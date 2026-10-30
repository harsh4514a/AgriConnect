'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, PhoneAuthProvider } from 'firebase/auth';
import { firebaseConfig } from './config';

export { isFirebaseEnabled } from './config';

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

