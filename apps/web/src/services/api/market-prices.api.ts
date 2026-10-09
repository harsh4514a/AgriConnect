import { api } from './axios';

export interface MarketPrice {
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

export interface MarketPriceListResponse {
  items: MarketPrice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  latestAvailableDate?: string;
}

export interface MarketPriceFiltersResponse {
  districts: string[];
  markets: string[];
  marketYardCount: number;
  commodities: string[];
  varieties: string[];
  latestAvailableDate?: string;
}

export interface MarketPriceRegion {
  name: string;
  marketCount: number;
  districtCount: number;
}

export interface MarketPriceMarket {
  market: string;
  district: string;
}

export interface MarketPriceMarketListResponse {
  items: MarketPriceMarket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MarketPriceMarketCrop {
  market: string;
  district: string;
  commodity: string;
  variety: string;
  grade: string;
  minimumPrice: number;
  maximumPrice: number;
  modalPrice: number;
  dataDate: string;
}

export interface MarketPriceMarketCropListResponse {
  items: MarketPriceMarketCrop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  latestAvailableDate?: string;
}

export interface MarketPriceCrop {
  name: string;
  marketCount: number;
}

export interface MarketPriceCropListResponse {
  items: MarketPriceCrop[];
  total: number;
}

export interface MarketPriceCropMarketComparison {
  market: string;
  district: string;
  highestPrice: number;
  averagePrice: number;
  lowestPrice: number;
  recordCount: number;
  varieties: string[];
  dataDate: string;
}

export interface MarketPriceCropMarketComparisonResponse {
  items: MarketPriceCropMarketComparison[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  latestAvailableDate?: string;
}

export interface MarketPriceQuery {
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MarketPriceBrowseQuery {
  district?: string;
  date?: string;
  variety?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getMarketPrices(
  query: MarketPriceQuery = {},
): Promise<MarketPriceListResponse> {
  const { data } = await api.get<MarketPriceListResponse>('/market-prices', { params: query });
  return data;
}

export async function getMarketPriceFilters(): Promise<MarketPriceFiltersResponse> {
  const { data } = await api.get<MarketPriceFiltersResponse>('/market-prices/filters');
  return data;
}

export async function getMarketPriceRegions(): Promise<MarketPriceRegion[]> {
  const { data } = await api.get<MarketPriceRegion[]>('/market-prices/regions');
  return data;
}

export async function getMarketYardsByRegion(
  region: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
  } = {},
): Promise<MarketPriceMarketListResponse> {
  const params = new URLSearchParams();

  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));

  if (query.search?.trim()) {
    params.set('search', query.search.trim());
  }

  const encodedRegion = encodeURIComponent(region.trim());

  return api
    .get<MarketPriceMarketListResponse>(
      `/market-prices/regions/${encodedRegion}/markets?${params.toString()}`,
    )
    .then((response) => response.data);
}

export async function getMarketYardPrices(
  market: string,
  query: MarketPriceBrowseQuery = {},
): Promise<MarketPriceMarketCropListResponse> {
  const { data } = await api.get<MarketPriceMarketCropListResponse>(
    `/market-prices/markets/${encodeURIComponent(market)}/prices`,
    { params: query },
  );
  return data;
}

export async function getMarketPriceCrops(search?: string): Promise<MarketPriceCropListResponse> {
  const { data } = await api.get<MarketPriceCropListResponse>('/market-prices/crops', {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function getCropMarketComparison(
  commodity: string,
  query: MarketPriceBrowseQuery = {},
): Promise<MarketPriceCropMarketComparisonResponse> {
  const { data } = await api.get<MarketPriceCropMarketComparisonResponse>(
    `/market-prices/crops/${encodeURIComponent(commodity)}/compare`,
    { params: query },
  );

  return data;
}
