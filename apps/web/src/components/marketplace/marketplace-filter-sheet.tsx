'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedDomainName } from '@agri/domain-data';
import { cn } from '@/utils/cn';
import type { CropKey } from '@/data/marketplace-listings';
import {
  CROPS,
  PRICE_RANGES,
  QUANTITY_RANGES,
} from '@/data/marketplace-listings';
import type { MarketplaceFilterState } from '@/components/marketplace/marketplace-filters';
import { DEFAULT_FILTERS } from '@/components/marketplace/marketplace-filters';

export type FilterSheetMode = 'filters' | 'sort';

/** Backdrop for the bottom sheet / modal. Kept below the panel so it never blocks panel clicks. */
const OVERLAY = 'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm';

interface MarketplaceFilterSheetProps {
  open: boolean;
  mode: FilterSheetMode;
  filters: MarketplaceFilterState;
  districts: string[];
  villages: string[];
  onClose: () => void;
  onChange: (filters: MarketplaceFilterState) => void;
}

function OptionRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.99]',
        active
          ? 'border-accent/40 bg-accent-soft text-accent'
          : 'border-border bg-surface-subtle text-foreground hover:bg-surface-subtle',
      )}
    >
      <span>{children}</span>
      {active && <Check className="h-4 w-4 shrink-0 text-accent" />}
    </button>
  );
}

/** A labelled select used inside the filter sheet. */
function SheetSelect({
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
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-border bg-surface-subtle px-3 text-sm text-foreground outline-none transition-colors focus:border-focus/50"
      >
        {children}
      </select>
    </div>
  );
}

/**
 * Filter / Sort sheet.
 * Mobile: bottom sheet (slides up). Desktop: centered modal.
 * Includes Crop, District, Village, Price Range, Quantity, Verified Farmers Only
 * and (in sort mode) the 5 sort options.
 */
export function MarketplaceFilterSheet({
  open,
  mode,
  filters,
  districts,
  villages,
  onClose,
  onChange,
}: MarketplaceFilterSheetProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  // Only render the portal after the component is mounted on the client,
  // so SSR never attempts to access `document`.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted) return null;

  const update = (patch: Partial<MarketplaceFilterState>) => onChange({ ...filters, ...patch });

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={OVERLAY}
            aria-hidden="true"
          />

          {/* Sheet / Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={
              mode === 'filters'
                ? t('dashboard.marketplaceBrowse.ux.filter')
                : t('dashboard.marketplaceBrowse.ux.sort')
            }
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-50 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {mode === 'filters'
                  ? t('dashboard.marketplaceBrowse.ux.filter')
                  : t('dashboard.marketplaceBrowse.ux.sort')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('dashboard.marketplaceBrowse.ux.closeFilters')}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {mode === 'sort' ? (
              /* ---------------- SORT ---------------- */
              <div className="mt-5 space-y-2">
                {(
                  [
                    ['nearest', t('dashboard.marketplaceBrowse.sort.nearest')],
                    ['lowestPrice', t('dashboard.marketplaceBrowse.sort.lowestPrice')],
                    ['highestPrice', t('dashboard.marketplaceBrowse.sort.highestPrice')],
                    ['newest', t('dashboard.marketplaceBrowse.sort.newest')],
                    ['mostQty', t('dashboard.marketplaceBrowse.sort.mostQty')],
                  ] as const
                ).map(([key, label]) => (
                  <OptionRow
                    key={key}
                    active={filters.sort === key}
                    onClick={() => {
                      update({ sort: key });
                      onClose();
                    }}
                  >
                    {label}
                  </OptionRow>
                ))}
              </div>
            ) : (
              /* ---------------- FILTERS ---------------- */
              <div className="mt-5 space-y-4">
                <SheetSelect
                  id="sheet-crop"
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
                </SheetSelect>

                <SheetSelect
                  id="sheet-district"
                  label={t('dashboard.marketplaceBrowse.filters.district')}
                  value={filters.district}
                  onChange={(value) => update({ district: value })}
                >
                  <option value="all">
                    {t('dashboard.marketplaceBrowse.filters.allDistricts')}
                  </option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {getLocalizedDomainName(district, locale, 'district')}
                    </option>
                  ))}
                </SheetSelect>

                <SheetSelect
                  id="sheet-village"
                  label={t('dashboard.marketplaceBrowse.ux.village')}
                  value={filters.village}
                  onChange={(value) => update({ village: value })}
                >
                  <option value="all">{t('dashboard.marketplaceBrowse.ux.allVillages')}</option>
                  {villages.map((village) => (
                    <option key={village} value={village}>
                      {getLocalizedDomainName(village, locale, 'village')}
                    </option>
                  ))}
                </SheetSelect>

                <SheetSelect
                  id="sheet-price"
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
                </SheetSelect>

                <SheetSelect
                  id="sheet-qty"
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
                </SheetSelect>

                {/* Verified Farmers Only toggle */}
                <button
                  type="button"
                  onClick={() => update({ verifiedOnly: !filters.verifiedOnly })}
                  aria-pressed={filters.verifiedOnly}
                  className={cn(
                    'flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.99]',
                    filters.verifiedOnly
                      ? 'border-accent/40 bg-accent-soft text-accent'
                      : 'border-border bg-surface-subtle text-foreground hover:bg-surface-subtle',
                  )}
                >
                  <span>{t('dashboard.marketplaceBrowse.ux.verifiedFarmersOnly')}</span>
                  <span
                    className={cn(
                      'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
                      filters.verifiedOnly
                        ? 'bg-green-500/40 justify-end'
                        : 'bg-surface-subtle justify-start',
                    )}
                  >
                    <span className="h-5 w-5 rounded-full bg-surface" />
                  </span>
                </button>

                {/* Footer actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onChange(DEFAULT_FILTERS)}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border bg-surface-subtle text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
                  >
                    {t('dashboard.marketplaceBrowse.ux.clearFilters')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
                  >
                    {t('dashboard.marketplaceBrowse.ux.applyFilters')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
