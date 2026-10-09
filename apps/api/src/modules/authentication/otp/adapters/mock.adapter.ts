import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import { OTPAdapter } from '../otp-adapter.interface';

/**
 * Mock OTP Adapter (development only).
 *
 * Does NOT send a real OTP message. Prints the OTP to the backend console
 * so developers can complete the OTP flow locally without a production
 * provider.
 *
 * Active only when `OTP_PROVIDER=mock` in .env.
 */
@Injectable()
export class MockOtpAdapter implements OTPAdapter {
  readonly name = 'mock';

  private readonly logger = new Logger(MockOtpAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOTP(mobileNumber: string, otp: string): Promise<void> {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new Error('Mock OTP delivery is disabled in production.');
    }

    const countryCode = this.configService.get('OTP_COUNTRY_CODE') ?? '91';

    this.logger.log('========================================');
    this.logger.log(`OTP for +${countryCode}${mobileNumber}`);
    this.logger.log(otp);
    this.logger.log('========================================');
  }
}
