import type { Metadata } from 'next';
import { AdminOverview } from '@/components/admin/admin-overview';
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
    title: `${messages.admin.dashboard.title} | AgriConnect`,
    description: messages.admin.dashboard.subtitle.replace(
      '{username}',
      messages.admin.layout.defaultAdministrator,
    ),
  };
}

export default function AdminDashboardPage() {
  return <AdminOverview />;
}
