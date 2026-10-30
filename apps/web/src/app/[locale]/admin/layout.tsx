import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';
import { ScopedIntlProvider } from '@/components/performance/scoped-intl-provider';
import { ADMIN_MESSAGE_PATHS } from '@/i18n/message-scopes';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : 'en';
  const localeMessages = await loadLocaleMessages(resolvedLocale);

  return {
    title: `${localeMessages.admin.brand} | AgriConnect`,
    description: localeMessages.admin.layout.topSubtitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = isLocale(routeLocale) ? routeLocale : 'en';
  return (
    <ScopedIntlProvider locale={locale} paths={ADMIN_MESSAGE_PATHS}>
      {children}
    </ScopedIntlProvider>
  );
}
