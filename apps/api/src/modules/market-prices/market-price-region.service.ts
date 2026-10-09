import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GUJARAT_REGION_DISTRICTS,
  GUJARAT_REGIONS,
  canonicalizeGujaratDistrict,
  getGujaratRegionForDistrict,
  type GujaratRegion,
} from './region-map';

@Injectable()
export class MarketPriceRegionService implements OnModuleInit {
  private readonly logger = new Logger(MarketPriceRegionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      // This table is code-owned. Rebuild it from the canonical mapping so
      // old alias rows can never inflate district counts.
      await this.prisma.$transaction(async (tx) => {
        await tx.gujaratMarketRegion.deleteMany({});
        await tx.gujaratMarketRegion.createMany({
          data: GUJARAT_REGIONS.flatMap((region) =>
            GUJARAT_REGION_DISTRICTS[region].map((district) => ({
              region,
              district,
            })),
          ),
        });
      });

      this.logger.log('Gujarat market-region mappings rebuilt from canonical districts');
    } catch (error) {
      this.logger.warn(
        `Could not initialize market-region mappings: ${(error as Error).message}`,
      );
    }
  }

  async getDistricts(region: GujaratRegion): Promise<string[]> {
    const rows = await this.prisma.gujaratMarketRegion.findMany({
      where: { region },
      select: { district: true },
      orderBy: { district: 'asc' },
    });
    return rows.map((row) => row.district);
  }

  canonicalizeDistrict(district: string): string {
    return canonicalizeGujaratDistrict(district);
  }

  getRegionForDistrictSync(district: string): GujaratRegion | null {
    return getGujaratRegionForDistrict(district);
  }

  async getRegionForDistrict(district: string): Promise<GujaratRegion | null> {
    // Use the same canonical mapping for all callers. This handles Kachchh,
    // Kutch, Kachch and Cutch as one district without requiring duplicate DB rows.
    const canonicalDistrict = canonicalizeGujaratDistrict(district);

    const row = await this.prisma.gujaratMarketRegion.findUnique({
      where: { district: canonicalDistrict },
      select: { region: true },
    });

    return (row?.region as GujaratRegion | undefined) ?? null;
  }
}
