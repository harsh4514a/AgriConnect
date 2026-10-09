import { adminApi } from './admin-axios';

export type AdminActivityType =
  | 'user'
  | 'listing'
  | 'buyerRequirement'
  | 'transport'
  | 'governmentScheme'
  | 'cropGuide';

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeListings: number;
  activeBuyerRequirements: number;
  activeTransportListings: number;
  publishedGovernmentSchemes: number;
  publishedCropGuides: number;
  marketPriceRecords: number;
}

export interface AdminRecentActivity {
  id: string;
  type: AdminActivityType;
  title: string;
  detail: string;
  createdAt: string;
}

export interface AdminDashboardResponse {
  metrics: AdminDashboardMetrics;
  recentActivity: AdminRecentActivity[];
}

export async function adminGetDashboardOverviewApi(): Promise<AdminDashboardResponse> {
  const { data } = await adminApi.get<AdminDashboardResponse>(
    '/admin/dashboard/overview',
  );
  return data;
}
