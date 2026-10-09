import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { ConfigService } from '@/config/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { AdminJwtPayload } from './interfaces/admin-jwt-payload.interface';
import {
  AdminAuthResponse,
  AdminProfileResponse,
} from './interfaces/admin-auth-response.interface';
import { AdminAuditService } from '../audit/admin-audit.service';

interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  // Development-safe fallback protection. A shared/distributed rate limiter
  // can replace this when the deployment provides Redis or an API gateway.
  private readonly rateLimits = new Map<string, RateLimitRecord>();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000;

  // Dummy hash keeps username-not-found and wrong-password checks comparable.
  private static readonly DUMMY_HASH =
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AdminAuditService,
  ) {}

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAccessSecret(): string {
    return this.configService.getOrThrow('JWT_ADMIN_ACCESS_SECRET');
  }

  private getRefreshSecret(): string {
    return this.configService.getOrThrow('JWT_ADMIN_REFRESH_SECRET');
  }

  private checkRateLimit(key: string): void {
    const now = Date.now();
    const record = this.rateLimits.get(key);

    if (!record) return;

    if (record.lockedUntil > now) {
      const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      throw new HttpException(
        `Too many failed login attempts. Please try again after ${waitMinutes} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (record.lockedUntil <= now && record.attempts >= this.MAX_FAILED_ATTEMPTS) {
      this.rateLimits.delete(key);
    }
  }

  private recordFailedAttempt(key: string): void {
    const now = Date.now();
    const record = this.rateLimits.get(key) || {
      attempts: 0,
      lockedUntil: 0,
    };

    record.attempts += 1;

    if (record.attempts >= this.MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + this.LOCK_DURATION_MS;
      this.logger.warn('Admin login rate limit triggered.');
    }

    this.rateLimits.set(key, record);
  }

  private clearFailedAttempts(key: string): void {
    this.rateLimits.delete(key);
  }

  async login(
    dto: AdminLoginDto,
    clientIp = 'unknown',
    userAgent = 'unknown',
  ): Promise<AdminAuthResponse> {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const rateLimitKey = `${clientIp}:${normalizedUsername}`;

    this.checkRateLimit(rateLimitKey);

    const admin = await this.prisma.admin.findUnique({
      where: { username: normalizedUsername },
    });

    if (!admin) {
      await bcrypt.compare(dto.password, AdminAuthService.DUMMY_HASH);
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, admin.passwordHash);

    if (!isMatch) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.clearFailedAttempts(rateLimitKey);

    const tokens = await this.generateTokens(admin.id, admin.username);

    // Record audit log upon successful authentication
    await this.auditService.recordAuditLog({
      actorId: admin.id,
      actorType: 'admin',
      actorName: admin.username,
      action: 'ADMIN_LOGIN',
      resource: 'auth',
      resourceId: admin.id,
      description: `Administrator "${admin.username}" signed in successfully`,
      ipAddress: clientIp !== 'unknown' ? clientIp : null,
      userAgent: userAgent !== 'unknown' ? userAgent : null,
      status: 'SUCCESS',
    });

    return {
      ...tokens,
      admin: {
        id: admin.id,
        username: admin.username,
        role: 'admin',
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      },
    };
  }

  async getProfile(adminId: string): Promise<AdminProfileResponse> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin not found or deactivated');
    }

    return {
      id: admin.id,
      username: admin.username,
      role: 'admin',
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
  }

  async logout(
    adminId: string,
    refreshToken?: string,
  ): Promise<{ message: string }> {
    if (refreshToken) {
      const activeTokens = await this.prisma.adminRefreshToken.findMany({
        where: { adminId, isRevoked: false },
      });

      const hashedInput = this.hashRefreshToken(refreshToken);

      for (const record of activeTokens) {
        if (
          (await bcrypt.compare(hashedInput, record.token)) ||
          (await bcrypt.compare(refreshToken, record.token))
        ) {
          await this.prisma.adminRefreshToken.update({
            where: { id: record.id },
            data: { isRevoked: true },
          });
          break;
        }
      }
    } else {
      await this.prisma.adminRefreshToken.updateMany({
        where: { adminId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async refresh(
    dto: AdminRefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: AdminJwtPayload;

    try {
      payload = this.jwtService.verify<AdminJwtPayload>(dto.refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'admin' || payload.role !== 'admin' || !payload.sub) {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const activeTokens = await this.prisma.adminRefreshToken.findMany({
      where: {
        adminId: admin.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenRecord: (typeof activeTokens)[number] | null = null;
    const hashedInput = this.hashRefreshToken(dto.refreshToken);

    for (const record of activeTokens) {
      if (
        (await bcrypt.compare(hashedInput, record.token)) ||
        (await bcrypt.compare(dto.refreshToken, record.token))
      ) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      await this.prisma.adminRefreshToken.updateMany({
        where: { adminId: admin.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.adminRefreshToken.update({
      where: { id: matchedTokenRecord.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(admin.id, admin.username);
  }

  private async generateTokens(
    adminId: string,
    username: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const basePayload: AdminJwtPayload = {
      sub: adminId,
      username,
      role: 'admin',
      type: 'admin',
    };

    const accessToken = this.jwtService.sign(
      { ...basePayload, jti: randomUUID() },
      {
        secret: this.getAccessSecret(),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...basePayload, jti: randomUUID() },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      },
    );

    const hashedRefreshToken = await bcrypt.hash(this.hashRefreshToken(refreshToken), 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.adminRefreshToken.create({
      data: {
        adminId,
        token: hashedRefreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
