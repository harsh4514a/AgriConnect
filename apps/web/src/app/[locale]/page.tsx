import type { Metadata } from 'next';
import { HomePage } from '@/components/home/home-page';
import { defaultLocale, isLocale, locales, type Locale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';
import { getSiteUrl } from '@/lib/site-url';

const homeSeo: Record<Locale, { title: string; description: string; ogLocale: string }> = {
  en: {
    title: 'Smart Agricultural Marketplace for Farmers',
    description:
      'Connect with buyers, browse crop listings, check agricultural market prices, and explore crop information and farmer schemes with AgriConnect.',
    ogLocale: 'en_IN',
  },
  gu: {
    title: 'ખેડૂતો માટે સ્માર્ટ કૃષિ બજાર',
    description:
      'ખરીદદારો સાથે જોડાઓ, પાકની યાદીઓ જુઓ, કૃષિ બજાર ભાવ તપાસો અને એગ્રીકનેક્ટ પર પાકની માહિતી તથા ખેડૂત યોજનાઓ શોધો.',
    ogLocale: 'gu_IN',
  },
  hi: {
    title: 'किसानों के लिए स्मार्ट कृषि बाज़ार',
    description:
      'खरीदारों से जुड़ें, फसल लिस्टिंग देखें, कृषि मंडी भाव जानें और एग्रीकनेक्ट पर फसल जानकारी व किसान योजनाएँ खोजें।',
    ogLocale: 'hi_IN',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale: Locale = isLocale(routeLocale) ? routeLocale : defaultLocale;
  const seo = homeSeo[locale];
  const siteUrl = getSiteUrl();
  const canonical = siteUrl ? new URL(`/${locale}`, siteUrl) : undefined;
  const languageAlternates = siteUrl
    ? Object.fromEntries([
        ...locales.map((supportedLocale) => [
          supportedLocale,
          new URL(`/${supportedLocale}`, siteUrl).toString(),
        ]),
        ['x-default', new URL('/en', siteUrl).toString()],
      ])
    : undefined;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      ...(canonical ? { canonical: canonical.toString() } : {}),
      ...(languageAlternates ? { languages: languageAlternates } : {}),
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: 'AgriConnect',
      title: seo.title,
      description: seo.description,
      locale: seo.ogLocale,
      alternateLocale: locales
        .filter((supportedLocale) => supportedLocale !== locale)
        .map((supportedLocale) => homeSeo[supportedLocale].ogLocale),
      ...(canonical ? { url: canonical.toString() } : {}),
    },
    twitter: {
      card: 'summary',
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale: Locale = isLocale(routeLocale) ? routeLocale : defaultLocale;
  const messages = await loadLocaleMessages(locale);
  const siteUrl = getSiteUrl();
  const websiteSchema = siteUrl
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'AgriConnect',
        url: new URL(`/${locale}`, siteUrl).toString(),
        description: homeSeo[locale].description,
        inLanguage: { en: 'en-IN', gu: 'gu-IN', hi: 'hi-IN' }[locale],
      }
    : null;

  return (
    <>
      {websiteSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c'),
          }}
        />
      ) : null}
      <HomePage locale={locale} copy={messages.landingPage} />
    </>
  );
}
