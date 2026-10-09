import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketPriceSyncService } from './market-price-sync.service';

@Injectable()
export class MarketPriceSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(MarketPriceSchedulerService.name);

  constructor(private readonly syncService: MarketPriceSyncService) {}

  onModuleInit(): void {
    // Do not hold the HTTP server startup open while the external government
    // API is unavailable or slow. The sync service records its own failures.
    void this.syncService.runInitialSync().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Initial market-price sync failed: ${message}`);
    });
  }

  @Cron('0 0 8,10,11,12,16,19 * * *', {
    name: 'data-gov-market-price-sync',
    timeZone: 'Asia/Kolkata',
  })
  async scheduledSync(): Promise<void> {
    await this.syncService.runScheduledSync();
  }
}
