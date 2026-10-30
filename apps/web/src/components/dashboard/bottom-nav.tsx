'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, Ellipsis, Home, Package, Plus, Store } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DASHBOARD_NAV, DASHBOARD_NAV_GROUPS } from '@/constants/dashboard.constants';
import { cn } from '@/utils/cn';

const primaryItems = [
  { key: 'home', labelKey: 'dashboard.mobile.bottomNav.home', href: '/dashboard', icon: Home },
  { key: 'marketplace', labelKey: 'dashboard.mobile.bottomNav.marketplace', href: '/dashboard/marketplace', icon: Store },
  { key: 'listings', labelKey: 'dashboard.mobile.bottomNav.listings', href: '/dashboard/my-listings', icon: Package },
];
const moreLabelFallback: Record<string, string> = {
  en: 'More',
  hi: 'और',
  gu: 'વધુ',
};

function isActive(pathname: string, locale: string, href: string) {
  const target = `/${locale}${href}`;
  return href === '/dashboard'
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
}

export function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const sellHref = `/${locale}/dashboard/marketplace/create`;
  const moreLabelKey = 'dashboard.mobile.bottomNav.more';
  const moreLabel = t.has(moreLabelKey) ? t(moreLabelKey) : moreLabelFallback[locale] || moreLabelFallback.en;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface lg:hidden"
      aria-label={t('dashboard.mobile.bottomNav.label')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid h-[68px] max-w-xl grid-cols-5 items-center px-2">
        <Link
          href={`/${locale}/dashboard`}
          prefetch={false}
          aria-current={isActive(pathname, locale, '/dashboard') ? 'page' : undefined}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            isActive(pathname, locale, '/dashboard') ? 'text-accent-strong' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Home className="h-[18px] w-[18px]" aria-hidden="true" />
          <span>{t(primaryItems[0].labelKey)}</span>
        </Link>

        <Link
          href={`/${locale}/dashboard/marketplace`}
          prefetch={false}
          aria-current={isActive(pathname, locale, '/dashboard/marketplace') ? 'page' : undefined}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            isActive(pathname, locale, '/dashboard/marketplace') ? 'text-accent-strong' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Store className="h-[18px] w-[18px]" aria-hidden="true" />
          <span>{t(primaryItems[1].labelKey)}</span>
        </Link>

        <Link
          href={sellHref}
          prefetch={false}
          aria-current={isActive(pathname, locale, '/dashboard/marketplace/create') ? 'page' : undefined}
          className="mx-auto flex min-h-12 min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>{t('dashboard.mobile.bottomNav.sell')}</span>
        </Link>

        <Link
          href={`/${locale}/dashboard/my-listings`}
          prefetch={false}
          aria-current={isActive(pathname, locale, '/dashboard/my-listings') ? 'page' : undefined}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            isActive(pathname, locale, '/dashboard/my-listings') ? 'text-accent-strong' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Package className="h-[18px] w-[18px]" aria-hidden="true" />
          <span>{t(primaryItems[2].labelKey)}</span>
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-label={moreLabel}
            >
              <Ellipsis className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>{moreLabel}</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="end"
              sideOffset={10}
              className="z-50 max-h-[min(70vh,34rem)] w-[min(92vw,22rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-2 text-foreground shadow-xl shadow-black/15"
              aria-label={t('dashboard.menu.label')}
            >
              {DASHBOARD_NAV_GROUPS.map((group) => {
                const items = DASHBOARD_NAV.filter((item) => item.group === group.key);
                if (!items.length) return null;

                return (
                  <section key={group.key} className="py-1">
                    <h2 className="px-3 pb-1.5 pt-2 text-xs font-semibold text-muted-foreground">
                      {t(group.labelKey)}
                    </h2>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const current = isActive(pathname, locale, item.href);
                      return (
                        <DropdownMenu.Item key={item.key} asChild>
                          <Link
                            href={`/${locale}${item.href}`}
                            prefetch={false}
                            aria-current={current ? 'page' : undefined}
                            className={cn(
                              'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm outline-none transition-colors focus:bg-surface-subtle',
                              current ? 'bg-accent-soft font-semibold text-accent-strong' : 'text-foreground',
                            )}
                          >
                            <Icon className="h-[18px] w-[18px] text-accent" aria-hidden="true" />
                            {t(item.labelKey)}
                            {current && <ChevronDown className="ml-auto h-4 w-4 rotate-[-90deg]" aria-hidden="true" />}
                          </Link>
                        </DropdownMenu.Item>
                      );
                    })}
                  </section>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
}
