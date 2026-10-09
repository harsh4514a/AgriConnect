import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import { OTPAdapter } from './otp-adapter.interface';
import { FirebaseOtpAdapter } from './adapters/firebase.adapter';
import { MockOtpAdapter } from './adapters/mock.adapter';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

/**
 * Supported OTP providers.
 * Adding a new provider only requires:
 *   1. A new adapter implementing OTPAdapter.
 *   2. A new case in this factory.
 *   3. `OTP_PROVIDER=<provider>` in .env.
 * No business logic changes.
 */
export enum OtpProviderName {
  MOCK = 'mock',
  FIREBASE = 'firebase',
}

/**
 * ProviderFactory builds the correct OTPAdapter based on `OTP_PROVIDER` in .env.
 *
 * The value is read through ConfigService — never process.env directly.
 */
@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  /**
   * Resolve and return the adapter configured for this environment.
   */
  create(): OTPAdapter {
    const provider = (
      this.configService.get('OTP_PROVIDER') ?? OtpProviderName.MOCK
    ).trim().toLowerCase();

    this.logger.log(`Resolving OTP provider: ${provider}`);

    if (
      this.configService.get('NODE_ENV') === 'production' &&
      provider !== OtpProviderName.FIREBASE
    ) {
      throw new Error('OTP_PROVIDER must be set to firebase in production.');
    }

    switch (provider) {
      case OtpProviderName.FIREBASE:
        return new FirebaseOtpAdapter(this.firebaseAdminService);
      case OtpProviderName.MOCK:
        if (this.configService.get('NODE_ENV') === 'production') {
          throw new Error('Mock OTP delivery is disabled in production.');
        }
        // Default to mock for safety — never send a real message or depend on
        // a production provider unless explicitly configured in development.
        return new MockOtpAdapter(this.configService);
      default:
        throw new Error(`Unsupported OTP_PROVIDER "${provider}".`);
    }
  }
}
