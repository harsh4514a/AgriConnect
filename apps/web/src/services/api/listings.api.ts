import { api } from './axios';
import { emitNotificationsChanged } from './notifications.api';
import type { CropKey, CropListing, UnitKey } from '@/data/marketplace-listings';

export interface ListingsResponse {
  listings: CropListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateListingRequest {
  cropKey: CropKey;
  variety?: string;
  customCropName?: string;
  qualityGrade?: string;
  quantity: number;
  unit: UnitKey;
  price: number;
  primaryUnit: string;
  district: string;
  taluka: string;
  village: string;
  state?: string;
  cropDate: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  additionalImages?: string[];
}

/** Load marketplace listings from the API database. */
export interface ListingsQuery {
  cropKey?: CropKey;
  district?: string;
  status?: 'active' | 'sold' | 'inactive';
  page?: number;
  limit?: number;
}

export async function getListings(query: ListingsQuery = {}): Promise<ListingsResponse> {
  const response = await api.get<ListingsResponse>('/listings', {
    params: {
      ...(query.cropKey ? { cropKey: query.cropKey } : {}),
      ...(query.district ? { district: query.district } : {}),
      ...(query.status ? { status: query.status } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  return response.data;
}

/** Load a single marketplace listing from the API database. */
export async function getListing(id: string): Promise<CropListing> {
  const response = await api.get<CropListing>(`/listings/${id}`);
  return response.data;
}

/**
 * Load only actually related listings from the database.
 *
 * The backend determines the relationship using the current
 * listing's cropKey. The frontend does not use static marketplace data.
 */
export async function getRelatedListings(id: string): Promise<CropListing[]> {
  const response = await api.get<CropListing[]>(`/listings/${id}/related`);

  return response.data;
}
/** Load only the current authenticated farmer's database listings. */
export async function getMyListings(): Promise<CropListing[]> {
  const response = await api.get<CropListing[]>('/listings/mine');
  return response.data;
}

/** Upload listing photos and receive persistent Cloudinary secure URLs. */
export async function uploadListingImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const response = await api.post<{ urls: string[] }>('/listings/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return response.data.urls;
}

/** Load one owned listing for the edit form. */
export async function getMyListing(id: string): Promise<CropListing> {
  const response = await api.get<CropListing>(`/listings/mine/${id}`);
  return response.data;
}

/** Publish a listing for the authenticated farmer. */
export async function createListing(data: CreateListingRequest): Promise<CropListing> {
  const response = await api.post<CropListing>('/listings', data);
  emitNotificationsChanged();
  return response.data;
}

/** Update an owned listing in PostgreSQL. */
export async function updateListing(
  id: string,
  data: Partial<CreateListingRequest>,
): Promise<CropListing> {
  const response = await api.patch<CropListing>(`/listings/${id}`, data);
  return response.data;
}

/** Update an owned listing's lifecycle status in PostgreSQL. */
export async function updateListingStatus(
  id: string,
  status: 'active' | 'sold' | 'inactive',
): Promise<CropListing> {
  const response = await api.patch<CropListing>(`/listings/${id}/status`, { status });
  emitNotificationsChanged();
  return response.data;
}

/** Permanently delete an owned listing from PostgreSQL. */
export async function deleteListing(id: string): Promise<void> {
  await api.delete(`/listings/${id}`);
}

export interface NearbyListingsParams {
  radius?: number;
  cropKey?: CropKey;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Load nearby listings from the database.
 *
 * The backend uses the authenticated user's saved
 * profile coordinates to calculate the distance.
 */
export async function getNearbyListings(
  params: NearbyListingsParams = {},
): Promise<ListingsResponse> {
  const response = await api.get<ListingsResponse>('/listings/nearby', {
    params: {
      radius: params.radius ?? 10,

      ...(params.cropKey
        ? {
            cropKey: params.cropKey,
          }
        : {}),

      ...(params.search?.trim()
        ? {
            search: params.search.trim(),
          }
        : {}),

      page: params.page ?? 1,

      limit: params.limit ?? 12,
    },
  });

  return response.data;
}
