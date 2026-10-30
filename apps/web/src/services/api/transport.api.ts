import { api } from './axios';
import { emitNotificationsChanged } from './notifications.api';

export type TransportVehicleType =
  | 'tractor'
  | 'tractor_trailer'
  | 'pickup'
  | 'mini_truck'
  | 'truck'
  | 'other';

export interface TransportLocation {
  id: string;
  name: string;
}

export interface TransportProvider {
  id: string;

  businessName: string;

  contactName?: string | null;

  /** Present only in signed-in responses. */
  phoneNumber?: string;

  vehicleType: TransportVehicleType | string;

  customVehicleType?: string | null;

  additionalDetails?: string | null;

  district: TransportLocation;

  taluka?: TransportLocation | null;

  village?: TransportLocation | null;

  latitude?: number | null;

  longitude?: number | null;

  isAvailable: boolean;

  isVerified: boolean;

  isActive: boolean;
}

export interface TransportListResponse {
  items: TransportProvider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransportQuery {
  search?: string;

  districtId?: string;

  talukaId?: string;

  villageId?: string;

  vehicleType?: TransportVehicleType;

  available?: boolean;

  page?: number;

  limit?: number;
}

export interface CreateTransportPayload {
  vehicleType: TransportVehicleType;

  customVehicleType?: string;

  phoneNumber: string;

  districtId: string;

  talukaId: string;

  villageId: string;

  additionalDetails?: string;

  isAvailable?: boolean;

  latitude?: number | null;

  longitude?: number | null;
}

export type UpdateTransportPayload =
  Partial<CreateTransportPayload>;

export async function getTransportProviders(
  query: TransportQuery = {},
  signal?: AbortSignal,
): Promise<TransportListResponse> {
  const { data } =
    await api.get<TransportListResponse>('/transport', {
      params: query,
      signal,
    });

  return data;
}

export async function getMyTransportProviders(
  query: Pick<TransportQuery, 'page' | 'limit'> = {},
): Promise<TransportListResponse> {
  const { data } =
    await api.get<TransportListResponse>('/transport/mine', {
      params: query,
    });

  return data;
}

export async function createTransportProvider(
  payload: CreateTransportPayload,
): Promise<TransportProvider> {
  const { data } =
    await api.post<TransportProvider>(
      '/transport',
      payload,
    );

  emitNotificationsChanged();
  return data;
}

export async function updateTransportProvider(
  id: string,
  payload: UpdateTransportPayload,
): Promise<TransportProvider> {
  const { data } =
    await api.patch<TransportProvider>(
      `/transport/${id}`,
      payload,
    );

  return data;
}

export async function updateTransportAvailability(
  id: string,
  isAvailable: boolean,
): Promise<TransportProvider> {
  const { data } =
    await api.patch<TransportProvider>(
      `/transport/${id}/availability`,
      { isAvailable },
    );

  emitNotificationsChanged();
  return data;
}

export async function deleteTransportProvider(
  id: string,
): Promise<void> {
  await api.delete(`/transport/${id}`);
}
