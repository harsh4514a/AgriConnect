import type { Metadata } from 'next';
import { AdminBuyerRequirements } from '@/components/admin/admin-buyer-requirements';
import { isLocale } from '@/i18n/config';
import { loadLocaleMessages } from '@/i18n/server-messages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const resolvedLocale = isLocale(locale) ? locale : 'en';
    const messages = await loadLocaleMessages(resolvedLocale);
    return {
        title: `${messages.admin.buyerRequirements.title} | AgriConnect`,
        description: messages.admin.buyerRequirements.subtitle,
    };
}

export default function AdminBuyerRequirementsPage() {
    return <AdminBuyerRequirements />;
}
