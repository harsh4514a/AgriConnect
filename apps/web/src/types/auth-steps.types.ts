export type AuthStep =
  | 'mobile'
  | 'otp'
  | 'name'
  | 'language'
  | 'location'
  | 'location-permission'
  | 'manual-location';

export interface AuthData {
  mobileNumber: string | null;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
  registrationToken?: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
}

export interface StepProps {
  onNext: (data?: Partial<AuthData>) => void;
  onBack: () => void;
  authData: AuthData;
  onComplete?: () => void;
}

export const INITIAL_AUTH_DATA: AuthData = {
  mobileNumber: null,
  firstName: '',
  lastName: '',
  preferredLanguage: '',
  registrationToken: undefined,
  state: '',
  district: '',
  taluka: '',
  village: '',
  latitude: null,
  longitude: null,
};


