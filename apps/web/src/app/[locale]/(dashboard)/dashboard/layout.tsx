'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayoutShell } from '@/components/dashboard/layout-shell';
import { hasUsableSession } from '@/services/api/token';
import { getDashboardNavItem } from '@/constants/dashboard.constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const locale = (params?.locale as string) || 'en';

    // Derive the page title from the current route so the top navbar reflects
    // the active section (e.g. "Marketplace" instead of always "Dashboard").
    const title = useMemo(() => {
        const segments = pathname.split('/').filter(Boolean); // ['en', 'dashboard', ...]
        const sectionKey = segments[2] ?? 'dashboard';
        const item = getDashboardNavItem(sectionKey as never);
        return item ? t(item.labelKey) : t('dashboard.menu.dashboard');
    }, [pathname, t]);

    // Guard: guests cannot access the dashboard.
    useEffect(() => {
        if (!hasUsableSession()) {
            router.replace(`/${locale}/auth`);
        }
    }, [locale, router]);

    return (
        <DashboardLayoutShell title={title}>
            {children}
        </DashboardLayoutShell>
    );
}
