'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, Leaf } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { NotificationPanel } from '@/components/dashboard/notification-panel';
import { ProfileDropdown } from '@/components/dashboard/profile-dropdown';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { DASHBOARD_NAV } from '@/constants/dashboard.constants';
import type { DashboardNavItem } from '@/types/dashboard.types';
import { cn } from '@/utils/cn';

function isCurrentPath(pathname: string, locale: string, href: string) {
  const target = `/${locale}${href}`;
  return href === '/dashboard'
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
}

function NavigationMenu({
  label,
  items,
  locale,
  pathname,
}: {
  label: string;
  items: DashboardNavItem[];
  locale: string;
  pathname: string;
}) {
  const t = useTranslations();
  const active = items.some((item) => isCurrentPath(pathname, locale, item.href));

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            active ? 'bg-accent-soft text-accent-strong' : 'text-muted-foreground',
          )}
          aria-label={label}
        >
          {label}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 min-w-56 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-xl shadow-black/10"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const current = isCurrentPath(pathname, locale, item.href);
            return (
              <DropdownMenu.Item key={item.key} asChild>
                <Link
                  href={`/${locale}${item.href}`}
                  prefetch={false}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors focus:bg-surface-subtle',
                    current ? 'bg-accent-soft font-semibold text-accent-strong' : 'text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  {t(item.labelKey)}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function TopNavbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const marketItems = DASHBOARD_NAV.filter((item) => item.group === 'marketplace');
  const informationItems = DASHBOARD_NAV.filter((item) => item.group === 'information');
  const dashboardHref = `/${locale}/dashboard`;
  const transport = DASHBOARD_NAV.find((item) => item.key === 'transport');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 sm:px-6 xl:px-8">
        <Link
          href={dashboardHref}
          prefetch={false}
          className="inline-flex min-w-10 items-center gap-2.5 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={t('common.appName')}
        >
          <Image
            src="/logo.png"
            alt="AgriConnect"
            width={420}
            height={140}
            priority
            className="h-10 w-[126px] object-contain sm:h-11 sm:w-[144px]"
          />
        </Link>

        <nav
          className="ml-3 hidden min-w-0 items-center gap-1 lg:flex"
          aria-label={t('dashboard.menu.label')}
        >
          <Link
            href={dashboardHref}
            prefetch={false}
            aria-current={isCurrentPath(pathname, locale, '/dashboard') ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface-subtle',
              isCurrentPath(pathname, locale, '/dashboard')
                ? 'bg-accent-soft text-accent-strong'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Leaf className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.menu.dashboard')}
          </Link>
          <NavigationMenu
            label={t('dashboard.menu.groupMarketplace')}
            items={marketItems}
            locale={locale}
            pathname={pathname}
          />
          <NavigationMenu
            label={t('dashboard.menu.groupInformation')}
            items={informationItems}
            locale={locale}
            pathname={pathname}
          />
          {transport && (
            <Link
              href={`/${locale}${transport.href}`}
              prefetch={false}
              aria-current={isCurrentPath(pathname, locale, transport.href) ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface-subtle',
                isCurrentPath(pathname, locale, transport.href)
                  ? 'bg-accent-soft text-accent-strong'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(transport.labelKey)}
            </Link>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher compact />
          <NotificationPanel />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
