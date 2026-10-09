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
  status: 'active' | 'sold' | 'inactive';
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

export interface AdminMarketplaceFiltersResponse {
  cropKeys: string[];
  districts: string[];
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
