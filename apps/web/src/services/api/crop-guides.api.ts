import { api } from './axios';

export type CropGuideSeason = 'kharif' | 'rabi' | 'summer' | 'yearRound';

export type CropGuideCard = {
  slug: string;
  image: string;
  imageAlt: string;
  category: string;
  seasonKeys: CropGuideSeason[];
  name: string;
  aliases: string[];
  shortDescription: string;
  suitableSeason: string | null;
};

export type CropGuideListResponse = {
  items: CropGuideCard[];
  categories: string[];
  seasons: CropGuideSeason[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CropGuideDetail = CropGuideCard & {
  sections: Record<string, string[]>;
  source: {
    name: string;
    url: string;
  };
};

export async function getCropGuides(
  params: {
    search?: string;
    category?: string;
    season?: CropGuideSeason;
    locale?: string;
    page?: number;
    limit?: number;
    signal?: AbortSignal;
  } = {},
) {
  const { signal, ...query } = params;
  const response = await api.get<CropGuideListResponse>('/crop-guides', {
    params: query,
    signal,
  });

  return response.data;
}

export async function getCropGuide(slug: string, locale?: string) {
  const response = await api.get<CropGuideDetail>(
    `/crop-guides/${encodeURIComponent(slug)}`,
    { params: { locale } },
  );

  return response.data;
}
