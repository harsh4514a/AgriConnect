export const AUTH_ROUTES = {
  HOME: '/',
} as const;

export const MOBILE_CONFIG = {
  COUNTRY_CODE: '+91',
  MAX_LENGTH: 10,
  MIN_LENGTH: 10,
  REGEX: /^[6-9]\d{9}$/,
} as const;

export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'agri_access_token',
  REFRESH_TOKEN: 'agri_refresh_token',
  TEMP_TOKEN: 'agri_temp_token',
  MOBILE_NUMBER: 'agri_mobile',
} as const;
