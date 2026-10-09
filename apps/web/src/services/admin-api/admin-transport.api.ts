import { adminApi } from './admin-axios';

export type AdminTransportVehicleType = string;

export interface AdminTransportLocation {
  id: string;
  name: string;
}

export interface AdminTransportOwner {
  id: string;
  name: string;
  mobileNumber: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface AdminTransportListItem {
  id: string;
  businessName: string;
  contactName: string | null;
  phoneNumber: string;
  vehicleType: AdminTransportVehicleType;
  customVehicleType: string | null;
  additionalDetails: string | null;
  district: AdminTransportLocation;
  taluka: AdminTransportLocation | null;
  village: AdminTransportLocation | null;
  isAvailable: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: AdminTransportOwner | null;
}

export type AdminTransportDetails = AdminTransportListItem;

export interface AdminTransportFiltersResponse {
  vehicleTypes: string[];
  districts: AdminTransportLocation[];
  talukas: AdminTransportLocation[];
  villages: AdminTransportLocation[];
}

export interface AdminTransportsResponse {
  items: AdminTransportListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AdminTransportQuery {
  search?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  vehicleType?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export async function adminGetTransportsApi(
  params: AdminTransportQuery = {},
): Promise<AdminTransportsResponse> {
  const { data } = await adminApi.get<AdminTransportsResponse>('/admin/transport', { params });
  return data;
}

export async function adminGetTransportFiltersApi(): Promise<AdminTransportFiltersResponse> {
  const { data } = await adminApi.get<AdminTransportFiltersResponse>('/admin/transport/filters');
  return data;
}

export async function adminGetTransportApi(id: string): Promise<AdminTransportDetails> {
  const { data } = await adminApi.get<AdminTransportDetails>(`/admin/transport/${id}`);
  return data;
}

export async function adminUpdateTransportStatusApi(
  id: string,
  isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
  const { data } = await adminApi.patch<{ id: string; isActive: boolean }>(
    `/admin/transport/${id}/status`,
    { isActive },
  );
  return data;
}
