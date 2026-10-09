'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { storeLocale } from '@/i18n/persist';
import { isLocale } from '@/i18n/config';

/**
 * Restores the user's locale without fighting the locale encoded in the URL.
 *
 * Admin routes are URL-authoritative: /en/admin, /gu/admin and /hi/admin
 * must always render in the locale shown in the route. Farmer-facing routes
 * retain the existing local/server preference behavior.
 */
export function LocaleRestorer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathLocale = pathname.split('/').filter(Boolean)[0];

  useEffect(() => {
    if (isLocale(pathLocale)) storeLocale(pathLocale);
  }, [pathLocale]);

  return <>{children}</>;
}
