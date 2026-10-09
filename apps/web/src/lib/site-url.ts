/**
 * Returns the configured canonical site origin. Production deployments must
 * provide SITE_URL and use HTTPS; local development may leave it unset.
 */
export function getSiteUrl(): URL | null {
  const configured = process.env.SITE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SITE_URL must be configured for production metadata.');
    }
    return null;
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(configured);
  } catch {
    throw new Error('SITE_URL must be a valid absolute URL.');
  }

  if (
    !['https:', 'http:'].includes(siteUrl.protocol) ||
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.search ||
    siteUrl.hash ||
    (siteUrl.pathname !== '/' && siteUrl.pathname !== '')
  ) {
    throw new Error('SITE_URL must contain only the website origin.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

  if (isProduction && siteUrl.protocol !== 'https:') {
    throw new Error('SITE_URL must use HTTPS in production.');
  }

  if (isProduction && localHosts.has(siteUrl.hostname.toLowerCase())) {
    throw new Error('SITE_URL cannot point to a local host in production.');
  }

  return new URL(siteUrl.origin);
}

export function requireProductionSiteUrl(): URL {
  const siteUrl = getSiteUrl();
  return siteUrl ?? new URL('http://localhost:3000');
}
