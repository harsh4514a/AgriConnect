import axios from 'axios';
import { translate } from '@/i18n/client';
import { API_BASE_URL } from '@/lib/api-url';
import { getStoredTokens, refreshAccessToken, isTokenExpired, clearStoredTokens } from './token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Shared in-flight refresh so concurrent calls reuse a single request. */
let refreshInFlight: Promise<string> | null = null;

/**
 * Resolve a valid access token for the current session.
 * - Uses the stored access token when it is still valid.
 * - Otherwise exchanges the refresh token once (single-flight).
 * - Returns null when there is no usable session.
 */
async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = getStoredTokens();

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  if (!refreshToken || isTokenExpired(refreshToken)) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken()
      .catch((err) => {
        // Only drop the session when the server explicitly rejects
        // the refresh token (revoked/expired), not on network issues.
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          clearStoredTokens();
        }
        throw err;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

/**
 * Attach a valid Bearer token to every request (client-side only).
 * Expired access tokens are refreshed transparently so protected calls
 * succeed instead of failing with 401.
 */
api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  try {
    const token = await getValidAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Refresh failed (expired/invalid/revoked session). Leave the header
    // off; the server will reject protected routes with 401.
  }

  return config;
});

/** Reject with an Error that always carries the HTTP status (when present). */
function rejectWithStatus(message: string, status?: number): Error {
  const err = new Error(message) as Error & { status?: number };
  if (status !== undefined) {
    err.status = status;
  }
  return err;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const rawServerMessage = data?.message;
      const serverMessage =
        typeof rawServerMessage === 'string'
          ? rawServerMessage
          : Array.isArray(rawServerMessage)
            ? rawServerMessage.join(' ')
            : rawServerMessage && typeof rawServerMessage === 'object'
              ? JSON.stringify(rawServerMessage)
              : rawServerMessage == null
                ? ''
                : String(rawServerMessage);

      const lower = serverMessage.toLowerCase();

      if (lower.includes('5 wrong')) {
        return Promise.reject(rejectWithStatus(translate('api.otpMaxAttempts'), status));
      }
      if (lower.includes('wrong')) {
        return Promise.reject(rejectWithStatus(translate('api.otpWrong'), status));
      }
      if (lower.includes('expired')) {
        return Promise.reject(rejectWithStatus(translate('api.otpExpired'), status));
      }
      if (lower.includes('invalid otp')) {
        return Promise.reject(rejectWithStatus(translate('api.invalidOtp'), status));
      }
      if (lower.includes('registration token')) {
        return Promise.reject(rejectWithStatus(translate('api.invalidRegistrationToken'), status));
      }
      if (lower.includes('profile')) {
        return Promise.reject(rejectWithStatus(translate('api.profileAlreadyCompleted'), status));
      }
      if (lower.includes('cooldown') || status === 429) {
        return Promise.reject(rejectWithStatus(translate('api.otpCooldown'), status));
      }
      if (lower.includes('resend')) {
        return Promise.reject(rejectWithStatus(translate('api.otpMaxResend'), status));
      }

      const message =
        status >= 500
          ? translate('errors.serverError')
          : status === 429
            ? translate('errors.tooManyRequests')
            : translate('errors.unexpectedError');

      return Promise.reject(rejectWithStatus(message, status));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(rejectWithStatus(translate('errors.requestTimedOut')));
    }

    return Promise.reject(rejectWithStatus(translate('errors.connectionError')));
  },
);

export { api };
