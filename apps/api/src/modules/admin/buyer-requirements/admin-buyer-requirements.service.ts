import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminBuyerRequirementQueryDto } from './dto/admin-buyer-requirement-query.dto';
import {
  AdminBuyerRequirementDetails,
  AdminBuyerRequirementFiltersResponse,
  AdminBuyerRequirementListItem,
  AdminBuyerRequirementsResponse,
} from './interfaces/admin-buyer-requirements-response.interface';

@Injectable()
export class AdminBuyerRequirementsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly buyerSelect = {
    id: true,
    firstName: true,
    lastName: true,
    mobileNumber: true,
    isVerified: true,
    isActive: true,
  } as const;

  private readonly requirementSelect = {
    id: true,
    cropKey: true,
    customCropName: true,
    variety: true,
    quantity: true,
    unit: true,
    district: true,
    taluka: true,
    village: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    buyer: { select: this.buyerSelect },
  } as const;

  private buildWhere(query: AdminBuyerRequirementQueryDto): Prisma.BuyerRequirementWhereInput {
    const search = query.search?.trim();

    return {
      ...(query.cropKey && query.cropKey !== 'all' ? { cropKey: query.cropKey } : {}),
      ...(query.district && query.district !== 'all' ? { district: query.district } : {}),
      ...(query.status && query.status !== 'all' ? { status: query.status } : {}),
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
              { cropKey: { contains: search, mode: 'insensitive' } },
              { customCropName: { contains: search, mode: 'insensitive' } },
              { variety: { contains: search, mode: 'insensitive' } },
              { district: { contains: search, mode: 'insensitive' } },
              { taluka: { contains: search, mode: 'insensitive' } },
              { village: { contains: search, mode: 'insensitive' } },
              { contactNumber: { contains: search } },
              {
                buyer: {
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

  async findAll(query: AdminBuyerRequirementQueryDto): Promise<AdminBuyerRequirementsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);
    const orderBy = { createdAt: query.sort === 'oldest' ? ('asc' as const) : ('desc' as const) };

    const [total, rows] = await Promise.all([
      this.prisma.buyerRequirement.count({ where }),
      this.prisma.buyerRequirement.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.requirementSelect,
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getFilters(): Promise<AdminBuyerRequirementFiltersResponse> {
    const [cropRows, districtRows, statusRows] = await Promise.all([
      this.prisma.buyerRequirement.findMany({
        distinct: ['cropKey'],
        orderBy: { cropKey: 'asc' },
        select: { cropKey: true },
      }),
      this.prisma.buyerRequirement.findMany({
        distinct: ['district'],
        orderBy: { district: 'asc' },
        select: { district: true },
      }),
      this.prisma.buyerRequirement.findMany({
        distinct: ['status'],
        orderBy: { status: 'asc' },
        select: { status: true },
      }),
    ]);

    return {
      cropKeys: cropRows.map(({ cropKey }) => cropKey),
      districts: districtRows.map(({ district }) => district),
      statuses: statusRows.map(({ status }) => status),
    };
  }

  async findOne(id: string): Promise<AdminBuyerRequirementDetails> {
    const row = await this.prisma.buyerRequirement.findUnique({
      where: { id },
      select: {
        ...this.requirementSelect,
        contactNumber: true,
        additionalRequirements: true,
      },
    });

    if (!row) {
      throw new NotFoundException('Buyer requirement not found');
    }

    return {
      ...this.toListItem(row),
      contactNumber: row.contactNumber,
      additionalRequirements: row.additionalRequirements,
    };
  }

  private toListItem(row: {
    id: string;
    cropKey: string;
    customCropName: string | null;
    variety: string | null;
    quantity: number;
    unit: string;
    district: string;
    taluka: string | null;
    village: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    buyer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      mobileNumber: string;
      isVerified: boolean;
      isActive: boolean;
    };
  }): AdminBuyerRequirementListItem {
    return {
      id: row.id,
      cropKey: row.cropKey,
      customCropName: row.customCropName,
      variety: row.variety,
      quantity: row.quantity,
      unit: row.unit,
      district: row.district,
      taluka: row.taluka,
      village: row.village,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      buyer: {
        id: row.buyer.id,
        name: [row.buyer.firstName, row.buyer.lastName].filter(Boolean).join(' ').trim(),
        mobileNumber: row.buyer.mobileNumber,
        isVerified: row.buyer.isVerified,
        isActive: row.buyer.isActive,
      },
    };
  }
}
