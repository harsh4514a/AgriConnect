'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedDomainName } from '@agri/domain-data';
import { cn } from '@/utils/cn';
import type { CropKey, SortKey } from '@/data/marketplace-listings';
import { CROPS, PRICE_RANGES, QUANTITY_RANGES, SORT_OPTIONS } from '@/data/marketplace-listings';

export interface MarketplaceFilterState {
    crop: CropKey | 'all';
    district: string | 'all';
    village: string | 'all';
    priceRange: string | 'all';
    quantity: string | 'all';
    verifiedOnly: boolean;
    sort: SortKey;
}

export const DEFAULT_FILTERS: MarketplaceFilterState = {
    crop: 'all',
    district: 'all',
    village: 'all',
    priceRange: 'all',
    quantity: 'all',
    verifiedOnly: false,
    sort: 'newest',
};

interface MarketplaceFiltersProps {
    filters: MarketplaceFilterState;
    districts: string[];
    onChange: (filters: MarketplaceFilterState) => void;
}

/** A reusable labelled select field. */
function FilterSelect({
    id,
    label,
    value,
    onChange,
    children,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-border bg-surface-subtle pl-3 pr-9 text-sm text-foreground outline-none transition-colors focus:border-focus/50 focus:bg-surface-subtle"
                >
                    {children}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
        </div>
    );
}

/**
 * Responsive filter bar.
 * Desktop: horizontal row. Mobile: collapsible panel.
 */
export function MarketplaceFilters({ filters, districts, onChange }: MarketplaceFiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
    const [open, setOpen] = useState(false);

    const hasActiveFilters =
        filters.crop !== 'all' ||
        filters.district !== 'all' ||
        filters.priceRange !== 'all' ||
        filters.quantity !== 'all';

    const update = (patch: Partial<MarketplaceFilterState>) => onChange({ ...filters, ...patch });

    /** The filter controls, shared between desktop and mobile layouts. */
    const controls = (
        <>
            <FilterSelect
                id="mp-crop"
                label={t('dashboard.marketplaceBrowse.filters.crop')}
                value={filters.crop}
                onChange={(value) => update({ crop: value as CropKey | 'all' })}
            >
                <option value="all">{t('dashboard.marketplaceBrowse.filters.allCrops')}</option>
                {CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                        {t(`dashboard.marketplaceBrowse.crop.${crop}`)}
                    </option>
                ))}
            </FilterSelect>

            <FilterSelect
                id="mp-district"
                label={t('dashboard.marketplaceBrowse.filters.district')}
                value={filters.district}
                onChange={(value) => update({ district: value })}
            >
                <option value="all">{t('dashboard.marketplaceBrowse.filters.allDistricts')}</option>
                {districts.map((district) => (
                    <option key={district} value={district}>
                        {getLocalizedDomainName(district, locale, 'district')}
                    </option>
                ))}
            </FilterSelect>

            <FilterSelect
                id="mp-price"
                label={t('dashboard.marketplaceBrowse.filters.priceRange')}
                value={filters.priceRange}
                onChange={(value) => update({ priceRange: value })}
            >
                <option value="all">{t('dashboard.marketplaceBrowse.filters.anyPrice')}</option>
                {PRICE_RANGES.map((range) => (
                    <option key={range.key} value={range.key}>
                        {t(`dashboard.marketplaceBrowse.priceRange.${range.key}`)}
                    </option>
                ))}
            </FilterSelect>

            <FilterSelect
                id="mp-qty"
                label={t('dashboard.marketplaceBrowse.filters.quantity')}
                value={filters.quantity}
                onChange={(value) => update({ quantity: value })}
            >
                <option value="all">{t('dashboard.marketplaceBrowse.filters.anyQty')}</option>
                {QUANTITY_RANGES.map((range) => (
                    <option key={range.key} value={range.key}>
                        {t(`dashboard.marketplaceBrowse.quantityOption.${range.key}`)}
                    </option>
                ))}
            </FilterSelect>

            <FilterSelect
                id="mp-sort"
                label={t('dashboard.marketplaceBrowse.filters.sortBy')}
                value={filters.sort}
                onChange={(value) => update({ sort: value as SortKey })}
            >
                {SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                        {t(`dashboard.marketplaceBrowse.filters.${option.key}`)}
                    </option>
                ))}
            </FilterSelect>

            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={() => onChange(DEFAULT_FILTERS)}
                    className="inline-flex h-11 items-center gap-1.5 self-end rounded-xl border border-border bg-surface-subtle px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                    {t('dashboard.marketplaceBrowse.filters.reset')}
                </button>
            )}
        </>
    );

    return (
        <div className="rounded-2xl border border-border bg-surface-subtle p-4 backdrop-blur-xl">
            {/* Mobile toggle */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-controls="marketplace-filters"
                className="flex w-full items-center justify-between lg:hidden"
            >
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-accent" />
                    {t('dashboard.marketplaceBrowse.filters.label')}
                    {hasActiveFilters && (
                        <span className="h-2 w-2 rounded-full bg-accent" aria-label={t('dashboard.marketplaceBrowse.filters.activeFilters')} />
                    )}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>

            {/* Desktop: horizontal row */}
            <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-5">
                {controls}
            </div>

            {/* Mobile: collapsible */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id="marketplace-filters"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
                            {controls}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
