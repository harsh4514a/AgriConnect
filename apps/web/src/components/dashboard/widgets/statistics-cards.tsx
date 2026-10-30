'use client';

import { Package, ClipboardList, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DashboardUser } from '@/types/dashboard.types';
import type { DashboardDataState } from '@/hooks/use-dashboard-data';
import { useLocale } from '@/i18n/locale-provider';
import { localeNames } from '@/i18n/config';
import type { BuyerRequirement } from '@/services/api/buyer-requirements.api';

interface StatisticsCardsProps {
  user: DashboardUser | null;
  activeListingsCount: DashboardDataState<number>;
  buyerRequirements: DashboardDataState<BuyerRequirement[]>;
}

function StatValue({
  loading,
  error,
  value,
}: {
  loading: boolean;
  error: boolean;
  value: string | number;
}) {
  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-7 w-14 animate-pulse rounded-md bg-surface-subtle"
      />
    );
  }

  if (error) {
    return <span>—</span>;
  }

  return <span>{value}</span>;
}

export function StatisticsCards({
  user,
  activeListingsCount,
  buyerRequirements,
}: StatisticsCardsProps) {
  const t = useTranslations();
  const appLocale = useLocale();

  const languageLabel = localeNames[appLocale];

  const stats = [
    {
      icon: Package,
      label: t('dashboard.stats.activeListings'),
      value: String(activeListingsCount.data),
      loading: activeListingsCount.isLoading,
      error: Boolean(activeListingsCount.error),
      accent: 'text-accent',
      bg: 'bg-accent-soft',
    },
    {
      icon: ClipboardList,
      label: t('dashboard.stats.buyerRequests'),
      value: String(buyerRequirements.total ?? 0),
      loading: buyerRequirements.isLoading,
      error: Boolean(buyerRequirements.error),
      accent: 'text-warning',
      bg: 'bg-surface-subtle',
    },
    {
      icon: Globe,
      label: t('dashboard.stats.preferredLanguage'),
      value: languageLabel,
      loading: false,
      error: !user,
      accent: 'text-accent',
      bg: 'bg-accent-soft',
    },
  ];

  return (
    <section
      className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface"
      aria-label={t('dashboard.stats.label')}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="flex min-w-0 flex-col items-start gap-1.5 px-2.5 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-4 lg:px-5"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${stat.bg}`}
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.accent}`} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <div className="break-words text-base font-semibold leading-tight text-foreground sm:text-xl">
                <StatValue
                  loading={stat.loading}
                  error={stat.error}
                  value={stat.value}
                />
              </div>
              <p className="mt-0.5 break-words text-[10px] leading-tight text-muted-foreground sm:text-xs">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
