import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BuyerRequirement } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BUYER_REQUIREMENT_CROP_KEYS,
  CreateBuyerRequirementDto,
} from './dto/create-buyer-requirement.dto';
import { QueryBuyerRequirementsDto } from './dto/query-buyer-requirements.dto';
import { UpdateBuyerRequirementDto } from './dto/update-buyer-requirement.dto';
import {
  BuyerRequirementListResponseDto,
  BuyerRequirementResponseDto,
} from './dto/buyer-requirement-response.dto';
import { NotificationsService, NOTIFICATION_TYPES } from '../notifications/notifications.service';
import { getDomainSearchAliases } from '@agri/domain-data';

const ACTIVE = 'active';

function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return value.trim();
}

@Injectable()
export class BuyerRequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private validateBusinessRules(
    dto: CreateBuyerRequirementDto | UpdateBuyerRequirementDto,
  ) {
    if (dto.cropKey === 'other' && !dto.customCropName?.trim()) {
      throw new BadRequestException(
        'Custom crop name is required when using Other crop',
      );
    }

    if (
      dto.cropKey &&
      !BUYER_REQUIREMENT_CROP_KEYS.includes(dto.cropKey as never)
    ) {
      throw new BadRequestException('Unsupported crop');
    }

    if (dto.quantity !== undefined && dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    if (dto.contactNumber !== undefined) {
      const normalized = normalizeIndianMobile(dto.contactNumber);

      if (!/^\+91\d{10}$/.test(normalized)) {
        throw new BadRequestException(
          'Please provide a valid Indian mobile number',
        );
      }
    }

    if (dto.district !== undefined && !dto.district.trim()) {
      throw new BadRequestException('Location is required');
    }
  }

  private toDto(
    row: BuyerRequirement & {
      buyer?: {
        firstName: string | null;
        lastName: string | null;
        isVerified: boolean;
      };
    },
    includeContact = false,
  ): BuyerRequirementResponseDto {
    const dto: BuyerRequirementResponseDto = {
      id: row.id,
      buyerId: row.buyerId,
      cropKey: row.cropKey,
      customCropName: row.customCropName ?? undefined,
      variety: row.variety ?? undefined,
      quantity: row.quantity,
      unit: row.unit,
      district: row.district,
      taluka: includeContact ? row.taluka ?? undefined : undefined,
      village: includeContact ? row.village ?? undefined : undefined,
      additionalRequirements: row.additionalRequirements ?? undefined,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      postedBy: includeContact && row.buyer
        ? {
            firstName: row.buyer.firstName ?? undefined,
            lastName: row.buyer.lastName ?? undefined,
            isVerified: row.buyer.isVerified,
          }
        : undefined,
    };

    if (includeContact && row.contactNumber) {
      const displayName = [row.buyer?.firstName, row.buyer?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      dto.contact = {
        phoneNumber: row.contactNumber,
        displayName: displayName || 'Buyer',
      };
    }

    return dto;
  }

  private readonly buyerSelect = {
    firstName: true,
    lastName: true,
    isVerified: true,
  } as const;

  async findAll(
    query: QueryBuyerRequirementsDto,
    includeContact = false,
  ): Promise<BuyerRequirementListResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 12));
    const skip = (page - 1) * limit;

    const search = query.search?.trim();
    const searchTerms = search ? [search, ...getDomainSearchAliases(search)] : [];
    const cropKey = query.cropKey?.trim();

    const where: Prisma.BuyerRequirementWhereInput = {
      status: ACTIVE,
      ...(cropKey && cropKey !== 'all' ? { cropKey } : {}),
      ...(query.district && query.district !== 'all'
        ? {
            district: {
              equals: query.district.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.minQuantity !== undefined || query.maxQuantity !== undefined
        ? {
            quantity: {
              ...(query.minQuantity !== undefined
                ? { gte: query.minQuantity }
                : {}),
              ...(query.maxQuantity !== undefined
                ? { lte: query.maxQuantity }
                : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: searchTerms.flatMap((term) => [
              { district: { contains: term, mode: 'insensitive' as const } },
              { taluka: { contains: term, mode: 'insensitive' as const } },
              { village: { contains: term, mode: 'insensitive' as const } },
              { cropKey: { contains: term, mode: 'insensitive' as const } },
              { customCropName: { contains: term, mode: 'insensitive' as const } },
              { variety: { contains: term, mode: 'insensitive' as const } },
              { additionalRequirements: { contains: term, mode: 'insensitive' as const } },
            ]),
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.buyerRequirement.count({ where }),
      this.prisma.buyerRequirement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { buyer: { select: this.buyerSelect } },
      }),
    ]);

    return {
      items: rows.map((row) => this.toDto(row, includeContact)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMine(userId: string): Promise<BuyerRequirementResponseDto[]> {
    const rows = await this.prisma.buyerRequirement.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { buyer: { select: this.buyerSelect } },
    });

    return rows.map((row) => this.toDto(row, true));
  }

  async findOne(
    userId: string | null,
    id: string,
  ): Promise<BuyerRequirementResponseDto> {
    const row = await this.prisma.buyerRequirement.findFirst({
      where: userId
        ? { id, OR: [{ status: ACTIVE }, { buyerId: userId }] }
        : { id, status: ACTIVE },
      include: { buyer: { select: this.buyerSelect } },
    });

    if (!row) {
      throw new NotFoundException('Buyer requirement not found');
    }

    return this.toDto(row, Boolean(userId));
  }

  async create(
    userId: string,
    dto: CreateBuyerRequirementDto,
  ): Promise<BuyerRequirementResponseDto> {
    this.validateBusinessRules(dto);

    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!buyer) {
      throw new NotFoundException('User not found');
    }

    if (dto.submissionKey) {
      const existing = await this.prisma.buyerRequirement.findUnique({
        where: { submissionKey: dto.submissionKey },
        include: { buyer: { select: this.buyerSelect } },
      });

      if (existing && existing.buyerId === userId) {
        return this.toDto(existing, true);
      }

      if (existing) {
        throw new ForbiddenException('Submission key already used');
      }
    }

    const row = await this.prisma.buyerRequirement.create({
      data: {
        buyerId: userId,
        cropKey: dto.cropKey,
        customCropName: dto.customCropName?.trim() || null,
        variety: dto.variety?.trim() || null,
        quantity: dto.quantity,
        unit: dto.unit,
        district: dto.district.trim(),
        taluka: dto.taluka?.trim() || null,
        village: dto.village?.trim() || null,
        contactNumber: normalizeIndianMobile(dto.contactNumber),
        additionalRequirements:
          dto.additionalRequirements?.trim() || null,
        submissionKey: dto.submissionKey?.trim() || null,
        status: ACTIVE,
      },
      include: { buyer: { select: this.buyerSelect } },
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.BUYER_REQUIREMENT,
      titleKey: 'dashboard.notifications.types.buyerRequirementCreated.title',
      messageKey: 'dashboard.notifications.types.buyerRequirementCreated.message',
      data: {
        cropKey: row.cropKey,
        customCropName: row.customCropName,
      },
      relatedPath: `/dashboard/buyer-requirements/${row.id}`,
      relatedType: 'buyer_requirement',
      relatedId: row.id,
      dedupeKey: `buyer-requirement.created:${row.id}`,
    });

    return this.toDto(row, true);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBuyerRequirementDto,
  ): Promise<BuyerRequirementResponseDto> {
    const existing = await this.prisma.buyerRequirement.findUnique({
      where: { id },
      include: { buyer: { select: this.buyerSelect } },
    });

    if (!existing) {
      throw new NotFoundException('Buyer requirement not found');
    }

    if (existing.buyerId !== userId) {
      throw new ForbiddenException(
        'You can only edit your own requirement',
      );
    }

    if (existing.status !== ACTIVE) {
      throw new BadRequestException(
        'Only active requirements can be edited',
      );
    }

    const merged: CreateBuyerRequirementDto = {
      cropKey:
        dto.cropKey ??
        (existing.cropKey as CreateBuyerRequirementDto['cropKey']),
      customCropName:
        dto.customCropName ?? existing.customCropName ?? undefined,
      variety: dto.variety ?? existing.variety ?? undefined,
      quantity: dto.quantity ?? existing.quantity,
      unit:
        dto.unit ??
        (existing.unit as CreateBuyerRequirementDto['unit']),
      district: dto.district ?? existing.district,
      taluka: dto.taluka ?? existing.taluka ?? undefined,
      village: dto.village ?? existing.village ?? undefined,
      contactNumber:
        dto.contactNumber ?? existing.contactNumber,
      additionalRequirements:
        dto.additionalRequirements ??
        existing.additionalRequirements ??
        undefined,
    };

    this.validateBusinessRules(merged);

    const data: Prisma.BuyerRequirementUpdateInput = {};

    if (dto.cropKey !== undefined) {
      data.cropKey = dto.cropKey;
    }

    if (dto.customCropName !== undefined) {
      data.customCropName = dto.customCropName.trim() || null;
    }

    if (dto.variety !== undefined) {
      data.variety = dto.variety.trim() || null;
    }

    if (dto.quantity !== undefined) {
      data.quantity = dto.quantity;
    }

    if (dto.unit !== undefined) {
      data.unit = dto.unit;
    }

    if (dto.district !== undefined) {
      data.district = dto.district.trim();
    }

    if (dto.taluka !== undefined) {
      data.taluka = dto.taluka.trim() || null;
    }

    if (dto.village !== undefined) {
      data.village = dto.village.trim() || null;
    }

    if (dto.contactNumber !== undefined) {
      data.contactNumber = normalizeIndianMobile(dto.contactNumber);
    }

    if (dto.additionalRequirements !== undefined) {
      data.additionalRequirements =
        dto.additionalRequirements.trim() || null;
    }

    const row = await this.prisma.buyerRequirement.update({
      where: { id },
      data,
      include: { buyer: { select: this.buyerSelect } },
    });

    return this.toDto(row, true);
  }

  async close(
    userId: string,
    id: string,
    status: 'cancelled' | 'fulfilled',
  ) {
    const existing = await this.prisma.buyerRequirement.findUnique({
      where: { id },
      select: { id: true, buyerId: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Buyer requirement not found');
    }

    if (existing.buyerId !== userId) {
      throw new ForbiddenException(
        'You can only close your own requirement',
      );
    }

    if (existing.status !== ACTIVE) {
      throw new BadRequestException(
        'Only active requirements can be closed',
      );
    }

    const row = await this.prisma.buyerRequirement.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, cropKey: true, customCropName: true },
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.BUYER_REQUIREMENT,
      titleKey: 'dashboard.notifications.types.buyerRequirementStatusUpdated.title',
      messageKey: 'dashboard.notifications.types.buyerRequirementStatusUpdated.message',
      data: {
        cropKey: row.cropKey,
        customCropName: row.customCropName,
      },
      relatedPath: `/dashboard/buyer-requirements/${row.id}`,
      relatedType: 'buyer_requirement',
      relatedId: row.id,
      dedupeKey: `buyer-requirement.status:${row.id}:${row.status}`,
    });

    return { id: row.id, status: row.status };
  }
}
