import type { Metadata } from 'next';
import { AdminUsers } from '@/components/admin/admin-users';
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
    title: `${messages.admin.users.title} | AgriConnect`,
    description: messages.admin.users.subtitle,
  };
}

export default function AdminUsersPage() {
  return <AdminUsers />;
}
