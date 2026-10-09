import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';

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

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
