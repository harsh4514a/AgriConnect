'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { hasUsableSession } from '@/services/api/token';

/**
 * Redirects already-authenticated users away from the public landing page to
 * their dashboard. This keeps the marketing site public for guests while
 * sending signed-in farmers straight into the app.
 */
export function AuthenticatedRedirect() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    useEffect(() => {
        if (hasUsableSession()) {
            router.replace(`/${locale}/dashboard`);
        }
    }, [locale, router]);

    return null;
}
