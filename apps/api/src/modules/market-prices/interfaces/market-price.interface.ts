export interface DataGovInMarketPriceRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  arrival_date?: string;
  min_price?: number | string;
  max_price?: number | string;
  modal_price?: number | string;
}

export interface DataGovInResponse {
  title?: string;
  total?: number | string;
  count?: number | string;
  limit?: number | string;
  offset?: number | string;
  records?: DataGovInMarketPriceRecord[];
}
