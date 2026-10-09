export interface AdminProfileResponse {
  id: string;
  username: string;
  role: 'admin';
  isActive: boolean;
  createdAt: Date;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfileResponse;
}
