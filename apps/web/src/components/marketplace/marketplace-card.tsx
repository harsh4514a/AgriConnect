'use client';

import { motion } from 'framer-motion';
import {
    BadgeCheck,
    MapPin,
    Clock,
    User,
    Navigation,
    Phone,
    Trophy,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CropListing } from '@/data/marketplace-listings';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';

interface MarketplaceCardProps {
    listing: CropListing;
    onViewDetails: (listing: CropListing) => void;
    index?: number;
}

/** Format a price in Indian Locale (₹) with grouping. */
function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
}

/** Human-friendly "posted X ago" label. */
function formatPosted(hoursAgo: number, t: (key: string) => string): string {
    if (hoursAgo < 1) return t('dashboard.marketplaceBrowse.ux.postedToday');
    if (hoursAgo < 24) return `${hoursAgo} ${t('dashboard.marketplaceBrowse.ux.postedHours')}`;
    const days = Math.floor(hoursAgo / 24);
    if (days === 1) return t('dashboard.marketplaceBrowse.ux.postedYesterday');
    return `${days} ${t('dashboard.marketplaceBrowse.ux.postedDays')}`;
}

/**
 * Convert a listing's quantity into quintals + kilograms.
 * 1 quintal = 100 kg. Handles ton / kg units too.
 */
function toQuintals(listing: CropListing): number {
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

export function MarketplaceCard({
    listing,
    onViewDetails,
    index = 0,
}: MarketplaceCardProps) {
    const t = useTranslations();
    const locale = useLocale();

    const cropSource = listing.customCropName || listing.cropKey;
    const cropLabel = listing.cropKey === 'other' && !listing.customCropName
        ? t('dashboard.marketplaceBrowse.crop.other')
        : getLocalizedDomainName(cropSource, locale, 'crop');
    const districtLabel = getLocalizedDomainName(listing.district, locale, 'district');

    // Market comparison: seller price vs market price (per quintal).
    const isBestPrice = listing.price <= listing.marketPrice;

    // Quantity in quintal + kilogram.
    const quintals = toQuintals(listing);
    const kilograms = Math.round(quintals * 100);

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="button"
            tabIndex={0}
            onClick={() => onViewDetails(listing)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetails(listing);
                }
            }}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-400/30 hover:bg-white/10 hover:shadow-xl hover:shadow-green-900/20 focus-visible:outline-2 focus-visible:outline-green-400"
        >
            {/* Image — reduced height (~30-35% of card) */}
            <div className="relative aspect-[2/1] overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={listing.image}
                    alt={listing.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle bottom gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                {/* Top-left: Verified Farmer */}
                {listing.verified && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-green-900/80 px-2 py-0.5 text-[10px] font-semibold text-green-200 backdrop-blur-sm">
                        <BadgeCheck className="h-3 w-3" />
                        {t('dashboard.marketplaceBrowse.ux.verifiedFarmer')}
                    </span>
                )}

                {/* Top-right: Ready to Sell */}
                {listing.readyToSell && (
                    <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {t('dashboard.marketplaceBrowse.ux.readyToSell')}
                    </span>
                )}
            </div>

            {/* Content — compact */}
            <div className="flex flex-1 flex-col p-3">
                {/* Crop name */}
                <h3 className="truncate text-base font-bold text-white">{cropLabel}</h3>

                {/* Best Price — amber/gold premium badge */}
                {isBestPrice && (
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-300/30">
                        <Trophy className="h-3 w-3" />
                        {t('dashboard.marketplaceBrowse.ux.bestPrice')}
                    </span>
                )}

                {/* Price — primary visual focus */}
                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold leading-none text-green-300">
                        {formatPrice(listing.price)}
                    </span>
                    <span className="text-[11px] font-medium text-white/50">
                        /{getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}
                    </span>
                </div>
                <p className="mt-0.5 text-xs text-white/50">
                    {formatPrice(listing.marketPrice)} {t('dashboard.marketplaceBrowse.ux.perQuintal')}
                </p>

                {/* Quantity — compact */}
                <p className="mt-2 text-xs text-white/70">
                    <span className="font-semibold text-white/85">
                        {t('dashboard.marketplaceBrowse.ux.quantityLabel')}:{' '}
                        {quintals} {t('dashboard.marketplaceBrowse.ux.quintals')}
                    </span>{' '}
                    <span className="text-white/40">({kilograms} {t('dashboard.marketplaceBrowse.ux.kilograms')})</span>
                </p>

                {/* Info rows — compact, no labels */}
                <div className="mt-2 space-y-1 text-xs">
                    <p className="flex items-center gap-1.5 text-white/70">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-green-300" aria-hidden="true" />
                        <span className="truncate">
                            {getLocalizedDomainName(listing.village, locale, 'village')}, {getLocalizedDomainName(listing.taluka, locale, 'taluka')}, {districtLabel}
                        </span>
                    </p>
                    <p className="flex items-center gap-1.5 text-white/70">
                        <User className="h-3.5 w-3.5 shrink-0 text-green-300" aria-hidden="true" />
                        <span className="truncate">{listing.farmerNameShort}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-white/70">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-green-300" aria-hidden="true" />
                        <span className="truncate">{listing.mobileNumber}</span>
                    </p>
                </div>

                {/* Distance + listing age */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
                    <span className="inline-flex items-center gap-0.5">
                        <Navigation className="h-3 w-3" />
                        {listing.distanceKm} {t('dashboard.marketplaceBrowse.ux.kmAway')}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatPosted(listing.postedHoursAgo, t)}
                    </span>
                </div>

                {/* Actions — Call Farmer is independent (stopPropagation); View Details fills card */}
                <div className="mt-3">
                    <a
                        href={`tel:${listing.mobileNumber}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${t('dashboard.marketplaceBrowse.ux.callFarmer')} ${listing.farmerNameShort}`}
                        className={cn(
                            'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95',
                        )}
                        style={{
                            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                            boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                        }}
                    >
                        <Phone className="h-4 w-4" />
                        {t('dashboard.marketplaceBrowse.ux.callFarmer')}
                    </a>
                </div>
            </div>
        </motion.article>
    );
}
