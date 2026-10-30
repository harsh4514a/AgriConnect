import { BadRequestException, Injectable } from '@nestjs/common';
import { getDomainSearchAliases } from '@agri/domain-data';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GUJARAT_REGIONS,
  GUJARAT_DISTRICT_ALIASES,
  getGujaratRegionForDistrict,
  canonicalizeGujaratDistrict,
  type GujaratRegion,
} from './region-map';
import type {
  QueryMarketPricesDto,
  QueryMarketPriceBrowseDto,
} from './dto/query-market-prices.dto';
import type {
  MarketPriceFiltersResponseDto,
  MarketPriceListResponseDto,
  MarketPriceMarketListResponseDto,
  MarketPriceMarketPriceListResponseDto,
  MarketPriceRegionDto,
  MarketPriceCropListResponseDto,
  MarketPriceCropMarketComparisonResponseDto,
  MarketPriceResponseDto,
} from './dto/market-price-response.dto';
import { MarketPriceRegionService } from './market-price-region.service';
import { normalizeMarketYardName } from './market-name';

function domainSearchTerms(value?: string): string[] {
  const query = value?.trim();
  return query ? [...new Set([query, ...getDomainSearchAliases(query)])] : [];
}

@Injectable()
export class MarketPricesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly regionService: MarketPriceRegionService,
  ) {}

  async findAll(query: QueryMarketPricesDto): Promise<MarketPriceListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    /*
     * Advanced Market Prices should show the latest available market data
     * by default.
     *
     * Without this, a search such as "Gondal" searches every historical
     * date, which causes the same crop to appear multiple times.
     *
     * If the user explicitly selects a date, that date is respected.
     */
    let effectiveQuery = query;
    let latestAvailableDate: Date | null | undefined;

    if (!query.date) {
      const latest = await this.prisma.marketPrice.findFirst({
        where: {
          state: 'Gujarat',
        },
        orderBy: {
          dataDate: 'desc',
        },
        select: {
          dataDate: true,
        },
      });
      latestAvailableDate = latest?.dataDate ?? null;

      if (latest?.dataDate) {
        effectiveQuery = {
          ...query,
          date: latest.dataDate.toISOString().slice(0, 10),
        };
      }
    }

    const where = this.buildWhere(effectiveQuery);

    const [total, rows, latest] = await Promise.all([
      this.prisma.marketPrice.count({
        where,
      }),

      this.prisma.marketPrice.findMany({
        where,
        orderBy: [{ commodity: 'asc' }, { variety: 'asc' }, { grade: 'asc' }, { market: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      latestAvailableDate !== undefined
        ? Promise.resolve(latestAvailableDate)
        : this.prisma.marketPrice
            .findFirst({
              where: { state: 'Gujarat' },
              orderBy: { dataDate: 'desc' },
              select: { dataDate: true },
            })
            .then((latest) => latest?.dataDate ?? null),
    ]);

    return {
      items: rows.map((row) => this.toDto(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      latestAvailableDate: latest?.toISOString().slice(0, 10),
    };
  }

  async getFilters(): Promise<MarketPriceFiltersResponseDto> {
    const [districts, markets, commodities, varieties, marketYards, latest] = await Promise.all([
      this.distinct('district'),
      this.distinct('market'),
      this.distinct('commodity'),
      this.distinct('variety'),
      this.getMarketYardCount(),
      this.latestDate(),
    ]);
    return {
      districts,
      markets,
      commodities,
      varieties,
      marketYardCount: marketYards,
      latestAvailableDate: latest,
    };
  }

  async getRegions(): Promise<MarketPriceRegionDto[]> {
    const pairs = await this.prisma.marketPrice.findMany({
      where: { state: 'Gujarat' },
      select: { district: true, market: true },
      distinct: ['district', 'market'],
    });

    const result: MarketPriceRegionDto[] = [];
    const unmappedDistricts = new Set<string>();

    for (const row of pairs) {
      if (!getGujaratRegionForDistrict(row.district)) {
        unmappedDistricts.add(row.district.trim());
      }
    }

    if (unmappedDistricts.size > 0) {
      // Keep the data visible in the global market-price view, but surface
      // any new government district spelling that needs an explicit alias.
      console.warn(
        `[MarketPrices] Unmapped Gujarat districts: ${[...unmappedDistricts].sort().join(', ')}`,
      );
    }

    for (const name of GUJARAT_REGIONS) {
      const regionDistricts = new Set<string>();
      const marketYards = new Set<string>();

      for (const row of pairs) {
        const canonicalDistrict = canonicalizeGujaratDistrict(row.district);
        if (getGujaratRegionForDistrict(canonicalDistrict) !== name) continue;

        regionDistricts.add(canonicalDistrict);
        marketYards.add(
          `${canonicalDistrict.toLowerCase()}::${normalizeMarketYardName(row.market)}`,
        );
      }

      result.push({
        name,
        districtCount: regionDistricts.size,
        marketCount: marketYards.size,
      });
    }

    return result;
  }
  async findDuplicateMarketYards() {
    const rows = await this.prisma.marketPrice.findMany({
      where: {
        state: 'Gujarat',
      },
      select: {
        district: true,
        market: true,
      },
    });

    const groups = new Map<
      string,
      Array<{
        district: string;
        market: string;
      }>
    >();

    for (const row of rows) {
      const district = canonicalizeGujaratDistrict(row.district);
      const market = normalizeMarketYardName(row.market);

      const key = `${district.toLowerCase()}::${market}`;

      const existing = groups.get(key) ?? [];

      existing.push({
        district: row.district,
        market: row.market,
      });

      groups.set(key, existing);
    }

    return [...groups.entries()]
      .filter(([, records]) => records.length > 1)
      .map(([identity, records]) => ({
        identity,
        records,
      }));
  }

  async getMarketsByRegion(
    region: string,
    query: QueryMarketPriceBrowseDto = {},
  ): Promise<MarketPriceMarketListResponseDto> {
    const regionName = this.asRegion(region);
    const safeQuery = query ?? {};

    const search = safeQuery.search?.trim().toLowerCase();
    const searchTerms = domainSearchTerms(safeQuery.search).map((term) => term.toLowerCase());

    const page = Math.max(safeQuery.page ?? 1, 1);
    const limit = Math.min(Math.max(safeQuery.limit ?? 20, 1), 100);

    const pairs = await this.prisma.marketPrice.findMany({
      where: {
        state: 'Gujarat',
      },
      select: {
        market: true,
        district: true,
      },
      distinct: ['market', 'district'],
      orderBy: [
        {
          market: 'asc',
        },
        {
          district: 'asc',
        },
      ],
    });

    const seen = new Set<string>();

    const items: Array<{
      market: string;
      district: string;
    }> = [];

    for (const row of pairs) {
      const canonicalDistrict = canonicalizeGujaratDistrict(row.district);

      const rowRegion = getGujaratRegionForDistrict(canonicalDistrict);

      if (rowRegion !== regionName) {
        continue;
      }

      if (search && ![row.market, canonicalDistrict].some((value) =>
        searchTerms.some((term) => value.toLowerCase().includes(term)),
      )) {
        continue;
      }

      const normalizedMarket = normalizeMarketYardName(row.market);

      const identity = `${canonicalDistrict.toLowerCase()}::${normalizedMarket}`;

      if (seen.has(identity)) {
        continue;
      }

      seen.add(identity);

      items.push({
        market: row.market.trim(),
        district: canonicalDistrict,
      });
    }

    const total = items.length;

    const startIndex = (page - 1) * limit;

    const pagedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: pagedItems,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getMarketPrices(
    market: string,
    query: QueryMarketPriceBrowseDto,
  ): Promise<MarketPriceMarketPriceListResponseDto> {
    const baseWhere = {
      state: 'Gujarat',
      market,
      ...(query.district ? { district: { in: this.getDistrictVariants(query.district) } } : {}),
    };
    const date = query.date ?? (await this.latestDateFor(baseWhere));
    if (!date)
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: 0,
      };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const searchTerms = domainSearchTerms(search);
    const where = {
      ...baseWhere,
      dataDate: new Date(`${date}T00:00:00.000Z`),
      ...(query.variety ? { variety: query.variety } : {}),
      ...(searchTerms.length > 0
        ? {
            OR: [
              ...searchTerms.flatMap((term) => [
                { commodity: { contains: term, mode: 'insensitive' as const } },
                { variety: { contains: term, mode: 'insensitive' as const } },
                { grade: { contains: term, mode: 'insensitive' as const } },
              ]),
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.marketPrice.count({ where }),
      this.prisma.marketPrice.findMany({
        where,
        orderBy: [{ commodity: 'asc' }, { variety: 'asc' }, { grade: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      items: rows.map((row) => ({
        market: row.market,
        district: canonicalizeGujaratDistrict(row.district),
        commodity: row.commodity,
        variety: row.variety,
        grade: row.grade,
        minimumPrice: row.minimumPrice,
        maximumPrice: row.maximumPrice,
        modalPrice: row.modalPrice,
        dataDate: row.dataDate.toISOString().slice(0, 10),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      latestAvailableDate: date,
    };
  }

  async getCrops(search?: string): Promise<MarketPriceCropListResponseDto> {
    const searchTerms = domainSearchTerms(search);
    const rows = await this.prisma.marketPrice.findMany({
      where: {
        state: 'Gujarat',
        ...(searchTerms.length > 0
          ? { OR: searchTerms.map((term) => ({ commodity: { contains: term, mode: 'insensitive' as const } })) }
          : {}),
      },
      select: { commodity: true, market: true },
      distinct: ['commodity', 'market'],
      orderBy: { commodity: 'asc' },
    });
    const counts = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!counts.has(row.commodity)) counts.set(row.commodity, new Set());
      counts.get(row.commodity)!.add(row.market);
    }
    return {
      total: counts.size,
      items: [...counts.entries()].map(([name, markets]) => ({ name, marketCount: markets.size })),
    };
  }

  async getCropMarketComparison(
    commodity: string,
    query: QueryMarketPriceBrowseDto,
  ): Promise<MarketPriceCropMarketComparisonResponseDto> {
    const normalizedCommodity = commodity.trim();
    const baseWhere = {
      state: 'Gujarat',
      commodity: normalizedCommodity,
    };

    const requestedDate = query.date?.trim();
    const date = requestedDate || (await this.latestDateFor(baseWhere));
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    if (!date) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const where = {
      ...baseWhere,
      dataDate: new Date(`${date}T00:00:00.000Z`),
      ...(query.variety?.trim() ? { variety: query.variety.trim() } : {}),
    };

    /*
     * Crop comparison is intentionally calculated from the original
     * government fields:
     *
     *   Highest = highest maximumPrice in the market
     *   Average = average modalPrice in the market
     *   Lowest  = lowest minimumPrice in the market
     *
     * Do NOT use min/max/avg of modalPrice for all three columns.
     */
    const grouped = await this.prisma.marketPrice.groupBy({
      by: ['market', 'district'],
      where,
      _min: {
        minimumPrice: true,
      },
      _max: {
        maximumPrice: true,
      },
      _avg: {
        modalPrice: true,
      },
      _count: {
        _all: true,
      },
      orderBy: { market: 'asc' },
    });

    type MergedRow = {
      market: string;
      district: string;
      highestPrice: number;
      lowestPrice: number;
      modalPriceTotal: number;
      recordCount: number;
      dataDate: string;
    };

    const merged = new Map<string, MergedRow>();

    for (const row of grouped) {
      const market = row.market.trim();
      const district = canonicalizeGujaratDistrict(row.district);
      const key = `${market.toLowerCase()}::${district.toLowerCase()}`;

      const count = row._count._all;
      const averageModal = Number(row._avg.modalPrice ?? 0);
      const highest = Number(row._max.maximumPrice ?? 0);
      const lowest = Number(row._min.minimumPrice ?? 0);

      const current = merged.get(key);

      if (!current) {
        merged.set(key, {
          market,
          district,
          highestPrice: highest,
          lowestPrice: lowest,
          modalPriceTotal: averageModal * count,
          recordCount: count,
          dataDate: date,
        });
      } else {
        current.highestPrice = Math.max(current.highestPrice, highest);
        current.lowestPrice = Math.min(current.lowestPrice, lowest);
        current.modalPriceTotal += averageModal * count;
        current.recordCount += count;
      }
    }

    const groupedCanonical = [...merged.values()].sort((a, b) =>
      `${a.market} ${a.district}`.localeCompare(`${b.market} ${b.district}`),
    );

    const searchTerms = domainSearchTerms(query.search).map((term) => term.toLowerCase());
    const filtered = searchTerms.length > 0
      ? groupedCanonical.filter((row) =>
          [row.market, row.district].some((value) =>
            searchTerms.some((term) => value.toLowerCase().includes(term)),
          ),
        )
      : groupedCanonical;

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * limit, page * limit);

    const varietyRows = paged.length
      ? await this.prisma.marketPrice.findMany({
          where,
          select: { market: true, variety: true },
          distinct: ['market', 'variety'],
        })
      : [];

    const varieties = new Map<string, string[]>();
    for (const row of varietyRows) {
      if (!row.variety) continue;
      const marketKey = row.market.trim().toLowerCase();
      if (!varieties.has(marketKey)) varieties.set(marketKey, []);
      varieties.get(marketKey)!.push(row.variety);
    }

    return {
      items: paged.map((row) => ({
        market: row.market,
        district: row.district,
        highestPrice: Number(row.highestPrice),
        averagePrice: Number((row.modalPriceTotal / row.recordCount).toFixed(2)),
        lowestPrice: Number(row.lowestPrice),
        recordCount: row.recordCount,
        varieties: varieties.get(row.market.trim().toLowerCase()) ?? [],
        dataDate: row.dataDate,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      latestAvailableDate: date,
    };
  }

  private buildWhere(query: QueryMarketPricesDto) {
    const search = query.search?.trim();
    const searchTerms = search
      ? [...new Set([search, ...getDomainSearchAliases(search)])]
      : [];
    return {
      state: 'Gujarat',
      ...(query.district ? { district: { in: this.getDistrictVariants(query.district) } } : {}),
      ...(query.market ? { market: query.market } : {}),
      ...(query.commodity ? { commodity: query.commodity } : {}),
      ...(query.variety ? { variety: query.variety } : {}),
      ...(query.date ? { dataDate: new Date(`${query.date}T00:00:00.000Z`) } : {}),
      ...(searchTerms.length > 0
        ? {
            OR: searchTerms.flatMap((term) => [
              { district: { contains: term, mode: 'insensitive' as const } },
              { market: { contains: term, mode: 'insensitive' as const } },
              { commodity: { contains: term, mode: 'insensitive' as const } },
              { variety: { contains: term, mode: 'insensitive' as const } },
              { grade: { contains: term, mode: 'insensitive' as const } },
            ]),
          }
        : {}),
    };
  }

  private async distinct(
    field: 'district' | 'market' | 'commodity' | 'variety',
  ): Promise<string[]> {
    if (field === 'district') {
      const rows = await this.prisma.marketPrice.findMany({
        where: { state: 'Gujarat' },
        distinct: ['district'],
        select: { district: true },
        orderBy: { district: 'asc' },
      });

      const districts = new Map<string, string>();
      for (const row of rows) {
        const canonical = canonicalizeGujaratDistrict(row.district);
        if (!canonical) continue;
        districts.set(canonical.toLowerCase(), canonical);
      }

      return [...districts.values()].sort((a, b) => a.localeCompare(b));
    }
    if (field === 'market') {
      const rows = await this.prisma.marketPrice.findMany({
        where: { state: 'Gujarat' },
        distinct: ['market'],
        select: { market: true },
        orderBy: { market: 'asc' },
      });
      return rows.map((row) => row.market).filter(Boolean);
    }
    if (field === 'commodity') {
      const rows = await this.prisma.marketPrice.findMany({
        where: { state: 'Gujarat' },
        distinct: ['commodity'],
        select: { commodity: true },
        orderBy: { commodity: 'asc' },
      });
      return rows.map((row) => row.commodity).filter(Boolean);
    }
    const rows = await this.prisma.marketPrice.findMany({
      where: { state: 'Gujarat' },
      distinct: ['variety'],
      select: { variety: true },
      orderBy: { variety: 'asc' },
    });
    return rows.map((row) => row.variety).filter(Boolean);
  }

  private async getMarketYardCount(): Promise<number> {
    const rows = await this.prisma.marketPrice.findMany({
      where: { state: 'Gujarat' },
      select: {
        district: true,
        market: true,
      },
      distinct: ['district', 'market'],
    });

    const identities = new Set(
      rows.map((row) => {
        const district = canonicalizeGujaratDistrict(row.district);
        const market = normalizeMarketYardName(row.market);

        return `${district.toLowerCase()}::${market}`;
      }),
    );

    return identities.size;
  }

  private getDistrictVariants(district: string): string[] {
    const canonical = canonicalizeGujaratDistrict(district);
    const variants = new Set<string>([canonical]);

    for (const [alias, target] of Object.entries(GUJARAT_DISTRICT_ALIASES)) {
      if (target !== canonical) continue;
      variants.add(alias);
      variants.add(alias.replace(/\b\w/g, (character) => character.toUpperCase()));
    }

    return [...variants].filter(Boolean);
  }

  private async latestDate(): Promise<string | undefined> {
    const row = await this.prisma.marketPrice.findFirst({
      where: { state: 'Gujarat' },
      orderBy: { dataDate: 'desc' },
      select: { dataDate: true },
    });
    return row?.dataDate.toISOString().slice(0, 10);
  }

  private async latestDateFor(where: {
    state: string;
    market?: string;
    commodity?: string;
    district?: { in: string[] };
  }): Promise<string | undefined> {
    const row = await this.prisma.marketPrice.findFirst({
      where,
      orderBy: { dataDate: 'desc' },
      select: { dataDate: true },
    });
    return row?.dataDate.toISOString().slice(0, 10);
  }

  private asRegion(value: string): GujaratRegion {
    const raw = String(value ?? '').trim();

    if (!raw) {
      throw new BadRequestException('Gujarat region is required');
    }

    let decoded: string;

    try {
      decoded = decodeURIComponent(raw).trim();
    } catch {
      throw new BadRequestException('Invalid Gujarat region');
    }

    const matchedRegion = GUJARAT_REGIONS.find(
      (region) => region.toLowerCase() === decoded.toLowerCase(),
    );

    if (matchedRegion) {
      return matchedRegion;
    }

    throw new BadRequestException(`Unknown Gujarat region: ${decoded}`);
  }

  private toDto(row: {
    id: string;
    state: string;
    district: string;
    market: string;
    commodity: string;
    variety: string;
    grade: string;
    dataDate: Date;
    minimumPrice: number;
    maximumPrice: number;
    modalPrice: number;
    source: string;
    fetchedAt: Date;
  }): MarketPriceResponseDto {
    return {
      id: row.id,
      state: row.state,
      district: canonicalizeGujaratDistrict(row.district),
      market: row.market,
      commodity: row.commodity,
      variety: row.variety,
      grade: row.grade,
      dataDate: row.dataDate.toISOString().slice(0, 10),
      minimumPrice: row.minimumPrice,
      maximumPrice: row.maximumPrice,
      modalPrice: row.modalPrice,
      source: row.source,
      fetchedAt: row.fetchedAt.toISOString(),
    };
  }
}
