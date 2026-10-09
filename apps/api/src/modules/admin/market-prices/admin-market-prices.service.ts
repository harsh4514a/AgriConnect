import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { AdminMarketPricesQueryDto } from './dto/admin-market-prices-query.dto';
import type {
  AdminMarketPriceListItem,
  AdminMarketPricesFiltersResponse,
  AdminMarketPricesResponse,
  AdminMarketPriceSyncInfo,
} from './interfaces/admin-market-prices-response.interface';

/** Allowed sort field → Prisma field mapping (whitelist). */
const SORT_FIELD_MAP: Record<string, string> = {
  commodity: 'commodity',
  market: 'market',
  district: 'district',
  modalPrice: 'modalPrice',
  dataDate: 'dataDate',
};

@Injectable()
export class AdminMarketPricesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List market-price records for administrators. */
  async findAll(query: AdminMarketPricesQueryDto): Promise<AdminMarketPricesResponse> {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 100);
    const skip = (page - 1) * pageSize;

    const sortByField = SORT_FIELD_MAP[query.sortBy ?? 'commodity'] ?? 'commodity';
    const sortDir = query.sortDir === 'desc' ? 'desc' : 'asc';

    /*
     * If the admin has not chosen a specific date, default to the latest
     * available date so results are not a confusing historical mix.
     */
    let effectiveDate = query.date;
    if (!effectiveDate) {
      const latest = await this.prisma.marketPrice.findFirst({
        orderBy: { dataDate: 'desc' },
        select: { dataDate: true },
      });
      if (latest?.dataDate) {
        effectiveDate = latest.dataDate.toISOString().slice(0, 10);
      }
    }

    const where = this.buildWhere(query, effectiveDate);

    const [total, rows, syncInfo] = await Promise.all([
      this.prisma.marketPrice.count({ where }),
      this.prisma.marketPrice.findMany({
        where,
        orderBy: { [sortByField]: sortDir },
        skip,
        take: pageSize,
        select: {
          id: true,
          state: true,
          district: true,
          market: true,
          commodity: true,
          variety: true,
          grade: true,
          dataDate: true,
          minimumPrice: true,
          maximumPrice: true,
          modalPrice: true,
          source: true,
          fetchedAt: true,
        },
      }),
      this.getSyncInfo(),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / pageSize),
      },
      syncInfo,
    };
  }

  /** Distinct filter options for Admins. */
  async getFilters(): Promise<AdminMarketPricesFiltersResponse> {
    const [districtRows, marketRows, commodityRows, varietyRows, dateRows] = await Promise.all([
      this.prisma.marketPrice.findMany({
        distinct: ['district'],
        orderBy: { district: 'asc' },
        select: { district: true },
      }),
      this.prisma.marketPrice.findMany({
        distinct: ['market'],
        orderBy: { market: 'asc' },
        select: { market: true },
      }),
      this.prisma.marketPrice.findMany({
        distinct: ['commodity'],
        orderBy: { commodity: 'asc' },
        select: { commodity: true },
      }),
      this.prisma.marketPrice.findMany({
        distinct: ['variety'],
        orderBy: { variety: 'asc' },
        select: { variety: true },
        where: { variety: { not: '' } },
      }),
      this.prisma.marketPrice.findMany({
        distinct: ['dataDate'],
        orderBy: { dataDate: 'desc' },
        select: { dataDate: true },
        take: 30,
      }),
    ]);

    return {
      districts: districtRows.map((r) => r.district).filter(Boolean),
      markets: marketRows.map((r) => r.market).filter(Boolean),
      commodities: commodityRows.map((r) => r.commodity).filter(Boolean),
      varieties: varietyRows.map((r) => r.variety).filter(Boolean),
      availableDates: dateRows.map((r) => r.dataDate.toISOString().slice(0, 10)),
    };
  }

  /** Get a single market-price record by ID. */
  async findOne(id: string): Promise<AdminMarketPriceListItem | null> {
    const row = await this.prisma.marketPrice.findUnique({
      where: { id },
      select: {
        id: true,
        state: true,
        district: true,
        market: true,
        commodity: true,
        variety: true,
        grade: true,
        dataDate: true,
        minimumPrice: true,
        maximumPrice: true,
        modalPrice: true,
        source: true,
        fetchedAt: true,
      },
    });
    return row ? this.toListItem(row) : null;
  }

  /** Synchronization summary extracted from real database data. */
  private async getSyncInfo(): Promise<AdminMarketPriceSyncInfo> {
    const [latestByDate, latestByFetch, totalRecords] = await Promise.all([
      this.prisma.marketPrice.findFirst({
        orderBy: { dataDate: 'desc' },
        select: { dataDate: true },
      }),
      this.prisma.marketPrice.findFirst({
        orderBy: { fetchedAt: 'desc' },
        select: { fetchedAt: true },
      }),
      this.prisma.marketPrice.count(),
    ]);

    return {
      latestDataDate: latestByDate?.dataDate?.toISOString().slice(0, 10) ?? null,
      latestFetchedAt: latestByFetch?.fetchedAt?.toISOString() ?? null,
      totalRecords,
    };
  }

  private buildWhere(query: AdminMarketPricesQueryDto, effectiveDate?: string) {
    const search = query.search?.trim();
    return {
      ...(query.district ? { district: { contains: query.district, mode: 'insensitive' as const } } : {}),
      ...(query.market ? { market: { contains: query.market, mode: 'insensitive' as const } } : {}),
      ...(query.commodity ? { commodity: { contains: query.commodity, mode: 'insensitive' as const } } : {}),
      ...(query.variety ? { variety: { contains: query.variety, mode: 'insensitive' as const } } : {}),
      ...(effectiveDate ? { dataDate: new Date(`${effectiveDate}T00:00:00.000Z`) } : {}),
      ...(search
        ? {
            OR: [
              { commodity: { contains: search, mode: 'insensitive' as const } },
              { variety: { contains: search, mode: 'insensitive' as const } },
              { market: { contains: search, mode: 'insensitive' as const } },
              { district: { contains: search, mode: 'insensitive' as const } },
              { grade: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  private toListItem(row: {
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
  }): AdminMarketPriceListItem {
    return {
      id: row.id,
      state: row.state,
      district: row.district,
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
