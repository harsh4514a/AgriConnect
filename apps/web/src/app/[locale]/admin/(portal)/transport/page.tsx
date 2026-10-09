import type { Metadata } from 'next';
import { AdminTransport } from '@/components/admin/admin-transport';
import { isLocale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : 'en';
  const messages = await loadLocaleMessages(resolvedLocale);
  const localizedMessages = messages as unknown as {
    api?: { transportManagement?: { title: string; subtitle: string } };
    adminBuyerRequirementsLegacy?: {
      transportManagement?: { title: string; subtitle: string };
    };
  };
  const transportMessages = resolvedLocale === 'hi'
    ? localizedMessages.api?.transportManagement
    : localizedMessages.adminBuyerRequirementsLegacy?.transportManagement;
  return {
    title: `${transportMessages?.title ?? messages.admin.nav.transport} | AgriConnect`,
    description: transportMessages?.subtitle ?? '',
  };
}

export default function AdminTransportPage() {
  return <AdminTransport />;
}
