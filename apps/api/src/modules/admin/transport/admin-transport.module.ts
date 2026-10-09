import { Module } from '@nestjs/common';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { AdminTransportController } from './admin-transport.controller';
import { AdminTransportService } from './admin-transport.service';

@Module({
  imports: [AdminAuditModule],
  controllers: [AdminTransportController],
  providers: [AdminTransportService],
  exports: [AdminTransportService],
})
export class AdminTransportModule {}
