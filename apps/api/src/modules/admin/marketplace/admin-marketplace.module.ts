import { Module } from '@nestjs/common';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { AdminMarketplaceController } from './admin-marketplace.controller';
import { AdminMarketplaceService } from './admin-marketplace.service';

@Module({
  imports: [AdminAuditModule],
  controllers: [AdminMarketplaceController],
  providers: [AdminMarketplaceService],
  exports: [AdminMarketplaceService],
})
export class AdminMarketplaceModule {}
