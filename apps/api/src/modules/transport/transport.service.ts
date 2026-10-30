import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransportProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportAvailabilityDto } from './dto/availability.dto';
import { QueryTransportDto } from './dto/query-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import {
  TransportListResponseDto,
  TransportProviderResponseDto,
} from './dto/transport-response.dto';
import { NotificationsService, NOTIFICATION_TYPES } from '../notifications/notifications.service';
import { getDomainSearchAliases } from '@agri/domain-data';

type TransportWithRelations = TransportProvider & {
  district: { id: string; name: string };
  taluka: { id: string; name: string } | null;
  village: { id: string; name: string } | null;
  owner: {
    firstName: string | null;
    lastName: string | null;
  } | null;
};

@Injectable()
export class TransportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return value.trim();
  }

  private providerName(row: TransportWithRelations): string {
    const firstName = row.owner?.firstName?.trim();
    const lastName = row.owner?.lastName?.trim();
    const profileName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return profileName || row.businessName;
  }

  private toDto(
    row: TransportWithRelations,
    includeContact = true,
  ): TransportProviderResponseDto {
    return {
      id: row.id,
      // New public directory entries currently store the owner's name in
      // businessName. Use a generic label for guests to avoid exposing it.
      businessName: includeContact ? this.providerName(row) : 'Transport provider',
      ...(includeContact
        ? {
            contactName: row.contactName ?? undefined,
            phoneNumber: row.phoneNumber,
          }
        : {}),
      vehicleType: row.vehicleType,
      customVehicleType: row.customVehicleType ?? undefined,
      additionalDetails: row.additionalDetails ?? undefined,
      district: row.district,
      ...(includeContact
        ? {
            taluka: row.taluka,
            village: row.village,
            latitude: row.latitude,
            longitude: row.longitude,
          }
        : {}),
      isAvailable: row.isAvailable,
      isVerified: row.isVerified,
      isActive: row.isActive,
    };
  }

  private readonly select = {
    id: true,
    businessName: true,
    contactName: true,
    phoneNumber: true,
    vehicleType: true,
    customVehicleType: true,
    additionalDetails: true,
    latitude: true,
    longitude: true,
    isAvailable: true,
    isVerified: true,
    isActive: true,
    district: { select: { id: true, name: true } },
    taluka: { select: { id: true, name: true } },
    village: { select: { id: true, name: true } },
    owner: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
  } satisfies Prisma.TransportProviderSelect;

  async findAll(
    query: QueryTransportDto,
    includeContact = false,
  ): Promise<TransportListResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 12));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const searchTerms = search ? [search, ...getDomainSearchAliases(search)] : [];

    const where: Prisma.TransportProviderWhereInput = {
      isActive: true,
      ...(query.districtId ? { districtId: query.districtId } : {}),
      ...(query.talukaId ? { talukaId: query.talukaId } : {}),
      ...(query.villageId ? { villageId: query.villageId } : {}),
      ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
      ...(query.available !== undefined ? { isAvailable: query.available } : {}),
      ...(search
        ? {
            OR: searchTerms.flatMap((term) => [
              ...(includeContact
                ? [
                    { businessName: { contains: term, mode: 'insensitive' as const } },
                    { owner: { firstName: { contains: term, mode: 'insensitive' as const } } },
                    { owner: { lastName: { contains: term, mode: 'insensitive' as const } } },
                    { contactName: { contains: term, mode: 'insensitive' as const } },
                  ]
                : []),
              { vehicleType: { contains: term, mode: 'insensitive' as const } },
              { customVehicleType: { contains: term, mode: 'insensitive' as const } },
              { district: { name: { contains: term, mode: 'insensitive' as const } } },
              { taluka: { name: { contains: term, mode: 'insensitive' as const } } },
              { village: { name: { contains: term, mode: 'insensitive' as const } } },
            ]),
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.transportProvider.count({ where }),
      this.prisma.transportProvider.findMany({
        where,
        select: this.select,
        orderBy: [{ isAvailable: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) =>
        this.toDto(row as TransportWithRelations, includeContact),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMine(
    userId: string,
    query: QueryTransportDto,
  ): Promise<TransportListResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 12));
    const skip = (page - 1) * limit;

    const where: Prisma.TransportProviderWhereInput = {
      ownerId: userId,
    };

    const [total, rows] = await Promise.all([
      this.prisma.transportProvider.count({ where }),
      this.prisma.transportProvider.findMany({
        where,
        select: this.select,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => this.toDto(row as TransportWithRelations)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    includeContact = false,
  ): Promise<TransportProviderResponseDto> {
    const row = await this.prisma.transportProvider.findFirst({
      where: { id, isActive: true },
      select: this.select,
    });

    if (!row) {
      throw new NotFoundException('Transport service not found');
    }

    return this.toDto(row as TransportWithRelations, includeContact);
  }

  private async validateLocation(
    districtId: string,
    talukaId: string,
    villageId: string,
  ) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      select: { id: true },
    });

    if (!district) throw new BadRequestException('Invalid district');

    const taluka = await this.prisma.taluka.findFirst({
      where: { id: talukaId, districtId },
      select: { id: true },
    });

    if (!taluka) {
      throw new BadRequestException('Invalid taluka for the selected district');
    }

    const village = await this.prisma.village.findFirst({
      where: { id: villageId, talukaId },
      select: { id: true },
    });

    if (!village) {
      throw new BadRequestException('Invalid village for the selected taluka');
    }
  }

  private async getOwner(userId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobileNumber: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!owner) throw new NotFoundException('User not found');

    const fullName = [owner.firstName?.trim(), owner.lastName?.trim()]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!fullName) {
      throw new BadRequestException('Complete your profile before adding transport');
    }

    return { ...owner, fullName };
  }

  async create(
    userId: string,
    dto: CreateTransportDto,
  ): Promise<TransportProviderResponseDto> {
    const owner = await this.getOwner(userId);

    await this.validateLocation(dto.districtId, dto.talukaId, dto.villageId);

    const vehicleType = dto.vehicleType.trim();
    const customVehicleType = dto.customVehicleType?.trim() || null;

    if (vehicleType === 'other' && !customVehicleType) {
      throw new BadRequestException('Custom vehicle type is required');
    }

    if (vehicleType !== 'other' && customVehicleType) {
      throw new BadRequestException('Custom vehicle type is only allowed for other');
    }

    try {
      const row = await this.prisma.transportProvider.create({
        data: {
          ownerId: owner.id,
          businessName: owner.fullName,
          contactName: owner.fullName,
          phoneNumber: this.normalizePhone(dto.phoneNumber),
          vehicleType,
          customVehicleType,
          districtId: dto.districtId,
          talukaId: dto.talukaId,
          villageId: dto.villageId,
          additionalDetails: dto.additionalDetails?.trim() || null,
          isAvailable: dto.isAvailable ?? true,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
        },
        select: this.select,
      });

      await this.notifications.create({
        userId,
        type: NOTIFICATION_TYPES.TRANSPORT,
        titleKey: 'dashboard.notifications.types.transportCreated.title',
        messageKey: 'dashboard.notifications.types.transportCreated.message',
        relatedPath: '/dashboard/transport',
        relatedType: 'transport',
        relatedId: row.id,
        dedupeKey: `transport.created:${row.id}`,
      });

      return this.toDto(row as TransportWithRelations);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'You already have the same transport service listed for this location',
        );
      }
      throw error;
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransportDto,
  ): Promise<TransportProviderResponseDto> {
    const existing = await this.prisma.transportProvider.findFirst({
      where: { id, ownerId: userId },
      select: {
        id: true,
        districtId: true,
        talukaId: true,
        villageId: true,
        vehicleType: true,
        customVehicleType: true,
      },
    });

    if (!existing) throw new NotFoundException('Transport service not found');

    const districtId = dto.districtId ?? existing.districtId;
    const talukaId = dto.talukaId ?? existing.talukaId;
    const villageId = dto.villageId ?? existing.villageId;

    if (!districtId || !talukaId || !villageId) {
      throw new BadRequestException('Complete transport location is required');
    }

    await this.validateLocation(districtId, talukaId, villageId);

    const vehicleType = dto.vehicleType?.trim() ?? existing.vehicleType;
    const customVehicleType =
      dto.customVehicleType !== undefined
        ? dto.customVehicleType.trim() || null
        : existing.customVehicleType;

    if (vehicleType === 'other' && !customVehicleType) {
      throw new BadRequestException('Custom vehicle type is required');
    }

    if (vehicleType !== 'other' && customVehicleType) {
      throw new BadRequestException('Custom vehicle type is only allowed for other');
    }

    try {
      const row = await this.prisma.transportProvider.update({
        where: { id },
        data: {
          ...(dto.phoneNumber !== undefined
            ? { phoneNumber: this.normalizePhone(dto.phoneNumber) }
            : {}),
          ...(dto.vehicleType !== undefined ? { vehicleType } : {}),
          ...(dto.customVehicleType !== undefined || dto.vehicleType !== undefined
            ? { customVehicleType: vehicleType === 'other' ? customVehicleType : null }
            : {}),
          ...(dto.additionalDetails !== undefined
            ? { additionalDetails: dto.additionalDetails.trim() || null }
            : {}),
          ...(dto.districtId !== undefined ? { districtId } : {}),
          ...(dto.talukaId !== undefined ? { talukaId } : {}),
          ...(dto.villageId !== undefined ? { villageId } : {}),
          ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
          ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
          ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
        },
        select: this.select,
      });

      return this.toDto(row as TransportWithRelations);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'You already have the same transport service listed for this location',
        );
      }
      throw error;
    }
  }

  async updateAvailability(
    userId: string,
    id: string,
    dto: UpdateTransportAvailabilityDto,
  ): Promise<TransportProviderResponseDto> {
    const existing = await this.prisma.transportProvider.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Transport service not found');

    const row = await this.prisma.transportProvider.update({
      where: { id },
      data: { isAvailable: dto.isAvailable },
      select: this.select,
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.TRANSPORT,
      titleKey: 'dashboard.notifications.types.transportAvailabilityUpdated.title',
      messageKey: 'dashboard.notifications.types.transportAvailabilityUpdated.message',
      relatedPath: '/dashboard/transport',
      relatedType: 'transport',
      relatedId: row.id,
    });

    return this.toDto(row as TransportWithRelations);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.prisma.transportProvider.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Transport service not found');

    await this.prisma.transportProvider.delete({ where: { id } });

    return { message: 'Transport service deleted successfully' };
  }
}
