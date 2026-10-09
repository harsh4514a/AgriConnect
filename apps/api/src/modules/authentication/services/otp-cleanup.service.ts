import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@/config/config.service';

/**
 * Flow (times relative to OTP creation):
 *  - 0 min:  OTP created
 *  - 5 min:  OTP expires (no longer accepted by verifyOtp)
 *  - 10 min: OTP record hard-deleted by this scheduled job
 */

/**
 * Scheduled job that hard-deletes OTP records once they are older than
 * `OTP_CLEANUP_MINUTES` (default 10 minutes) from creation.
 *
 * This guarantees OTPs are removed from the database on time even if no
 * new OTP request or verification happens for that mobile number (the lazy
 * cleanup in OtpService only runs on-demand).
 */
@Injectable()
export class OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Runs every 5 minutes. Deletes all OTP records older than the cleanup window.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredOtps(): Promise<void> {
    const cleanupMinutes = this.configService.getNumber('OTP_CLEANUP_MINUTES', 10);
    const cutoff = new Date(Date.now() - cleanupMinutes * 60 * 1000);

    try {
      const result = await this.prisma.otp.deleteMany({
        where: {
          createdAt: { lt: cutoff },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `Deleted ${result.count} OTP record(s) older than ${cleanupMinutes} minutes.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to clean up OTP records: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

