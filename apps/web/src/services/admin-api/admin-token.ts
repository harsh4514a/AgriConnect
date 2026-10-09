import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-url';

const ADMIN_ACCESS_TOKEN_KEY = 'agri_admin_access_token';
const ADMIN_REFRESH_TOKEN_KEY = 'agri_admin_refresh_token';
const ADMIN_PROFILE_KEY = 'agri_admin_profile';

export interface StoredAdminTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface StoredAdminProfile {
  id: string;
  username: string;
  role: 'admin';
  isActive: boolean;
  createdAt: string;
}

export function getStoredAdminTokens(): StoredAdminTokens {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY),
  };
}

export function storeAdminTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredAdminTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
}

export function getCachedAdminProfile(): StoredAdminProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as StoredAdminProfile) : null;
  } catch {
    return null;
  }
}

export function cacheAdminProfile(profile: StoredAdminProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore quota errors
  }
}

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

export function isAdminTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const expiry = getJwtExpiryMillis(token);
  if (expiry === null) return true;
  return Date.now() >= expiry;
}

export function hasUsableAdminSession(): boolean {
  const { accessToken, refreshToken } = getStoredAdminTokens();
  if (accessToken && !isAdminTokenExpired(accessToken)) {
    return true;
  }
  return !!refreshToken && !isAdminTokenExpired(refreshToken);
}

export async function refreshAdminAccessToken(): Promise<string> {
  const { refreshToken } = getStoredAdminTokens();
  if (!refreshToken) {
    throw new Error('No admin refresh token available');
  }

  const response = await axios.post<{
    accessToken: string;
    refreshToken: string;
  }>(
    `${API_BASE_URL}/admin/auth/refresh`,
    { refreshToken },
    { timeout: 15000 },
  );

  storeAdminTokens(response.data.accessToken, response.data.refreshToken);
  return response.data.accessToken;
}
