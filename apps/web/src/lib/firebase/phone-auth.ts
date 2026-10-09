'use client';

import {
  RecaptchaVerifier,
  signInWithCredential,
  PhoneAuthProvider,
  PhoneAuthCredential,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirebaseAuth, getPhoneAuthProvider, isFirebaseEnabled } from './client';

/**
 * Firebase Phone Authentication helpers.
 *
 * Flow:
 *  1. `sendOtpWithFirebase(mobileNumber, containerId)` triggers Firebase to
 *     send an SMS OTP. An INVISIBLE reCAPTCHA verifier is created to satisfy
 *     Firebase's anti-abuse requirement without changing the login UI.
 *  2. The user types the OTP into the existing OTP form.
 *  3. `verifyOtpWithFirebase(mobileNumber, otpCode)` exchanges the code for a
 *     Firebase ID Token.
 *  4. The ID Token is sent to the backend `/auth/verify-firebase`, which
 *     verifies it with the Admin SDK (never trusts the frontend).
 *
 * The UI (mobile-number-form + otp-verification-form) remains visually
 * identical to the mock OTP flow.
 */

let activeVerifier: RecaptchaVerifier | null = null;

/**
 * Cached verificationId shared between the mobile-number form (which triggers
 * the Firebase SMS send) and the OTP form (which exchanges the code for an
 * ID Token). Module-scoped so the two sibling components can communicate
 * without prop drilling.
 */
let pendingVerificationId: string | null = null;

export function setPendingVerificationId(verificationId: string | null): void {
  pendingVerificationId = verificationId;
}

export function getPendingVerificationId(): string | null {
  return pendingVerificationId;
}

/**
 * Clear the cached verificationId once consumed (after verify attempt) or
 * when the user navigates back to change the number.
 */
export function clearPendingVerificationId(): void {
  pendingVerificationId = null;
}


/**
 * Reuse (or create) a single invisible reCAPTCHA verifier so multiple OTP
 * sends don't stack duplicate widgets.
 */
function getOrCreateVerifier(containerId: string): RecaptchaVerifier {
  if (activeVerifier) {
    try {
      activeVerifier.clear();
    } catch {
      // already cleared
    }
    activeVerifier = null;
  }

  const auth = getFirebaseAuth();
  activeVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — Firebase will proceed with the SMS send.
    },
  });

  return activeVerifier;
}

/**
 * Send an OTP to the given E.164 mobile number via Firebase.
 *
 * @param mobileNumber - E.164 format, e.g. '+919876543210'.
 * @param containerId  - ID of a hidden DOM element used for invisible reCAPTCHA.
 *
 * @returns The Firebase verificationId needed later to confirm the code.
 *
 * Throws with a user-friendly message on failure (invalid number, quota,
 * reCAPTCHA failure, etc.).
 */
export async function sendOtpWithFirebase(
  mobileNumber: string,
  containerId = 'firebase-recaptcha-container',
): Promise<string> {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* variables.');
  }

  const verifier = getOrCreateVerifier(containerId);
  const provider = getPhoneAuthProvider();

  // `verifyPhoneNumber` returns a verificationId used later in
  // `verifyOtpWithFirebase`. The actual SMS is sent by Firebase.
  const verificationId = await provider.verifyPhoneNumber(mobileNumber, verifier);

  return verificationId;
}

/**
 * Resend the Firebase SMS OTP for the same mobile number. A fresh
 * verificationId is produced and cached for the OTP form.
 *
 * @param mobileNumber - E.164 number, e.g. '+919876543210'.
 * @returns The new Firebase verificationId.
 */
export async function resendOtpWithFirebase(
  mobileNumber: string,
  containerId = 'firebase-recaptcha-container',
): Promise<string> {
  const verificationId = await sendOtpWithFirebase(mobileNumber, containerId);
  setPendingVerificationId(verificationId);
  return verificationId;
}

/**
 * Verify the OTP code the user entered and return a Firebase ID Token.
 *
 * @param mobileNumber   - E.164 number the OTP was sent to.
 * @param verificationId - From `sendOtpWithFirebase`.
 * @param otpCode        - The 6-digit code the user typed.
 *
 * @returns The Firebase ID Token (already refreshed to be valid), plus the
 *          signed-in user.
 */
export async function verifyOtpWithFirebase(
  mobileNumber: string,
  verificationId: string,
  otpCode: string,
): Promise<{ idToken: string; user: User }> {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* variables.');
  }

  const credential: PhoneAuthCredential = PhoneAuthProvider.credential(
    verificationId,
    otpCode,
  );

  const userCredential = await signInWithCredential(getFirebaseAuth(), credential);
  const idToken = await userCredential.user.getIdToken();

  return { idToken, user: userCredential.user };
}

/**
 * Listen for Firebase auth state changes (used for sign-out on logout).
 */
export function onFirebaseAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

/**
 * Sign out the current Firebase user (called on app logout).
 */
export async function signOutFirebase(): Promise<void> {
  await getFirebaseAuth().signOut();
}

