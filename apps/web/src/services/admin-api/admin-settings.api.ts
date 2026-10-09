import { adminApi } from './admin-axios';

export interface AdminSettingsInfo {
  profile: {
    id: string;
    username: string;
    role: 'admin';
    isActive: boolean;
    createdAt: string;
  };
  system: {
    nodeEnv: string;
    supportedLocales: { code: string; name: string }[];
    defaultLocale: string;
    applicationName: string;
  };
  marketPrices: {
    syncEnabled: boolean;
    dataSource: string;
    latestDataDate: string | null;
    latestFetchedAt: string | null;
    totalRecords: number;
  };
  security: {
    authMethod: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    passwordProtected: boolean;
  };
}

export interface AdminChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminChangePasswordResponse {
  message: string;
}

export async function adminGetSettingsInfoApi(): Promise<AdminSettingsInfo> {
  const { data } = await adminApi.get<AdminSettingsInfo>('/admin/settings/info');
  return data;
}

export async function adminChangePasswordApi(
  payload: AdminChangePasswordPayload,
): Promise<AdminChangePasswordResponse> {
  const { data } = await adminApi.patch<AdminChangePasswordResponse>(
    '/admin/settings/security/password',
    payload,
  );
  return data;
}
