import { adminApi } from './admin-axios';

export type AdminCropGuideLocale = 'en' | 'gu' | 'hi';
export type AdminCropGuideContent = {
  id?: string;
  locale: AdminCropGuideLocale;
  name: string;
  aliases: string[];
  shortDescription: string;
  suitableSeason: string | null;
  sections: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
};

export interface AdminCropGuideListItem {
  id: string;
  slug: string;
  image: string;
  imageAlt: string;
  category: string;
  seasonKeys: string[];
  sortOrder: number;
  isPublished: boolean;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
  contents: Array<Pick<AdminCropGuideContent, 'locale' | 'name' | 'shortDescription'>>;
  availableLocales: AdminCropGuideLocale[];
}

export interface AdminCropGuideDetails extends Omit<AdminCropGuideListItem, 'contents'> {
  contents: AdminCropGuideContent[];
}

export interface AdminCropGuideFiltersResponse {
  categories: string[];
  seasons: string[];
}
export interface AdminCropGuidesResponse {
  items: AdminCropGuideListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
export interface AdminCropGuideQuery {
  search?: string;
  category?: string;
  season?: string;
  locale?: AdminCropGuideLocale;
  isPublished?: boolean;
  sort?: 'newest' | 'oldest' | 'name';
  page?: number;
  pageSize?: number;
}
export interface AdminCropGuidePayload {
  slug: string;
  image: string;
  imageAlt: string;
  category: string;
  seasonKeys: string[];
  sortOrder?: number;
  isPublished?: boolean;
  sourceName: string;
  sourceUrl: string;
  contents: AdminCropGuideContent[];
}

export async function adminGetCropGuidesApi(params: AdminCropGuideQuery = {}) {
  const { data } = await adminApi.get<AdminCropGuidesResponse>('/admin/crop-guides', { params });
  return data;
}
export async function adminGetCropGuideFiltersApi() {
  const { data } = await adminApi.get<AdminCropGuideFiltersResponse>('/admin/crop-guides/filters');
  return data;
}
export async function adminGetCropGuideApi(id: string) {
  const { data } = await adminApi.get<AdminCropGuideDetails>(`/admin/crop-guides/${id}`);
  return data;
}
export async function adminCreateCropGuideApi(payload: AdminCropGuidePayload) {
  const { data } = await adminApi.post<AdminCropGuideDetails>('/admin/crop-guides', payload);
  return data;
}
export async function adminUpdateCropGuideApi(id: string, payload: AdminCropGuidePayload) {
  const { data } = await adminApi.put<AdminCropGuideDetails>(`/admin/crop-guides/${id}`, payload);
  return data;
}
export async function adminUpdateCropGuideStatusApi(id: string, isPublished: boolean) {
  const { data } = await adminApi.patch<{ id: string; isPublished: boolean }>(
    `/admin/crop-guides/${id}/status`,
    { isPublished },
  );
  return data;
}
