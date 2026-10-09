'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  LayoutDashboard,
  Settings,
  ShoppingBasket,
  Shield,
  Truck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  key: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  href?: string;
  isAvailable: boolean;
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupKey: 'nav.overviewGroup',
    items: [
      { key: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, href: '/admin', isAvailable: true },
    ],
  },
  {
    groupKey: 'nav.managementGroup',
    items: [
      { key: 'users', labelKey: 'nav.users', icon: Users, href: '/admin/users', isAvailable: true },
      { key: 'marketplace', labelKey: 'nav.marketplace', icon: ShoppingBasket, href: '/admin/marketplace', isAvailable: true },
      { key: 'buyerRequirements', labelKey: 'nav.buyerRequirements', icon: FileText, href: '/admin/buyer-requirements', isAvailable: true },
      { key: 'transport', labelKey: 'nav.transport', icon: Truck, href: '/admin/transport', isAvailable: true },
    ],
  },
  {
    groupKey: 'nav.contentGroup',
    items: [
      { key: 'cropGuide', labelKey: 'nav.cropGuide', icon: BookOpen, href: '/admin/crop-guide', isAvailable: true },
      { key: 'governmentSchemes', labelKey: 'nav.governmentSchemes', icon: Landmark, href: '/admin/government-schemes', isAvailable: true },
      { key: 'marketPrices', labelKey: 'nav.marketPrices', icon: TrendingUp, href: '/admin/market-prices', isAvailable: true },
    ],
  },
  {
    groupKey: 'nav.systemGroup',
    items: [
      { key: 'activity', labelKey: 'nav.activity', icon: Activity, href: '/admin/activity', isAvailable: true },
      { key: 'settings', labelKey: 'nav.settings', icon: Settings, href: '/admin/settings', isAvailable: true },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const isActive = (href?: string) => {
    if (!href) return false;
    const target = `/${locale}${href}`;
    return href === '/admin'
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#123b2b] text-[#e7efe9]">
      <div
        className={cn(
          'flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-4',
          collapsed && 'lg:justify-center lg:px-2',
        )}
      >
        <Link
          href={`/${locale}/admin`}
          className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none"
          title={t('brand')}
          onClick={onMobileClose}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f7a58] text-white shadow-sm shadow-emerald-950/10">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight text-white">
                {t('brand')}
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                {t('portal')}
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-lg p-1.5 text-emerald-100/70 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label={t('layout.closeSidebar')}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6" aria-label={t('nav.ariaLabel')}>
        {NAV_GROUPS.map((group) => (
          <div key={group.groupKey} className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/70">
                {t(group.groupKey)}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              if (item.isAvailable && item.href) {
                return (
                  <Link
                    key={item.key}
                    href={`/${locale}${item.href}`}
                    onClick={onMobileClose}
                    className={cn(
                      'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                      active
                        ? 'bg-emerald-100/80 text-[#0b5a3a] shadow-sm ring-1 ring-inset ring-emerald-200/80'
                        : 'text-emerald-50/85 hover:bg-white/10 hover:text-white',
                      collapsed && 'lg:justify-center lg:px-2',
                    )}
                    title={collapsed ? t(item.labelKey) : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#2f7a58]" aria-hidden="true" />
                    ) : null}
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        active ? 'text-emerald-200' : 'text-emerald-100/70 group-hover:text-slate-600',
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  </Link>
                );
              }

              return (
                <div
                  key={item.key}
                  className={cn(
                    'flex min-h-11 cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-100/70',
                    collapsed && 'lg:justify-center lg:px-2',
                  )}
                  title={`${t(item.labelKey)} (${t('nav.comingSoon')})`}
                  aria-disabled="true"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-[18px] w-[18px] shrink-0 text-emerald-100/45" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  </div>
                  {!collapsed && (
                    <span className="ml-2 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-emerald-100/70">
                      {t('nav.comingSoon')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-white/10 p-3 lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-white/10 hover:text-emerald-100"
          aria-label={collapsed ? t('layout.expand') : t('layout.collapse')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>{t('layout.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-white/10 transition-[width] duration-200 lg:flex lg:flex-col',
          collapsed ? 'lg:w-20' : 'lg:w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
            onClick={onMobileClose}
            aria-label={t('layout.closeSidebar')}
          />
          <div className="relative flex w-72 max-w-[88vw] flex-col border-r border-white/10 bg-[#123b2b] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
