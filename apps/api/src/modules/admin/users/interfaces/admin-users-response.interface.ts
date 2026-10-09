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

export interface AdminUserStatusResponse {
  id: string;
  isActive: boolean;
}
