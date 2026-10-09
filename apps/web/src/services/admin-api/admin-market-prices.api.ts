import { adminApi } from './admin-axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminMarketPriceItem {
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

export interface AdminMarketPricesResponse {
  items: AdminMarketPriceItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  syncInfo: AdminMarketPriceSyncInfo;
}

export interface AdminMarketPricesFiltersResponse {
  districts: string[];
  markets: string[];
  commodities: string[];
  varieties: string[];
  availableDates: string[];
}

export type AdminMarketPricesSortBy =
  | 'commodity'
  | 'market'
  | 'district'
  | 'modalPrice'
  | 'dataDate';

export type AdminMarketPricesSortDir = 'asc' | 'desc';

export interface AdminMarketPricesQuery {
  search?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  date?: string;
  sortBy?: AdminMarketPricesSortBy;
  sortDir?: AdminMarketPricesSortDir;
  page?: number;
  pageSize?: number;
}

// ─── API functions ─────────────────────────────────────────────────────────────

export async function adminGetMarketPricesApi(
  params: AdminMarketPricesQuery = {},
): Promise<AdminMarketPricesResponse> {
  const { data } = await adminApi.get<AdminMarketPricesResponse>('/admin/market-prices', {
    params,
  });
  return data;
}

export async function adminGetMarketPricesFiltersApi(): Promise<AdminMarketPricesFiltersResponse> {
  const { data } = await adminApi.get<AdminMarketPricesFiltersResponse>(
    '/admin/market-prices/filters',
  );
  return data;
}

export async function adminGetMarketPriceRecordApi(id: string): Promise<AdminMarketPriceItem> {
  const { data } = await adminApi.get<AdminMarketPriceItem>(`/admin/market-prices/${id}`);
  return data;
}
