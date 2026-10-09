'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getUnreadNotificationCount } from '@/services/api/notifications.api';
import { hasUsableSession } from '@/services/api/token';

export function NotificationPanel() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      if (
        !hasUsableSession() ||
        pathname.endsWith('/dashboard/notifications')
      ) {
        return;
      }

      try {
        const count = await getUnreadNotificationCount();

        if (!cancelled) {
          setUnreadCount(count);
        }
      } catch {
        // The notification bell remains usable even when the count request fails.
      }
    };

    void loadCount();

    const handleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;

      if (typeof detail?.unreadCount === 'number') {
        setUnreadCount(detail.unreadCount);
        return;
      }

      void loadCount();
    };

    window.addEventListener(
      'agri:notifications-updated',
      handleUpdated,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        'agri:notifications-updated',
        handleUpdated,
      );
    };
  }, [pathname]);

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Link
      href={`/${locale}/dashboard/notifications`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={t('dashboard.notifications.ariaLabel')}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />

      {unreadCount > 0 && (
        <span
          className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-green-950 bg-emerald-400 px-1 text-[9px] font-black leading-none text-green-950"
          aria-label={t('dashboard.notifications.unreadCount', {
            count: unreadCount,
          })}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}