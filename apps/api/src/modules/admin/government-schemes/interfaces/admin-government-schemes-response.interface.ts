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
  governmentLevel: string;
  department: string;
  category: string;
  status: string;
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
