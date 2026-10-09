import type { Metadata } from 'next';
import { AdminAudit } from '@/components/admin/admin-audit';
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
    title: `${messages.admin.activity.title} | AgriConnect`,
    description: messages.admin.activity.subtitle,
  };
}

export default function AdminActivityPage() {
  return <AdminAudit />;
}
