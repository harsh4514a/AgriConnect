import type { Metadata } from 'next';
import { AdminMarketPrices } from '@/components/admin/admin-market-prices';
import { isLocale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : 'en';
  const messages = await loadLocaleMessages(resolvedLocale);

  return {
    title: `${messages.admin.marketPrices.title} | AgriConnect`,
    description: messages.admin.marketPrices.subtitle,
  };
}

export default function AdminMarketPricesPage() {
  return <AdminMarketPrices />;
}
