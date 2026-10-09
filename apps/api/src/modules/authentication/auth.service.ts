import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@/config/config.service';
import { OtpService } from './otp/otp.service';
import { ProviderFactory } from './otp/provider.factory';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyFirebaseDto } from './dto/verify-firebase.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  AuthTokens,
  AuthResponse,
  OtpResponse,
  VerifyOtpResponse,
  CompleteProfileResponse,
} from './interfaces/auth-response.interface';
import { UserRole } from './enums/user-role.enum';
import {
  REGISTRATION_TOKEN_EXPIRY,
} from './constants/auth.constants';
import { normalizePreferredLanguage } from './utils/normalize-language.util';
import { NotificationsService, NOTIFICATION_TYPES } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly providerFactory: ProviderFactory,
    private readonly notifications: NotificationsService,
  ) {}

  private getRegistrationTokenSecret(): string {
    return this.configService.getOrThrow('JWT_REGISTRATION_SECRET');
  }

  async sendOtp(dto: SendOtpDto): Promise<OtpResponse> {
    const { mobileNumber } = dto;
    this.logger.log('OTP requested.');

    await this.otpService.sendOtp(mobileNumber);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const { mobileNumber, otp } = dto;
    this.logger.log('OTP verification attempt.');

    const result = await this.otpService.verifyOtp(mobileNumber, otp);

    if (!result.isValid) {
      switch (result.status) {
        case 'invalid':
          throw new UnauthorizedException('OTP is wrong. Please try again.');
        case 'expired':
          throw new UnauthorizedException(
            'OTP has expired. Please request a new OTP.',
          );
        case 'max-attempts-exceeded':
          throw new UnauthorizedException(
            'Your OTP has expired because you entered 5 wrong OTPs. Please request a new OTP.',
          );
        default:
          throw new UnauthorizedException(
            'Invalid OTP. Please try again.',
          );
      }
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { mobileNumber },
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new UnauthorizedException(
          'User account has been deactivated. Please contact support.',
        );
      }

      // Existing user — login
      const tokens = await this.generateTokens(
        existingUser.id,
        existingUser.mobileNumber,
        existingUser.role,
      );

      // Ensure user is marked as verified
      if (!existingUser.isVerified) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { isVerified: true },
        });
      }

      this.logger.log('User login completed via OTP.');

      return {
        message: 'OTP verified successfully. Login complete.',
        isNewUser: false,
        tokens,
      };
    }

    // New user — DO NOT create user record yet.
    // Issue a short-lived registrationToken that completeProfile will validate.
    const registrationToken = this.jwtService.sign(
      { mobileNumber },
      {
        secret: this.getRegistrationTokenSecret(),
        expiresIn: REGISTRATION_TOKEN_EXPIRY,
      },
    );

    this.logger.log('OTP verified for new user.');

    return {
      message: 'OTP verified successfully. Please complete your profile.',
      isNewUser: true,
      registrationToken,
    };
  }

  /**
   * Verify a Firebase ID Token (Firebase Phone Auth).
   *
   * This is the Firebase counterpart of `verifyOtp`. When
   * `OTP_PROVIDER=firebase` in .env:
   *  - Firebase generates, sends and verifies the OTP itself.
   *  - The frontend obtains a Firebase ID Token after the user enters the OTP.
   *  - The backend verifies that token with the Firebase Admin SDK.
   *  - After successful verification, the existing login/onboarding flow
   *    (JWT + refresh token + registration token) is reused unchanged.
   *
   * No OTP is generated or stored in PostgreSQL when using Firebase.
   */
  async verifyFirebase(dto: VerifyFirebaseDto): Promise<VerifyOtpResponse> {
    const { idToken, mobileNumber } = dto;
    this.logger.log('Firebase verification attempt.');

    // Resolve the configured adapter (mock or firebase).
    const adapter = this.providerFactory.create();

    // Firebase adapter verifies the ID token and enforces the phone match.
    // For other providers this throws (unsupported) — but verify-firebase is
    // only reachable when OTP_PROVIDER=firebase.
    if (!adapter.verifyIdToken) {
      throw new UnauthorizedException(
        'Firebase verification is not enabled on this server.',
      );
    }
    const verifiedMobileNumber = await adapter.verifyIdToken(
      idToken,
      mobileNumber,
    );

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { mobileNumber: verifiedMobileNumber },
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new UnauthorizedException(
          'User account has been deactivated. Please contact support.',
        );
      }

      // Existing user — login
      const tokens = await this.generateTokens(
        existingUser.id,
        existingUser.mobileNumber,
        existingUser.role,
      );

      // Ensure user is marked as verified
      if (!existingUser.isVerified) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { isVerified: true },
        });
      }

      this.logger.log('User login completed via Firebase.');

      return {
        message: 'Firebase verification successful. Login complete.',
        isNewUser: false,
        tokens,
      };
    }

    // New user — DO NOT create user record yet.
    // Issue a short-lived registrationToken that completeProfile will validate.
    const registrationToken = this.jwtService.sign(
      { mobileNumber: verifiedMobileNumber },
      {
        secret: this.getRegistrationTokenSecret(),
        expiresIn: REGISTRATION_TOKEN_EXPIRY,
      },
    );

    this.logger.log('Firebase verified a new user.');

    return {
      message: 'Firebase verification successful. Please complete your profile.',
      isNewUser: true,
      registrationToken,
    };
  }

async completeProfile(
    dto: CompleteProfileDto,
  ): Promise<CompleteProfileResponse> {
    // Normalize legacy language codes to standardized en/gu/hi.
    const preferredLanguage = normalizePreferredLanguage(dto.preferredLanguage);

    // Validate registration token
    let mobileNumber: string;
    try {
      const payload = this.jwtService.verify<{ mobileNumber: string }>(
        dto.registrationToken,
        { secret: this.getRegistrationTokenSecret() },
      );
      mobileNumber = payload.mobileNumber;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired registration token. Please verify your OTP again.',
      );
    }

    this.logger.log('Profile completion started.');

    // Check if user already exists (defensive — should not happen)
    const existingUser = await this.prisma.user.findUnique({
      where: { mobileNumber },
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new UnauthorizedException(
          'User account has been deactivated. Please contact support.',
        );
      }

      if (existingUser.firstName && existingUser.lastName) {
        const tokens = await this.generateTokens(
          existingUser.id,
          existingUser.mobileNumber,
          existingUser.role,
        );

        this.logger.log('Profile was already completed; existing login returned.');

        return {
          user: {
            id: existingUser.id,
            mobileNumber: existingUser.mobileNumber,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            preferredLanguage: existingUser.preferredLanguage!,
            role: existingUser.role,
            isVerified: existingUser.isVerified,
          },
          tokens,
        };
      }
      // Update the incomplete user record
      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          preferredLanguage,
          stateId: dto.stateId || null,
          districtId: dto.districtId || null,
          talukaId: dto.talukaId || null,
          villageId: dto.villageId || null,
          latitude: dto.latitude || null,
          longitude: dto.longitude || null,
        },
      });

      const tokens = await this.generateTokens(
        updatedUser.id,
        updatedUser.mobileNumber,
        updatedUser.role,
      );

      this.logger.log('Profile completed for existing user.');

      return {
        user: {
          id: updatedUser.id,
          mobileNumber: updatedUser.mobileNumber,
          firstName: updatedUser.firstName!,
          lastName: updatedUser.lastName!,
          preferredLanguage: updatedUser.preferredLanguage!,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
        },
        tokens,
      };
    }

    // Create the user for the first time
    const newUser = await this.prisma.user.create({
      data: {
        mobileNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        preferredLanguage,
        role: UserRole.FARMER,
        isVerified: true,
        stateId: dto.stateId || null,
        districtId: dto.districtId || null,
        talukaId: dto.talukaId || null,
        villageId: dto.villageId || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
      },
    });

    const tokens = await this.generateTokens(
      newUser.id,
      newUser.mobileNumber,
      newUser.role,
    );

    this.logger.log('User profile created.');

    return {
      user: {
        id: newUser.id,
        mobileNumber: newUser.mobileNumber,
        firstName: newUser.firstName!,
        lastName: newUser.lastName!,
        preferredLanguage: newUser.preferredLanguage!,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
      tokens,
    };
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    this.logger.log('Token refresh attempt');

    const candidateTokens = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    let matchedToken: (typeof candidateTokens)[number] | null = null;
    for (const candidate of candidateTokens) {
      const isMatch = await bcrypt.compare(dto.refreshToken, candidate.token);
      if (isMatch) {
        matchedToken = candidate;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (!matchedToken.user.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: matchedToken.user.id,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException(
        'User account has been deactivated. Please contact support.',
      );
    }

    // Revoke used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(
      matchedToken.user.id,
      matchedToken.user.mobileNumber,
      matchedToken.user.role,
    );

    this.logger.log(`Tokens refreshed for user: ${matchedToken.user.id}`);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    this.logger.log(`Logout for user: ${userId}`);

    if (refreshToken) {
      const tokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
        },
      });

      for (const token of tokens) {
        const isMatch = await bcrypt.compare(refreshToken, token.token);
        if (isMatch) {
          await this.prisma.refreshToken.update({
            where: { id: token.id },
            data: { isRevoked: true },
          });
          break;
        }
      }
    } else {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
    }

    this.logger.log(`User logged out successfully: ${userId}`);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobileNumber: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
        role: true,
        isVerified: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        taluka: { select: { id: true, name: true } },
        village: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...user,
      preferredLanguage: normalizePreferredLanguage(user.preferredLanguage),
    };
  }

  /**
   * Update only the authenticated user's editable profile fields.
   *
   * Location IDs are validated as a hierarchy on the server so a client
   * cannot submit a taluka/village belonging to another district.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const district = await this.prisma.district.findUnique({
      where: { id: dto.districtId },
      select: { id: true, stateId: true },
    });

    if (!district) {
      throw new BadRequestException('Invalid district');
    }

    const taluka = await this.prisma.taluka.findFirst({
      where: {
        id: dto.talukaId,
        districtId: district.id,
      },
      select: { id: true },
    });

    if (!taluka) {
      throw new BadRequestException('Invalid taluka for the selected district');
    }

    const village = await this.prisma.village.findFirst({
      where: {
        id: dto.villageId,
        talukaId: taluka.id,
      },
      select: { id: true },
    });

    if (!village) {
      throw new BadRequestException('Invalid village for the selected taluka');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        stateId: district.stateId,
        districtId: district.id,
        talukaId: taluka.id,
        villageId: village.id,
      },
      select: {
        id: true,
        mobileNumber: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
        role: true,
        isVerified: true,
        latitude: true,
        longitude: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        taluka: { select: { id: true, name: true } },
        village: { select: { id: true, name: true } },
      },
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.ACCOUNT,
      titleKey: 'dashboard.notifications.types.profileUpdated.title',
      messageKey: 'dashboard.notifications.types.profileUpdated.message',
      relatedPath: '/dashboard/profile',
      relatedType: 'profile',
      relatedId: userId,
    });

    return {
      ...user,
      preferredLanguage: normalizePreferredLanguage(user.preferredLanguage),
    };
  }

  /**
   * Update the authenticated user's preferred language.
   * Values are validated by UpdateLanguageDto to be one of en/gu/hi.
   */
  async updatePreferredLanguage(userId: string, preferredLanguage: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage },
      select: { id: true, updatedAt: true },
    });

    await this.notifications.create({
      userId,
      type: NOTIFICATION_TYPES.ACCOUNT,
      titleKey: 'dashboard.notifications.types.languageUpdated.title',
      messageKey: 'dashboard.notifications.types.languageUpdated.message',
      relatedPath: '/dashboard/settings',
      relatedType: 'settings',
      relatedId: user.id,
      dedupeKey: `language.updated:${userId}:${user.updatedAt.toISOString()}`,
    });

    this.logger.log(`Language updated for user ${userId}: ${preferredLanguage}`);

    return { preferredLanguage };
  }

  private async generateTokens(
    userId: string,
    mobileNumber: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, mobileNumber, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // Store hashed refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedRefreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
