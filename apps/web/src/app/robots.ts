import type { MetadataRoute } from 'next';
import { requireProductionSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = requireProductionSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/*/admin', '/*/dashboard', '/*/auth', '/api/'],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
