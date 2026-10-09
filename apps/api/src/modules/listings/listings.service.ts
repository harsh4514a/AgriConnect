import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryListingsDto } from './dto/query-listings.dto';
import type { ListingResponseDto, PaginatedListingsDto } from './dto/listing-response.dto';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import type { Listing } from '@prisma/client';
import type { NearbyListingsQueryDto } from './dto/nearby-listings.dto';
import { NotificationsService, NOTIFICATION_TYPES } from '../notifications/notifications.service';
import { getDomainSearchAliases } from '@agri/domain-data';

/**
 * Convert the seller's price unit into kilograms.
 *
 * Supported values:
 * - "20 kg"
 * - "kg"
 * - "quintal"
 * - "ton"
 *
 * The database stores marketPrice as a price per quintal.
 */
function getPriceUnitInKg(primaryUnit: string): number {
  const normalized = primaryUnit.toLowerCase().replace(/\s+/g, ' ').trim();

  // "20 kg", "40 kg", etc.
  const kgMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*kg$/);

  if (kgMatch) {
    const kg = Number(kgMatch[1]);

    if (Number.isFinite(kg) && kg > 0) {
      return kg;
    }
  }

  // Price entered per kilogram.
  if (normalized === 'kg') {
    return 1;
  }

  // Price entered per quintal.
  if (normalized === 'quintal' || normalized === 'qtl') {
    return 100;
  }

  // Price entered per ton.
  if (normalized === 'ton' || normalized === 'tonne' || normalized === 'tonnes') {
    return 1000;
  }

  /*
   * Your current create-listing UI defaults to 20 kg.
   * Keep 20 kg as the safe fallback if an unexpected
   * primaryUnit reaches the backend.
   */
  return 20;
}

/**
 * Convert the seller's entered price into price per quintal.
 *
 * Examples:
 *
 * ₹500 / 20 kg
 * → ₹2,500 / quintal
 *
 * ₹25 / kg
 * → ₹2,500 / quintal
 *
 * ₹2,500 / quintal
 * → ₹2,500 / quintal
 *
 * ₹25,000 / ton
 * → ₹2,500 / quintal
 */
function getPricePerQuintal(price: number, primaryUnit: string): number {
  const unitKg = getPriceUnitInKg(primaryUnit);

  return price * (100 / unitKg);
}

/**
 * Calculate the market comparison price.
 *
 * marketPrice is stored in the database as price per quintal.
 *
 * The current project uses a 10% market-price comparison
 * above the seller's normalized quintal price.
 */
function calculateMarketPrice(price: number, primaryUnit: string): number {
  const pricePerQuintal = getPricePerQuintal(price, primaryUnit);

  return Math.round(pricePerQuintal * 1.1);
}

/**
 * Calculate the great-circle distance between two coordinates.
 *
 * Result is returned in kilometres.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Map a Prisma Listing row to the ListingResponseDto shape.
   * additionalImages is stored as a Json column; cast it to string[].
   */
  private toDto(listing: Listing): ListingResponseDto {
    return {
      id: listing.id,
      cropKey: listing.cropKey,
      image: listing.image.startsWith('blob:')
        ? `/crops/${listing.cropKey === 'other' ? 'other' : listing.cropKey}.svg`
        : listing.image,
      imageAlt: listing.imageAlt,
      farmerName: listing.farmerName,
      farmerNameShort: listing.farmerNameShort,
      district: listing.district,
      village: listing.village,
      taluka: listing.taluka,
      state: listing.state,
      quantity: listing.quantity,
      unit: listing.unit,
      price: listing.price,
      primaryUnit: listing.primaryUnit,
      secondaryUnit: listing.secondaryUnit,
      marketPrice: listing.marketPrice,
      distanceKm: listing.distanceKm,
      postedHoursAgo: listing.postedHoursAgo,
      availability: listing.availability,
      verified: listing.verified,
      mobileNumber: listing.mobileNumber,
      phoneLabel: listing.phoneLabel,
      readyToSell: listing.readyToSell,
      lat: listing.lat,
      lng: listing.lng,
      description: listing.description ?? undefined,
      variety: listing.variety ?? undefined,
      customCropName: listing.customCropName ?? undefined,
      qualityGrade: listing.qualityGrade ?? undefined,
      cropDate: listing.cropDate ?? undefined,
      farmerMemberSince: listing.farmerMemberSince ?? undefined,
      farmerListingCount: listing.farmerListingCount ?? undefined,
      additionalImages: Array.isArray(listing.additionalImages)
        ? (listing.additionalImages as unknown[]).filter(
            (image): image is string =>
              typeof image === 'string' && !image.startsWith('blob:'),
          )
        : undefined,
      status: listing.status,
      isUserCreated: listing.isUserCreated,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  async findAll(
    query: QueryListingsDto,
    includePrivateFields = false,
  ): Promise<PaginatedListingsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.cropKey && query.cropKey !== 'all' ? { cropKey: query.cropKey } : {}),
      ...(query.district && query.district !== 'all' ? { district: query.district } : {}),
      ...(includePrivateFields
        ? query.status
          ? { status: query.status }
          : { NOT: { status: 'inactive' } }
        : { status: 'active' }),
    };

    const [total, rows] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      listings: rows.map((row) => {
        const dto = this.toDto(row);
        return includePrivateFields ? dto : this.toPublicDto(dto);
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find marketplace listings near the authenticated user's
   * saved profile location.
   *
   * Important:
   * - Uses the user's saved latitude/longitude from PostgreSQL.
   * - Does NOT use browser GPS.
   * - Does NOT trust client-provided user coordinates.
   * - Only active listings are returned.
   * - Distance is calculated server-side.
   * - Results are sorted nearest first.
   */
  async findNearby(userId: string, query: NearbyListingsQueryDto): Promise<PaginatedListingsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const radius = query.radius ?? 10;

    /*
     * Get the user's saved profile location.
     */
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Authenticated user not found');
    }

    /*
     * Nearby requires actual coordinates.
     */
    const hasValidUserLocation =
      typeof user.latitude === 'number' &&
      typeof user.longitude === 'number' &&
      Number.isFinite(user.latitude) &&
      Number.isFinite(user.longitude) &&
      user.latitude >= -90 &&
      user.latitude <= 90 &&
      user.longitude >= -180 &&
      user.longitude <= 180 &&
      !(user.latitude === 0 && user.longitude === 0);

    if (!hasValidUserLocation) {
      throw new BadRequestException('Profile location is required to find nearby listings');
    }

    /*
     * Build the database filter.
     *
     * We fetch only active listings.
     */
    const search = query.search?.trim();
    const searchTerms = search ? [search, ...getDomainSearchAliases(search)] : [];

    const where = {
      status: 'active',

      ...(query.cropKey
        ? {
            cropKey: query.cropKey,
          }
        : {}),

      ...(search
        ? {
            OR: searchTerms.flatMap((term) => [
              { farmerName: { contains: term, mode: 'insensitive' as const } },
              { farmerNameShort: { contains: term, mode: 'insensitive' as const } },
              { village: { contains: term, mode: 'insensitive' as const } },
              { taluka: { contains: term, mode: 'insensitive' as const } },
              { district: { contains: term, mode: 'insensitive' as const } },
              { variety: { contains: term, mode: 'insensitive' as const } },
              { customCropName: { contains: term, mode: 'insensitive' as const } },
              { cropKey: { contains: term, mode: 'insensitive' as const } },
            ]),
          }
        : {}),
    };

    /*
     * Get active database listings matching the search/crop filter.
     *
     * Distance is calculated below because the current project
     * does not use PostGIS.
     */
    const rows = await this.prisma.listing.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    /*
     * Calculate the real distance from the user's saved location.
     */
    const nearbyRows = rows
      .map((listing) => ({
        listing,
        distanceKm: haversineKm(
          user.latitude as number,
          user.longitude as number,
          listing.lat,
          listing.lng,
        ),
      }))
      .filter(({ distanceKm }) => Number.isFinite(distanceKm) && distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    /*
     * Pagination happens AFTER the distance filter.
     *
     * This is important.
     *
     * We don't want:
     *
     * first 12 database listings
     *       ↓
     * distance filter
     *
     * because that could incorrectly hide nearby listings.
     *
     * Instead:
     *
     * all matching listings
     *       ↓
     * calculate distance
     *       ↓
     * radius filter
     *       ↓
     * nearest first
     *       ↓
     * pagination
     */
    const total = nearbyRows.length;

    const skip = (page - 1) * limit;

    const paginatedRows = nearbyRows.slice(skip, skip + limit);

    return {
      listings: paginatedRows.map(({ listing, distanceKm }) => ({
        ...this.toDto(listing),

        /*
         * Override the database's stored distance with
         * the actual distance from the current user.
         */
        distanceKm: Math.round(distanceKm * 10) / 10,
      })),

      total,
      page,
      limit,

      totalPages: Math.ceil(total / limit),
    };
  }

  async create(userId: string, dto: CreateListingDto): Promise<ListingResponseDto> {
    const [user, existingListingCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          mobileNumber: true,
          isVerified: true,
          latitude: true,
          longitude: true,
          createdAt: true,
        },
      }),
      this.prisma.listing.count({ where: { userId } }),
    ]);

    // JwtStrategy normally guarantees this. Keeping the guard makes this method
    // safe to reuse from another authenticated entry point as well.
    if (!user) {
      throw new NotFoundException('Authenticated user not found');
    }

    const farmerName =
      user.firstName && user.lastName
        ? `${user.firstName.trim()} ${user.lastName.trim()}`
        : 'AgriConnect Farmer';
    const farmerNameShort = user.firstName?.trim() || farmerName.split(/\s+/)[0] || farmerName;
    const image = dto.image || `/crops/${dto.cropKey === 'other' ? 'other' : dto.cropKey}.svg`;
    const imageAlt = dto.imageAlt || dto.customCropName?.trim() || dto.cropKey;
    const price = Number(dto.price);

    const primaryUnit = dto.primaryUnit.trim();

    const marketPrice = calculateMarketPrice(price, primaryUnit);

    const listing = await this.prisma.listing.create({
      data: {
        cropKey: dto.cropKey,
        image,
        imageAlt,
        farmerName,
        farmerNameShort,
        district: dto.district.trim(),
        village: dto.village.trim(),
        taluka: dto.taluka.trim(),
        state: dto.state?.trim() || 'Gujarat',
        quantity: Number(dto.quantity),
        unit: dto.unit,
        // price,
        // primaryUnit: dto.primaryUnit.trim(),
        // secondaryUnit: 'quintal',
        // marketPrice: Math.round(price * 1.1),
        price,
        primaryUnit,
        secondaryUnit: 'quintal',
        marketPrice,
        availability: 'available',
        verified: user.isVerified,
        mobileNumber: user.mobileNumber,
        phoneLabel: farmerNameShort,
        readyToSell: true,
        lat: user.latitude ?? 22.03,
        lng: user.longitude ?? 71.2,
        description: dto.description?.trim() || null,
        variety: dto.variety?.trim() || null,
        customCropName: dto.customCropName?.trim() || null,
        qualityGrade: dto.qualityGrade?.trim() || 'A Grade',
        cropDate: dto.cropDate,
        farmerMemberSince: user.createdAt.getFullYear(),
        farmerListingCount: existingListingCount + 1,
        additionalImages: dto.additionalImages ?? [],
        status: 'active',
        isUserCreated: true,
        userId,
      },
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.LISTING,
      titleKey: 'dashboard.notifications.types.listingCreated.title',
      messageKey: 'dashboard.notifications.types.listingCreated.message',
      data: {
        cropKey: listing.cropKey,
        customCropName: listing.customCropName,
      },
      relatedPath: '/dashboard/my-listings',
      relatedType: 'listing',
      relatedId: listing.id,
      dedupeKey: `listing.created:${listing.id}`,
    });

    return this.toDto(listing);
  }

  async findMine(userId: string): Promise<ListingResponseDto[]> {
    const listings = await this.prisma.listing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return listings.map((listing) => this.toDto(listing));
  }

  async findMineById(userId: string, id: string): Promise<ListingResponseDto> {
    return this.toDto(await this.findOwnedListing(userId, id));
  }

  // async update(userId: string, id: string, dto: UpdateListingDto): Promise<ListingResponseDto> {
  //   await this.findOwnedListing(userId, id);

  //   const price = dto.price === undefined ? undefined : Number(dto.price);
  //   const listing = await this.prisma.listing.update({

  async update(userId: string, id: string, dto: UpdateListingDto): Promise<ListingResponseDto> {
    const existingListing = await this.findOwnedListing(userId, id);

    const price = dto.price === undefined ? existingListing.price : Number(dto.price);

    const primaryUnit =
      dto.primaryUnit === undefined ? existingListing.primaryUnit : dto.primaryUnit.trim();

    /*
     * Recalculate marketPrice whenever either:
     * - price changes
     * - primaryUnit changes
     *
     * This keeps the database internally consistent.
     */
    const shouldRecalculateMarketPrice = dto.price !== undefined || dto.primaryUnit !== undefined;

    const marketPrice = shouldRecalculateMarketPrice
      ? calculateMarketPrice(price, primaryUnit)
      : existingListing.marketPrice;

    const listing = await this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.cropKey !== undefined ? { cropKey: dto.cropKey } : {}),
        ...(dto.quantity !== undefined ? { quantity: Number(dto.quantity) } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        // ...(price !== undefined ? { price, marketPrice: Math.round(price * 1.1) } : {}),

        ...(dto.price !== undefined
          ? {
              price,
            }
          : {}),

        ...(dto.primaryUnit !== undefined
          ? {
              primaryUnit,
            }
          : {}),

        ...(shouldRecalculateMarketPrice
          ? {
              marketPrice,
            }
          : {}),

        ...(dto.primaryUnit !== undefined ? { primaryUnit: dto.primaryUnit.trim() } : {}),
        ...(dto.district !== undefined ? { district: dto.district.trim() } : {}),
        ...(dto.taluka !== undefined ? { taluka: dto.taluka.trim() } : {}),
        ...(dto.village !== undefined ? { village: dto.village.trim() } : {}),
        ...(dto.state !== undefined ? { state: dto.state.trim() || 'Gujarat' } : {}),
        ...(dto.cropDate !== undefined ? { cropDate: dto.cropDate } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.variety !== undefined ? { variety: dto.variety.trim() || null } : {}),
        ...(dto.customCropName !== undefined
          ? { customCropName: dto.customCropName.trim() || null }
          : {}),
        ...(dto.qualityGrade !== undefined
          ? { qualityGrade: dto.qualityGrade.trim() || null }
          : {}),
        ...(dto.image !== undefined ? { image: dto.image } : {}),
        ...(dto.imageAlt !== undefined ? { imageAlt: dto.imageAlt } : {}),
        ...(dto.additionalImages !== undefined ? { additionalImages: dto.additionalImages } : {}),
      },
    });

    return this.toDto(listing);
  }

  async updateStatus(
    userId: string,
    id: string,
    status: 'active' | 'sold' | 'inactive',
  ): Promise<ListingResponseDto> {
    await this.findOwnedListing(userId, id);
    const listing = await this.prisma.listing.update({
      where: { id },
      data: {
        status,
        availability: status === 'sold' ? 'soldOut' : 'available',
      },
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.LISTING,
      titleKey: 'dashboard.notifications.types.listingStatusUpdated.title',
      messageKey: 'dashboard.notifications.types.listingStatusUpdated.message',
      data: {
        cropKey: listing.cropKey,
        customCropName: listing.customCropName,
      },
      relatedPath: '/dashboard/my-listings',
      relatedType: 'listing',
      relatedId: listing.id,
      dedupeKey: `listing.status:${listing.id}:${listing.updatedAt.toISOString()}`,
    });

    return this.toDto(listing);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwnedListing(userId, id);
    await this.prisma.listing.delete({ where: { id } });
  }

  private async findOwnedListing(userId: string, id: string): Promise<Listing> {
    const listing = await this.prisma.listing.findFirst({ where: { id, userId } });
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    return listing;
  }

  /**
   * Find listings actually related to the current listing.
   *
   * Related means:
   * - Same cropKey
   * - Active listing only
   * - Current listing excluded
   * - Results come directly from PostgreSQL
   * - Newest listings first
   */
  async findRelated(id: string, includePrivateFields = false): Promise<ListingResponseDto[]> {
    // First fetch the current listing so the relationship is
    // determined from the database, not from frontend/static data.
    const currentListing = await this.prisma.listing.findUnique({
      where: { id, ...(!includePrivateFields ? { status: 'active' } : {}) },
      select: {
        id: true,
        cropKey: true,
      },
    });

    if (!currentListing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }

    // Fetch only listings belonging to the same crop.
    const relatedListings = await this.prisma.listing.findMany({
      where: {
        cropKey: currentListing.cropKey,
        status: 'active',
        id: {
          not: currentListing.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
    });

    return relatedListings.map((listing) => {
      const dto = this.toDto(listing);
      return includePrivateFields ? dto : this.toPublicDto(dto);
    });
  }

  async findOne(id: string, includePrivateFields = false): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }

    if (!includePrivateFields && listing.status !== 'active') {
      throw new NotFoundException(`Listing ${id} not found`);
    }

    const dto = this.toDto(listing);
    return includePrivateFields ? dto : this.toPublicDto(dto);
  }

  private toPublicDto(dto: ListingResponseDto): ListingResponseDto {
    const publicDto = { ...dto };
    delete publicDto.farmerName;
    delete publicDto.farmerNameShort;
    delete publicDto.village;
    delete publicDto.taluka;
    delete publicDto.mobileNumber;
    delete publicDto.phoneLabel;
    delete publicDto.lat;
    delete publicDto.lng;
    return publicDto;
  }
}
