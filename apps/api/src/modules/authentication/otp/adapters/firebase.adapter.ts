import { Injectable, Logger } from '@nestjs/common';
import { OTPAdapter } from '../otp-adapter.interface';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';

/**
 * Firebase OTP Adapter.
 *
 * In Firebase Phone Auth, Firebase itself generates, sends and verifies the
 * OTP. The application never sees the OTP and never stores it in PostgreSQL.
 * Therefore:
 *  - `sendOTP` is intentionally a no-op (the Firebase client SDK triggers the
 *    SMS via `signInWithPhoneNumber`). This keeps the OTPAdapter contract.
 *  - `verifyFirebaseIdToken` is the real entry point: the backend verifies the
 *    Firebase ID Token with the Admin SDK (never trusting the frontend) and
 *    returns the verified E.164 phone number.
 *
 * Active only when `OTP_PROVIDER=firebase` in .env.
 */
@Injectable()
export class FirebaseOtpAdapter implements OTPAdapter {
  readonly name = 'firebase';

  private readonly logger = new Logger(FirebaseOtpAdapter.name);

  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  /**
   * No-op for the delivery contract. Firebase handles OTP delivery entirely
   * on the client side via signInWithPhoneNumber.
   */
  async sendOTP(_mobileNumber: string, _otp: string): Promise<void> {
    this.logger.debug(
      'Firebase provider: OTP delivery is handled by the Firebase client SDK.',
    );
  }

  /**
   * Verify a Firebase ID Token and return the verified phone number.
   *
   * Implements `OTPAdapter.verifyIdToken` (verification-based provider).
   *
   * @param idToken - Firebase ID token (obtained after the user enters the OTP
   *                  in the Firebase client SDK).
   * @param expectedMobileNumber - E.164 number the token must match.
   */
  async verifyIdToken(
    idToken: string,
    expectedMobileNumber: string,
  ): Promise<string> {
    return this.firebaseAdminService.verifyPhoneNumber(
      idToken,
      expectedMobileNumber,
    );
  }
}

