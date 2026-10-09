import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminMarketplaceModule } from './marketplace/admin-marketplace.module';
import { AdminBuyerRequirementsModule } from './buyer-requirements/admin-buyer-requirements.module';
import { AdminTransportModule } from './transport/admin-transport.module';
import { AdminCropGuidesModule } from './crop-guides/admin-crop-guides.module';
import { AdminGovernmentSchemesModule } from './government-schemes/admin-government-schemes.module';
import { AdminMarketPricesModule } from './market-prices/admin-market-prices.module';
import { AdminAuditModule } from './audit/admin-audit.module';
import { AdminSettingsModule } from './settings/admin-settings.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminDashboardModule,
    AdminUsersModule,
    AdminMarketplaceModule,
    AdminBuyerRequirementsModule,
    AdminTransportModule,
    AdminCropGuidesModule,
    AdminGovernmentSchemesModule,
    AdminMarketPricesModule,
    AdminAuditModule,
    AdminSettingsModule,
  ],
  exports: [
    AdminAuthModule,
    AdminDashboardModule,
    AdminUsersModule,
    AdminMarketplaceModule,
    AdminBuyerRequirementsModule,
    AdminTransportModule,
    AdminCropGuidesModule,
    AdminGovernmentSchemesModule,
    AdminMarketPricesModule,
    AdminAuditModule,
    AdminSettingsModule,
  ],
})
export class AdminModule {}
