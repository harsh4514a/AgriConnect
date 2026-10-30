'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import Image from 'next/image';
import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Activity,
  BookOpen,
  ChevronDown,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBasket,
  Settings,
  Truck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useSetLocale } from '@/i18n/locale-provider';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/utils/cn';

const groups = [
  {
    key: 'managementGroup',
    items: [
      { key: 'users', labelKey: 'nav.users', href: '/admin/users', icon: Users },
      { key: 'marketplace', labelKey: 'nav.marketplace', href: '/admin/marketplace', icon: ShoppingBasket },
      { key: 'buyerRequirements', labelKey: 'nav.buyerRequirements', href: '/admin/buyer-requirements', icon: FileText },
      { key: 'transport', labelKey: 'nav.transport', href: '/admin/transport', icon: Truck },
    ],
  },
  {
    key: 'contentGroup',
    items: [
      { key: 'cropGuide', labelKey: 'nav.cropGuide', href: '/admin/crop-guide', icon: BookOpen },
      { key: 'governmentSchemes', labelKey: 'nav.governmentSchemes', href: '/admin/government-schemes', icon: Landmark },
      { key: 'marketPrices', labelKey: 'nav.marketPrices', href: '/admin/market-prices', icon: TrendingUp },
    ],
  },
  {
    key: 'systemGroup',
    items: [
      { key: 'activity', labelKey: 'nav.activity', href: '/admin/activity', icon: Activity },
      { key: 'settings', labelKey: 'nav.settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

function isActive(pathname: string, locale: string, href: string) {
  const target = `/${locale}${href}`;
  return href === '/admin'
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
}

function AdminGroupMenu({
  group,
  locale,
  pathname,
  t,
}: {
  group: (typeof groups)[number];
  locale: string;
  pathname: string;
  t: ReturnType<typeof useTranslations<'admin'>>;
}) {
  const active = group.items.some((item) => isActive(pathname, locale, item.href));
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            active ? 'bg-accent-soft text-accent-strong' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`nav.${group.key}`)}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="start" sideOffset={8} className="z-50 min-w-56 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-xl shadow-black/10">
          {group.items.map((item) => {
            const Icon = item.icon;
            const current = isActive(pathname, locale, item.href);
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

export function AdminTopNavbar() {
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = (params?.locale as Locale) || 'en';
  const { admin, logout } = useAdminAuth();
  const setLocale = useSetLocale();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const locale = currentLocale;
  const dashboardHref = `/${locale}/admin`;
  const dashboardActive = isActive(pathname, locale, '/admin');

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;
    setLocale(newLocale);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigation = (
    <>
      <DropdownMenu.Item asChild>
        <Link
          href={dashboardHref}
          prefetch={false}
          aria-current={dashboardActive ? 'page' : undefined}
          className={cn(
            'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors focus:bg-surface-subtle',
            dashboardActive ? 'bg-accent-soft font-semibold text-accent-strong' : 'text-foreground',
          )}
        >
          <LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />
          {t('nav.dashboard')}
        </Link>
      </DropdownMenu.Item>
      {groups.map((group) => (
        <section key={group.key} className="py-1">
          <h2 className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
            {t(`nav.${group.key}`)}
          </h2>
          {group.items.map((item) => {
            const Icon = item.icon;
            const current = isActive(pathname, locale, item.href);
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
        </section>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 sm:px-6 xl:px-8">
        <Link href={dashboardHref} prefetch={false} className="inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Image
            src="/small_logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <span className="hidden sm:block">
            <span className="block text-sm font-bold tracking-tight text-foreground">{t('brand')}</span>
            <span className="block text-[11px] text-muted-foreground">{t('layout.topSubtitle')}</span>
          </span>
        </Link>

        <nav className="ml-4 hidden min-w-0 items-center gap-1 xl:flex" aria-label={t('nav.ariaLabel')}>
          <Link
            href={dashboardHref}
            prefetch={false}
            aria-current={dashboardActive ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-surface-subtle',
              dashboardActive ? 'bg-accent-soft text-accent-strong' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            {t('nav.dashboard')}
          </Link>
          {groups.map((group) => (
            <AdminGroupMenu key={group.key} group={group} locale={locale} pathname={pathname} t={t} />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-2.5 text-sm font-semibold text-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus xl:hidden" aria-label={t('nav.ariaLabel')}>
                <Menu className="h-4 w-4" aria-hidden="true" />
                <span>{t('nav.open')}</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={8} className="z-50 max-h-[min(75vh,38rem)] w-[min(92vw,22rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-2 text-foreground shadow-xl shadow-black/15">
                {navigation}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <label className="sr-only" htmlFor="admin-language">{t('layout.languageSelector')}</label>
          <select
            id="admin-language"
            value={currentLocale}
            onChange={(event) => handleLocaleChange(event.target.value as Locale)}
            className="h-10 max-w-[76px] cursor-pointer rounded-xl border border-border bg-surface px-2 text-xs font-semibold text-foreground sm:max-w-[112px] sm:px-3 sm:text-sm"
          >
            {locales.map((item) => (
              <option key={item} value={item}>{localeNames[item]}</option>
            ))}
          </select>

          <ThemeToggle />

          <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 xl:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block max-w-32 truncate text-xs font-bold text-foreground">{admin?.username || t('layout.defaultAdministrator')}</span>
              <span className="block text-[10px] font-medium text-muted-foreground">{admin?.isActive ? t('active') : t('disabled')}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-3"
            aria-label={isLoggingOut ? t('layout.loggingOut') : t('layout.logout')}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden pl-1.5 text-xs font-bold sm:inline">{isLoggingOut ? t('layout.loggingOut') : t('layout.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
