import { Suspense } from 'react';
import type { Metadata } from 'next';

import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';

import '@/styles/globals.css';

import { LocaleProvider } from '@/i18n/locale-provider';
import { LocaleRestorer } from '@/components/auth/locale-restorer';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';
import { getSiteUrl } from '@/lib/site-url';
import { RouteProgressBar } from '@/components/ui/route-progress-bar';

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
    const localeMessages = await loadLocaleMessages(resolvedLocale);

    return (
        <html lang={resolvedLocale}>
            <body>
                <Suspense fallback={null}>
                    <RouteProgressBar />
                </Suspense>
                <LocaleProvider
                    initialLocale={resolvedLocale}
                    initialMessages={localeMessages}
                >
                    <LocaleRestorer>
                        {children}
                    </LocaleRestorer>
                    <Toaster
                        position="top-right"
                        richColors
                        closeButton
                        toastOptions={{
                            duration: 4000,
                        }}
                    />
                </LocaleProvider>
            </body>
        </html>
    );
}
