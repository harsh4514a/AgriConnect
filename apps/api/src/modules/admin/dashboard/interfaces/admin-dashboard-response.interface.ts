export interface AdminDashboardMetrics {
  totalUsers: number;
  activeListings: number;
  activeBuyerRequirements: number;
  activeTransportListings: number;
  publishedGovernmentSchemes: number;
  publishedCropGuides: number;
  marketPriceRecords: number;
}

export type AdminActivityType =
  | 'user'
  | 'listing'
  | 'buyerRequirement'
  | 'transport'
  | 'governmentScheme'
  | 'cropGuide';

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
