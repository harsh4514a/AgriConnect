import { Injectable, Logger, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@/config/config.service';
import { OTPAdapter } from './otp-adapter.interface';
import { ProviderFactory } from './provider.factory';

/**
 * Reason why an OTP verification failed.
 * - invalid: the OTP provided does not match (wrong OTP).
 * - expired: the OTP has passed its expiry window.
 * - max-attempts-exceeded: the maximum number of wrong attempts was reached.
 */
export type OtpVerificationStatus =
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'max-attempts-exceeded';

export interface SendOtpResult {
  message: string;
}

export interface VerifyOtpResult {
  isValid: boolean;
  status: OtpVerificationStatus;
}

/**
 * Token used to inject the resolved OTPAdapter (built by ProviderFactory).
 */
export const OTP_ADAPTER_TOKEN = 'OTP_ADAPTER';

/**
 * OtpService is the single orchestrator for the OTP lifecycle.
 *
 * Responsibilities:
 *  - Generate cryptographically secure OTPs (configurable length).
 *  - Hash OTPs (bcrypt) before persisting — plain OTP is never stored.
 *  - Enforce expiry, resend cooldown, max verification attempts, max resends.
 *  - Enforce single-use semantics (invalidated on success / resend).
 *  - Delegate delivery ONLY to the injected OTPAdapter.
 *
 * AuthService depends on this service — it never knows which SMS provider
 * (Mock, Firebase, ...) is actually being used.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly providerFactory: ProviderFactory,
    @Inject(OTP_ADAPTER_TOKEN) private readonly adapter: OTPAdapter,
  ) {}

  /**
   * Generate, persist and deliver a new OTP for the given mobile number.
   *
   * Rules:
   * - Enforces a resend cooldown (default 30s) between requests.
   * - Enforces a maximum number of resend attempts (default 3).
   * - Any previous unused OTP for the same mobile number is immediately
   *   invalidated (marked used) when a new OTP is requested.
   */
  async sendOtp(mobileNumber: string): Promise<SendOtpResult> {
    // When a verification-based provider (e.g. Firebase) is active, the OTP is
    // generated, sent and verified by the provider itself. The backend must NOT
    // generate or store an OTP in PostgreSQL in that mode.
    if (this.adapter.name === 'firebase') {
      this.logger.log(
        'Firebase provider active — OTP delivery handled by Firebase.',
      );
      return { message: 'OTP sent successfully' };
    }

    const expiryMinutes = this.configService.getNumber('OTP_EXPIRY_MINUTES', 5);
    const cleanupMinutes = this.configService.getNumber('OTP_CLEANUP_MINUTES', 10);
    const cooldownSeconds = this.configService.getNumber('OTP_RESEND_COOLDOWN', 30);
    const maxResends = this.configService.getNumber('OTP_MAX_RESENDS', 3);
    const otpLength = this.configService.getNumber('OTP_LENGTH', 6);

    // Delete OTP records older than the cleanup window (lazy cleanup).
    await this.prisma.otp.deleteMany({
      where: {
        mobileNumber,
        createdAt: { lt: new Date(Date.now() - cleanupMinutes * 60 * 1000) },
      },
    });

    // Find the most recent unused OTP for this mobile number.
    const recentOtp = await this.prisma.otp.findFirst({
      where: {
        mobileNumber,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const elapsedSeconds = (Date.now() - recentOtp.createdAt.getTime()) / 1000;

      if (elapsedSeconds < cooldownSeconds) {
        const waitSeconds = Math.ceil(cooldownSeconds - elapsedSeconds);
        throw new Error(
          `Please wait ${waitSeconds} seconds before requesting a new OTP`,
        );
      }

      if (recentOtp.resendAttempts >= maxResends) {
        throw new Error(
          'Maximum OTP resend attempts reached. Please try again later.',
        );
      }
    }

    // Expire any previous unused OTPs for this mobile number.
    // This ensures that requesting a new OTP invalidates the previous one.
    await this.prisma.otp.updateMany({
      where: {
        mobileNumber,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true },
    });

    // Generate cryptographically secure OTP.
    const otp = this.generateSecureOtp(otpLength);
    const hashedOtp = await bcrypt.hash(otp, 10);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);

    // Store the new OTP.
    await this.prisma.otp.create({
      data: {
        mobileNumber,
        hashedOtp,
        expiresAt,
        resendAttempts: recentOtp ? recentOtp.resendAttempts + 1 : 0,
        verificationAttempts: 0,
        isUsed: false,
        createdAt,
      },
    });

    // Deliver via the configured adapter (Mock / Firebase / future).
    // The adapter never returns the OTP and must not log it (except Mock in dev).
    await this.adapter.sendOTP(mobileNumber, otp);

    return { message: 'OTP sent successfully' };
  }

  /**
   * Verify the OTP provided by the user against the stored hash.
   *
   * Returns a detailed status so the caller can distinguish between:
   * - wrong OTP (invalid)
   * - expired OTP (expired)
   * - expired due to max wrong attempts (max-attempts-exceeded)
   */
  async verifyOtp(mobileNumber: string, otp: string): Promise<VerifyOtpResult> {
    const cleanupMinutes = this.configService.getNumber('OTP_CLEANUP_MINUTES', 10);
    const maxAttempts = this.configService.getNumber('OTP_MAX_ATTEMPTS', 5);

    // First, clean up any OTP records older than the cleanup window.
    await this.prisma.otp.deleteMany({
      where: {
        mobileNumber,
        createdAt: { lt: new Date(Date.now() - cleanupMinutes * 60 * 1000) },
      },
    });

    // Find the latest unused OTP for this mobile number.
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        mobileNumber,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // No active OTP found. Either it was already used, deleted after cleanup,
    // or never created.
    if (!otpRecord) {
      return { isValid: false, status: 'expired' };
    }

    // Check if the OTP has expired (expiry window).
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      // Mark as used to prevent further attempts.
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return { isValid: false, status: 'expired' };
    }

    // Check if the maximum number of wrong attempts has been exceeded.
    if (otpRecord.verificationAttempts >= maxAttempts) {
      // Mark as used to prevent further attempts.
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return { isValid: false, status: 'max-attempts-exceeded' };
    }

    // Compare the OTP against the stored hash BEFORE incrementing attempts.
    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);

    if (isValid) {
      // Correct OTP — mark as used (single-use). The record is NOT deleted
      // immediately here; the scheduled cleanup (OtpCleanupService) and the
      // lazy cleanup above remove it after the cleanup window. Marking it
      // used guarantees it cannot be replayed.
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return { isValid: true, status: 'valid' };
    }

    // Wrong OTP — increment verification attempts.
    const newAttemptCount = otpRecord.verificationAttempts + 1;
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verificationAttempts: newAttemptCount },
    });

    // If this was the final wrong attempt, expire the OTP immediately.
    if (newAttemptCount >= maxAttempts) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return { isValid: false, status: 'max-attempts-exceeded' };
    }

    return { isValid: false, status: 'invalid' };
  }

  /**
   * Generate a cryptographically secure numeric OTP of the given length.
   * Uses Node's crypto.randomBytes via a rejection-sampling helper to avoid
   * modulo bias.
   */
  private generateSecureOtp(length: number): string {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    const value = cryptoRandomInt(min, max);
    return value.toString();
  }
}

/**
 * Cryptographically secure random integer in range [min, max].
 * Uses Node.js crypto module with rejection sampling (no modulo bias).
 */
function cryptoRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytes = Math.ceil(Math.log2(range) / 8);
  const maxNum = 2 ** (bytes * 8);
  const excess = maxNum % range;

  let rand: number;
  do {
    const buf = randomBytes(bytes);
    rand = buf.reduce<number>((acc, byte, i) => acc + byte * 2 ** (8 * i), 0);
  } while (rand >= maxNum - excess);

  return min + (rand % range);
}
