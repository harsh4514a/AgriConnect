import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { ScopedIntlProvider } from '@/components/performance/scoped-intl-provider';
import { PRIVATE_DASHBOARD_MESSAGE_PATHS } from '@/i18n/message-scopes';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PrivateDashboardGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = (isLocale(routeLocale) ? routeLocale : 'en') as Locale;
  return (
    <ScopedIntlProvider locale={locale} paths={PRIVATE_DASHBOARD_MESSAGE_PATHS}>
      {children}
    </ScopedIntlProvider>
  );
}
