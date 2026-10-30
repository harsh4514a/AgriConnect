// 'use client';

// import {
//   CalendarDays,
//   Package,
//   Sprout,
// } from 'lucide-react';

// import { useTranslations } from 'next-intl';

// import type { CropListing } from '@/data/marketplace-listings';

// interface MarketplaceProductDetailsProps {
//   listing: CropListing;
// }

// function formatNumber(
//   value: number,
// ): string {
//   return new Intl.NumberFormat(
//     'en-IN',
//     {
//       maximumFractionDigits: 2,
//     },
//   ).format(value);
// }

// export function MarketplaceProductDetails({
//   listing,
// }: MarketplaceProductDetailsProps) {
//   const t = useTranslations();

//   const cropLabel = t(
//     `dashboard.marketplaceBrowse.crop.${listing.cropKey}`,
//   );

//   const detailItems = [
//     {
//       label: t(
//         'dashboard.marketplaceBrowse.detail.crop',
//       ),
//       value: cropLabel,
//     },

//     {
//       label: t(
//         'dashboard.marketplaceBrowse.detail.quantity',
//       ),
//       value: `${formatNumber( // listing.quantity, // )} ${t( //`dashboard.marketplaceBrowse.unit.${listing.unit}`, // )}`,
//     },

//     {
//       label: t(
//         'dashboard.marketplaceBrowse.detail.pricePerUnit',
//       ),
//       value: `₹${formatNumber( // listing.price, // )} / ${listing.primaryUnit}`,
//     },

//     ...(listing.cropDate
//       ? [
//           {
//             label: t(
//               'dashboard.marketplaceBrowse.detail.cropDate',
//             ),
//             value: listing.cropDate,
//           },
//         ]
//       : []),

//     {
//       label: t(
//         'dashboard.marketplaceBrowse.detail.availability',
//       ),
//       value:
//         listing.availability ===
//         'available'
//           ? t(
//               'dashboard.marketplaceBrowse.detail.available',
//             )
//           : t(
//               'dashboard.marketplaceBrowse.detail.soldOut',
//             ),
//     },

//     ...(listing.variety?.trim()
//       ? [
//           {
//             label: t(
//               'dashboard.marketplaceBrowse.detail.variety',
//             ),
//             value:
//               listing.variety.trim(),
//           },
//         ]
//       : []),
//   ];

//   return (
//     <section className="rounded-2xl bg-surface/[0.035] p-5 sm:p-6">
//       {/* HEADER */}
//       <div className="flex items-center gap-2">
//         <Sprout
//           className="h-5 w-5 text-accent"
//           aria-hidden="true"
//         />

//         <h2 className="text-lg font-bold text-foreground">
//           {t(
//             'dashboard.marketplaceBrowse.detail.productDetails',
//           )}
//         </h2>
//       </div>

//       {/* DETAILS */}
//       <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
//         {detailItems.map((item) => (
//           <div
//             key={item.label}
//             className="min-w-0 rounded-xl bg-surface/[0.025] p-3.5 transition-colors hover:bg-surface/[0.045]"
//           >
//             <span className="block truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
//               {item.label}
//             </span>

//             <span className="mt-1 block truncate text-sm font-semibold text-foreground">
//               {item.value}
//             </span>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }


'use client';

import {
  CalendarDays,
  FileText,
  Package,
  Sprout,
} from 'lucide-react';

import { useLocale, useTranslations } from 'next-intl';

import type { CropListing } from '@/data/marketplace-listings';
import { getLocalizedDomainName } from '@agri/domain-data';

interface MarketplaceProductDetailsProps {
  listing: CropListing;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function MarketplaceProductDetails({
  listing,
}: MarketplaceProductDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();

  const cropLabel = listing.cropKey === 'other' && !listing.customCropName
    ? t('dashboard.marketplaceBrowse.crop.other')
    : getLocalizedDomainName(listing.customCropName || listing.cropKey, locale, 'crop');

  /*
   * IMPORTANT:
   *
   * The description comes directly from the database/API.
   *
   * We trim it so that a description containing only spaces
   * is treated as empty.
   */
  const description =
    listing.description?.trim() || '';

  const detailItems = [
    {
      label: t(
        'dashboard.marketplaceBrowse.detail.crop',
      ),
      value: cropLabel,
    },

    {
      label: t(
        'dashboard.marketplaceBrowse.detail.quantity',
      ),
      value: `${formatNumber( listing.quantity, )} ${t(`dashboard.marketplaceBrowse.unit.${listing.unit}`, )}`,
    },

    {
      label: t(
        'dashboard.marketplaceBrowse.detail.pricePerUnit',
      ),
      value: `₹${formatNumber(
        listing.price,
      )} / ${getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}`,
    },

    ...(listing.cropDate
      ? [
          {
            label: t(
              'dashboard.marketplaceBrowse.detail.cropDate',
            ),
            value: listing.cropDate,
          },
        ]
      : []),

    {
      label: t(
        'dashboard.marketplaceBrowse.detail.availability',
      ),
      value:
        listing.availability === 'available'
          ? t(
              'dashboard.marketplaceBrowse.detail.available',
            )
          : t(
              'dashboard.marketplaceBrowse.detail.soldOut',
            ),
    },

    ...(listing.variety?.trim()
      ? [
          {
            label: t(
              'dashboard.marketplaceBrowse.detail.variety',
            ),
            value: getLocalizedDomainName(listing.variety.trim(), locale, 'variety'),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      {/* =====================================================
          ABOUT THIS PRODUCE

          Show this section ONLY when the seller has entered
          additional details while creating the listing.
         ===================================================== */}

      {description && (
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          {/* HEADER */}
          <div className="flex items-center gap-2">
            <FileText
              className="h-5 w-5 text-accent"
              aria-hidden="true"
            />

            <h2 className="text-lg font-bold text-foreground">
              {t(
                'dashboard.marketplaceBrowse.detail.aboutProduce',
              )}
            </h2>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4">
            <p className="whitespace-pre-line text-sm leading-7 text-foreground">
              {description}
            </p>
          </div>
        </section>
      )}

      {/* =====================================================
          PRODUCT DETAILS
         ===================================================== */}

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {/* HEADER */}
        <div className="flex items-center gap-2">
          <Sprout
            className="h-5 w-5 text-accent"
            aria-hidden="true"
          />

          <h2 className="text-lg font-bold text-foreground">
            {t(
              'dashboard.marketplaceBrowse.detail.productDetails',
            )}
          </h2>
        </div>

        {/* DETAILS */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-xl border border-border bg-surface-subtle p-3.5 transition-colors hover:border-border-strong"
            >
              <span className="block truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>

              <span className="mt-1 block truncate text-sm font-semibold text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
