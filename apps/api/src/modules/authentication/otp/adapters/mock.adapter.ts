
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import { OTPAdapter } from '../otp-adapter.interface';

/**
 * Mock OTP adapter.
 *
 * Prints generated OTPs to the server logs. It does not send SMS.
 * Use only for local development or controlled production testing.
 */
@Injectable()
export class MockOtpAdapter implements OTPAdapter {
  readonly name = 'mock';

  private readonly logger = new Logger(MockOtpAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOTP(mobileNumber: string, otp: string): Promise<void> {
    const environment =
      this.configService.get('NODE_ENV') ?? 'development';

    const countryCode =
      this.configService.get('OTP_COUNTRY_CODE') ?? '91';

    // Do not expose real users' OTPs in public production logs.
    // Configure this flag only for controlled testing.
    if (
      environment === 'production' &&
      this.configService.get('ALLOW_PRODUCTION_MOCK_OTP') !== 'true'
    ) {
      throw new Error(
        'Mock OTP is disabled in production. Configure a real OTP provider or explicitly enable controlled testing.',
      );
    }

    this.logger.warn(
      `Mock OTP generated for +${countryCode}${mobileNumber}. ` +
        'This code is visible in application logs.',
    );

    this.logger.log(`OTP: ${otp}`);
  }
}
