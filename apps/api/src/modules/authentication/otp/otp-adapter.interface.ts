/**
 * @file OTPAdapter contract.
 *
 * The OTP system must NEVER depend directly on a concrete OTP provider.
 * Every provider (Mock, Firebase, or any future provider) implements this
 * single interface.
 *
 * Switching providers only requires:
 *   1. `OTP_PROVIDER=<provider>` in .env
 *   2. Provider credentials in .env
 * No business logic changes.
 */
export interface OTPAdapter {
  /**
   * Stable identifier used for logging and diagnostics (e.g. 'mock', 'firebase').
   */
  readonly name: string;

  /**
   * Deliver the OTP to the user's mobile number.
   *
   * For delivery-based providers (Mock, SMS), this actually sends the
   * OTP. For verification-based providers (Firebase), the OTP is generated,
   * sent and verified by the provider itself, so this is a no-op — the real
   * entry point is `verifyIdToken`.
   *
   * @param mobileNumber - Mobile number WITHOUT the leading '+' and WITHOUT
   *                       the country code (e.g. '9876543210').
   * @param otp          - Plain-text OTP (delivery providers only).
   *
   * @throws Error with a user-friendly message on any delivery failure.
   *
   * SECURITY: Implementations MUST NOT log the OTP. Only the Mock adapter
   * may print it, and only in development.
   */
  sendOTP(mobileNumber: string, otp: string): Promise<void>;

  /**
   * OPTIONAL verification-based entry point.
   *
   * Implemented only by verification-based providers (e.g. Firebase). For
   * delivery-based providers (Mock), this is not used.
   *
   * @param idToken            - Provider-issued ID token (e.g. Firebase ID token).
   * @param expectedMobileNumber - E.164 number the verified token must match.
   *
   * @returns The verified E.164 phone number.
   *
   * SECURITY: Backend MUST verify the token with the provider's Admin SDK and
   * NEVER trust a token the frontend merely claims to be valid.
   */
  verifyIdToken?(
    idToken: string,
    expectedMobileNumber: string,
  ): Promise<string>;
}

