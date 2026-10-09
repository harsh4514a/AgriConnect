/**
 * Maps Firebase auth error codes to AgriConnect i18n message keys.
 *
 * Used ONLY for user-facing UI messages — never for authorization decisions.
 * Authorization always happens server-side via the Firebase Admin SDK.
 */

export function getFirebaseErrorKey(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: unknown }).code);

    switch (code) {
      case 'auth/operation-not-allowed':
        return 'firebase.operationNotAllowed';
      case 'auth/billing-not-enabled':
        return 'firebase.billingNotEnabled';
      case 'auth/quota-exceeded':
        return 'firebase.quotaExceeded';
      case 'auth/invalid-phone-number':
        return 'firebase.invalidPhone';
      case 'auth/captcha-check-failed':
      case 'auth/recaptcha-check-failed':
        return 'firebase.captchaFailed';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'mobile.failedSend';
      case 'auth/too-many-requests':
        return 'errors.tooManyRequests';
      case 'auth/invalid-verification-code':
        return 'otp.wrongTitle';
      case 'auth/code-expired':
      case 'auth/expired-action-code':
        return 'otp.expiredTitle';
      case 'auth/missing-verification-code':
      case 'auth/missing-phone-number':
      case 'auth/missing-verification-id':
        return 'otp.networkError';
      default:
        return 'mobile.failedSend';
    }
  }

  return 'mobile.failedSend';
}

