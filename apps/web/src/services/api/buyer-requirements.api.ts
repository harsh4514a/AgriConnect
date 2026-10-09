import { api } from './axios';
import { emitNotificationsChanged } from './notifications.api';

export type BuyerRequirementCropKey =
  | 'cotton'
  | 'groundnut'
  | 'wheat'
  | 'rice'
  | 'tomato'
  | 'onion'
  | 'potato'
  | 'chili'
  | 'maize'
  | 'bajra'
  | 'other';

export type BuyerRequirementUnit = 'kg' | 'quintal' | 'ton';
export type BuyerRequirementStatus = 'active' | 'fulfilled' | 'expired' | 'cancelled';

export interface BuyerRequirement {
  id: string;
  buyerId: string;

  cropKey: BuyerRequirementCropKey;
  customCropName?: string;
  variety?: string;

  quantity: number;
  unit: BuyerRequirementUnit;

  district: string;
  taluka?: string;
  village?: string;

  additionalRequirements?: string;

  status: BuyerRequirementStatus;

  createdAt: string;
  updatedAt: string;

  postedBy?: {
    firstName?: string;
    lastName?: string;
    isVerified: boolean;
  };

  contact?: {
    phoneNumber: string;
    displayName: string;
  };
}

export interface BuyerRequirementListResponse {
  items: BuyerRequirement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BuyerRequirementQuery {
  search?: string;
  cropKey?: string;
  district?: string;
  minQuantity?: number;
  maxQuantity?: number;
  page?: number;
  limit?: number;
}

export interface CreateBuyerRequirementPayload {
  cropKey: BuyerRequirementCropKey;
  customCropName?: string;
  variety?: string;

  quantity: number;
  unit: BuyerRequirementUnit;

  district: string;
  taluka?: string;
  village?: string;

  contactNumber: string;

  additionalRequirements?: string;

  submissionKey?: string;
}

export async function getBuyerRequirements(
  query: BuyerRequirementQuery = {},
): Promise<BuyerRequirementListResponse> {
  const { data } = await api.get<BuyerRequirementListResponse>('/buyer-requirements', {
    params: query,
  });
  return data;
}

export async function getMyBuyerRequirements(): Promise<BuyerRequirement[]> {
  const { data } = await api.get<BuyerRequirement[]>('/buyer-requirements/mine');
  return data;
}

export async function getBuyerRequirement(id: string): Promise<BuyerRequirement> {
  const { data } = await api.get<BuyerRequirement>(
    `/buyer-requirements/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function createBuyerRequirement(
  payload: CreateBuyerRequirementPayload,
): Promise<BuyerRequirement> {
  const { data } = await api.post<BuyerRequirement>('/buyer-requirements', payload);
  emitNotificationsChanged();
  return data;
}

export async function updateBuyerRequirement(
  id: string,
  payload: Partial<CreateBuyerRequirementPayload>,
): Promise<BuyerRequirement> {
  const { data } = await api.patch<BuyerRequirement>(
    `/buyer-requirements/${encodeURIComponent(id)}`,
    payload,
  );
  return data;
}

export async function closeBuyerRequirement(
  id: string,
  status: 'cancelled' | 'fulfilled',
): Promise<{ id: string; status: BuyerRequirementStatus }> {
  const { data } = await api.patch<{ id: string; status: BuyerRequirementStatus }>(
    `/buyer-requirements/${encodeURIComponent(id)}/close`,
    { status },
  );
  emitNotificationsChanged();
  return data;
}
