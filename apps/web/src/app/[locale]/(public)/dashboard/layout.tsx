import type { Metadata } from 'next';
import { Navbar } from '@/components/home/navbar';
import { isLocale, type Locale } from '@/i18n/config';
import { ScopedIntlProvider } from '@/components/performance/scoped-intl-provider';
import { PUBLIC_DASHBOARD_MESSAGE_PATHS } from '@/i18n/message-scopes';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function PublicBrowseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = (isLocale(routeLocale) ? routeLocale : 'en') as Locale;
  return (
    <ScopedIntlProvider locale={locale} paths={PUBLIC_DASHBOARD_MESSAGE_PATHS}>
      <div className="min-h-dvh bg-canvas text-foreground">
        <Navbar variant="solid" showNotifications />
        <main
          id="page-content"
          className="mx-auto min-h-[calc(100dvh-4.5rem)] w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8"
        >
          {children}
        </main>
      </div>
    </ScopedIntlProvider>
  );
}
