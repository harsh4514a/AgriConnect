import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryListingsDto } from './dto/query-listings.dto';
import type { ListingResponseDto, PaginatedListingsDto } from './dto/listing-response.dto';
import type { RecentListingResponseDto } from './dto/recent-listing-response.dto';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import type { Listing, Prisma } from '@prisma/client';
import type { NearbyListingsQueryDto } from './dto/nearby-listings.dto';
import type { QueryMyListingsManagementDto } from './dto/query-my-listings-management.dto';
import type { MyListingsManagementResponseDto } from './dto/my-listings-management-response.dto';
import { NotificationsService, NOTIFICATION_TYPES } from '../notifications/notifications.service';
import { getDomainSearchAliases } from '@agri/domain-data';
import {
  compareDistanceRows,
  filterDistanceRows,
  hasValidCoordinates as hasValidGeoCoordinates,
} from './geo-distance';
import {
  LocationGeographyService,
  type ListingGeographicContext,
} from './location-geography.service';

type ListingWithOwnerLocation = ListingGeographicContext;

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
function normalizeLocationName(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? '';
}

function hasValidCoordinates(
  latitude: number | null,
  longitude: number | null,
): boolean {
  return hasValidGeoCoordinates({ latitude, longitude });
}

function searchWhere(search: string | undefined): Prisma.ListingWhereInput {
  const trimmed = search?.trim();
  if (!trimmed) return {};

  const terms = [...new Set([trimmed, ...getDomainSearchAliases(trimmed)])];
  return {
    OR: terms.flatMap((term) => [
      { farmerName: { contains: term, mode: 'insensitive' as const } },
      { farmerNameShort: { contains: term, mode: 'insensitive' as const } },
      { village: { contains: term, mode: 'insensitive' as const } },
      { taluka: { contains: term, mode: 'insensitive' as const } },
      { district: { contains: term, mode: 'insensitive' as const } },
      { variety: { contains: term, mode: 'insensitive' as const } },
      { customCropName: { contains: term, mode: 'insensitive' as const } },
      { cropKey: { contains: term, mode: 'insensitive' as const } },
    ]),
  };
}

function quantityInQuintals(listing: Pick<Listing, 'quantity' | 'unit'>): number {
  if (listing.unit === 'ton') return listing.quantity * 10;
  if (listing.unit === 'kg') return listing.quantity / 100;
  return listing.quantity;
}

function matchesNumericFilters(
  listing: Listing,
  query: QueryListingsDto,
): boolean {
  const quantity = quantityInQuintals(listing);
  return (
    (query.verified !== true || listing.verified) &&
    (query.priceMin === undefined || listing.price >= query.priceMin) &&
    (query.priceMax === undefined || listing.price < query.priceMax) &&
    (query.quantityMin === undefined || quantity >= query.quantityMin) &&
    (query.quantityMax === undefined || quantity < query.quantityMax)
  );
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly locationGeography: LocationGeographyService,
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
      coordinatesVerified: listing.hasExplicitCoordinates,
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
    userId: string | null = null,
  ): Promise<PaginatedListingsDto> {
    const includePrivateFields = Boolean(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.ListingWhereInput = {
      ...(query.cropKey && query.cropKey !== 'all' ? { cropKey: query.cropKey } : {}),
      ...(query.district && query.district !== 'all' ? { district: query.district } : {}),
      ...(query.village && query.village !== 'all' ? { village: query.village } : {}),
      ...(includePrivateFields
        ? query.status
          ? { status: query.status }
          : { NOT: { status: 'inactive' } }
        : { status: 'active' }),
      ...searchWhere(query.search),
    };

    if (query.sort === 'nearest') {
      const [rows, user] = await Promise.all([
        this.prisma.listing.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          include: this.locationGeography.canonicalLocationInclude(),
        }),
        userId
          ? this.prisma.user.findUnique({
              where: { id: userId },
              select: this.locationGeography.userLocationSelect(),
            })
          : Promise.resolve(null),
      ]);

      const filteredRows = rows.filter((row) => matchesNumericFilters(row, query));
      const reference = this.locationGeography.resolveUserCoordinates(user);
      const locationAvailable = Boolean(reference);

      if (!locationAvailable) {
        const total = filteredRows.length;
        const pageRows = filteredRows.slice((page - 1) * limit, page * limit);
        return {
          listings: pageRows.map((row) => this.toBrowseDto(row, includePrivateFields, null)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          locationAvailable: false,
          unlocatedCount: total,
        };
      }

      const ranked = filteredRows.map((listing) => {
        const point = this.resolveListingCoordinates(listing as ListingWithOwnerLocation);
        return {
          item: listing,
          distanceKm: point ? this.locationGeography.distanceKm(reference!, point) : null,
        };
      }).sort(compareDistanceRows);
      const unlocatedCount = ranked.filter(({ distanceKm }) => distanceKm === null).length;
      const total = ranked.length;
      const pageRows = ranked.slice((page - 1) * limit, page * limit);

      return {
        listings: pageRows.map(({ item, distanceKm }) =>
          this.toBrowseDto(item, includePrivateFields, distanceKm),
        ),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        locationAvailable: true,
        unlocatedCount,
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      listings: rows.map((row) => this.toBrowseDto(row, includePrivateFields, null)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toBrowseDto(
    listing: Listing,
    includePrivateFields: boolean,
    distanceKm: number | null,
  ): ListingResponseDto {
    const dto = includePrivateFields ? this.toDto(listing) : this.toPublicDto(this.toDto(listing));
    delete dto.lat;
    delete dto.lng;
    return {
      ...dto,
      distanceKm: distanceKm === null ? 0 : Math.round(distanceKm * 10) / 10,
      locationDistanceVerified: distanceKm !== null,
    };
  }

  private resolveListingCoordinates(
    listing: ListingWithOwnerLocation,
  ): { latitude: number; longitude: number } | null {
    return this.locationGeography.resolveListingCoordinates(listing);
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
      where: { id: userId },
      select: this.locationGeography.userLocationSelect(),
    });

    if (!user) {
      throw new NotFoundException('Authenticated user not found');
    }

    /*
     * Nearby requires actual coordinates.
     */
    const reference = this.locationGeography.resolveUserCoordinates(user);

    if (!reference) {
      throw new BadRequestException('Profile location is required to find nearby listings');
    }

    /*
     * Build the database filter.
     *
     * We fetch only active listings.
     */
    const search = query.search?.trim();
    const where: Prisma.ListingWhereInput = {
      status: 'active',

      ...(query.cropKey
        ? {
            cropKey: query.cropKey,
          }
        : {}),

      availability: 'available',
      ...searchWhere(search),
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
      include: this.locationGeography.canonicalLocationInclude(),
    });

    /*
     * Calculate the real distance from the user's saved location.
     */
    const distanceRows = rows.map((listing) => {
      const point = this.resolveListingCoordinates(listing as ListingWithOwnerLocation);
      return {
        item: listing,
        distanceKm: point
          ? this.locationGeography.distanceKm(reference, point)
          : null,
      };
    });
    const unlocatedCount = distanceRows.filter(({ distanceKm }) => distanceKm === null).length;
    const nearbyRows = filterDistanceRows(distanceRows, radius).sort(compareDistanceRows);

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
      listings: paginatedRows.map(({ item, distanceKm }) =>
        this.toBrowseDto(item, true, distanceKm),
      ),

      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      locationAvailable: true,
      unlocatedCount,
    };
  }

  async create(userId: string, dto: CreateListingDto): Promise<ListingResponseDto> {
    const hasAnySubmittedCoordinate = dto.latitude != null || dto.longitude != null;
    const hasSubmittedCoordinates = hasValidCoordinates(dto.latitude ?? null, dto.longitude ?? null);
    if (hasAnySubmittedCoordinate && !hasSubmittedCoordinates) {
      throw new BadRequestException('Both valid listing coordinates are required');
    }

    const [user, existingListingCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          ...this.locationGeography.userLocationSelect(),
          firstName: true,
          lastName: true,
          mobileNumber: true,
          isVerified: true,
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
    const locationVillageId = await this.locationGeography.findCanonicalVillageId({
      state: dto.state?.trim() || 'Gujarat',
      district: dto.district,
      taluka: dto.taluka,
      village: dto.village,
    });

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
        lat: hasSubmittedCoordinates
          ? dto.latitude!
          : 0,
        lng: hasSubmittedCoordinates
          ? dto.longitude!
          : 0,
        hasExplicitCoordinates: hasSubmittedCoordinates,
        locationVillageId,
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

  async findRecentMine(userId: string): Promise<RecentListingResponseDto[]> {
    const listings = await this.prisma.listing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        cropKey: true,
        image: true,
        imageAlt: true,
        customCropName: true,
        price: true,
        quantity: true,
        unit: true,
        village: true,
        district: true,
        createdAt: true,
      },
    });

    return listings.map((listing) => ({
      ...listing,
      image: listing.image.startsWith('blob:')
        ? `/crops/${listing.cropKey === 'other' ? 'other' : listing.cropKey}.svg`
        : listing.image,
    }));
  }

  async findMineManagement(
    userId: string,
    query: QueryMyListingsManagementDto,
  ): Promise<MyListingsManagementResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const search = query.search?.trim();
    const searchTerms = search ? [...new Set([search, ...getDomainSearchAliases(search)])] : [];
    const where: Prisma.ListingWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(searchTerms.length > 0
        ? {
            OR: searchTerms.flatMap((term) => [
              { cropKey: { contains: term, mode: 'insensitive' as const } },
              { customCropName: { contains: term, mode: 'insensitive' as const } },
              { variety: { contains: term, mode: 'insensitive' as const } },
              { village: { contains: term, mode: 'insensitive' as const } },
              { district: { contains: term, mode: 'insensitive' as const } },
            ]),
          }
        : {}),
    };

    const [listings, statusCounts, searchedTotal] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      searchTerms.length > 0
        ? this.prisma.listing.count({ where })
        : Promise.resolve<number | null>(null),
    ]);

    const counts = new Map(statusCounts.map(({ status, _count }) => [status, _count._all]));
    const stats = {
      total: statusCounts.reduce((sum, item) => sum + item._count._all, 0),
      active: counts.get('active') ?? 0,
      sold: counts.get('sold') ?? 0,
      inactive: counts.get('inactive') ?? 0,
    };
    const total = searchedTotal ?? (query.status ? stats[query.status] : stats.total);

    return {
      listings: listings.map((listing) => this.toDto(listing)),
      stats,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
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

    const hasCoordinateInput = dto.latitude !== undefined || dto.longitude !== undefined;
    const hasSubmittedCoordinates = hasValidCoordinates(dto.latitude ?? null, dto.longitude ?? null);
    if (hasCoordinateInput && !hasSubmittedCoordinates && !(dto.latitude == null && dto.longitude == null)) {
      throw new BadRequestException('Both valid listing coordinates are required');
    }

    const nextLocation = {
      district: dto.district ?? existingListing.district,
      taluka: dto.taluka ?? existingListing.taluka,
      village: dto.village ?? existingListing.village,
      state: dto.state ?? existingListing.state,
    };
    const locationChanged =
      normalizeLocationName(nextLocation.state) !== normalizeLocationName(existingListing.state) ||
      normalizeLocationName(nextLocation.district) !== normalizeLocationName(existingListing.district) ||
      normalizeLocationName(nextLocation.taluka) !== normalizeLocationName(existingListing.taluka) ||
      normalizeLocationName(nextLocation.village) !== normalizeLocationName(existingListing.village);
    let coordinateUpdate: Prisma.ListingUpdateInput = {};

    if (hasCoordinateInput) {
      coordinateUpdate = hasSubmittedCoordinates
        ? { lat: dto.latitude!, lng: dto.longitude!, hasExplicitCoordinates: true }
        : { lat: 0, lng: 0, hasExplicitCoordinates: false };
    } else if (locationChanged) {
      coordinateUpdate = { lat: 0, lng: 0, hasExplicitCoordinates: false };
    }

    const locationVillageId = locationChanged
      ? await this.locationGeography.findCanonicalVillageId(nextLocation)
      : undefined;

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
        ...coordinateUpdate,
        ...(locationChanged
          ? locationVillageId
            ? { locationVillage: { connect: { id: locationVillageId } } }
            : { locationVillage: { disconnect: true } }
          : {}),
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
