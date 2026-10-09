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
      className="flex min-h-[45vh] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-green-300">
        {isFiltered ? (
          <FilterX className="h-10 w-10" />
        ) : (
          <PackageOpen className="h-10 w-10" />
        )}
      </div>

      <h3 className="mt-5 text-xl font-bold text-white">
        {isFiltered
          ? t('dashboard.myListings.empty.noFilterTitle', {
              status: t(`dashboard.myListings.status.${statusFilter}`),
            })
          : t('dashboard.myListings.empty.title')}
      </h3>

      <p className="mt-2 max-w-sm text-xs sm:text-sm text-white/60">
        {isFiltered
          ? t('dashboard.myListings.empty.noFilterDesc')
          : t('dashboard.myListings.empty.desc')}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isFiltered && onClearFilter && (
          <button
            type="button"
            onClick={onClearFilter}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Show All Listings
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/marketplace/create`)}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-6 text-xs font-bold text-white transition-all shadow-lg active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
            boxShadow: '0 4px 14px rgba(46,125,50,0.4)',
          }}
        >
          <Plus className="h-4 w-4" />
          <span>{t('dashboard.myListings.empty.cta')}</span>
        </button>
      </div>
    </motion.div>
  );
}
