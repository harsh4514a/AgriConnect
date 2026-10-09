import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigModule } from '@/config/config.module';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.register({}),
    PrismaModule,
    ConfigModule,
    AdminAuditModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy, AdminJwtAuthGuard],
  exports: [AdminAuthService, AdminJwtStrategy, AdminJwtAuthGuard, PassportModule],
})
export class AdminAuthModule {}
