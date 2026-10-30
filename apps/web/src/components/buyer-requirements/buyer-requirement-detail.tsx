// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Link from 'next/link';
// import { useParams, useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
// import {
//   ArrowLeft,
//   CheckCircle2,
//   Edit3,
//   MapPin,
//   Package,
//   Phone,
//   ShieldCheck,
//   XCircle,
// } from 'lucide-react';
// import { toast } from 'sonner';
// import {
//   closeBuyerRequirement,
//   getBuyerRequirement,
//   type BuyerRequirement,
// } from '@/services/api/buyer-requirements.api';
// import { BuyerRequirementForm } from './buyer-requirement-form';
// import { useAuth } from '@/hooks/use-auth';

// function formatLocation(item: BuyerRequirement) {
//   return [item.village, item.taluka, item.district]
//     .filter(Boolean)
//     .join(',');
// }

// export function BuyerRequirementDetail({ id }: { id: string }) {
//   const t = useTranslations('buyerRequirements');
//   const params = useParams();
//   const router = useRouter();
//   const locale = (params?.locale as string) || 'en';

//   const { user } = useAuth();
//   const [item, setItem] = useState<BuyerRequirement | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(false);
//   const [closing, setClosing] = useState(false);

//   const cropLabels = useMemo(
//     () =>
//       Object.fromEntries([
//         ['cotton', t('crops.cotton')],
//         ['groundnut', t('crops.groundnut')],
//         ['wheat', t('crops.wheat')],
//         ['rice', t('crops.rice')],
//         ['tomato', t('crops.tomato')],
//         ['onion', t('crops.onion')],
//         ['potato', t('crops.potato')],
//         ['chili', t('crops.chili')],
//         ['maize', t('crops.maize')],
//         ['bajra', t('crops.bajra')],
//         ['other', t('crops.other')],
//       ]),
//     [t],
//   );

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const result = await getBuyerRequirement(id);

//         if (!cancelled) {
//           setItem(result);
//         }
//       } catch {
//         if (!cancelled) {
//           toast.error(t('errors.load'));
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [id, t]);

//   if (loading) {
//     return (
//       <div className="mx-auto max-w-3xl px-4 py-8">
//         <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
//       </div>
//     );
//   }

//   if (!item) {
//     return (
//       <div className="mx-auto max-w-3xl px-4 py-10 text-center">
//         <p className="font-semibold text-slate-900">
//           {t('errors.notFound')}
//         </p>

//         <Link
//           href={`/${locale}/dashboard/buyer-requirements`}
//           className="mt-4 inline-flex text-sm font-semibold text-accent"
//         >
//           {t('backToList')}
//         </Link>
//       </div>
//     );
//   }

//   if (editing) {
//     return <BuyerRequirementForm initial={item} mode="edit" />;
//   }

//   const cropName =
//     item.cropKey === 'other'
//       ? item.customCropName || cropLabels.other
//       : cropLabels[item.cropKey];

//   const buyerName =
//     [item.postedBy?.firstName, item.postedBy?.lastName]
//       .filter(Boolean)
//       .join('') || t('card.buyer');

//   const close = async (status: 'cancelled' | 'fulfilled') => {
//     setClosing(true);

//     try {
//       await closeBuyerRequirement(item.id, status);
//       setItem({ ...item, status });

//       toast.success(
//         status === 'fulfilled'
//           ? t('successFulfilled')
//           : t('successCancelled'),
//       );
//     } catch {
//       toast.error(t('errors.close'));
//     } finally {
//       setClosing(false);
//     }
//   };

//   return (
//     <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
//       <button
//         onClick={() => router.back()}
//         className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600"
//       >
//         <ArrowLeft className="h-4 w-4" />
//         {t('backToList')}
//       </button>

//       <article className="rounded-3xl border border-slate-200 bg-surface p-5 shadow-sm sm:p-8">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//           <div>
//             <p className="text-sm font-semibold text-accent">
//               {t('detail.need')}
//             </p>

//             <h1 className="mt-1 text-3xl font-bold text-slate-900">
//               {cropName}
//             </h1>

//             <p className="mt-2 flex items-center gap-2 text-slate-600">
//               <Package className="h-4 w-4" />
//               {item.quantity} {item.unit}
//             </p>

//             {item.variety ? (
//               <p className="mt-1 text-sm font-medium text-slate-500">
//                 {t('form.variety')}: {item.variety}
//               </p>
//             ) : null}
//           </div>

//           {item.postedBy?.isVerified ? (
//             <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-accent">
//               <ShieldCheck className="h-4 w-4" />
//               {t('card.verifiedBuyer')}
//             </span>
//           ) : null}
//         </div>

//         <div className="mt-7 grid gap-3 sm:grid-cols-2">
//           <Info
//             icon={<MapPin className="h-4 w-4" />}
//             label={t('form.location')}
//             value={formatLocation(item)}
//           />

//           <Info
//             icon={<Package className="h-4 w-4" />}
//             label={t('form.quantity')}
//             value={`${item.quantity} ${item.unit}`}
//           />
//         </div>

//         {item.additionalRequirements ? (
//           <div className="mt-5 rounded-2xl bg-slate-50 p-4">
//             <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//               {t('detail.additional')}
//             </p>

//             <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
//               {item.additionalRequirements}
//             </p>
//           </div>
//         ) : null}

//         <div className="mt-6 rounded-2xl border border-slate-200 p-4">
//           <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//             {t('card.buyer')}
//           </p>

//           <p className="mt-1 font-semibold text-slate-900">
//             {buyerName}
//           </p>
//         </div>

//         {item.status === 'active' && item.contact?.phoneNumber ? (
//           <a
//             href={`tel:${item.contact.phoneNumber}`}
//             className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent-strong"
//           >
//             <Phone className="h-4 w-4" />
//             {t('detail.contactBuyer')}
//           </a>
//         ) : null}

//         <div className="mt-5 flex flex-col gap-2 sm:flex-row">
//           <Link
//             href={`/${locale}/dashboard/buyer-requirements`}
//             className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
//           >
//             {t('backToList')}
//           </Link>

//           {item.status === 'active' && item.buyerId === user?.id ? (
//             <>
//               <button
//                 onClick={() => setEditing(true)}
//                 className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
//               >
//                 <Edit3 className="h-4 w-4" />
//                 {t('detail.edit')}
//               </button>

//               <button
//                 disabled={closing}
//                 onClick={() => void close('fulfilled')}
//                 className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-accent disabled:opacity-50"
//               >
//                 <CheckCircle2 className="h-4 w-4" />
//                 {t('detail.fulfilled')}
//               </button>

//               <button
//                 disabled={closing}
//                 onClick={() => void close('cancelled')}
//                 className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 text-sm font-semibold text-danger disabled:opacity-50"
//               >
//                 <XCircle className="h-4 w-4" />
//                 {t('detail.cancel')}
//               </button>
//             </>
//           ) : null}
//         </div>
//       </article>
//     </div>
//   );
// }

// function Info({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string;
// }) {
//   return (
//     <div className="rounded-2xl bg-slate-50 p-4">
//       <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
//         {icon}
//         {label}
//       </div>

//       <p className="mt-1 text-sm font-semibold text-slate-800">
//         {value}
//       </p>
//     </div>
//   );
// }


'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  MapPin,
  X,
  Package,
  Phone,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  closeBuyerRequirement,
  getBuyerRequirement,
  type BuyerRequirement,
} from '@/services/api/buyer-requirements.api';
import { BuyerRequirementForm } from './buyer-requirement-form';
import { useAuth } from '@/hooks/use-auth';
import { getLocalizedDomainName } from '@agri/domain-data';

function formatLocation(item: BuyerRequirement, locale: string) {
  return [
    item.village ? getLocalizedDomainName(item.village, locale, 'village') : '',
    item.taluka ? getLocalizedDomainName(item.taluka, locale, 'taluka') : '',
    item.district ? getLocalizedDomainName(item.district, locale, 'district') : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export function BuyerRequirementDetail({ id }: { id: string }) {
  const t = useTranslations('buyerRequirements');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [item, setItem] = useState<BuyerRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCallConfirmation, setShowCallConfirmation] = useState(false);

  const cropLabels = useMemo(
    () =>
      Object.fromEntries([
        ['cotton', t('crops.cotton')],
        ['groundnut', t('crops.groundnut')],
        ['wheat', t('crops.wheat')],
        ['rice', t('crops.rice')],
        ['tomato', t('crops.tomato')],
        ['onion', t('crops.onion')],
        ['potato', t('crops.potato')],
        ['chili', t('crops.chili')],
        ['maize', t('crops.maize')],
        ['bajra', t('crops.bajra')],
        ['other', t('crops.other')],
      ]),
    [t],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await getBuyerRequirement(id);

        if (!cancelled) {
          setItem(result);
        }
      } catch {
        if (!cancelled) {
          toast.error(t('errors.load'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-3xl bg-surface-subtle" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="font-semibold text-foreground">
          {t('errors.notFound')}
        </p>

        <Link
          href={`/${locale}/dashboard/buyer-requirements`}
          className="mt-4 inline-flex text-sm font-semibold text-accent"
        >
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (editing) {
    return <BuyerRequirementForm initial={item} mode="edit" />;
  }

  const cropValue = item.cropKey === 'other' ? item.customCropName || item.cropKey : item.cropKey;
  const localizedCrop = getLocalizedDomainName(cropValue, locale, 'crop');
  const cropName = localizedCrop !== cropValue
    ? localizedCrop
    : item.cropKey === 'other'
      ? item.customCropName || cropLabels.other
      : cropLabels[item.cropKey];

  const buyerName =
    [item.postedBy?.firstName, item.postedBy?.lastName]
      .filter(Boolean)
      .join(' ') || t('card.buyer');

  const close = async (status: 'cancelled' | 'fulfilled') => {
    setClosing(true);

    try {
      await closeBuyerRequirement(item.id, status);
      setItem({ ...item, status });

      toast.success(
        status === 'fulfilled'
          ? t('successFulfilled')
          : t('successCancelled'),
      );
    } catch {
      toast.error(t('errors.close'));
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToList')}
      </button>

      <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">
              {t('detail.need')}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-foreground">
              {cropName}
            </h1>

            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              {item.quantity} {getLocalizedDomainName(item.unit, locale, 'unit')}
            </p>

            {item.variety ? (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {t('form.variety')}: {getLocalizedDomainName(item.variety, locale, 'variety')}
              </p>
            ) : null}
          </div>

          {item.postedBy?.isVerified ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
              <ShieldCheck className="h-4 w-4" />
              {t('card.verifiedBuyer')}
            </span>
          ) : null}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Info
            icon={<MapPin className="h-4 w-4" />}
            label={t('form.location')}
            value={formatLocation(item, locale)}
          />

          <Info
            icon={<Package className="h-4 w-4" />}
            label={t('form.quantity')}
            value={`${item.quantity} ${getLocalizedDomainName(item.unit, locale, 'unit')}`}
          />
        </div>

        {item.additionalRequirements ? (
          <div className="mt-5 rounded-2xl bg-surface-subtle p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('detail.additional')}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {item.additionalRequirements}
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('card.buyer')}
          </p>

          <p className="mt-1 font-semibold text-foreground">
            {buyerName}
          </p>
        </div>

        {item.status === 'active' && item.contact?.phoneNumber ? (
          <button
            type="button"
            onClick={() => setShowCallConfirmation(true)}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t('detail.contactBuyer')}
          </button>
        ) : null}

        {item.status === 'active' && !isAuthenticated && !authLoading ? (
          <Link
            href={`/${locale}/auth`}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-surface-subtle px-5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t('detail.signInToContact')}
          </Link>
        ) : null}

        {showCallConfirmation && item.contact?.phoneNumber ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-buyer-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="call-buyer-title"
                    className="text-lg font-bold text-foreground"
                  >
                    {t('detail.contactBuyer')}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t('detail.callConfirmationText')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCallConfirmation(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
                  aria-label={t('detail.cancelCall')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-surface-subtle p-4">
                <p className="text-xs text-muted-foreground">
                  {buyerName}
                </p>

                <p className="mt-1 text-xl font-bold tracking-wide text-foreground">
                  {item.contact.phoneNumber}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallConfirmation(false)}
                  className="h-11 rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
                >
                  {t('detail.cancelCall')}
                </button>

                <a
                  href={`tel:${item.contact.phoneNumber}`}
                  onClick={() => setShowCallConfirmation(false)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {t('detail.confirmCall')}
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/${locale}/dashboard/buyer-requirements`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground"
          >
            {t('backToList')}
          </Link>

          {item.status === 'active' && item.buyerId === user?.id ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground"
              >
                <Edit3 className="h-4 w-4" />
                {t('detail.edit')}
              </button>

              <button
                disabled={closing}
                onClick={() => void close('fulfilled')}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-soft px-4 text-sm font-semibold text-accent disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('detail.fulfilled')}
              </button>

              <button
                disabled={closing}
                onClick={() => void close('cancelled')}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 text-sm font-semibold text-danger disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {t('detail.cancel')}
              </button>
            </>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-subtle p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
