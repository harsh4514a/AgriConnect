import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  imports: [ConfigModule, PrismaModule, AdminAuditModule, AdminAuthModule],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminSettingsModule {}
