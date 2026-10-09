// 'use client';

// import { useMemo, useState } from 'react';
// import {
//   MessageCircle,
//   Phone,
//   ShieldCheck,
//   X,
// } from 'lucide-react';
// import { useTranslations } from 'next-intl';

// import type { CropListing } from '@/data/marketplace-listings';
// import { cn } from '@/utils/cn';

// interface MarketplaceContactActionProps {
//   listing: CropListing;
//   variant?: 'desktop' | 'mobile-sticky';
// }

// function formatPrice(price: number): string {
//   return new Intl.NumberFormat('en-IN', {
//     maximumFractionDigits: 0,
//   }).format(price);
// }

// function getWhatsAppNumber(mobileNumber: string): string {
//   return mobileNumber.replace(/\D/g, '');
// }

// export function MarketplaceContactAction({
//   listing,
//   variant = 'desktop',
// }: MarketplaceContactActionProps) {
//   const t = useTranslations();

//   const [showCallConfirmation, setShowCallConfirmation] =
//     useState(false);

//   const cropLabel = t(
//     `dashboard.marketplaceBrowse.crop.${listing.cropKey}`,
//   );

//   /**
//    * WhatsApp inquiry.
//    *
//    * The message is automatically placed in the WhatsApp
//    * chat input when the buyer clicks WhatsApp.
//    */
//   const whatsappUrl = useMemo(() => {
//     const number = getWhatsAppNumber(listing.mobileNumber);

//     const message = [
//       `Hello ${listing.farmerName},`,
//       '',
//       `I am interested in your ${cropLabel} listing on AgriConnect.`,
//       `Quantity: ${listing.quantity} ${listing.unit}`,
//       `Price: ₹${formatPrice(listing.price)} / ${listing.primaryUnit}`,
//       '',
//       'Is this produce still available? I would like to discuss the purchase.',
//     ].join('\n');

//     return `https://wa.me/${number}?text=${encodeURIComponent(
//       message,
//     )}`;
//   }, [cropLabel, listing]);

//   const handleConfirmCall = () => {
//     setShowCallConfirmation(false);

//     window.location.href = `tel:${listing.mobileNumber}`;
//   };

//   const contactButtons = (
//     <div className="grid grid-cols-2 gap-2">
//       {/* CALL FARMER */}
//       <button
//         type="button"
//         onClick={() => setShowCallConfirmation(true)}
//         aria-label={`${t(
//           'dashboard.marketplaceBrowse.detail.callFarmer',
//         )} ${listing.farmerNameShort}`}
//         className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-green-400"
//         style={{
//           background:
//             'linear-gradient(135deg, #2E7D32, #1B5E20)',
//           boxShadow:
//             '0 4px 18px rgba(46,125,50,0.35)',
//         }}
//       >
//         <Phone
//           className="h-4 w-4"
//           aria-hidden="true"
//         />

//         <span>
//           {t(
//             'dashboard.marketplaceBrowse.detail.callFarmer',
//           )}
//         </span>
//       </button>

//       {/* WHATSAPP */}
//       <a
//         href={whatsappUrl}
//         target="_blank"
//         rel="noopener noreferrer"
//         aria-label={`${t(
//           'dashboard.marketplaceBrowse.detail.whatsappFarmer',
//         )} ${listing.farmerNameShort}`}
//         className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-green-400"
//       >
//         <MessageCircle
//           className="h-4 w-4"
//           aria-hidden="true"
//         />

//         <span>
//           {t(
//             'dashboard.marketplaceBrowse.detail.whatsappFarmer',
//           )}
//         </span>
//       </a>
//     </div>
//   );

//   return (
//     <>
//       {/* DESKTOP */}
//       {variant === 'desktop' && (
//         <div className="space-y-3">
//           {contactButtons}

//           <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-white/50">
//             <ShieldCheck
//               className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400"
//               aria-hidden="true"
//             />

//             <span>
//               {t(
//                 'dashboard.marketplaceBrowse.detail.trustNotice',
//               )}
//             </span>
//           </div>
//         </div>
//       )}

//       {/* MOBILE STICKY CONTACT BAR */}
//       {variant === 'mobile-sticky' && (
//         <div
//           className="fixed inset-x-0 bottom-16 z-40 border-t border-white/10 p-3 backdrop-blur-2xl lg:hidden"
//           style={{
//             background: 'rgba(7, 24, 13, 0.94)',
//           }}
//         >
//           <div className="mx-auto max-w-lg">
//             <div className="mb-2 flex items-center gap-3">
//               <div className="min-w-0 flex-1">
//                 <div className="truncate text-xs font-semibold text-white/90">
//                   {listing.farmerNameShort}
//                 </div>

//                 <div className="flex items-center gap-1 text-[11px] text-green-300">
//                   <ShieldCheck
//                     className="h-3 w-3 shrink-0"
//                     aria-hidden="true"
//                   />

//                   <span>
//                     {t(
//                       'dashboard.marketplaceBrowse.detail.verifiedSeller',
//                     )}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {contactButtons}
//           </div>
//         </div>
//       )}

//       {/* CALL CONFIRMATION MODAL */}
//       {showCallConfirmation && (
//         <div
//           className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="call-farmer-title"
//         >
//           <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#123b23] p-5 shadow-2xl sm:p-6">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h2
//                   id="call-farmer-title"
//                   className="text-lg font-bold text-white"
//                 >
//                   {t(
//                     'dashboard.marketplaceBrowse.detail.callFarmer',
//                   )}
//                 </h2>

//                 <p className="mt-1 text-sm text-white/60">
//                   {t(
//                     'dashboard.marketplaceBrowse.detail.callConfirmationText',
//                   )}
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setShowCallConfirmation(false)
//                 }
//                 className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
//                 aria-label={t(
//                   'dashboard.marketplaceBrowse.detail.cancelCall',
//                 )}
//               >
//                 <X
//                   className="h-4 w-4"
//                   aria-hidden="true"
//                 />
//               </button>
//             </div>

//             {/* PHONE NUMBER */}
//             <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
//               <div className="text-xs text-white/50">
//                 {listing.farmerName}
//               </div>

//               <div className="mt-1 text-xl font-bold tracking-wide text-white">
//                 {listing.mobileNumber}
//               </div>
//             </div>

//             {/* ACTIONS */}
//             <div className="mt-5 grid grid-cols-2 gap-2">
//               <button
//                 type="button"
//                 onClick={() =>
//                   setShowCallConfirmation(false)
//                 }
//                 className={cn(
//                   'h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/80 transition-colors',
//                   'hover:bg-white/10 hover:text-white',
//                 )}
//               >
//                 {t(
//                   'dashboard.marketplaceBrowse.detail.cancelCall',
//                 )}
//               </button>

//               <button
//                 type="button"
//                 onClick={handleConfirmCall}
//                 className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-bold text-white transition-colors hover:bg-green-500"
//               >
//                 <Phone
//                   className="h-4 w-4"
//                   aria-hidden="true"
//                 />

//                 {t(
//                   'dashboard.marketplaceBrowse.detail.confirmCall',
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
'use client';

import {
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { CropListing } from '@/data/marketplace-listings';

interface MarketplaceContactActionProps {
  listing: CropListing;
  variant?: 'desktop' | 'mobile-sticky';
}

function formatPrice(
  price: number,
): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(price);
}

function getWhatsAppNumber(
  mobileNumber: string,
): string {
  const digits =
    mobileNumber.replace(/\D/g, '');

  /*
   * Database numbers normally contain +91.
   * If a 10-digit Indian number is stored,
   * add the country code automatically.
   */
  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (
    digits.startsWith('91') &&
    digits.length === 12
  ) {
    return digits;
  }

  return digits;
}

export function MarketplaceContactAction({
  listing,
  variant = 'desktop',
}: MarketplaceContactActionProps) {
  const t = useTranslations();

  const [
    showCallConfirmation,
    setShowCallConfirmation,
  ] = useState(false);

  const whatsappUrl = useMemo(() => {
    const number =
      getWhatsAppNumber(
        listing.mobileNumber,
      );

    const message = [
      `Hello ${listing.farmerNameShort},`,
      '',
      `I am interested in your ${listing.cropKey} listing on AgriConnect.`,
      `Quantity: ${listing.quantity} ${listing.unit}`,
      `Price: ₹${formatPrice(listing.price)} / ${listing.primaryUnit}`,
      '',
      'Is this produce still available? I would like to discuss the purchase.',
    ].join('\n');

    return `https://wa.me/${number}?text=${encodeURIComponent(
      message,
    )}`;
  }, [listing]);

  const callButton = (
    <button
      type="button"
      onClick={() =>
        setShowCallConfirmation(true)
      }
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 px-5 text-sm font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-green-400"
    >
      <Phone
        className="h-4 w-4"
        aria-hidden="true"
      />

      {t(
        'dashboard.marketplaceBrowse.detail.callFarmer',
      )}
    </button>
  );

  const whatsappButton = (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 text-sm font-bold text-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-400/[0.12] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-400"
    >
      <MessageCircle
        className="h-4 w-4"
        aria-hidden="true"
      />

      {t(
        'dashboard.marketplaceBrowse.detail.whatsappFarmer',
      )}
    </a>
  );

  return (
    <>
      {variant === 'mobile-sticky' ? (
        <div
          className="fixed inset-x-0 bottom-16 z-40 border-t border-white/10 p-3 backdrop-blur-2xl lg:hidden"
          style={{
            background:
              'rgba(7, 24, 13, 0.95)',
          }}
        >
          <div className="mx-auto max-w-lg">
            <div className="mb-2 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white/90">
                  {listing.farmerNameShort}
                </p>

                {listing.verified && (
                  <p className="flex items-center gap-1 text-[11px] text-emerald-300">
                    <ShieldCheck
                      className="h-3 w-3"
                      aria-hidden="true"
                    />

                    {t(
                      'dashboard.marketplaceBrowse.detail.verifiedSeller',
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {callButton}
              {whatsappButton}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {callButton}
            {whatsappButton}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-white/7 bg-white/[0.02] p-3 text-[11px] leading-5 text-white/40">
            <ShieldCheck
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />

            <span>
              {t(
                'dashboard.marketplaceBrowse.detail.trustNotice',
              )}
            </span>
          </div>
        </div>
      )}

      {/* CALL CONFIRMATION */}
      {showCallConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-farmer-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#123b23] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="call-farmer-title"
                  className="text-lg font-bold text-white"
                >
                  {t(
                    'dashboard.marketplaceBrowse.detail.callFarmer',
                  )}
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/55">
                  {t(
                    'dashboard.marketplaceBrowse.detail.callConfirmationText',
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCallConfirmation(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t(
                  'dashboard.marketplaceBrowse.detail.cancelCall',
                )}
              >
                <X
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs text-white/40">
                {listing.farmerName}
              </p>

              <p className="mt-1 text-xl font-bold tracking-wide text-white">
                {listing.mobileNumber}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowCallConfirmation(false)
                }
                className="h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(
                  'dashboard.marketplaceBrowse.detail.cancelCall',
                )}
              </button>

              <a
                href={`tel:${listing.mobileNumber}`}
                onClick={() =>
                  setShowCallConfirmation(false)
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-bold text-white transition-colors hover:bg-green-500"
              >
                <Phone
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {t(
                  'dashboard.marketplaceBrowse.detail.confirmCall',
                )}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}