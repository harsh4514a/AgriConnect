import { adminApi } from './admin-axios';

export interface AdminUserListItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  mobileNumber: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  location: {
    state: string | null;
    district: string | null;
    taluka: string | null;
    village: string | null;
  };
  activity: {
    listings: number;
    buyerRequirements: number;
    transportListings: number;
  };
}

export interface AdminUserDistrictOption {
  id: string;
  name: string;
}

export interface AdminUserFiltersResponse {
  districts: AdminUserDistrictOption[];
}

export interface AdminUsersResponse {
  items: AdminUserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserDetails extends AdminUserListItem {
  updatedAt: string;
}

export interface AdminUserQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  districtId?: string;
  registeredFrom?: string;
  registeredTo?: string;
  sort?: 'newest' | 'oldest';
}

export async function adminGetUsersApi(
  params: AdminUserQuery,
): Promise<AdminUsersResponse> {
  const { data } = await adminApi.get<AdminUsersResponse>('/admin/users', {
    params,
  });
  return data;
}

export async function adminGetUserApi(
  id: string,
): Promise<AdminUserDetails> {
  const { data } = await adminApi.get<AdminUserDetails>(`/admin/users/${id}`);
  return data;
}

export async function adminUpdateUserStatusApi(
  id: string,
  isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
  const { data } = await adminApi.patch<{ id: string; isActive: boolean }>(
    `/admin/users/${id}/status`,
    { isActive },
  );
  return data;
}

export async function adminGetUserFiltersApi(): Promise<AdminUserFiltersResponse> {
  const { data } = await adminApi.get<AdminUserFiltersResponse>('/admin/users/filters');
  return data;
}
