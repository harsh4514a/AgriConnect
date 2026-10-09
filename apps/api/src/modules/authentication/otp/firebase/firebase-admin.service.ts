import {
  Injectable,
  Logger,
  UnauthorizedException,
  OnModuleDestroy,
} from '@nestjs/common';
import { App, initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ConfigService } from '@/config/config.service';

/**
 * FirebaseAdminService wraps the Firebase Admin SDK.
 *
 * It is initialized lazily on first use with credentials read exclusively
 * from environment variables (never hardcoded).
 *
 * Responsibilities:
 *  - Initialize the Firebase Admin app once (singleton).
 *  - Verify Firebase ID Tokens signed by Firebase Auth.
 *  - Extract the verified phone number (E.164) from a verified token.
 *
 * SECURITY:
 *  - The backend NEVER trusts the frontend. Only `getAuth().verifyIdToken()`
 *    is authoritative proof that the user passed Firebase Phone Auth.
 *  - No application JWT is issued until the ID token has been verified here.
 */
@Injectable()
export class FirebaseAdminService implements OnModuleDestroy {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Lazily initialize the Firebase Admin SDK using service-account env vars.
   * Because the private key contains escaped newlines (\\n) in .env, we
   * normalize them before initializing.
   */
  private getApp(): App {
    if (this.app) {
      return this.app;
    }

    const projectId = this.configService.getOrThrow('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.getOrThrow('FIREBASE_CLIENT_EMAIL');
    const privateKey = (
      this.configService.getOrThrow('FIREBASE_PRIVATE_KEY') ?? ''
    ).replace(/\\n/g, '\n');

    this.app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });

    this.logger.log(`Firebase Admin initialized for project: ${projectId}`);

    return this.app;
  }

  /**
   * Verify a Firebase ID Token and return the verified phone number.
   *
   * @param idToken - Firebase ID token obtained from the Firebase client SDK.
   * @param expectedMobileNumber - Optional. When provided, the verified token
   *                               must reference this exact E.164 number. This
   *                               prevents a user verifying number A on the
   *                               client but sending a token for number B.
   *
   * @throws UnauthorizedException if the token is invalid/expired or the phone
   *         number does not match the expected number.
   */
  async verifyPhoneNumber(
    idToken: string,
    expectedMobileNumber?: string,
  ): Promise<string> {
    try {
      const decodedToken = await getAuth(this.getApp()).verifyIdToken(idToken);

      const phoneNumber = decodedToken.phone_number;
      if (!phoneNumber) {
        this.logger.warn('Firebase ID token has no phone_number claim.');
        throw new UnauthorizedException(
          'Firebase token is not associated with a phone number.',
        );
      }

      if (expectedMobileNumber && phoneNumber !== expectedMobileNumber) {
        this.logger.warn('Firebase token phone number did not match the request.');
        throw new UnauthorizedException(
          'The verified phone number does not match the requested number.',
        );
      }

      return phoneNumber;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Firebase ID token verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw new UnauthorizedException(
        'Firebase verification failed. Please try again.',
      );
    }
  }

  /**
   * Clean up the Firebase app on module destroy (graceful shutdown).
   */
  async onModuleDestroy(): Promise<void> {
    if (this.app) {
      await deleteApp(this.app);
      this.app = null;
    }
  }
}
