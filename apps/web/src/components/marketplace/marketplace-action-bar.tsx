'use client';

import { ArrowDownWideNarrow, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

interface MarketplaceActionBarProps {
  onOpenFilters: () => void;
  onOpenSort: () => void;
  filterCount: number;
}

/** Compact marketplace controls for opening the filter and sort sheets. */
export function MarketplaceActionBar({
  onOpenFilters,
  onOpenSort,
  filterCount,
}: MarketplaceActionBarProps) {
  const t = useTranslations();
  const buttonClass =
    'inline-flex h-12 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition-colors active:scale-95 sm:px-4';

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          buttonClass,
          filterCount > 0
            ? 'border-accent/40 bg-accent-soft text-accent'
            : 'border-border bg-surface-subtle text-muted-foreground hover:text-foreground',
        )}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {t('dashboard.marketplaceBrowse.ux.filter')}
          {filterCount > 0 && <span className="ml-1">({filterCount})</span>}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenSort}
        className={cn(
          buttonClass,
          'border-border bg-surface-subtle text-muted-foreground hover:text-foreground',
        )}
      >
        <ArrowDownWideNarrow className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('dashboard.marketplaceBrowse.ux.sort')}</span>
      </button>
    </div>
  );
}
