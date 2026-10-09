import axios from 'axios';
import { API_BASE_URL } from '@/lib/api-url';
import {
  getStoredAdminTokens,
  isAdminTokenExpired,
  refreshAdminAccessToken,
  clearStoredAdminTokens,
} from './admin-token';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshInFlight: Promise<string> | null = null;

async function getValidAdminAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = getStoredAdminTokens();

  if (accessToken && !isAdminTokenExpired(accessToken)) {
    return accessToken;
  }

  if (!refreshToken || isAdminTokenExpired(refreshToken)) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAdminAccessToken()
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          clearStoredAdminTokens();
        }
        throw err;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

adminApi.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  try {
    const token = await getValidAdminAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Session invalidated or expired; backend will reject with 401
  }

  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const rawMessage = data?.message;
      const isSafeServerError = status >= 400 && status < 500;
      const message = isSafeServerError
        ? typeof rawMessage === 'string'
          ? rawMessage
          : Array.isArray(rawMessage)
            ? rawMessage.join(' ')
            : 'Admin authentication request failed'
        : 'Admin authentication request failed';

      const err = new Error(message) as Error & { status?: number };
      err.status = status;
      return Promise.reject(err);
    }

    if (error.code === 'ECONNABORTED') {
      const err = new Error('Admin API request timed out') as Error & { status?: number };
      err.status = 408;
      return Promise.reject(err);
    }

    const err = new Error('Could not connect to Admin API server') as Error & {
      status?: number;
    };
    err.status = 503;
    return Promise.reject(err);
  },
);

export { adminApi };
