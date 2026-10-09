import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminMarketplaceQueryDto } from './dto/admin-marketplace-query.dto';
import { AdminMarketplaceStatusDto } from './dto/admin-marketplace-status.dto';
import {
  AdminMarketplaceDetails,
  AdminMarketplaceFarmer,
  AdminMarketplaceFiltersResponse,
  AdminMarketplaceListItem,
  AdminMarketplaceResponse,
  AdminMarketplaceSummary,
} from './interfaces/admin-marketplace-response.interface';

@Injectable()
export class AdminMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  private buildWhere(query: AdminMarketplaceQueryDto) {
    const search = query.search?.trim();

    return {
      ...(query.cropKey && query.cropKey !== 'all' ? { cropKey: query.cropKey } : {}),
      ...(query.district && query.district !== 'all' ? { district: query.district } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.listedFrom || query.listedTo
        ? {
            createdAt: {
              ...(query.listedFrom ? { gte: new Date(query.listedFrom) } : {}),
              ...(query.listedTo ? { lt: new Date(query.listedTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { farmerName: { contains: search, mode: 'insensitive' as const } },
              { farmerNameShort: { contains: search, mode: 'insensitive' as const } },
              { mobileNumber: { contains: search } },
              { cropKey: { contains: search, mode: 'insensitive' as const } },
              { customCropName: { contains: search, mode: 'insensitive' as const } },
              { variety: { contains: search, mode: 'insensitive' as const } },
              { district: { contains: search, mode: 'insensitive' as const } },
              { taluka: { contains: search, mode: 'insensitive' as const } },
              { village: { contains: search, mode: 'insensitive' as const } },
              { state: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  private readonly farmerSelect = {
    id: true,
    firstName: true,
    lastName: true,
    mobileNumber: true,
    isActive: true,
    isVerified: true,
    _count: {
      select: {
        listings: true,
        buyerRequirements: true,
        transportProviders: true,
      },
    },
  } as const;

  private readonly listingSelect = {
    id: true,
    cropKey: true,
    customCropName: true,
    variety: true,
    image: true,
    imageAlt: true,
    farmerName: true,
    farmerNameShort: true,
    mobileNumber: true,
    district: true,
    taluka: true,
    village: true,
    state: true,
    quantity: true,
    unit: true,
    price: true,
    primaryUnit: true,
    secondaryUnit: true,
    marketPrice: true,
    availability: true,
    verified: true,
    readyToSell: true,
    description: true,
    qualityGrade: true,
    cropDate: true,
    status: true,
    isUserCreated: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: this.farmerSelect,
    },
  } as const;

  private readonly detailSelect = {
    ...this.listingSelect,
    additionalImages: true,
    lat: true,
    lng: true,
    distanceKm: true,
    postedHoursAgo: true,
  } as const;

  async findAll(query: AdminMarketplaceQueryDto): Promise<AdminMarketplaceResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);
    const orderBy = { createdAt: query.sort === 'oldest' ? ('asc' as const) : ('desc' as const) };

    const [total, rows, summary] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: this.listingSelect,
      }),
      this.getSummary(),
    ]);

    return {
      items: rows.map((listing) => this.toListItem(listing)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary,
    };
  }

  async getFilters(): Promise<AdminMarketplaceFiltersResponse> {
    const [cropRows, districtRows] = await Promise.all([
      this.prisma.listing.findMany({
        distinct: ['cropKey'],
        orderBy: { cropKey: 'asc' },
        select: { cropKey: true },
      }),
      this.prisma.listing.findMany({
        distinct: ['district'],
        orderBy: { district: 'asc' },
        select: { district: true },
      }),
    ]);

    return {
      cropKeys: cropRows.map(({ cropKey }) => cropKey),
      districts: districtRows.map(({ district }) => district),
    };
  }

  async findOne(id: string): Promise<AdminMarketplaceDetails> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: this.detailSelect,
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.toDetails(listing);
  }

  async updateStatus(
    id: string,
    dto: AdminMarketplaceStatusDto,
    admin?: AdminProfileResponse,
  ) {
    const existing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, cropKey: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: dto.status,
        availability: dto.status === 'sold' ? 'soldOut' : 'available',
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Record audit log upon successful status update
    await this.auditService.recordAuditLog({
      actorId: admin?.id,
      actorType: 'admin',
      actorName: admin?.username,
      action: 'LISTING_STATUS_CHANGE',
      resource: 'marketplace',
      resourceId: id,
      description: `Administrator ${admin?.username || 'system'} updated listing for crop "${existing.cropKey}" status to "${dto.status}"`,
      metadata: {
        listingId: id,
        cropKey: existing.cropKey,
        previousStatus: existing.status,
        newStatus: dto.status,
      },
      status: 'SUCCESS',
    });

    return updated;
  }

  private async getSummary(): Promise<AdminMarketplaceSummary> {
    const recentSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, statusGroups, recentlyAdded] = await Promise.all([
      this.prisma.listing.count(),
      this.prisma.listing.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.listing.count({
        where: { createdAt: { gte: recentSince } },
      }),
    ]);

    const counts = new Map(
      statusGroups.map((group) => [group.status, group._count._all]),
    );

    return {
      total,
      active: counts.get('active') ?? 0,
      inactive: counts.get('inactive') ?? 0,
      sold: counts.get('sold') ?? 0,
      recentlyAdded,
    };
  }

  private toFarmer(
    farmer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      mobileNumber: string;
      isActive: boolean;
      isVerified: boolean;
      _count: {
        listings: number;
        buyerRequirements: number;
        transportProviders: number;
      };
    } | null,
    listing: { farmerName: string; mobileNumber: string; verified: boolean },
  ): AdminMarketplaceFarmer {
    if (!farmer) {
      return {
        id: null,
        name: listing.farmerName,
        mobileNumber: listing.mobileNumber,
        isActive: null,
        isVerified: listing.verified,
        activity: {
          listings: 0,
          buyerRequirements: 0,
          transportListings: 0,
        },
      };
    }

    const name = [farmer.firstName, farmer.lastName].filter(Boolean).join(' ').trim();

    return {
      id: farmer.id,
      name: name || listing.farmerName,
      mobileNumber: farmer.mobileNumber,
      isActive: farmer.isActive,
      isVerified: farmer.isVerified,
      activity: {
        listings: farmer._count.listings,
        buyerRequirements: farmer._count.buyerRequirements,
        transportListings: farmer._count.transportProviders,
      },
    };
  }

  private toListItem(listing: {
    id: string;
    cropKey: string;
    customCropName: string | null;
    variety: string | null;
    image: string;
    imageAlt: string;
    farmerName: string;
    farmerNameShort: string;
    mobileNumber: string;
    district: string;
    taluka: string;
    village: string;
    state: string;
    quantity: number;
    unit: string;
    price: number;
    primaryUnit: string;
    secondaryUnit: string;
    marketPrice: number;
    availability: string;
    verified: boolean;
    readyToSell: boolean;
    description: string | null;
    qualityGrade: string | null;
    cropDate: string | null;
    status: string;
    isUserCreated: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      mobileNumber: string;
      isActive: boolean;
      isVerified: boolean;
      _count: {
        listings: number;
        buyerRequirements: number;
        transportProviders: number;
      };
    } | null;
  }): AdminMarketplaceListItem {
    return {
      id: listing.id,
      cropKey: listing.cropKey,
      customCropName: listing.customCropName,
      variety: listing.variety,
      image: listing.image.startsWith('blob:')
        ? `/crops/${listing.cropKey === 'other' ? 'other' : listing.cropKey}.svg`
        : listing.image,
      imageAlt: listing.imageAlt,
      farmerName: listing.farmerName,
      farmerNameShort: listing.farmerNameShort,
      mobileNumber: listing.mobileNumber,
      district: listing.district,
      taluka: listing.taluka,
      village: listing.village,
      state: listing.state,
      quantity: listing.quantity,
      unit: listing.unit,
      price: listing.price,
      primaryUnit: listing.primaryUnit,
      secondaryUnit: listing.secondaryUnit,
      marketPrice: listing.marketPrice,
      availability: listing.availability,
      verified: listing.verified,
      readyToSell: listing.readyToSell,
      description: listing.description,
      qualityGrade: listing.qualityGrade,
      cropDate: listing.cropDate,
      status: listing.status as AdminMarketplaceListItem['status'],
      isUserCreated: listing.isUserCreated,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      farmer: this.toFarmer(listing.user, listing),
    };
  }

  private toDetails(listing: Parameters<AdminMarketplaceService['toListItem']>[0] & {
    additionalImages: unknown;
    lat: number;
    lng: number;
    distanceKm: number;
    postedHoursAgo: number;
  }): AdminMarketplaceDetails {
    const item = this.toListItem(listing);

    return {
      ...item,
      additionalImages: Array.isArray(listing.additionalImages)
        ? listing.additionalImages.filter(
            (value): value is string =>
              typeof value === 'string' && !value.startsWith('blob:'),
          )
        : [],
      lat: listing.lat,
      lng: listing.lng,
      distanceKm: listing.distanceKm,
      postedHoursAgo: listing.postedHoursAgo,
    };
  }
}
