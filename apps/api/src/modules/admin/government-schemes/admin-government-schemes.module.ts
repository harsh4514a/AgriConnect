import { Module } from '@nestjs/common';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { AdminGovernmentSchemesController } from './admin-government-schemes.controller';
import { AdminGovernmentSchemesService } from './admin-government-schemes.service';

@Module({
  imports: [AdminAuditModule],
  controllers: [AdminGovernmentSchemesController],
  providers: [AdminGovernmentSchemesService],
  exports: [AdminGovernmentSchemesService],
})
export class AdminGovernmentSchemesModule {}
