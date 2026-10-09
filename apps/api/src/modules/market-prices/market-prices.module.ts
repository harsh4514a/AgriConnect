import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketPricesController } from './market-prices.controller';
import { MarketPricesService } from './market-prices.service';
import { MarketPriceSyncService } from './market-price-sync.service';
import { MarketPriceSchedulerService } from './market-price-scheduler.service';
import { DataGovInMarketPriceProvider } from './providers/data-gov-in-market-price.provider';
import { MarketPriceRegionService } from './market-price-region.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MarketPricesController],
  providers: [
    MarketPricesService,
    MarketPriceRegionService,
    MarketPriceSyncService,
    MarketPriceSchedulerService,
    DataGovInMarketPriceProvider,
  ],
})
export class MarketPricesModule {}
