import { adminApi } from './admin-axios';

export type AdminGovernmentSchemeLocale = 'en' | 'gu' | 'hi';
export type AdminGovernmentSchemeLevel = 'central' | 'state';
export type AdminGovernmentSchemeStatus = 'active' | 'closed' | 'upcoming';

export interface AdminGovernmentSchemeContent {
  id?: string;
  locale: AdminGovernmentSchemeLocale;
  name: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  applicationSteps: string[];
  conditions: string[];
  keywords: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminGovernmentSchemeListItem {
  id: string;
  slug: string;
  governmentLevel: AdminGovernmentSchemeLevel;
  department: string;
  category: string;
  status: AdminGovernmentSchemeStatus;
  availableStates: string[];
  applicationUrl: string | null;
  sourceUrl: string;
  lastVerifiedAt: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  contents: Array<Pick<AdminGovernmentSchemeContent, 'locale' | 'name' | 'shortDescription'>>;
  availableLocales: AdminGovernmentSchemeLocale[];
}

export interface AdminGovernmentSchemeDetails extends Omit<AdminGovernmentSchemeListItem, 'contents'> {
  contents: AdminGovernmentSchemeContent[];
}

export interface AdminGovernmentSchemeFiltersResponse {
  categories: string[];
  governmentLevels: string[];
  statuses: string[];
  states: string[];
}

export interface AdminGovernmentSchemesResponse {
  items: AdminGovernmentSchemeListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminGovernmentSchemeQuery {
  search?: string;
  category?: string;
  governmentLevel?: string;
  status?: string;
  state?: string;
  locale?: AdminGovernmentSchemeLocale;
  isPublished?: boolean;
  sort?: 'newest' | 'oldest' | 'name' | 'sortOrder';
  page?: number;
  pageSize?: number;
}

export interface AdminGovernmentSchemePayload {
  slug: string;
  governmentLevel: 'central' | 'state';
  department: string;
  category: string;
  status: 'active' | 'closed' | 'upcoming';
  availableStates: string[];
  applicationUrl?: string | null;
  sourceUrl: string;
  lastVerifiedAt?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
  contents: AdminGovernmentSchemeContent[];
}

export async function adminGetGovernmentSchemesApi(params: AdminGovernmentSchemeQuery = {}) {
  const { data } = await adminApi.get<AdminGovernmentSchemesResponse>('/admin/government-schemes', {
    params,
  });
  return data;
}

export async function adminGetGovernmentSchemeFiltersApi() {
  const { data } = await adminApi.get<AdminGovernmentSchemeFiltersResponse>(
    '/admin/government-schemes/filters',
  );
  return data;
}

export async function adminGetGovernmentSchemeApi(id: string) {
  const { data } = await adminApi.get<AdminGovernmentSchemeDetails>(
    `/admin/government-schemes/${id}`,
  );
  return data;
}

export async function adminCreateGovernmentSchemeApi(payload: AdminGovernmentSchemePayload) {
  const { data } = await adminApi.post<AdminGovernmentSchemeDetails>(
    '/admin/government-schemes',
    payload,
  );
  return data;
}

export async function adminUpdateGovernmentSchemeApi(
  id: string,
  payload: AdminGovernmentSchemePayload,
) {
  const { data } = await adminApi.put<AdminGovernmentSchemeDetails>(
    `/admin/government-schemes/${id}`,
    payload,
  );
  return data;
}

export async function adminUpdateGovernmentSchemeStatusApi(id: string, isPublished: boolean) {
  const { data } = await adminApi.patch<{ id: string; isPublished: boolean }>(
    `/admin/government-schemes/${id}/status`,
    { isPublished },
  );
  return data;
}

export async function adminDeleteGovernmentSchemeApi(id: string) {
  const { data } = await adminApi.delete<{ id: string; slug: string; deleted: boolean }>(
    `/admin/government-schemes/${id}`,
  );
  return data;
}
