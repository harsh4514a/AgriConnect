import { adminApi } from './admin-axios';

export type AdminMarketplaceStatus = 'active' | 'sold' | 'inactive';
export type AdminMarketplaceSort = 'newest' | 'oldest';

export interface AdminMarketplaceActivity {
  listings: number;
  buyerRequirements: number;
  transportListings: number;
}

export interface AdminMarketplaceFarmer {
  id: string | null;
  name: string;
  mobileNumber: string;
  isActive: boolean | null;
  isVerified: boolean;
  activity: AdminMarketplaceActivity;
}

export interface AdminMarketplaceListItem {
  id: string;
  cropKey: string;
  customCropName: string | null;
  variety: string | null;
  image: string;
  imageAlt: string;
  farmerName: string;
  farmerNameShort: string;
  mobileNumber: string;
  district: string;
  taluka: string;
  village: string;
  state: string;
  quantity: number;
  unit: string;
  price: number;
  primaryUnit: string;
  secondaryUnit: string;
  marketPrice: number;
  availability: string;
  verified: boolean;
  readyToSell: boolean;
  description: string | null;
  qualityGrade: string | null;
  cropDate: string | null;
  status: AdminMarketplaceStatus;
  isUserCreated: boolean;
  createdAt: string;
  updatedAt: string;
  farmer: AdminMarketplaceFarmer;
}

export interface AdminMarketplaceDetails extends AdminMarketplaceListItem {
  additionalImages: string[];
  lat: number;
  lng: number;
  distanceKm: number;
  postedHoursAgo: number;
}

export interface AdminMarketplaceSummary {
  total: number;
  active: number;
  inactive: number;
  sold: number;
  recentlyAdded: number;
}

export interface AdminMarketplaceResponse {
  items: AdminMarketplaceListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: AdminMarketplaceSummary;
}

export interface AdminMarketplaceFiltersResponse {
  cropKeys: string[];
  districts: string[];
}

export interface AdminMarketplaceQuery {
  search?: string;
  cropKey?: string;
  district?: string;
  status?: AdminMarketplaceStatus;
  listedFrom?: string;
  listedTo?: string;
  sort?: AdminMarketplaceSort;
  page?: number;
  pageSize?: number;
}

export async function adminGetMarketplaceApi(
  params: AdminMarketplaceQuery = {},
): Promise<AdminMarketplaceResponse> {
  const { data } = await adminApi.get<AdminMarketplaceResponse>('/admin/marketplace', {
    params,
  });
  return data;
}

export async function adminGetMarketplaceFiltersApi(): Promise<AdminMarketplaceFiltersResponse> {
  const { data } = await adminApi.get<AdminMarketplaceFiltersResponse>(
    '/admin/marketplace/filters',
  );
  return data;
}

export async function adminGetMarketplaceListingApi(
  id: string,
): Promise<AdminMarketplaceDetails> {
  const { data } = await adminApi.get<AdminMarketplaceDetails>(`/admin/marketplace/${id}`);
  return data;
}

export async function adminUpdateMarketplaceStatusApi(
  id: string,
  status: AdminMarketplaceStatus,
): Promise<{ id: string; status: AdminMarketplaceStatus }> {
  const { data } = await adminApi.patch<{ id: string; status: AdminMarketplaceStatus }>(
    `/admin/marketplace/${id}/status`,
    { status },
  );
  return data;
}
