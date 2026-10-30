'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
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
      prefetch={false}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      aria-label={t('dashboard.notifications.ariaLabel')}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />

      {unreadCount > 0 && (
        <span
          className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-surface bg-accent px-1 text-[9px] font-bold leading-none text-accent-foreground"
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
