'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  FileText,
  Landmark,
  RefreshCw,
  ShoppingBasket,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { getCachedAdminProfile } from '@/services/admin-api/admin-token';
import { adminGetDashboardOverviewApi } from '@/services/admin-api/admin-dashboard.api';
import type {
  AdminDashboardResponse,
  AdminRecentActivity,
} from '@/services/admin-api/admin-dashboard.api';
import type { Locale } from '@/i18n/config';

const METRIC_CONFIG = [
  { key: 'totalUsers', icon: Users, tone: 'emerald' },
  { key: 'activeListings', icon: ShoppingBasket, tone: 'olive' },
  { key: 'activeBuyerRequirements', icon: FileText, tone: 'amber' },
  { key: 'activeTransportListings', icon: Truck, tone: 'blue' },
  { key: 'publishedGovernmentSchemes', icon: Landmark, tone: 'teal' },
  { key: 'publishedCropGuides', icon: BookOpen, tone: 'violet' },
  { key: 'marketPriceRecords', icon: TrendingUp, tone: 'green' },
] as const;

const ACTIVITY_ICONS = {
  user: Users,
  listing: ShoppingBasket,
  buyerRequirement: FileText,
  transport: Truck,
  governmentScheme: Landmark,
  cropGuide: BookOpen,
} as const;

const QUICK_ACTIONS: ReadonlyArray<{
  key: string;
  icon: LucideIcon;
  href?: string;
}> = [
  { key: 'users', icon: Users, href: '/admin/users' },
  { key: 'marketplace', icon: ShoppingBasket, href: '/admin/marketplace' },
  { key: 'buyerRequirements', icon: FileText, href: '/admin/buyer-requirements' },
  { key: 'transport', icon: Truck, href: '/admin/transport' },
  { key: 'cropGuide', icon: BookOpen, href: '/admin/crop-guide' },
  { key: 'governmentSchemes', icon: Landmark, href: '/admin/government-schemes' },
  { key: 'marketPrices', icon: TrendingUp },
];

const TONE_CLASSES = {
  emerald: 'bg-accent-soft text-accent ring-focus',
  olive: 'bg-lime-50 text-lime-700 ring-lime-100',
  amber: 'bg-warning/10 text-warning ring-amber-100',
  blue: 'bg-sky-50 text-sky-700 ring-sky-100',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  green: 'bg-green-50 text-accent ring-focus',
} as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-36 animate-pulse rounded-3xl border border-border/70 bg-surface-subtle" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-border/70 bg-surface-subtle"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="h-[430px] animate-pulse rounded-2xl border border-border/70 bg-surface-subtle" />
        <div className="h-[430px] animate-pulse rounded-2xl border border-border/70 bg-surface-subtle" />
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: AdminRecentActivity }) {
  const t = useTranslations('admin');
  const params = useParams();
  const locale = ((params?.locale as Locale) || 'en') as Locale;
  const Icon = ACTIVITY_ICONS[activity.type];

  const timestamp = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(activity.createdAt)),
    [activity.createdAt, locale],
  );

  return (
    <li className="relative flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <div className="absolute bottom-0 left-[17px] top-12 w-px bg-surface-subtle last:hidden" aria-hidden="true" />
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-accent-soft text-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="truncate text-sm font-semibold text-foreground">
          {activity.title || t(`dashboard.activity.${activity.type}Fallback`)}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {t(`dashboard.activity.${activity.type}`)}
          {activity.detail ? `· ${activity.detail}` : ''}
        </p>
      </div>
      <time
        className="hidden shrink-0 pt-1 text-[11px] font-medium text-muted-foreground sm:block"
        dateTime={activity.createdAt}
      >
        {timestamp}
      </time>
    </li>
  );
}

export function AdminOverview() {
  const t = useTranslations('admin');
  const params = useParams();
  const locale = (params?.locale as Locale) || 'en';
  const [admin] = useState(() => getCachedAdminProfile());
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError(false);
    setIsLoading(true);

    try {
      const response = await adminGetDashboardOverviewApi();
      setData(response);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border-strong bg-[var(--hero)] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.12)] sm:p-7">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--hero-muted)]">
              {t('dashboard.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--hero-foreground)] sm:text-[30px]">
              {t('dashboard.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--hero-muted)]">
              {t('dashboard.subtitle', {
                username: admin?.username || t('layout.defaultAdministrator'),
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground shadow-sm transition hover:bg-surface-subtle"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.refresh')}
          </button>
        </div>
      </section>

      {error ? (
        <section
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">{t('dashboard.errorTitle')}</p>
                <p className="mt-1 text-sm text-danger">{t('dashboard.loadError')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-surface px-4 text-sm font-bold text-danger hover:bg-danger-soft"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.retry')}
            </button>
          </div>
        </section>
      ) : null}

      {!error && data ? (
        <>
          <section aria-labelledby="admin-kpi-heading">
            <div className="mb-3 flex items-center justify-between gap-4 px-1">
              <h2 id="admin-kpi-heading" className="text-base font-bold text-foreground">
                {t('dashboard.overviewHeading')}
              </h2>
              <span className="hidden rounded-full border border-emerald-100 bg-accent-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent sm:inline-flex">
                {t('dashboard.liveData')}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {METRIC_CONFIG.map(({ key, icon: Icon, tone }) => (
                <article
                  key={key}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] transition duration-150 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_16px_35px_rgba(15,76,45,0.07)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TONE_CLASSES[tone]}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {t('dashboard.database')}
                    </span>
                  </div>
                  <p className="mt-6 text-[28px] font-bold tracking-tight text-foreground">
                    {data.metrics[key].toLocaleString(locale)}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">
                    {t(`dashboard.metrics.${key}`)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
            <section
              aria-labelledby="recent-activity-heading"
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 id="recent-activity-heading" className="text-base font-bold text-foreground">
                    {t('dashboard.recentActivityTitle')}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('dashboard.recentActivitySubtitle')}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-muted-foreground">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-5">
                {data.recentActivity.length > 0 ? (
                  <ul aria-label={t('dashboard.recentActivityTitle')}>
                    {data.recentActivity.map((activity) => (
                      <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} />
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface-subtle/70 p-10 text-center">
                    <Activity className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {t('dashboard.noRecentActivity')}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              aria-labelledby="quick-actions-heading"
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-6"
            >
              <div>
                <h2 id="quick-actions-heading" className="text-base font-bold text-foreground">
                  {t('dashboard.quickActionsTitle')}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t('dashboard.quickActionsSubtitle')}
                </p>
              </div>

              <div className="mt-5 space-y-2">
                {QUICK_ACTIONS.map(({ key, icon: Icon, href }) => {
                  const content = (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground shadow-sm">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span className="truncate text-sm font-semibold text-foreground">
                          {t(`nav.${key}`)}
                        </span>
                      </div>
                      {href ? (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {t('nav.comingSoon')}
                        </span>
                      )}
                    </>
                  );

                  if (href) {
                    return (
                      <Link
                        key={key}
                        href={`/${locale}${href}`}
                        prefetch={false}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border/80 bg-[var(--surface)] px-3.5 py-2.5 transition hover:border-accent/30 hover:bg-accent-soft/40 hover:shadow-sm"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className="flex min-h-12 cursor-default items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-subtle/70 px-3.5 py-2.5"
                      aria-disabled="true"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
