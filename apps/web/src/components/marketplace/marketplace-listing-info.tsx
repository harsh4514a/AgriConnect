'use client';

import {
  Calendar,
  Clock,
  Scale,
  Wallet,
} from 'lucide-react';

import { useLocale, useTranslations } from 'next-intl';

import type { CropListing } from '@/data/marketplace-listings';

import { MarketplaceContactAction } from '@/components/marketplace/marketplace-contact-action';
import { getLocalizedDomainName } from '@agri/domain-data';

interface MarketplaceListingInfoProps {
  listing: CropListing;
  computedDistanceKm?: number;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
}

/* ---------------------------------------------------------
 * FORMATTERS
 * --------------------------------------------------------- */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Convert price unit into kilograms.
 *
 * 20 kg      -> 20
 * kg         -> 1
 * quintal    -> 100
 * ton        -> 1000
 */
function getUnitKg(unit: string): number {
  const normalized = unit
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const kgMatch = normalized.match(
    /^(\d+(?:\.\d+)?)\s*kg$/,
  );

  if (kgMatch) {
    const value = Number(kgMatch[1]);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  if (normalized === 'kg') {
    return 1;
  }

  if (
    normalized === 'quintal' ||
    normalized === 'qtl'
  ) {
    return 100;
  }

  if (
    normalized === 'ton' ||
    normalized === 'tonne' ||
    normalized === 'tonnes'
  ) {
    return 1000;
  }

  return 20;
}

/**
 * Convert listing quantity into kilograms.
 */
function getQuantityInKg(
  listing: CropListing,
): number {
  switch (listing.unit) {
    case 'ton':
      return listing.quantity * 1000;

    case 'quintal':
      return listing.quantity * 100;

    case 'kg':
    default:
      return listing.quantity;
  }
}

/**
 * Calculate total estimated value.
 */
function getTotalEstimatedValue(
  listing: CropListing,
): number {
  const quantityKg =
    getQuantityInKg(listing);

  const priceUnitKg =
    getUnitKg(listing.primaryUnit);

  if (
    !Number.isFinite(quantityKg) ||
    !Number.isFinite(priceUnitKg) ||
    priceUnitKg <= 0
  ) {
    return 0;
  }

  return (
    (quantityKg / priceUnitKg) *
    listing.price
  );
}

/**
 * Convert quantity to quintals.
 */
function toQuintals(
  listing: CropListing,
): number {
  switch (listing.unit) {
    case 'ton':
      return listing.quantity * 10;

    case 'kg':
      return listing.quantity / 100;

    case 'quintal':
    default:
      return listing.quantity;
  }
}

/**
 * Generate "12 days ago", "3 hours ago", etc.
 */
function formatPostedTime(
  listing: CropListing,
  locale: string,
): string {
  let timestamp: number | null = null;

  if (listing.createdAt) {
    const parsed =
      new Date(listing.createdAt).getTime();

    if (Number.isFinite(parsed)) {
      timestamp = parsed;
    }
  }

  /*
   * Fallback for old/static listings.
   */
  if (timestamp === null) {
    const hours =
      Number(listing.postedHoursAgo);

    if (
      Number.isFinite(hours) &&
      hours >= 0
    ) {
      timestamp =
        Date.now() -
        hours * 60 * 60 * 1000;
    }
  }

  if (timestamp === null) {
    return '';
  }

  const diffMinutes = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) /
        60000,
    ),
  );

  const relative =
    new Intl.RelativeTimeFormat(
      locale,
      {
        numeric: 'always',
      },
    );

  if (diffMinutes < 60) {
    return relative.format(
      -diffMinutes,
      'minute',
    );
  }

  const hours = Math.floor(
    diffMinutes / 60,
  );

  if (hours < 24) {
    return relative.format(
      -hours,
      'hour',
    );
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 30) {
    return relative.format(
      -days,
      'day',
    );
  }

  const months = Math.floor(
    days / 30,
  );

  if (months < 12) {
    return relative.format(
      -months,
      'month',
    );
  }

  const years = Math.floor(
    months / 12,
  );

  return relative.format(
    -years,
    'year',
  );
}

/* ---------------------------------------------------------
 * COMPONENT
 * --------------------------------------------------------- */

export function MarketplaceListingInfo({
  listing,
  isAuthenticated,
  isAuthLoading = false,
}: MarketplaceListingInfoProps) {
  const t = useTranslations();
  const locale = useLocale();

  const cropSource = listing.customCropName || listing.cropKey;
  const cropLabel = listing.cropKey === 'other' && !listing.customCropName
    ? t('dashboard.marketplaceBrowse.crop.other')
    : getLocalizedDomainName(cropSource, locale, 'crop');

  const totalEstimatedValue =
    getTotalEstimatedValue(listing);

  const quintals =
    toQuintals(listing);

  const kilograms =
    Math.round(quintals * 100);

  const postedTime =
    formatPostedTime(
      listing,
      locale,
    );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        {/* STATUS */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              listing.availability ===
              'available'
                ? 'bg-accent-soft text-accent'
                : 'bg-danger-soft text-danger'
            }`} > <span className={`h-1.5 w-1.5 rounded-full ${
                listing.availability ===
                'available'
                  ? 'bg-accent'
                  : 'bg-red-400'
              }`}
            />

            {listing.availability ===
            'available'
              ? t(
                  'dashboard.marketplaceBrowse.detail.available',
                )
              : t(
                  'dashboard.marketplaceBrowse.detail.soldOut',
                )}
          </span>

        </div>

        {/* TITLE */}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {cropLabel}
        </h1>

        {/* POSTED TIME */}
        {postedTime && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />

            {t(
              'dashboard.marketplaceBrowse.detail.posted',
            )}{' '}
            {postedTime}
          </p>
        )}
      </div>

      {/* =====================================================
          PRICE
      ====================================================== */}

      <div className="mt-5 rounded-xl border border-border bg-surface-subtle p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-5">
          {/* SELLER PRICE */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t(
                'dashboard.marketplaceBrowse.detail.sellerPrice',
              )}
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-accent">
                {formatPrice(
                  listing.price,
                )}
              </span>

              <span className="text-sm font-semibold text-muted-foreground">
                / {getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================
          THREE KEY METRICS — SINGLE ROW
      ====================================================== */}

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {/* QUANTITY */}
        <div className="min-w-0 rounded-xl border border-border bg-surface-subtle p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Scale
              className="h-3.5 w-3.5 shrink-0 text-accent"
              aria-hidden="true"
            />

            <span className="truncate">
              {t(
                'dashboard.marketplaceBrowse.detail.quantity',
              )}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-bold text-foreground">
            {quintals}{' '}
            {t(
              'dashboard.marketplaceBrowse.ux.quintals',
            )}
          </p>

          <p className="truncate text-[10px] text-muted-foreground">
            {kilograms}{' '}
            {t(
              'dashboard.marketplaceBrowse.ux.kilograms',
            )}
          </p>
        </div>

        {/* TOTAL VALUE */}
        <div className="min-w-0 rounded-xl bg-accent-soft p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Wallet
              className="h-3.5 w-3.5 shrink-0 text-accent"
              aria-hidden="true"
            />

            <span className="truncate">
              {t(
                'dashboard.marketplaceBrowse.detail.totalEstimatedValue',
              )}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-extrabold text-foreground">
            {formatPrice(
              totalEstimatedValue,
            )}
          </p>

          <p className="truncate text-[10px] text-muted-foreground">
            {t(
              'dashboard.marketplaceBrowse.detail.estimatedLotValue',
            )}
          </p>
        </div>

        {/* CROP DATE */}
        <div className="min-w-0 rounded-xl border border-accent/20 bg-accent-soft p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Calendar
              className="h-3.5 w-3.5 shrink-0 text-accent"
              aria-hidden="true"
            />

            <span className="truncate">
              {t(
                'dashboard.marketplaceBrowse.detail.cropDate',
              )}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-bold text-foreground">
            {listing.cropDate ||
              '—'}
          </p>

          <p className="truncate text-[10px] text-muted-foreground">
            {getLocalizedDomainName(listing.state || '', locale, 'state')}
          </p>
        </div>
      </div>

      {/* =====================================================
          CONTACT ACTIONS
      ====================================================== */}

      <div className="mt-auto pt-5">
        <MarketplaceContactAction
          listing={listing}
          isAuthenticated={isAuthenticated}
          isAuthLoading={isAuthLoading}
          variant="desktop"
        />
      </div>
    </div>
  );
}
