import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminTransportQueryDto } from './dto/admin-transport-query.dto';
import { AdminTransportStatusDto } from './dto/admin-transport-status.dto';
import {
  AdminTransportDetails,
  AdminTransportFiltersResponse,
  AdminTransportListItem,
  AdminTransportsResponse,
} from './interfaces/admin-transport-response.interface';

@Injectable()
export class AdminTransportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  private readonly transportSelect = {
    id: true,
    businessName: true,
    contactName: true,
    phoneNumber: true,
    vehicleType: true,
    customVehicleType: true,
    additionalDetails: true,
    isAvailable: true,
    isVerified: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    district: { select: { id: true, name: true } },
    taluka: { select: { id: true, name: true } },
    village: { select: { id: true, name: true } },
    owner: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        isVerified: true,
        isActive: true,
      },
    },
  } as const;

  private buildWhere(query: AdminTransportQueryDto): Prisma.TransportProviderWhereInput {
    const search = query.search?.trim();

    return {
      ...(query.districtId ? { districtId: query.districtId } : {}),
      ...(query.talukaId ? { talukaId: query.talukaId } : {}),
      ...(query.villageId ? { villageId: query.villageId } : {}),
      ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
      ...(query.isAvailable === undefined ? {} : { isAvailable: query.isAvailable }),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.createdFrom || query.createdTo
        ? {
            createdAt: {
              ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
              ...(query.createdTo ? { lt: new Date(query.createdTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { businessName: { contains: search, mode: 'insensitive' } },
              { contactName: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search } },
              { vehicleType: { contains: search, mode: 'insensitive' } },
              { customVehicleType: { contains: search, mode: 'insensitive' } },
              { district: { name: { contains: search, mode: 'insensitive' } } },
              { taluka: { name: { contains: search, mode: 'insensitive' } } },
              { village: { name: { contains: search, mode: 'insensitive' } } },
              {
                owner: {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { mobileNumber: { contains: search } },
                  ],
                },
              },
            ],
          }
        : {}),
    };
  }

  async findAll(query: AdminTransportQueryDto): Promise<AdminTransportsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);
    const orderBy = { createdAt: query.sort === 'oldest' ? ('asc' as const) : ('desc' as const) };

    const [total, rows] = await Promise.all([
      this.prisma.transportProvider.count({ where }),
      this.prisma.transportProvider.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.transportSelect,
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async getFilters(): Promise<AdminTransportFiltersResponse> {
    const [districts, talukas, villages, vehicleRows] = await Promise.all([
      this.prisma.district.findMany({
        where: { transportProviders: { some: {} } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.taluka.findMany({
        where: { transportProviders: { some: {} } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.village.findMany({
        where: { transportProviders: { some: {} } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.transportProvider.findMany({
        distinct: ['vehicleType'],
        orderBy: { vehicleType: 'asc' },
        select: { vehicleType: true },
      }),
    ]);

    return {
      vehicleTypes: vehicleRows.map(({ vehicleType }) => vehicleType),
      districts,
      talukas,
      villages,
    };
  }

  async findOne(id: string): Promise<AdminTransportDetails> {
    const row = await this.prisma.transportProvider.findUnique({
      where: { id },
      select: this.transportSelect,
    });

    if (!row) throw new NotFoundException('Transport service not found');
    return this.toListItem(row);
  }

  async updateStatus(
    id: string,
    dto: AdminTransportStatusDto,
    admin?: AdminProfileResponse,
  ) {
    const existing = await this.prisma.transportProvider.findUnique({
      where: { id },
      select: { id: true, businessName: true, isActive: true },
    });

    if (!existing) throw new NotFoundException('Transport service not found');

    const updated = await this.prisma.transportProvider.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: { id: true, isActive: true },
    });

    await this.auditService.recordAuditLog({
      actorId: admin?.id,
      actorType: 'admin',
      actorName: admin?.username,
      action: 'TRANSPORT_STATUS_CHANGE',
      resource: 'transport',
      resourceId: id,
      description: `Administrator ${admin?.username || 'system'} ${dto.isActive ? 'activated' : 'deactivated'} transport provider "${existing.businessName}"`,
      metadata: {
        providerId: id,
        businessName: existing.businessName,
        previousStatus: existing.isActive,
        newStatus: dto.isActive,
      },
      status: 'SUCCESS',
    });

    return updated;
  }

  private toListItem(row: {
    id: string;
    businessName: string;
    contactName: string | null;
    phoneNumber: string;
    vehicleType: string;
    customVehicleType: string | null;
    additionalDetails: string | null;
    isAvailable: boolean;
    isVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    district: { id: string; name: string };
    taluka: { id: string; name: string } | null;
    village: { id: string; name: string } | null;
    owner: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      mobileNumber: string;
      isVerified: boolean;
      isActive: boolean;
    } | null;
  }): AdminTransportListItem {
    const ownerName = [row.owner?.firstName, row.owner?.lastName].filter(Boolean).join(' ').trim();

    return {
      id: row.id,
      businessName: row.businessName,
      contactName: row.contactName,
      phoneNumber: row.phoneNumber,
      vehicleType: row.vehicleType,
      customVehicleType: row.customVehicleType,
      additionalDetails: row.additionalDetails,
      district: row.district,
      taluka: row.taluka,
      village: row.village,
      isAvailable: row.isAvailable,
      isVerified: row.isVerified,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      owner: row.owner
        ? {
            id: row.owner.id,
            name: ownerName || row.businessName,
            mobileNumber: row.owner.mobileNumber,
            isVerified: row.owner.isVerified,
            isActive: row.owner.isActive,
          }
        : null,
    };
  }
}
