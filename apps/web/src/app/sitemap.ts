import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { requireProductionSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = requireProductionSiteUrl();
  const languageAlternates = Object.fromEntries([
    ...locales.map((locale) => [locale, new URL(`/${locale}`, siteUrl).toString()]),
    ['x-default', new URL('/en', siteUrl).toString()],
  ]);

  return locales.map((locale) => ({
    url: new URL(`/${locale}`, siteUrl).toString(),
    alternates: { languages: languageAlternates },
  }));
}
