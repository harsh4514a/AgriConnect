// 'use client';

// import { SlidersHorizontal, ArrowDownWideNarrow, MapPin, Info } from 'lucide-react';
// import { useTranslations } from 'next-intl';
// import { cn } from '@/utils/cn';

// interface MarketplaceActionBarProps {
//   onOpenFilters: () => void;
//   onOpenSort: () => void;
//   onNearby: () => void;
//   nearbyActive: boolean;
//   /** True when the user has not saved a profile location yet (Nearby unavailable). */
//   nearbyDisabled: boolean;
//   /** Number of active filters — shown as "Filter (n)" when > 0. */
//   filterCount: number;
// }

// /**
//  * Toolbar action buttons: Filter / Sort / Nearby.
//  * Compact and inline with the search bar on desktop; equal-width
//  * touch targets on mobile. Never permanently expanded — opens sheets/modals.
//  * "Nearby" is a one-tap quick filter that uses the saved profile location.
//  */
// export function MarketplaceActionBar({
//   onOpenFilters,
//   onOpenSort,
//   onNearby,
//   nearbyActive,
//   nearbyDisabled,
//   filterCount,
// }: MarketplaceActionBarProps) {
//   const t = useTranslations();

//   const base =
//     'inline-flex h-12 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition-all active:scale-95 sm:px-4 whitespace-nowrap';

//   return (
//     <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
//       <button
//         type="button"
//         onClick={onOpenFilters}
//         className={cn(
//           base,
//           filterCount > 0
//             ? 'border-green-400/60 bg-green-500/20 text-green-200'
//             : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
//         )}
//       >
//         <SlidersHorizontal className="h-4 w-4 shrink-0" />
//         <span className="truncate">
//           {t('dashboard.marketplaceBrowse.ux.filter')}
//           {filterCount > 0 && <span className="ml-1">({filterCount})</span>}
//         </span>
//       </button>

//       <button
//         type="button"
//         onClick={onOpenSort}
//         className={cn(
//           base,
//           'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
//         )}
//       >
//         <ArrowDownWideNarrow className="h-4 w-4 shrink-0" />
//         <span className="truncate">{t('dashboard.marketplaceBrowse.ux.sort')}</span>
//       </button>

//       <div className="relative inline-flex items-center justify-center">
//         <button
//           type="button"
//           onClick={nearbyDisabled ? undefined : onNearby}
//           aria-pressed={nearbyActive}
//           aria-disabled={nearbyDisabled}
//           disabled={nearbyDisabled}
//           className={cn(
//             base,
//             'w-full',
//             nearbyDisabled
//               ? 'cursor-not-allowed border-white/5 bg-white/5 text-white/30'
//               : nearbyActive
//                 ? 'border-green-400/70 bg-green-500 text-white shadow-lg shadow-green-900/40'
//                 : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
//           )}
//         >
//           <MapPin className="h-4 w-4 shrink-0" />
//           <span className="truncate">{t('dashboard.marketplaceBrowse.ux.nearby')}</span>
//         </button>

//         {/* Tooltip: "Uses your saved profile location." */}
//         <span
//           role="tooltip"
//           className="group absolute -top-1 right-0 flex h-5 w-5 translate-y-[-100%] items-center justify-center"
//         >
//           <Info className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
//           <span className="absolute bottom-full right-0 mb-1 hidden w-max max-w-[200px] rounded-md border border-white/10 bg-[#0b2414]/95 px-2 py-1 text-[11px] font-medium text-white/80 shadow-xl backdrop-blur-md group-hover:block group-focus-within:block">
//             {t('dashboard.marketplaceBrowse.ux.nearbyTooltip')}
//           </span>
//         </span>
//       </div>
//     </div>
//   );
// }


'use client';

import {
  SlidersHorizontal,
  ArrowDownWideNarrow,
  MapPin,
} from 'lucide-react';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

interface MarketplaceActionBarProps {
  onOpenFilters: () => void;
  onOpenSort: () => void;
  onNearby: () => void;
  nearbyActive: boolean;
  nearbyDisabled: boolean;
  filterCount: number;
}

/**
 * Marketplace toolbar:
 *
 * Filter | Sort | Nearby
 *
 * Nearby uses the user's saved profile location
 * and shows listings within the configured radius.
 */
export function MarketplaceActionBar({
  onOpenFilters,
  onOpenSort,
  onNearby,
  nearbyActive,
  nearbyDisabled,
  filterCount,
}: MarketplaceActionBarProps) {
  const t = useTranslations();

  const base =
    'inline-flex h-12 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition-all active:scale-95 sm:px-4';

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">

      {/* ====================================================
          FILTER
         ==================================================== */}

      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          base,
          filterCount > 0
            ? 'border-green-400/60 bg-green-500/20 text-green-200'
            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
        )}
      >
        <SlidersHorizontal
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        />

        <span className="truncate">
          {t(
            'dashboard.marketplaceBrowse.ux.filter',
          )}

          {filterCount > 0 && (
            <span className="ml-1">
              ({filterCount})
            </span>
          )}
        </span>
      </button>

      {/* ====================================================
          SORT
         ==================================================== */}

      <button
        type="button"
        onClick={onOpenSort}
        className={cn(
          base,
          'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
        )}
      >
        <ArrowDownWideNarrow
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        />

        <span className="truncate">
          {t(
            'dashboard.marketplaceBrowse.ux.sort',
          )}
        </span>
      </button>

      {/* ====================================================
          NEARBY
         ==================================================== */}

      <button
        type="button"
        onClick={
          nearbyDisabled
            ? undefined
            : onNearby
        }
        aria-pressed={
          nearbyActive
        }
        aria-disabled={
          nearbyDisabled
        }
        disabled={
          nearbyDisabled
        }
        className={cn(
          base,
          'w-full',

          nearbyDisabled
            ? 'cursor-not-allowed border-white/5 bg-white/5 text-white/30'
            : nearbyActive
              ? 'border-green-400/70 bg-green-500 text-white shadow-lg shadow-green-900/40'
              : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
        )}
      >
        <MapPin
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        />

        <span className="truncate">
          {t(
            'dashboard.marketplaceBrowse.ux.nearby',
          )}
        </span>
      </button>
    </div>
  );
}