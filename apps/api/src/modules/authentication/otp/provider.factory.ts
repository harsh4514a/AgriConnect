
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import { OTPAdapter } from './otp-adapter.interface';
import { FirebaseOtpAdapter } from './adapters/firebase.adapter';
import { MockOtpAdapter } from './adapters/mock.adapter';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

export enum OtpProviderName {
  MOCK = 'mock',
  FIREBASE = 'firebase',
}

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  create(): OTPAdapter {
    const provider = (
      this.configService.get('OTP_PROVIDER') ?? OtpProviderName.MOCK
    )
      .trim()
      .toLowerCase();

    this.logger.log(`Resolving OTP provider: ${provider}`);

    switch (provider) {
      case OtpProviderName.FIREBASE:
        return new FirebaseOtpAdapter(this.firebaseAdminService);

      case OtpProviderName.MOCK:
        this.logger.warn(
          'Mock OTP provider enabled. OTPs may be visible in application logs.',
        );
        return new MockOtpAdapter(this.configService);

      default:
        throw new Error(`Unsupported OTP_PROVIDER "${provider}".`);
    }
  }
}
