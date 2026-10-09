'use client';

import { motion } from 'framer-motion';
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
        className="inline-block h-8 w-14 animate-pulse rounded-lg bg-white/10"
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
      accent: 'text-green-300',
      bg: 'bg-green-400/15',
    },
    {
      icon: ClipboardList,
      label: t('dashboard.stats.buyerRequests'),
      value: String(buyerRequirements.total ?? 0),
      loading: buyerRequirements.isLoading,
      error: Boolean(buyerRequirements.error),
      accent: 'text-amber-300',
      bg: 'bg-amber-400/15',
    },
    {
      icon: Globe,
      label: t('dashboard.stats.preferredLanguage'),
      value: languageLabel,
      loading: false,
      error: !user,
      accent: 'text-sky-300',
      bg: 'bg-sky-400/15',
    },
  ];

  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      aria-label={t('dashboard.stats.label')}
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: idx * 0.06,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}
            >
              <Icon className={`h-5 w-5 ${stat.accent}`} />
            </div>

            <div className="mt-4 text-2xl font-bold text-white">
              <StatValue
                loading={stat.loading}
                error={stat.error}
                value={stat.value}
              />
            </div>

            <p className="mt-1 text-sm text-white/50">{stat.label}</p>
          </motion.div>
        );
      })}
    </section>
  );
}
