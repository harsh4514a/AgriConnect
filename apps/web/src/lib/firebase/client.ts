'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, PhoneAuthProvider } from 'firebase/auth';

/**
 * Firebase Client SDK singleton.
 *
 * Initialized lazily (and only once) using the PUBLIC (client-safe) config
 * from NEXT_PUBLIC_FIREBASE_* environment variables.
 *
 * These values are safe to expose in the browser by design — they are NOT
 * secrets. The backend separately verifies every Firebase ID Token with the
 * Firebase Admin SDK, so the frontend can never be trusted on its own.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

/**
 * True when the app has the required public Firebase config to enable
 * Firebase Phone Authentication. When false, the login UI falls back to the
 * backend OTP (mock) flow.
 */
export function isFirebaseEnabled(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let phoneProvider: PhoneAuthProvider | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getPhoneAuthProvider(): PhoneAuthProvider {
  if (!phoneProvider) {
    phoneProvider = new PhoneAuthProvider(getFirebaseAuth());
  }
  return phoneProvider;
}

