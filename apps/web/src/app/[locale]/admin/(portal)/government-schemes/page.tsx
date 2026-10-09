import type { Metadata } from 'next';
import { AdminGovernmentSchemes } from '@/components/admin/admin-government-schemes';
import { isLocale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const resolvedLocale = isLocale(locale) ? locale : 'en';
    const messages = await loadLocaleMessages(resolvedLocale);
    const m = messages.governmentSchemes?.admin;
    return {
        title: `${m?.title ?? 'Government Schemes'} | AgriConnect Admin`,
        description: m?.subtitle ?? 'Manage government schemes',
    };
}

export default function AdminGovernmentSchemesPage() {
    return <AdminGovernmentSchemes />;
}
