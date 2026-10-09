import { Module } from '@nestjs/common';
import { AdminBuyerRequirementsController } from './admin-buyer-requirements.controller';
import { AdminBuyerRequirementsService } from './admin-buyer-requirements.service';

@Module({
  controllers: [AdminBuyerRequirementsController],
  providers: [AdminBuyerRequirementsService],
  exports: [AdminBuyerRequirementsService],
})
export class AdminBuyerRequirementsModule {}
