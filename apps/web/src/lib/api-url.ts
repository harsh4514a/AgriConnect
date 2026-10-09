const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

function resolveApiBaseUrl(): string {
  if (!configuredApiUrl) {
    if (process.env.NODE_ENV === 'development') return 'http://localhost:3001';
    throw new Error('NEXT_PUBLIC_API_URL must be configured for production.');
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(configuredApiUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be a valid absolute URL.');
  }

  if (
    !['https:', 'http:'].includes(apiUrl.protocol) ||
    apiUrl.username ||
    apiUrl.password ||
    apiUrl.search ||
    apiUrl.hash ||
    (apiUrl.pathname !== '/' && apiUrl.pathname !== '')
  ) {
    throw new Error('NEXT_PUBLIC_API_URL must contain only the API origin.');
  }

  if (process.env.NODE_ENV === 'production') {
    const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
    if (apiUrl.protocol !== 'https:' || localHosts.has(apiUrl.hostname.toLowerCase())) {
      throw new Error('NEXT_PUBLIC_API_URL must use HTTPS and a public host in production.');
    }
  }

  return configuredApiUrl.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();
