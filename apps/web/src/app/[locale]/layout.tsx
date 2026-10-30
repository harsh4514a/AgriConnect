import { Suspense } from 'react';
import type { Metadata } from 'next';

import { notFound } from 'next/navigation';
import '@/styles/globals.css';

import { LocaleProvider } from '@/i18n/locale-provider';
import { LocaleRestorer } from '@/components/auth/locale-restorer';
import { defaultLocale, isLocale, locales, type Locale } from '@/i18n/config';
import { loadScopedLocaleMessages } from '@/i18n/server-messages';
import { ROOT_MESSAGE_PATHS } from '@/i18n/message-scopes';
import { getSiteUrl } from '@/lib/site-url';
import { RouteProgressBar } from '@/components/ui/route-progress-bar';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { AppToaster } from '@/components/ui/app-toaster';

const themeInitScript = `(() => {
  const root = document.documentElement;
  let storedTheme = null;
  try { storedTheme = localStorage.getItem('agriconnect_theme'); } catch {}
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : systemTheme;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`;

// Older sessions may predate the middleware's routing hint cookie. Check their
// existing localStorage tokens in the document head, before the landing page
// body can paint, and route them to the same locale's dashboard.
const legacySessionRouteScript = `(() => {
  const match = window.location.pathname.match(/^\\/(en|hi|gu)\\/?$/);
  if (!match) return;
  const valid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch { return false; }
  };
  try {
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    if ((access && valid(access)) || (refresh && valid(refresh))) {
      window.location.replace('/' + match[1] + '/dashboard');
    }
  } catch {}
})();`;

const siteNames: Record<Locale, string> = {
    en: 'AgriConnect',
    gu: 'એગ્રીકનેક્ટ',
    hi: 'एग्रीकनेक्ट',
};

const siteDescriptions: Record<Locale, string> = {
    en: 'AgriConnect helps farmers and buyers connect through crop listings, agricultural market prices, crop guides, and farmer schemes.',
    gu: 'એગ્રીકનેક્ટ ખેડૂતો અને ખરીદદારોને પાકની યાદીઓ, કૃષિ બજાર ભાવ, પાક માર્ગદર્શિકા અને ખેડૂત યોજનાઓ સાથે જોડે છે.',
    hi: 'एग्रीकनेक्ट किसानों और खरीदारों को फसल लिस्टिंग, कृषि मंडी भाव, फसल मार्गदर्शिका और किसान योजनाओं से जोड़ता है।',
};

/** The localized UI is static; personal data is fetched from protected APIs in the browser. */
export function generateStaticParams(): Array<{ locale: Locale }> {
    return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: routeLocale } = await params;
    const locale: Locale = isLocale(routeLocale) ? routeLocale : defaultLocale;
    const siteUrl = getSiteUrl();
    const verification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

    return {
        metadataBase: siteUrl ?? undefined,
        title: {
            default: `${siteNames[locale]} — ${siteDescriptions[locale].split('.')[0]}`,
            template: '%s | AgriConnect',
        },
        description: siteDescriptions[locale],
        applicationName: 'AgriConnect',
        icons: { icon: '/favicon.ico' },
        ...(verification ? { verification: { google: verification } } : {}),
    };
}

export default async function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    const resolvedLocale: Locale = isLocale(locale) ? locale : defaultLocale;
    if (locale !== resolvedLocale) notFound();
    const localeMessages = await loadScopedLocaleMessages(resolvedLocale, ROOT_MESSAGE_PATHS);

    return (
        <html lang={resolvedLocale} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                <script dangerouslySetInnerHTML={{ __html: legacySessionRouteScript }} />
            </head>
            <body>
                <ThemeProvider>
                    <Suspense fallback={null}>
                        <RouteProgressBar />
                    </Suspense>
                    <LocaleProvider
                        initialLocale={resolvedLocale}
                        initialMessages={localeMessages}
                    >
                        <LocaleRestorer>{children}</LocaleRestorer>
                    </LocaleProvider>
                    <AppToaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
