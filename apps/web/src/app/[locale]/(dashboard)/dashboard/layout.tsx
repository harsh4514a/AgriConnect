'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayoutShell } from '@/components/dashboard/layout-shell';
import { hasUsableSession } from '@/services/api/token';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    // Guard: guests cannot access the dashboard.
    useEffect(() => {
        if (!hasUsableSession()) {
            router.replace(`/${locale}/auth`);
        }
    }, [locale, router]);

    return (
        <DashboardLayoutShell>
            {children}
        </DashboardLayoutShell>
    );
}
