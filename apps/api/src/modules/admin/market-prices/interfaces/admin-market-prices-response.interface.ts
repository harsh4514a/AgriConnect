export interface AdminMarketPriceListItem {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  dataDate: string;
  minimumPrice: number;
  maximumPrice: number;
  modalPrice: number;
  source: string;
  fetchedAt: string;
}

export interface AdminMarketPriceSyncInfo {
  latestDataDate: string | null;
  latestFetchedAt: string | null;
  totalRecords: number;
}

export interface AdminMarketPricesFiltersResponse {
  districts: string[];
  markets: string[];
  commodities: string[];
  varieties: string[];
  availableDates: string[];
}

export interface AdminMarketPricesResponse {
  items: AdminMarketPriceListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  syncInfo: AdminMarketPriceSyncInfo;
}
