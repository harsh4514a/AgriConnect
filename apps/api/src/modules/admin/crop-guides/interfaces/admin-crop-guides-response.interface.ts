export type AdminCropGuideLocale = 'en' | 'gu' | 'hi';

export interface AdminCropGuideContent {
  id: string;
  locale: AdminCropGuideLocale;
  name: string;
  aliases: string[];
  shortDescription: string;
  suitableSeason: string | null;
  sections: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

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
