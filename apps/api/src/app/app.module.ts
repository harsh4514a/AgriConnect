import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../modules/authentication/auth.module';
import { ListingsModule } from '../modules/listings/listings.module';
import { MarketPricesModule } from '../modules/market-prices/market-prices.module';
import { BuyerRequirementsModule } from '../modules/buyer-requirements/buyer-requirements.module';
import { CropGuidesModule } from '../modules/crop-guides/crop-guides.module';
import { GovernmentSchemesModule } from '../modules/government-schemes/government-schemes.module';
import { TransportModule } from '../modules/transport/transport.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { AdminModule } from '../modules/admin/admin.module';

import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    ListingsModule,
    MarketPricesModule,
    BuyerRequirementsModule,
    CropGuidesModule,
    GovernmentSchemesModule,
    TransportModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}