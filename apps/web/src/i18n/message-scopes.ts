export const CLIENT_ERROR_MESSAGE_PATHS = [
  'errors',
  'api.otpWrong',
  'api.otpExpired',
  'api.otpMaxAttempts',
  'api.invalidOtp',
  'api.invalidRegistrationToken',
  'api.profileAlreadyCompleted',
  'api.sessionExpired',
  'api.otpCooldown',
  'api.otpMaxResend',
] as const;

export const ROOT_MESSAGE_PATHS = [
  'common',
  'notFound',
  'landingPage.nav',
  'landingPage.account',
  'nav',
  'footer',
  'settings',
  ...CLIENT_ERROR_MESSAGE_PATHS,
] as const;

export const AUTH_MESSAGE_PATHS = [
  ...ROOT_MESSAGE_PATHS,
  'settings',
  'languages',
  'auth',
  'mobile',
  'otp',
  'name',
  'language',
  'locationPermission',
  'location',
  'manual',
  'wizard',
  'profile',
  'badges',
  'validation',
  'firebase',
] as const;

export const PUBLIC_DASHBOARD_MESSAGE_PATHS = [
  ...ROOT_MESSAGE_PATHS,
  'landingPage',
  'dashboard',
  'nav',
  'buyerRequirements',
  'marketPrices',
  'cropGuide',
  'governmentSchemes',
  'legal',
  'profile',
  'settings',
  'languages',
  'api.transportManagement',
  'adminBuyerRequirementsLegacy.transportManagement',
] as const;

export const PRIVATE_DASHBOARD_MESSAGE_PATHS = [
  ...ROOT_MESSAGE_PATHS,
  'dashboard',
  'buyerRequirements',
  'marketPrices',
  'cropGuide',
  'governmentSchemes',
  'profilePage',
  'profile',
  'settings',
  'legal',
  'validation',
  'languages',
  'api.transportManagement',
  'adminBuyerRequirementsLegacy.transportManagement',
] as const;

export const ADMIN_MESSAGE_PATHS = [
  ...ROOT_MESSAGE_PATHS,
  'admin',
  'settings',
  'cropGuide',
  'governmentSchemes',
  'marketPrices',
  'languages',
  'api.transportManagement',
  'adminBuyerRequirementsLegacy.transportManagement',
] as const;
