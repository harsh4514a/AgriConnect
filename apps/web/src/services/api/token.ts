import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-url';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const SESSION_HINT_COOKIE = 'agriconnect_session_exp';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export function getStoredTokens(): StoredTokens {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  syncSessionHintFromStorage();
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_HINT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

/** Decode the `exp` claim of a JWT (milliseconds since epoch), or null. */
function getJwtExpiryMillis(token: string): number | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const payload = JSON.parse(
      atob(segment.replace(/-/g, '+').replace(/_/g, '/')),
    );
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Keep a non-authenticating expiry hint in a cookie so middleware can route a
 * signed-in visitor away from the public landing page before rendering it.
 * The actual session remains in localStorage and all protected routes still
 * validate the real tokens.
 */
export function syncSessionHintFromStorage(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const { accessToken, refreshToken } = getStoredTokens();
  const expiries = [accessToken, refreshToken]
    .filter((token): token is string => Boolean(token))
    .map(getJwtExpiryMillis)
    .filter((expiry): expiry is number => expiry !== null && expiry > Date.now());

  const expirySeconds = Math.floor(Math.max(0, ...expiries) / 1000);
  if (!expirySeconds) {
    document.cookie = `${SESSION_HINT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    return;
  }

  const maxAge = Math.max(0, expirySeconds - Math.floor(Date.now() / 1000));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_HINT_COOKIE}=${expirySeconds}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/** True if the token has expired or cannot be decoded. */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const expiry = getJwtExpiryMillis(token);
  if (expiry === null) return true; // un-decodable -> treat as invalid
  return Date.now() >= expiry;
}

/**
 * True when a session is available: a non-expired access token,
 * or an unexpired refresh token that can still be exchanged.
 */
export function hasUsableSession(): boolean {
  const { accessToken, refreshToken } = getStoredTokens();
  if (accessToken && !isTokenExpired(accessToken)) {
    return true;
  }
  return !!refreshToken && !isTokenExpired(refreshToken);
}

/**
 * Exchange the stored refresh token for a fresh token pair.
 * Resolves with the new access token and persists both tokens.
 * Rejects with 401 when the refresh token is invalid/revoked/expired.
 */
export async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Use the raw axios client (not `api`) to avoid interceptor recursion.
  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { timeout: 15000 },
  );

  storeTokens(response.data.accessToken, response.data.refreshToken);
  return response.data.accessToken;
}
