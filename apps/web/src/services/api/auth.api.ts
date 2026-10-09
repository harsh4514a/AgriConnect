import { api } from './axios';
import { emitNotificationsChanged } from './notifications.api';
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VerifyFirebaseRequest,
  CompleteProfileRequest,
} from '@/types/auth.types';

export interface LocationOption {
  id: string;
  name: string;
  /** Localized label for display; `name` remains the canonical API value. */
  displayName?: string;
}

function getRouteLocale(): 'en' | 'gu' | 'hi' {
  if (typeof window === 'undefined') return 'en';
  const routeLocale = window.location.pathname.split('/')[1];
  return routeLocale === 'gu' || routeLocale === 'hi' ? routeLocale : 'en';
}

export async function sendOtp(
  data: SendOtpRequest,
): Promise<SendOtpResponse> {
  const response = await api.post<SendOtpResponse>(
    '/auth/send-otp',
    data,
  );

  return response.data;
}

export async function verifyOtp(
  data: VerifyOtpRequest,
): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>(
    '/auth/verify-otp',
    data,
  );

  return response.data;
}

export async function verifyFirebase(
  data: VerifyFirebaseRequest,
): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>(
    '/auth/verify-firebase',
    data,
  );

  return response.data;
}

export async function completeProfile(
  data: CompleteProfileRequest,
): Promise<{
  user: {
    id: string;
    mobileNumber: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
    role: string;
    isVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}> {
  const response = await api.post('/auth/complete-profile', data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  return response.data;
}

export async function updatePreferredLanguage(
  preferredLanguage: 'en' | 'gu' | 'hi',
): Promise<{ preferredLanguage: string }> {
  const response = await api.patch<{ preferredLanguage: string }>(
    '/auth/profile/language',
    { preferredLanguage },
  );

  emitNotificationsChanged();
  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export interface ProfileLocationOption {
  id: string;
  name: string;
}

export interface ProfileResponse {
  id: string;
  mobileNumber: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  role: string;
  isVerified: boolean;
  avatarUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  state?: ProfileLocationOption | null;
  district?: ProfileLocationOption | null;
  taluka?: ProfileLocationOption | null;
  village?: ProfileLocationOption | null;
}

/**
 * Fetch the authenticated user's profile.
 */
export async function getProfile(): Promise<ProfileResponse> {
  const response = await api.get<ProfileResponse>('/auth/profile');

  return response.data;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  districtId: string;
  talukaId: string;
  villageId: string;
}

/**
 * Update the authenticated user's profile.
 *
 * The backend determines the user from the authenticated session.
 * No user ID is accepted from the client.
 */
export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<ProfileResponse> {
  const response = await api.patch<ProfileResponse>(
    '/auth/profile',
    data,
  );

  emitNotificationsChanged();
  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Locations                                                                  */
/* -------------------------------------------------------------------------- */

export async function getStates(locale = getRouteLocale()): Promise<LocationOption[]> {
  const response = await api.get<LocationOption[]>(
    '/locations/states',
    { params: { locale } },
  );

  return response.data;
}

export async function getDistricts(
  stateId: string,
  locale = getRouteLocale(),
): Promise<LocationOption[]> {
  const response = await api.get<LocationOption[]>(
    '/locations/districts',
    {
      params: { stateId, locale },
    },
  );

  return response.data;
}

export async function getTalukas(
  districtId: string,
  locale = getRouteLocale(),
): Promise<LocationOption[]> {
  const response = await api.get<LocationOption[]>(
    '/locations/talukas',
    {
      params: { districtId, locale },
    },
  );

  return response.data;
}

export async function getVillages(
  talukaId: string,
  locale = getRouteLocale(),
): Promise<LocationOption[]> {
  const response = await api.get<LocationOption[]>(
    '/locations/villages',
    {
      params: { talukaId, locale },
    },
  );

  return response.data;
}
