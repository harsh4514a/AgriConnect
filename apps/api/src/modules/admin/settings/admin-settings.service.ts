import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@/config/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminChangePasswordDto } from '../auth/dto/admin-change-password.dto';

export interface AdminSettingsInfo {
  profile: {
    id: string;
    username: string;
    role: 'admin';
    isActive: boolean;
    createdAt: string;
  };
  system: {
    nodeEnv: string;
    supportedLocales: { code: string; name: string }[];
    defaultLocale: string;
    applicationName: string;
  };
  marketPrices: {
    syncEnabled: boolean;
    dataSource: string;
    latestDataDate: string | null;
    latestFetchedAt: string | null;
    totalRecords: number;
  };
  security: {
    authMethod: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    passwordProtected: boolean;
  };
}

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns non-sensitive, genuinely available settings information.
   * No secrets, API keys, passwords, or internal credentials are exposed.
   */
  async getSettingsInfo(adminId: string): Promise<AdminSettingsInfo> {
    // Fetch admin profile
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, username: true, isActive: true, createdAt: true },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin account not found or inactive');
    }

    // Fetch real market price sync statistics from the database
    const [latestByDate, latestByFetch, totalRecords] = await Promise.all([
      this.prisma.marketPrice.findFirst({
        orderBy: { dataDate: 'desc' },
        select: { dataDate: true },
      }),
      this.prisma.marketPrice.findFirst({
        orderBy: { fetchedAt: 'desc' },
        select: { fetchedAt: true },
      }),
      this.prisma.marketPrice.count(),
    ]);

    const syncEnabled = this.configService.getBoolean('MARKET_PRICE_SYNC_ENABLED', true);

    return {
      profile: {
        id: admin.id,
        username: admin.username,
        role: 'admin',
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
      },
      system: {
        nodeEnv: this.configService.getString('NODE_ENV', 'unknown'),
        supportedLocales: [
          { code: 'en', name: 'English' },
          { code: 'gu', name: 'ગુજરાતી' },
          { code: 'hi', name: 'हिन्दी' },
        ],
        defaultLocale: 'en',
        applicationName: 'AgriConnect',
      },
      marketPrices: {
        syncEnabled,
        dataSource: 'data.gov.in',
        latestDataDate: latestByDate?.dataDate?.toISOString().slice(0, 10) ?? null,
        latestFetchedAt: latestByFetch?.fetchedAt?.toISOString() ?? null,
        totalRecords,
      },
      security: {
        authMethod: 'JWT (Bearer Token)',
        accessTokenExpiry: '15 minutes',
        refreshTokenExpiry: '7 days',
        passwordProtected: true,
      },
    };
  }

  /**
   * Securely changes the admin password.
   * Verifies current password, enforces strength requirements,
   * invalidates all existing sessions, and records an audit event.
   */
  async changePassword(
    adminId: string,
    dto: AdminChangePasswordDto,
    clientIp = 'unknown',
    userAgent = 'unknown',
  ): Promise<{ message: string }> {
    // Fetch admin with password hash
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, username: true, passwordHash: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin account not found or inactive');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      admin.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      // Record failed attempt in audit log
      await this.auditService.recordAuditLog({
        actorId: adminId,
        actorType: 'admin',
        actorName: admin.username,
        action: 'ADMIN_PASSWORD_CHANGE',
        resource: 'admin_account',
        resourceId: adminId,
        description: `Administrator "${admin.username}" attempted a password change with incorrect current password`,
        ipAddress: clientIp !== 'unknown' ? clientIp : null,
        userAgent: userAgent !== 'unknown' ? userAgent : null,
        status: 'FAILED',
      });

      throw new UnauthorizedException('Current password is incorrect');
    }

    // Verify new passwords match
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Reject if new password is same as current
    const isSamePassword = await bcrypt.compare(dto.newPassword, admin.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    // Hash new password using the existing bcrypt mechanism (same as seed-admin)
    const newHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password and invalidate all existing refresh tokens atomically
    await this.prisma.$transaction([
      this.prisma.admin.update({
        where: { id: adminId },
        data: { passwordHash: newHash },
      }),
      this.prisma.adminRefreshToken.updateMany({
        where: { adminId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    // Record successful audit event (no passwords in metadata)
    await this.auditService.recordAuditLog({
      actorId: adminId,
      actorType: 'admin',
      actorName: admin.username,
      action: 'ADMIN_PASSWORD_CHANGE',
      resource: 'admin_account',
      resourceId: adminId,
      description: `Administrator "${admin.username}" successfully changed their password. All existing sessions have been revoked.`,
      metadata: { sessionsRevoked: true },
      ipAddress: clientIp !== 'unknown' ? clientIp : null,
      userAgent: userAgent !== 'unknown' ? userAgent : null,
      status: 'SUCCESS',
    });

    return { message: 'Password changed successfully. Please sign in again.' };
  }
}
