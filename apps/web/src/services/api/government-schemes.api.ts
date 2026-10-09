import { api } from './axios';

export type GovernmentSchemeLevel = 'central' | 'state';
export type GovernmentSchemeStatus = 'active' | 'closed' | 'upcoming';

export type GovernmentSchemeCard = {
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  governmentLevel: GovernmentSchemeLevel;
  status: GovernmentSchemeStatus;
  department: string;
  hasApplicationUrl: boolean;
  lastVerifiedAt: string | null;
};

export type GovernmentSchemeListResponse = {
  items: GovernmentSchemeCard[];
  categories: string[];
  governmentLevels: GovernmentSchemeLevel[];
  statuses: GovernmentSchemeStatus[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type GovernmentSchemeDetail = GovernmentSchemeCard & {
  description: string;
  availableStates: string[];
  benefits: string[];
  eligibility: string[];
  documents: string[];
  applicationSteps: string[];
  conditions: string[];
  applicationUrl: string | null;
  sourceUrl: string;
};

export async function getGovernmentSchemes(
  params: {
    search?: string;
    category?: string;
    governmentLevel?: GovernmentSchemeLevel;
    status?: GovernmentSchemeStatus;
    state?: string;
    locale?: string;
    page?: number;
    limit?: number;
    signal?: AbortSignal;
  } = {},
) {
  const { signal, ...query } = params;
  const response = await api.get<GovernmentSchemeListResponse>('/government-schemes', {
    params: query,
    signal,
  });
  return response.data;
}

export async function getGovernmentScheme(slug: string, locale?: string, signal?: AbortSignal) {
  const response = await api.get<GovernmentSchemeDetail>(
    `/government-schemes/${encodeURIComponent(slug)}`,
    { params: { locale }, signal },
  );
  return response.data;
}
