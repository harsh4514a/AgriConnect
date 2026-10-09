export interface SendOtpRequest {
    mobileNumber: string;
}

export interface SendOtpResponse {
    message: string;
}

export interface VerifyOtpRequest {
    mobileNumber: string;
    otp: string;
}

export interface VerifyFirebaseRequest {
    idToken: string;
    mobileNumber: string;
}


export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser {
    id: string;
    mobileNumber: string;
    firstName: string | null;
    lastName: string | null;
    preferredLanguage: string | null;
    role: string;
    isVerified: boolean;
}

export interface VerifyOtpResponse {
    message: string;
    isNewUser: boolean;
    tokens?: AuthTokens;
    user?: AuthUser;
    registrationToken?: string;
}

export interface CompleteProfileRequest {
    firstName: string;
    lastName: string;
    preferredLanguage: string;
    registrationToken: string;
    stateId?: string;
    districtId?: string;
    talukaId?: string;
    villageId?: string;
    latitude?: number;
    longitude?: number;
}

export interface UpdatePreferredLanguageRequest {
    preferredLanguage: 'en' | 'gu' | 'hi';
}

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

