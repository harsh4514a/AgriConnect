'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

interface MarketplaceEmptyStateProps {
  onReset: () => void;
  onBrowseAll: () => void;
  /** When true, shows the Nearby-specific empty state with a "Show All Listings" action. */
  variant?: 'default' | 'nearby';
}

/**
 * Empty state shown when no crops match the current search/filters.
 * Two variants:
 *  - default: "No crops found" with Clear Filters (primary) + Browse All (secondary).
 *  - nearby: "No nearby crops found." with Show All Listings (primary) that
 *    disables the Nearby quick filter.
 */
export function MarketplaceEmptyState({
  onReset,
  onBrowseAll,
  variant = 'default',
}: MarketplaceEmptyStateProps) {
  const t = useTranslations();
  const isNearby = variant === 'nearby';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface-subtle px-6 py-16 text-center backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 220 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-subtle text-4xl"
        aria-hidden="true"
      >
        {isNearby ? <MapPin className="h-8 w-8 text-accent" /> : '🌾'}
      </motion.div>

      <h3 className="mt-6 text-xl font-bold text-foreground">
        {isNearby
          ? t('dashboard.marketplaceBrowse.ux.nearbyNoResultsTitle')
          : t('dashboard.marketplaceBrowse.ux.noCropsTitle')}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {isNearby
          ? t('dashboard.marketplaceBrowse.ux.nearbyNoResultsSubtitle')
          : t('dashboard.marketplaceBrowse.ux.noCropsSubtitle')}
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2 sm:flex-row">
        {isNearby ? (
          <button
            onClick={onBrowseAll}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-lg active:scale-95"
          >
            {t('dashboard.marketplaceBrowse.ux.showAllListings')}
          </button>
        ) : (
          <>
            <button
              onClick={onReset}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-lg active:scale-95"
            >
              {t('dashboard.marketplaceBrowse.ux.clearFilters')}
            </button>
            <button
              onClick={onBrowseAll}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border bg-surface-subtle px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-surface-subtle hover:text-foreground active:scale-95"
            >
              {t('dashboard.marketplaceBrowse.ux.browseAll')}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
