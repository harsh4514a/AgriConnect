import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { DataGovInMarketPriceProvider } from './providers/data-gov-in-market-price.provider';
import type { DataGovInMarketPriceRecord } from './interfaces/market-price.interface';

@Injectable()
export class MarketPriceSyncService {
  private readonly logger = new Logger(MarketPriceSyncService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly provider: DataGovInMarketPriceProvider,
  ) {}

  async runInitialSync(): Promise<void> {
    if (!this.isEnabled()) return;
    const days = Math.max(1, this.config.getNumber('MARKET_PRICE_INITIAL_SYNC_DAYS', 3));
    await this.syncLatestAvailableDays(days, 'INITIAL');
  }

  async runScheduledSync(): Promise<void> {
    if (!this.isEnabled()) return;
    await this.syncLatestAvailableDays(1, 'SCHEDULED');
  }

  private isEnabled(): boolean {
    return this.config.getBoolean('MARKET_PRICE_SYNC_ENABLED', true);
  }

  private async syncLatestAvailableDays(days: number, trigger: 'INITIAL' | 'SCHEDULED') {
    if (this.running) {
      this.logger.warn('Market-price sync skipped because another sync is already running');
      return;
    }

    this.running = true;
    try {
      let collectedDates = new Set<string>();
      let cursor = this.toIndiaDate(new Date());

      for (let attempts = 0; attempts < 10 && collectedDates.size < days; attempts += 1) {
        const records = await this.fetchAllForDate(cursor);
        if (records.length > 0) {
          const saved = await this.upsertRecords(records);
          this.logger.log(`Market-price sync ${trigger}: ${saved} records saved for ${cursor}`);
          collectedDates.add(cursor);
        }
        cursor = this.addDays(cursor, -1);
      }

      if (collectedDates.size === 0) {
        this.logger.warn(`Market-price sync ${trigger}: no Gujarat data was available`);
      }
    } catch (error) {
      // Existing valid database rows are intentionally left untouched.
      this.logger.error(`Market-price sync ${trigger} failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async fetchAllForDate(date: string): Promise<DataGovInMarketPriceRecord[]> {
    const pageSize = Math.min(1000, Math.max(1, this.config.getNumber('DATA_GOV_IN_PAGE_SIZE', 1000)));
    const records: DataGovInMarketPriceRecord[] = [];
    let offset = 0;

    for (let page = 0; page < 100; page += 1) {
      const result = await this.provider.fetchPage({ offset, limit: pageSize, date });
      records.push(...result.records);

      if (result.records.length < pageSize || offset + result.records.length >= result.total) {
        break;
      }
      offset += result.records.length;
    }

    return records.filter((record) => record.state?.trim().toLowerCase() === 'gujarat');
  }

  private async upsertRecords(records: DataGovInMarketPriceRecord[]): Promise<number> {
    let saved = 0;
    const fetchedAt = new Date();

    for (const record of records) {
      const normalized = this.normalizeRecord(record);
      if (!normalized) continue;

      await this.prisma.marketPrice.upsert({
        where: { sourceRecordKey: normalized.sourceRecordKey },
        create: normalized,
        update: {
          minimumPrice: normalized.minimumPrice,
          maximumPrice: normalized.maximumPrice,
          modalPrice: normalized.modalPrice,
          fetchedAt,
        },
      });
      saved += 1;
    }

    return saved;
  }

  private normalizeRecord(record: DataGovInMarketPriceRecord) {
    const state = record.state?.trim();
    const district = record.district?.trim();
    const market = record.market?.trim();
    const commodity = record.commodity?.trim();
    const variety = record.variety?.trim() || '';
    const grade = record.grade?.trim() || '';
    const date = this.normalizeDate(record.arrival_date);
    const minimumPrice = this.toNumber(record.min_price);
    const maximumPrice = this.toNumber(record.max_price);
    const modalPrice = this.toNumber(record.modal_price);

    if (
      !state ||
      !district ||
      !market ||
      !commodity ||
      !date ||
      minimumPrice === null ||
      maximumPrice === null ||
      modalPrice === null
    ) {
      return null;
    }

    const sourceRecordKey = createHash('sha256')
      .update(
        JSON.stringify({
          state,
          district,
          market,
          commodity,
          variety,
          grade,
          date,
        }),
      )
      .digest('hex');

    return {
      sourceRecordKey,
      state,
      district,
      market,
      commodity,
      variety,
      grade,
      dataDate: new Date(`${date}T00:00:00.000Z`),
      minimumPrice,
      maximumPrice,
      modalPrice,
      source: 'data.gov.in',
      fetchedAt: new Date(),
    } satisfies Prisma.MarketPriceCreateInput;
  }

  private normalizeDate(value?: string): string | null {
    if (!value) return null;
    const valueTrimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(valueTrimmed)) return valueTrimmed;

    const match = valueTrimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return null;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toIndiaDate(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private addDays(dateString: string, amount: number): string {
    const date = new Date(`${dateString}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
}
