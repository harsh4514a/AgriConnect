import type { Metadata } from 'next';
import { AdminSettings } from '@/components/admin/admin-settings';
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
    title: `${messages.admin.settings.title} | AgriConnect`,
    description: messages.admin.settings.subtitle,
  };
}

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
