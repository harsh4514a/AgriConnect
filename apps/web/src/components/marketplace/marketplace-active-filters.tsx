'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Search, IndianRupee } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CropKey } from '@/data/marketplace-listings';
import { cn } from '@/utils/cn';

interface ActiveFilterChip {
  key: string;
  label: string;
  icon?: 'pin' | 'search' | 'price' | 'crop';
}

interface MarketplaceActiveFiltersProps {
  /** The active quick chip (crop or 'all'). */
  selectedChip: CropKey | 'all';
  /** The active district filter (or 'all'). */
  district: string | 'all';
  /** The active price range key (or 'all'). */
  priceRange: string | 'all';
  /** The active search query. */
  search: string;
  /** Whether "Near Me" is enabled. */
  nearMe: boolean;
  /** Clear a specific filter by key. */
  onRemove: (key: string) => void;
  /** Clear all filters. */
  onClearAll: () => void;
}

/**
 * Horizontal row of active-filter chips shown when at least one filter is active.
 * Mobile-first with comfortable tap targets. Each chip is removable; a
 * "Clear All" button clears everything at once.
 */
export function MarketplaceActiveFilters({
  selectedChip,
  district,
  priceRange,
  search,
  nearMe,
  onRemove,
  onClearAll,
}: MarketplaceActiveFiltersProps) {
  const t = useTranslations();

  const priceLabel =
    priceRange !== 'all' ? t(`dashboard.marketplaceBrowse.priceRange.${priceRange}`) : '';

  const chips: ActiveFilterChip[] = [];

  if (selectedChip !== 'all') {
    chips.push({
      key: 'crop',
      label: t(`dashboard.marketplaceBrowse.crop.${selectedChip}`),
      icon: 'crop',
    });
  }
  if (district !== 'all') {
    chips.push({ key: 'district', label: district, icon: 'pin' });
  }
  if (priceRange !== 'all') {
    chips.push({ key: 'priceRange', label: priceLabel, icon: 'price' });
  }
  if (search.trim()) {
    chips.push({
      key: 'search',
      label: `${t('dashboard.marketplaceBrowse.ux.searchActive')}: ${search}`,
      icon: 'search',
    });
  }
  if (nearMe) {
    chips.push({ key: 'nearMe', label: t('dashboard.marketplaceBrowse.ux.nearby'), icon: 'pin' });
  }

  if (chips.length === 0) return null;

  const iconFor = (icon: ActiveFilterChip['icon']) => {
    switch (icon) {
      case 'pin':
        return <MapPin className="h-3.5 w-3.5 shrink-0" />;
      case 'search':
        return <Search className="h-3.5 w-3.5 shrink-0" />;
      case 'price':
        return <IndianRupee className="h-3.5 w-3.5 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <motion.span
              key={chip.key}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 pl-3 pr-1.5 text-xs font-medium text-white/85"
            >
              {chip.icon && iconFor(chip.icon)}
              <span className="max-w-[140px] truncate">{chip.label}</span>
              <button
                type="button"
                onClick={() => onRemove(chip.key)}
                aria-label={`${t('dashboard.marketplaceBrowse.ux.clearFilters')} ${chip.label}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.span>
          ))}

          <button
            type="button"
            onClick={onClearAll}
            className={cn(
              'inline-flex h-9 items-center gap-1 rounded-full border border-green-400/40 bg-green-500/15 px-3.5 text-xs font-semibold text-green-200 transition-all active:scale-95',
              'hover:bg-green-500/25',
            )}
          >
            {t('dashboard.marketplaceBrowse.ux.clearAll')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
