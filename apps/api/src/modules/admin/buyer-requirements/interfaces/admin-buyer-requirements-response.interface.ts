export interface AdminBuyerRequirementBuyer {
  id: string;
  name: string;
  mobileNumber: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface AdminBuyerRequirementListItem {
  id: string;
  cropKey: string;
  customCropName: string | null;
  variety: string | null;
  quantity: number;
  unit: string;
  district: string;
  taluka: string | null;
  village: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: AdminBuyerRequirementBuyer;
}

export interface AdminBuyerRequirementDetails extends AdminBuyerRequirementListItem {
  contactNumber: string;
  additionalRequirements: string | null;
}

export interface AdminBuyerRequirementFiltersResponse {
  cropKeys: string[];
  districts: string[];
  statuses: string[];
}

export interface AdminBuyerRequirementsResponse {
  items: AdminBuyerRequirementListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
