import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminUserStatusDto } from './dto/admin-user-status.dto';
import {
  AdminUserDetails,
  AdminUserFiltersResponse,
  AdminUserListItem,
  AdminUsersResponse,
} from './interfaces/admin-users-response.interface';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  private buildWhere(query: AdminUserQueryDto) {
    const search = query.search?.trim();

    return {
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.districtId ? { districtId: query.districtId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { mobileNumber: { contains: search } },
              {
                district: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                taluka: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                village: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
      ...(query.registeredFrom || query.registeredTo
        ? {
            createdAt: {
              ...(query.registeredFrom
                ? { gte: new Date(query.registeredFrom) }
                : {}),
              ...(query.registeredTo
                ? { lt: new Date(query.registeredTo) }
                : {}),
            },
          }
        : {}),
    };
  }

  async findAll(query: AdminUserQueryDto): Promise<AdminUsersResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);
    const orderBy = { createdAt: query.sort === 'oldest' ? ('asc' as const) : ('desc' as const) };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobileNumber: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          state: { select: { name: true } },
          district: { select: { name: true } },
          taluka: { select: { name: true } },
          village: { select: { name: true } },
          _count: {
            select: {
              listings: true,
              buyerRequirements: true,
              transportProviders: true,
            },
          },
        },
      }),
    ]);

    const items: AdminUserListItem[] = users.map((user) => this.toListItem(user));

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getFilters(): Promise<AdminUserFiltersResponse> {
    const districts = await this.prisma.district.findMany({
      where: {
        users: { some: {} },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return { districts };
  }

  async findOne(id: string): Promise<AdminUserDetails> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        state: { select: { name: true } },
        district: { select: { name: true } },
        taluka: { select: { name: true } },
        village: { select: { name: true } },
        _count: {
          select: {
            listings: true,
            buyerRequirements: true,
            transportProviders: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...this.toListItem(user),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateStatus(
    id: string,
    dto: AdminUserStatusDto,
    admin?: AdminProfileResponse,
  ): Promise<{ id: string; isActive: boolean }> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        isActive: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (existing.isActive === dto.isActive) {
      return { id: existing.id, isActive: existing.isActive };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: { id: true, isActive: true },
    });

    if (!updated.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: id,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
    }

    // Record audit log upon successful state modification
    const fullName = [existing.firstName, existing.lastName].filter(Boolean).join(' ') || 'User';
    await this.auditService.recordAuditLog({
      actorId: admin?.id,
      actorType: 'admin',
      actorName: admin?.username,
      action: 'USER_STATUS_CHANGE',
      resource: 'user',
      resourceId: id,
      description: `Administrator ${admin?.username || 'system'} ${dto.isActive ? 'activated' : 'deactivated'} user account for ${fullName} (${existing.mobileNumber})`,
      metadata: {
        userId: id,
        mobileNumber: existing.mobileNumber,
        previousStatus: existing.isActive,
        newStatus: dto.isActive,
      },
      status: 'SUCCESS',
    });

    return updated;
  }

  private toListItem(user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    mobileNumber: string;
    role: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    state: { name: string } | null;
    district: { name: string } | null;
    taluka: { name: string } | null;
    village: { name: string } | null;
    _count: {
      listings: number;
      buyerRequirements: number;
      transportProviders: number;
    };
  }): AdminUserListItem {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      location: {
        state: user.state?.name ?? null,
        district: user.district?.name ?? null,
        taluka: user.taluka?.name ?? null,
        village: user.village?.name ?? null,
      },
      activity: {
        listings: user._count.listings,
        buyerRequirements: user._count.buyerRequirements,
        transportListings: user._count.transportProviders,
      },
    };
  }
}
