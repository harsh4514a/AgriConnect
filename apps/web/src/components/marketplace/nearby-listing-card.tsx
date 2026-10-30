// 'use client';

// import { motion } from 'framer-motion';

// import {
//   BadgeCheck,
//   Clock3,
//   MapPin,
//   Navigation,
//   Package,
//   UserRound,
// } from 'lucide-react';

// import { useTranslations } from 'next-intl';

// import type { CropListing } from '@/data/marketplace-listings';

// interface NearbyListingCardProps {
//   listing: CropListing;
//   distanceKm: number;
//   onViewDetails: (
//     listing: CropListing,
//   ) => void;
//   index?: number;
// }

// function formatNumber(
//   value: number,
// ): string {
//   return new Intl.NumberFormat(
//     'en-IN',
//     {
//       maximumFractionDigits: 0,
//     },
//   ).format(value);
// }

// /**
//  * Convert the database market price
//  * (stored per quintal) into the seller's
//  * primary unit.
//  *
//  * Example:
//  *
//  * marketPrice = ₹2500 / quintal
//  * primaryUnit = 20 kg
//  *
//  * result = ₹500 / 20 kg
//  */
// function getPriceUnitInKg(
//   primaryUnit: string,
// ): number {
//   const normalized =
//     primaryUnit
//       .toLowerCase()
//       .replace(/\s+/g, ' ')
//       .trim();

//   const kgMatch =
//     normalized.match(
//       /^(\d+(?:\.\d+)?)\s*kg$/,
//     );

//   if (kgMatch) {
//     const kg = Number(
//       kgMatch[1],
//     );

//     if (
//       Number.isFinite(kg) &&
//       kg > 0
//     ) {
//       return kg;
//     }
//   }

//   if (
//     normalized === 'kg'
//   ) {
//     return 1;
//   }

//   if (
//     normalized === 'quintal' ||
//     normalized === 'qtl'
//   ) {
//     return 100;
//   }

//   if (
//     normalized === 'ton' ||
//     normalized === 'tonne' ||
//     normalized === 'tonnes'
//   ) {
//     return 1000;
//   }

//   return 20;
// }

// function getMarketPriceInPrimaryUnit(
//   listing: CropListing,
// ): number {
//   const unitKg =
//     getPriceUnitInKg(
//       listing.primaryUnit,
//     );

//   return Math.round(
//     listing.marketPrice *
//       (unitKg / 100),
//   );
// }

// function formatPosted(
//   hoursAgo: number,
//   t: (
//     key: string,
//   ) => string,
// ): string {
//   if (hoursAgo < 1) {
//     return t(
//       'dashboard.marketplaceBrowse.ux.postedToday',
//     );
//   }

//   if (hoursAgo < 24) {
//     return `${hoursAgo} ${t(
//       'dashboard.marketplaceBrowse.ux.postedHours',
//     )}`;
//   }

//   const days =
//     Math.floor(
//       hoursAgo / 24,
//     );

//   if (days === 1) {
//     return t(
//       'dashboard.marketplaceBrowse.ux.postedYesterday',
//     );
//   }

//   return `${days} ${t(
//     'dashboard.marketplaceBrowse.ux.postedDays',
//   )}`;
// }

// export function NearbyListingCard({
//   listing,
//   distanceKm,
//   onViewDetails,
//   index = 0,
// }: NearbyListingCardProps) {
//   const t =
//     useTranslations();

//   const cropLabel =
//     t(
//       `dashboard.marketplaceBrowse.crop.${listing.cropKey}`,
//     );

//   const districtLabel =
//     t(
//       `dashboard.marketplaceBrowse.district.${listing.district}`,
//     );

//   const marketPrice =
//     getMarketPriceInPrimaryUnit(
//       listing,
//     );

//   const location = [
//     listing.village,
//     listing.taluka,
//     districtLabel,
//   ]
//     .filter(Boolean)
//     .filter(
//       (
//         value,
//         position,
//         array,
//       ) =>
//         array.indexOf(
//           value,
//         ) === position,
//     )
//     .join(', ');

//   return (
//     <motion.article
//       initial={{
//         opacity: 0,
//         y: 14,
//       }}
//       animate={{
//         opacity: 1,
//         y: 0,
//       }}
//       transition={{
//         delay:
//           index * 0.045,
//         duration: 0.35,
//         ease: [
//           0.16,
//           1,
//           0.3,
//           1,
//         ],
//       }}
//       role="button"
//       tabIndex={0}
//       onClick={() =>
//         onViewDetails(
//           listing,
//         )
//       }
//       onKeyDown={(
//         event,
//       ) => {
//         if (
//           event.key ===
//             'Enter' ||
//           event.key === ' '
//         ) {
//           event.preventDefault();

//           onViewDetails(
//             listing,
//           );
//         }
//       }}
//       className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/[0.045] shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/20 hover:bg-surface/[0.065] hover:shadow-[0_18px_45px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-focus"
//     >
//       {/* IMAGE */}
//       <div className="relative aspect-[16/9] overflow-hidden bg-surface/[0.04]">
//         {/* eslint-disable-next-line @next/next/no-img-element */}
//         <img
//           src={listing.image}
//           alt={listing.imageAlt}
//           loading="lazy"
//           className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
//         />

//         <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

//         {/* VERIFIED */}
//         {listing.verified && (
//           <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-950/75 px-2.5 py-1 text-[10px] font-semibold text-green-100 backdrop-blur-md">
//             <BadgeCheck className="h-3 w-3 text-accent" />

//             {t(
//               'dashboard.marketplaceBrowse.ux.verifiedFarmer',
//             )}
//           </span>
//         )}

//         {/* DISTANCE */}
//         <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
//           <Navigation className="h-3 w-3 text-accent" />

//           {distanceKm < 1
//             ? '<1'
//             : distanceKm.toFixed(
//                 1,
//               )}

//           {' '}

//           {t(
//             'dashboard.marketplaceBrowse.ux.kmAway',
//           )}
//         </span>
//       </div>

//       {/* CONTENT */}
//       <div className="flex flex-1 flex-col p-4">
//         {/* TITLE */}
//         <div className="flex items-start justify-between gap-3">
//           <div className="min-w-0">
//             <h3 className="truncate text-lg font-bold text-white">
//               {cropLabel}
//             </h3>

//             {listing.variety?.trim() && (
//               <p className="mt-0.5 truncate text-xs text-white/45">
//                 {listing.variety.trim()}
//               </p>
//             )}
//           </div>

//           {listing.availability ===
//             'available' && (
//             <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent">
//               {t(
//                 'dashboard.marketplaceBrowse.ux.available',
//               )}
//             </span>
//           )}
//         </div>

//         {/* PRICE */}
//         <div className="mt-3 flex items-end gap-1.5">
//           <span className="text-2xl font-extrabold leading-none text-accent">
//             ₹
//             {formatNumber(
//               listing.price,
//             )}
//           </span>

//           <span className="pb-0.5 text-xs text-white/45">
//             / {listing.primaryUnit}
//           </span>
//         </div>

//         {/* MARKET PRICE */}
//         <p className="mt-1 text-xs text-white/40">
//           {t(
//             'dashboard.marketplaceBrowse.ux.marketPrice',
//           )}
//           : ₹
//           {formatNumber(
//             marketPrice,
//           )}{' '}
//           / {listing.primaryUnit}
//         </p>

//         {/* SMALL STATS */}
//         <div className="mt-4 grid grid-cols-2 gap-2">
//           <div className="rounded-xl bg-surface/[0.025] p-3">
//             <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/35">
//               <Package className="h-3 w-3" />

//               {t(
//                 'dashboard.marketplaceBrowse.ux.quantityLabel',
//               )}
//             </div>

//             <p className="mt-1 text-sm font-semibold text-white/85">
//               {formatNumber(
//                 listing.quantity,
//               )}{' '}
//               {t(
//                 `dashboard.marketplaceBrowse.unit.${listing.unit}`,
//               )}
//             </p>
//           </div>

//           <div className="rounded-xl bg-surface/[0.025] p-3">
//             <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/35">
//               <Clock3 className="h-3 w-3" />

//               {t(
//                 'dashboard.marketplaceBrowse.ux.postedToday',
//               )}
//             </div>

//             <p className="mt-1 truncate text-sm font-semibold text-white/85">
//               {formatPosted(
//                 listing.postedHoursAgo,
//                 t,
//               )}
//             </p>
//           </div>
//         </div>

//         {/* LOCATION + FARMER */}
//         <div className="mt-3 space-y-1.5 text-xs text-white/55">
//           <p className="flex min-w-0 items-center gap-2">
//             <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />

//             <span className="truncate">
//               {location}
//             </span>
//           </p>

//           <p className="flex min-w-0 items-center gap-2">
//             <UserRound className="h-3.5 w-3.5 shrink-0 text-accent" />

//             <span className="truncate">
//               {listing.farmerName}
//             </span>
//           </p>
//         </div>

//         {/* VIEW DETAILS */}
//         <button
//           type="button"
//           onClick={(
//             event,
//           ) => {
//             event.stopPropagation();

//             onViewDetails(
//               listing,
//             );
//           }}
//           className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-green-800 px-4 text-sm font-bold text-white shadow-[0_5px_16px_rgba(46,125,50,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(46,125,50,0.32)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
//         >
//           {t(
//             'dashboard.marketplaceBrowse.ux.viewDetails',
//           )}
//         </button>
//       </div>
//     </motion.article>
//   );
// }

'use client';

import { motion } from 'framer-motion';
import {
    BadgeCheck,
    Clock3,
    MapPin,
    Navigation,
    UserRound,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CropListing } from '@/data/marketplace-listings';
import { formatListingCreatedAt } from '@/utils/listing-date';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';
import { OptimizedListingImage } from './optimized-listing-image';

interface NearbyListingCardProps {
    listing: CropListing;
    distanceKm: number;
    index?: number;
    onViewDetails: (listing: CropListing) => void;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
}

function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) return '<1 km';
    if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
    return `${Math.round(distanceKm)} km`;
}

function toQuintals(listing: CropListing): number {
    switch (listing.unit) {
        case 'ton':
            return listing.quantity * 10;

        case 'kg':
            return listing.quantity / 100;

        default:
            return listing.quantity;
    }
}

/**
 * Database market price is stored per quintal (100 kg).
 * Convert it to the same unit used by the seller price.
 *
 * Example:
 * Market price = ₹550 / quintal
 * Seller unit = 20 kg
 * Result = ₹110 / 20 kg
 */
function marketPriceForPrimaryUnit(
    listing: CropListing,
): number {
    const match = listing.primaryUnit.match(
        /([0-9]+(?:\.[0-9]+)?)\s*kg/i,
    );

    if (!match) {
        return listing.marketPrice;
    }

    const unitKg = Number(match[1]);

    return Math.round(
        (listing.marketPrice * unitKg) / 100,
    );
}

export function NearbyListingCard({
    listing,
    distanceKm,
    index = 0,
    onViewDetails,
}: NearbyListingCardProps) {
    const t = useTranslations();
    const locale = useLocale();
    const farmerName = listing.farmerName?.trim() || listing.farmerNameShort?.trim();
    const postedAt = formatListingCreatedAt(listing.createdAt, locale);

    const cropSource = listing.customCropName || listing.cropKey;
    const cropLabel = listing.cropKey === 'other' && !listing.customCropName
        ? t('dashboard.marketplaceBrowse.crop.other')
        : getLocalizedDomainName(cropSource, locale, 'crop');
    const districtLabel = getLocalizedDomainName(listing.district, locale, 'district');

    const quintals = toQuintals(listing);

    const marketPrice =
        marketPriceForPrimaryUnit(listing);

    const isBestPrice =
        listing.price <= marketPrice;

    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: Math.min(index, 8) * 0.035,
                duration: 0.25,
            }}
            className="group flex w-full max-w-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-raised hover:shadow-md"
        >
            {/* IMAGE */}
            <button
                type="button"
                onClick={() => onViewDetails(listing)}
                className="relative block aspect-[16/9] w-full overflow-hidden bg-amber-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset"
                aria-label={`${cropLabel} - ${t(
                    'dashboard.marketplaceBrowse.ux.viewDetails',
                )}`}
            >
                <OptimizedListingImage
                    src={listing.image}
                    alt={listing.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    priority={index === 0}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

                {/* VERIFIED */}
                {listing.verified && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/15 bg-green-900/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md">
                        <BadgeCheck
                            className="h-3 w-3"
                            aria-hidden="true"
                        />
                        {t(
                            'dashboard.marketplaceBrowse.ux.verifiedFarmer',
                        )}
                    </span>
                )}

                {/* DISTANCE */}
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-border bg-black/35 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-md">
                    <Navigation
                        className="h-3 w-3"
                        aria-hidden="true"
                    />
                    {formatDistance(distanceKm)}
                </span>
            </button>

            {/* CONTENT */}
            <div className="flex flex-1 flex-col p-3.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h2 className="truncate text-[17px] font-bold leading-tight text-foreground">
                            {cropLabel}
                        </h2>

                        {listing.variety && (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                {getLocalizedDomainName(listing.variety, locale, 'variety')}
                            </p>
                        )}
                    </div>

                    {listing.availability === 'available' && (
                        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-[9px] font-semibold text-accent">
                            {t(
                                'dashboard.marketplaceBrowse.ux.available',
                            )}
                        </span>
                    )}
                </div>

                {/* SELLER PRICE */}
                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[23px] font-extrabold leading-none tracking-tight text-accent">
                        {formatPrice(listing.price)}
                    </span>

                    <span className="text-[11px] font-medium text-muted-foreground">
                        /{getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}
                    </span>
                </div>

                {/* MARKET PRICE - SAME UNIT */}
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>
                        {t(
                            'dashboard.marketplaceBrowse.ux.marketPrice',
                        )}
                        :
                    </span>

                    <span
                        className={cn(
                            isBestPrice
                                ? 'text-accent/80'
                                : 'text-muted-foreground',
                        )}
                    >
                        {formatPrice(marketPrice)} /{' '}
                        {getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}
                    </span>
                </div>

                {/* QUANTITY + LOCATION */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        {quintals}{' '}
                        {t(
                            'dashboard.marketplaceBrowse.ux.quintals',
                        )}
                    </span>

                    <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin
                            className="h-3 w-3 shrink-0 text-accent/80"
                            aria-hidden="true"
                        />

                        <span className="truncate">
                            {[listing.village ? getLocalizedDomainName(listing.village, locale, 'village') : '', districtLabel].filter(Boolean).join(', ')}
                        </span>
                    </span>
                </div>

                {/* FARMER + POSTED */}
                <div className="mt-1.5 space-y-1 text-[10px] text-accent-foreground">
                    {farmerName ? <span className="inline-flex min-w-0 items-start gap-1">
                        <UserRound
                            className="h-3 w-3 shrink-0"
                            aria-hidden="true"
                        />

                        <span className="min-w-0 break-words">
                            {farmerName}
                        </span>
                    </span> : null}

                    {postedAt ? <time dateTime={postedAt.iso} className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock3
                            className="h-3 w-3"
                            aria-hidden="true"
                        />

                        {t('dashboard.marketplaceBrowse.ux.postedAt', { date: postedAt.label })}
                    </time> : null}
                </div>

                {/* DETAILS */}
                <button
                    type="button"
                    onClick={() => onViewDetails(listing)}
                    className="mt-auto flex h-9 w-full items-center justify-center rounded-xl bg-accent px-3 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                    {t(
                        'dashboard.marketplaceBrowse.ux.viewDetails',
                    )}
                </button>
            </div>
        </motion.article>
    );
}
