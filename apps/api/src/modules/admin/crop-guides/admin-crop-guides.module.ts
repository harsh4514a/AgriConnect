import { Module } from '@nestjs/common';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { AdminCropGuidesController } from './admin-crop-guides.controller';
import { AdminCropGuidesService } from './admin-crop-guides.service';

@Module({
  imports: [AdminAuditModule],
  controllers: [AdminCropGuidesController],
  providers: [AdminCropGuidesService],
  exports: [AdminCropGuidesService],
})
export class AdminCropGuidesModule {}
