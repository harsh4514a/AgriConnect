// 'use client';

// import {
//   UserCheck,
//   ShieldCheck,
//   Calendar,
//   Package,
// } from 'lucide-react';

// import { useTranslations } from 'next-intl';
// import type { CropListing } from '@/data/marketplace-listings';

// import { Avatar } from '@/components/dashboard/avatar';

// interface MarketplaceFarmerCardProps {
//   listing: CropListing;
// }

// export function MarketplaceFarmerCard({
//   listing,
// }: MarketplaceFarmerCardProps) {
//   const t = useTranslations();

//   const memberSinceYear =
//     listing.farmerMemberSince ??
//     2023;

//   const listingCount =
//     listing.farmerListingCount ?? 0;

//   return (
//     <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-6">
//       {/* HEADER */}
//       <div className="flex items-center gap-2 text-white">
//         <UserCheck
//           className="h-5 w-5 text-emerald-300"
//           aria-hidden="true"
//         />

//         <h2 className="text-lg font-bold">
//           {t(
//             'dashboard.marketplaceBrowse.detail.aboutFarmer',
//           )}
//         </h2>
//       </div>

//       <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
//         {/* FARMER */}
//         <div className="flex items-center gap-4">
//           <Avatar
//             name={listing.farmerName}
//             className="h-14 w-14 text-lg font-bold shadow-lg ring-2 ring-emerald-400/20"
//           />

//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-2">
//               <h3 className="text-base font-bold text-white">
//                 {listing.farmerName}
//               </h3>

//               {listing.verified && (
//                 <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
//                   <ShieldCheck
//                     className="h-3 w-3"
//                     aria-hidden="true"
//                   />

//                   {t(
//                     'dashboard.marketplaceBrowse.detail.verifiedSeller',
//                   )}
//                 </span>
//               )}
//             </div>

//             <p className="mt-1 text-xs text-white/40">
//               {t(
//                 'dashboard.marketplaceBrowse.detail.verifiedSeller',
//               )}
//             </p>
//           </div>
//         </div>

//         {/* STATS */}
//         <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
//           {/* MEMBER SINCE */}
//           <div className="rounded-xl border border-white/7 bg-white/[0.02] px-3.5 py-2.5">
//             <div className="flex items-center gap-1.5 text-[11px] text-white/45">
//               <Calendar
//                 className="h-3 w-3 text-emerald-400"
//                 aria-hidden="true"
//               />

//               <span>
//                 {t(
//                   'dashboard.marketplaceBrowse.detail.memberSince',
//                   {
//                     year: memberSinceYear,
//                   },
//                 )}
//               </span>
//             </div>
//           </div>

//           {/* ACTIVE LISTINGS */}
//           <div className="rounded-xl border border-white/7 bg-white/[0.02] px-3.5 py-2.5">
//             <div className="flex items-center gap-1.5 text-[11px] text-white/45">
//               <Package
//                 className="h-3 w-3 text-emerald-400"
//                 aria-hidden="true"
//               />

//               <span>
//                 {t(
//                   'dashboard.marketplaceBrowse.detail.activeListings',
//                   {
//                     count: listingCount,
//                   },
//                 )}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import {
  UserCheck,
  ShieldCheck,
  Calendar,
  Package,
} from 'lucide-react';

import { useTranslations } from 'next-intl';
import type { CropListing } from '@/data/marketplace-listings';

import { Avatar } from '@/components/dashboard/avatar';

interface MarketplaceFarmerCardProps {
  listing: CropListing;
}

export function MarketplaceFarmerCard({
  listing,
}: MarketplaceFarmerCardProps) {
  const t = useTranslations();

  const memberSinceYear =
    listing.farmerMemberSince ??
    2023;

  const listingCount =
    listing.farmerListingCount ?? 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-2 text-white">
        <UserCheck
          className="h-5 w-5 text-emerald-300"
          aria-hidden="true"
        />

        <h2 className="text-lg font-bold">
          {t(
            'dashboard.marketplaceBrowse.detail.aboutFarmer',
          )}
        </h2>
      </div>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* FARMER */}
        <div className="flex items-center gap-4">
          <Avatar
            name={listing.farmerName}
            className="h-14 w-14 text-lg font-bold shadow-lg ring-2 ring-emerald-400/20"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {listing.farmerName}
              </h3>

              {listing.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck
                    className="h-3 w-3"
                    aria-hidden="true"
                  />

                  {t(
                    'dashboard.marketplaceBrowse.detail.verifiedSeller',
                  )}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {/* MEMBER SINCE */}
          <div className="rounded-xl bg-white/[0.02] px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-white/45">
              <Calendar
                className="h-3 w-3 text-emerald-400"
                aria-hidden="true"
              />

              <span>
                {t(
                  'dashboard.marketplaceBrowse.detail.memberSince',
                  {
                    year: memberSinceYear,
                  },
                )}
              </span>
            </div>
          </div>

          {/* ACTIVE LISTINGS */}
          <div className="rounded-xl bg-white/[0.02] px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-white/45">
              <Package
                className="h-3 w-3 text-emerald-400"
                aria-hidden="true"
              />

              <span>
                {t(
                  'dashboard.marketplaceBrowse.detail.activeListings',
                  {
                    count: listingCount,
                  },
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
