import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigModule } from '@/config/config.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpCleanupService } from './services/otp-cleanup.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { OtpService, OTP_ADAPTER_TOKEN } from './otp/otp.service';
import { ProviderFactory } from './otp/provider.factory';
import { FirebaseModule } from './otp/firebase/firebase.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    PrismaModule,
    ConfigModule,
    FirebaseModule,
    NotificationsModule,
  ],
  controllers: [AuthController, LocationController],
  providers: [
    AuthService,
    LocationService,
    OtpService,
    OtpCleanupService,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    ProviderFactory,
    {
      provide: OTP_ADAPTER_TOKEN,
      inject: [ProviderFactory],
      useFactory: (factory: ProviderFactory) => factory.create(),
    },
  ],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard, PassportModule],
})
export class AuthModule {}
