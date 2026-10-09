export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    mobileNumber: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isVerified: boolean;
  };
  tokens: AuthTokens;
}

export interface OtpResponse {
  message: string;
  isNewUser?: boolean;
}

export interface VerifyOtpResponse {
  message: string;
  isNewUser: boolean;
  tokens?: AuthTokens;
  registrationToken?: string;
}

export interface CompleteProfileResponse {
  user: {
    id: string;
    mobileNumber: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
    role: string;
    isVerified: boolean;
  };
  tokens: AuthTokens;
}
