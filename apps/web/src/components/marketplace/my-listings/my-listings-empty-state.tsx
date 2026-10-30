'use client';

import { motion } from 'framer-motion';
import { PackageOpen, Plus, FilterX } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MyListingsEmptyStateProps {
  statusFilter?: string;
  onClearFilter?: () => void;
}

export function MyListingsEmptyState({
  statusFilter = 'all',
  onClearFilter,
}: MyListingsEmptyStateProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const isFiltered = statusFilter !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[45vh] flex-col items-center justify-center rounded-3xl border border-border bg-surface-subtle p-8 text-center backdrop-blur-xl"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-subtle text-accent">
        {isFiltered ? (
          <FilterX className="h-10 w-10" />
        ) : (
          <PackageOpen className="h-10 w-10" />
        )}
      </div>

      <h3 className="mt-5 text-xl font-bold text-foreground">
        {isFiltered
          ? t('dashboard.myListings.empty.noFilterTitle', {
              status: t(`dashboard.myListings.status.${statusFilter}`),
            })
          : t('dashboard.myListings.empty.title')}
      </h3>

      <p className="mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground">
        {isFiltered
          ? t('dashboard.myListings.empty.noFilterDesc')
          : t('dashboard.myListings.empty.desc')}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isFiltered && onClearFilter && (
          <button
            type="button"
            onClick={onClearFilter}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface-subtle px-5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
          >
            Show All Listings
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/marketplace/create`)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-xs font-bold text-accent-foreground shadow-sm transition-all hover:bg-accent-strong active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{t('dashboard.myListings.empty.cta')}</span>
        </button>
      </div>
    </motion.div>
  );
}
