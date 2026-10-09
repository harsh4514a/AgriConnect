import { adminApi } from './admin-axios';
import {
  storeAdminTokens,
  clearStoredAdminTokens,
  cacheAdminProfile,
  StoredAdminProfile,
} from './admin-token';

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: StoredAdminProfile;
}

export async function adminLoginApi(
  payload: AdminLoginPayload,
): Promise<AdminAuthResponse> {
  const { data } = await adminApi.post<AdminAuthResponse>(
    '/admin/auth/login',
    payload,
  );
  storeAdminTokens(data.accessToken, data.refreshToken);
  cacheAdminProfile(data.admin);
  return data;
}

export async function adminGetProfileApi(): Promise<StoredAdminProfile> {
  const { data } = await adminApi.get<StoredAdminProfile>('/admin/auth/profile');
  cacheAdminProfile(data);
  return data;
}

export async function adminLogoutApi(refreshToken?: string | null): Promise<void> {
  try {
    await adminApi.post('/admin/auth/logout', { refreshToken: refreshToken ?? undefined });
  } finally {
    clearStoredAdminTokens();
  }
}
