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
  vehicleType: string;
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

export interface AdminTransportDetails extends AdminTransportListItem {}

export interface AdminTransportFiltersResponse {
  vehicleTypes: string[];
  districts: AdminTransportLocation[];
  talukas: AdminTransportLocation[];
  villages: AdminTransportLocation[];
}

export interface AdminTransportsResponse {
  items: AdminTransportListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
