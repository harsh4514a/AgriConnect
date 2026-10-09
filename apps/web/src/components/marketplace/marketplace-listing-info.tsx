'use client';

import {
  Calendar,
  Clock,
  Scale,
  Trophy,
  Wallet,
} from 'lucide-react';

import { useLocale, useTranslations } from 'next-intl';

import type { CropListing } from '@/data/marketplace-listings';

import { MarketplaceContactAction } from '@/components/marketplace/marketplace-contact-action';
import { getLocalizedDomainName } from '@agri/domain-data';

interface MarketplaceListingInfoProps {
  listing: CropListing;
  computedDistanceKm?: number;
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
 * marketPrice is stored per quintal.
 *
 * Convert it into the same unit used by the seller.
 */
function getMarketPriceInSellerUnit(
  listing: CropListing,
): number {
  const sellerUnitKg = getUnitKg(
    listing.primaryUnit,
  );

  return listing.marketPrice * (
    sellerUnitKg / 100
  );
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
}: MarketplaceListingInfoProps) {
  const t = useTranslations();
  const locale = useLocale();

  const cropSource = listing.customCropName || listing.cropKey;
  const cropLabel = listing.cropKey === 'other' && !listing.customCropName
    ? t('dashboard.marketplaceBrowse.crop.other')
    : getLocalizedDomainName(cropSource, locale, 'crop');

  const marketPrice =
    getMarketPriceInSellerUnit(
      listing,
    );

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

  const isBestPrice =
    listing.price <= marketPrice;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
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
                ? 'bg-emerald-400/10 text-emerald-300'
                : 'bg-red-400/10 text-red-300'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                listing.availability ===
                'available'
                  ? 'bg-emerald-400'
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

          {isBestPrice && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <Trophy
                className="h-3 w-3"
                aria-hidden="true"
              />

              {t(
                'dashboard.marketplaceBrowse.detail.bestPrice',
              )}
            </span>
          )}
        </div>

        {/* TITLE */}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {cropLabel}
        </h1>

        {/* POSTED TIME */}
        {postedTime && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40">
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

      <div className="mt-5 rounded-xl bg-white/[0.025] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* SELLER PRICE */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {t(
                'dashboard.marketplaceBrowse.detail.sellerPrice',
              )}
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-300">
                {formatPrice(
                  listing.price,
                )}
              </span>

              <span className="text-sm font-semibold text-white/45">
                / {getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}
              </span>
            </div>
          </div>

          {/* MARKET PRICE */}
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {t(
                'dashboard.marketplaceBrowse.detail.marketPrice',
              )}
            </p>

            <div className="mt-1 flex items-baseline gap-2 sm:justify-end">
              <span className="text-xl font-bold text-white/85">
                {formatPrice(
                  marketPrice,
                )}
              </span>

              <span className="text-sm font-semibold text-white/45">
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
        <div className="min-w-0 rounded-xl bg-white/[0.025] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Scale
              className="h-3.5 w-3.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />

            <span className="truncate">
              {t(
                'dashboard.marketplaceBrowse.detail.quantity',
              )}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-bold text-white">
            {quintals}{' '}
            {t(
              'dashboard.marketplaceBrowse.ux.quintals',
            )}
          </p>

          <p className="truncate text-[10px] text-white/30">
            {kilograms}{' '}
            {t(
              'dashboard.marketplaceBrowse.ux.kilograms',
            )}
          </p>
        </div>

        {/* TOTAL VALUE */}
        <div className="min-w-0 rounded-xl bg-emerald-400/[0.045] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Wallet
              className="h-3.5 w-3.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />

            <span className="truncate">
              {t(
                'dashboard.marketplaceBrowse.detail.totalEstimatedValue',
              )}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-extrabold text-white">
            {formatPrice(
              totalEstimatedValue,
            )}
          </p>

          <p className="truncate text-[10px] text-white/30">
            {t(
              'dashboard.marketplaceBrowse.detail.estimatedLotValue',
            )}
          </p>
        </div>

        {/* CROP DATE */}
        <div className="min-w-0 rounded-xl bg-white/[0.025] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Calendar
              className="h-3.5 w-3.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />

            <span className="truncate">
              {t(
                'dashboard.marketplaceBrowse.detail.cropDate',
              )}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm font-bold text-white">
            {listing.cropDate ||
              '—'}
          </p>

          <p className="truncate text-[10px] text-white/30">
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
          variant="desktop"
        />
      </div>
    </div>
  );
}
