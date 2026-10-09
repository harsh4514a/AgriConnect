import type { Metadata } from 'next';
import { AdminMarketplace } from '@/components/admin/admin-marketplace';
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
    title: `${messages.admin.marketplace.title} | AgriConnect`,
    description: messages.admin.marketplace.subtitle,
  };
}

export default function AdminMarketplacePage() {
  return <AdminMarketplace />;
}
