// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
// import {
//   ArrowLeft,
//   Check,
//   Edit3,
//   MapPin,
//   Package,
//   Phone,
//   Loader2,
// } from 'lucide-react';
// import { toast } from 'sonner';
// import {
//   GUJARAT_LOCATIONS,
//   getTalukasByDistrict,
//   getVillagesByTaluka,
// } from '@/data/gujarat-locations';
// import { useProfileLocation } from '@/hooks/use-profile-location';
// import { useAuth } from '@/hooks/use-auth';
// import { getProfile } from '@/services/api/auth.api';
// import {
//   createBuyerRequirement,
//   updateBuyerRequirement,
//   type BuyerRequirement,
//   type BuyerRequirementCropKey,
//   type BuyerRequirementUnit,
//   type CreateBuyerRequirementPayload,
// } from '@/services/api/buyer-requirements.api';

// const CROP_KEYS: BuyerRequirementCropKey[] = [
//   'cotton',
//   'groundnut',
//   'wheat',
//   'rice',
//   'tomato',
//   'onion',
//   'potato',
//   'chili',
//   'maize',
//   'bajra',
//   'other',
// ];

// function makeSubmissionKey() {
//   if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
//     return crypto.randomUUID();
//   }

//   return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
// }

// function normalizeIndianMobile(value: string) {
//   const digits = value.replace(/\D/g, '');

//   if (digits.length === 10) return `+91${digits}`;
//   if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;

//   return value.trim();
// }

// function formatLocation(
//   district?: string,
//   taluka?: string,
//   village?: string,
// ) {
//   return [village, taluka, district]
//     .map((value) => value?.trim())
//     .filter(Boolean)
//     .join(',');
// }

// export function BuyerRequirementForm({
//   initial,
//   mode = 'create',
// }: {
//   initial?: BuyerRequirement;
//   mode?: 'create' | 'edit';
// }) {
//   const t = useTranslations('buyerRequirements');
//   const params = useParams();
//   const router = useRouter();
//   const locale = (params?.locale as string) || 'en';

//   const { user, isLoading: authLoading } = useAuth();
//   const {
//     district: profileDistrict,
//     taluka: profileTaluka,
//     village: profileVillage,
//   } = useProfileLocation();

//   const [cropKey, setCropKey] = useState<BuyerRequirementCropKey>(
//     initial?.cropKey || 'cotton',
//   );
//   const [customCropName, setCustomCropName] = useState(
//     initial?.customCropName || '',
//   );
//   const [variety, setVariety] = useState(initial?.variety || '');
//   const [quantity, setQuantity] = useState(
//     String(initial?.quantity ?? ''),
//   );
//   const [unit, setUnit] = useState<BuyerRequirementUnit>(
//     initial?.unit || 'kg',
//   );

//   const [district, setDistrict] = useState(initial?.district || '');
//   const [taluka, setTaluka] = useState(initial?.taluka || '');
//   const [village, setVillage] = useState(initial?.village || '');

//   const [contactNumber, setContactNumber] = useState(
//     initial?.contact?.phoneNumber || '',
//   );

//   const [additionalRequirements, setAdditionalRequirements] = useState(
//     initial?.additionalRequirements || '',
//   );

//   const [editingLocation, setEditingLocation] = useState(
//     mode === 'edit'
//       ? !Boolean(initial?.district && initial?.taluka && initial?.village)
//       : false,
//   );
//   const [editingContact, setEditingContact] = useState(
//     mode === 'edit' ? !Boolean(initial?.contact?.phoneNumber) : false,
//   );
//   const [showNote, setShowNote] = useState(
//     Boolean(initial?.additionalRequirements),
//   );

//   // Form UI state. Keep these local to the form so preview/validation/submission
//   // never depend on undeclared variables.
//   const [preview, setPreview] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const locationTouchedRef = useRef(false);
//   const contactTouchedRef = useRef(false);
//   const profilePrefillStartedRef = useRef(false);

//   /*
//    * Create mode: use the authenticated profile as the source for the initial
//    * location/contact values. The auth hook normally provides this data, but we
//    * also fetch the profile directly when the cached user does not contain the
//    * location. This makes the form reliable after a fresh login or hard refresh.
//    *
//    * IMPORTANT: once the user edits a field, profile data can never overwrite it.
//    */
//   useEffect(() => {
//     if (mode === 'edit' || authLoading || profilePrefillStartedRef.current) {
//       return;
//     }

//     profilePrefillStartedRef.current = true;

//     const applyProfile = (profile: {
//       district?: string | null;
//       taluka?: string | null;
//       village?: string | null;
//       mobileNumber?: string | null;
//     }) => {
//       if (!locationTouchedRef.current) {
//         const rawDistrict = profile.district?.trim() || '';
//         const canonicalDistrict =
//           GUJARAT_LOCATIONS.find(
//             (item) => item.name.toLowerCase() === rawDistrict.toLowerCase(),
//           )?.name || rawDistrict;

//         const districtData = GUJARAT_LOCATIONS.find(
//           (item) => item.name.toLowerCase() === canonicalDistrict.toLowerCase(),
//         );

//         const rawTaluka = profile.taluka?.trim() || '';
//         const canonicalTaluka =
//           districtData?.talukas.find(
//             (item) => item.name.toLowerCase() === rawTaluka.toLowerCase(),
//           )?.name || rawTaluka;

//         const talukaData = districtData?.talukas.find(
//           (item) => item.name.toLowerCase() === canonicalTaluka.toLowerCase(),
//         );

//         const rawVillage = profile.village?.trim() || '';
//         const canonicalVillage =
//           talukaData?.villages.find(
//             (item) => item.toLowerCase() === rawVillage.toLowerCase(),
//           ) || rawVillage;

//         setDistrict((current) => current || canonicalDistrict);
//         setTaluka((current) => current || canonicalTaluka);
//         setVillage((current) => current || canonicalVillage);

//         if (canonicalDistrict && canonicalTaluka && canonicalVillage) {
//           setEditingLocation(false);
//         }
//       }

//       if (!contactTouchedRef.current) {
//         const nextPhone = profile.mobileNumber?.trim() || '';
//         setContactNumber((current) => current || nextPhone);
//         if (nextPhone) setEditingContact(false);
//       }
//     };

//     /*
//      * Always prefer the live profile endpoint in create mode. The cached
//      * DashboardUser can legitimately contain the mobile number while its
//      * location is missing/stale, so checking only `user?.mobileNumber` can
//      * incorrectly skip the profile request.
//      */
//     void getProfile()
//       .then((profile) => {
//         applyProfile({
//           district: profile.district?.name,
//           taluka: profile.taluka?.name,
//           village: profile.village?.name,
//           mobileNumber: profile.mobileNumber,
//         });
//       })
//       .catch(() => {
//         // Fall back to the already-resolved auth user if the profile request fails.
//         applyProfile({
//           district: user?.location?.district,
//           taluka: user?.location?.taluka,
//           village: user?.location?.village,
//           mobileNumber: user?.mobileNumber,
//         });
//       });
//   }, [authLoading, mode, user]);

//   const districts = useMemo(
//     () =>
//       GUJARAT_LOCATIONS.map((item) => item.name).sort((a, b) =>
//         a.localeCompare(b),
//       ),
//     [],
//   );

//   const talukas = useMemo(
//     () => getTalukasByDistrict(district),
//     [district],
//   );

//   const villages = useMemo(
//     () => getVillagesByTaluka(district, taluka),
//     [district, taluka],
//   );

//   const cropLabels = useMemo(
//     () =>
//       Object.fromEntries(
//         CROP_KEYS.map((key) => [key, t(`crops.${key}`)]),
//       ) as Record<BuyerRequirementCropKey, string>,
//     [t],
//   );

//   const validate = () => {
//     const next: Record<string, string> = {};
//     const numericQuantity = Number(quantity);
//     const normalizedContact = normalizeIndianMobile(contactNumber);

//     if (!cropKey) next.cropKey = t('form.errors.crop');

//     if (cropKey === 'other' && !customCropName.trim()) {
//       next.customCropName = t('form.errors.customCrop');
//     }

//     if (variety.trim().length > 100) {
//       next.variety = t('form.errors.variety');
//     }

//     if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
//       next.quantity = t('form.errors.quantity');
//     }

//     if (!district.trim()) {
//       next.district = t('form.errors.location');
//     }

//     if (!taluka.trim()) {
//       next.taluka = t('form.errors.location');
//     }

//     if (!village.trim()) {
//       next.village = t('form.errors.location');
//     }

//     if (!/^\+91\d{10}$/.test(normalizedContact)) {
//       next.contactNumber = t('form.errors.contactNumber');
//     }

//     setErrors(next);
//     return Object.keys(next).length === 0;
//   };

//   const payload = (): CreateBuyerRequirementPayload => ({
//     cropKey,
//     customCropName:
//       cropKey === 'other' ? customCropName.trim() : undefined,
//     variety: variety.trim() || undefined,
//     quantity: Number(quantity),
//     unit,
//     district: district.trim(),
//     taluka: taluka.trim(),
//     village: village.trim(),
//     contactNumber: normalizeIndianMobile(contactNumber),
//     additionalRequirements:
//       additionalRequirements.trim() || undefined,
//   });

//   const publish = async () => {
//     if (!validate()) {
//       setPreview(false);
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const result =
//         mode === 'edit' && initial
//           ? await updateBuyerRequirement(initial.id, payload())
//           : await createBuyerRequirement({
//               ...payload(),
//               submissionKey: makeSubmissionKey(),
//             });

//       toast.success(mode === 'edit' ? t('updated') : t('success'));
//       router.replace(
//         `/${locale}/dashboard/buyer-requirements/${result.id}`,
//       );
//     } catch {
//       toast.error(t('errors.publish'));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const inputClass = (key?: string) =>
//     `mt-1 h-11 w-full rounded-xl border bg-surface px-3 text-sm text-slate-900 outline-none transition focus:border-focus focus:ring-2 focus:ring-focus ${
//       key && errors[key] ? 'border-red-400' : 'border-slate-200'
//     }`;

//   const locationText = formatLocation(district, taluka, village);
//   const normalizedContact = normalizeIndianMobile(contactNumber);

//   if (preview) {
//     return (
//       <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
//         <button
//           onClick={() => setPreview(false)}
//           className="mb-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           {t('form.back')}
//         </button>

//         <div className="rounded-3xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-6">
//           <div className="flex items-start gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-accent">
//               <Check className="h-5 w-5" />
//             </div>

//             <div>
//               <h1 className="text-xl font-bold text-slate-900">
//                 {t(
//                   mode === 'edit'
//                     ? 'form.editPreviewTitle'
//                     : 'form.previewTitle',
//                 )}
//               </h1>
//               <p className="mt-1 text-sm text-slate-500">
//                 {t(
//                   mode === 'edit'
//                     ? 'form.editPreviewDescription'
//                     : 'form.previewDescription',
//                 )}
//               </p>
//             </div>
//           </div>

//           <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-5">
//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                 {t('form.crop')}
//               </p>
//               <p className="mt-1 text-lg font-bold text-slate-900">
//                 {cropKey === 'other'
//                   ? customCropName
//                   : cropLabels[cropKey]}
//               </p>
//               {variety.trim() ? (
//                 <p className="mt-1 text-sm font-medium text-slate-500">
//                   {t('form.variety')}: {variety.trim()}
//                 </p>
//               ) : null}
//             </div>

//             <div className="grid gap-4 sm:grid-cols-2">
//               <PreviewItem
//                 icon={<Package className="h-4 w-4" />}
//                 label={t('form.quantity')}
//                 value={`${quantity} ${unit}`}
//               />

//               <PreviewItem
//                 icon={<MapPin className="h-4 w-4" />}
//                 label={t('form.location')}
//                 value={locationText || '—'}
//               />

//               <PreviewItem
//                 icon={<Phone className="h-4 w-4" />}
//                 label={t('form.contactNumber')}
//                 value={normalizedContact}
//               />
//             </div>

//             {additionalRequirements.trim() ? (
//               <div className="border-t border-slate-200 pt-4">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                   {t('form.note')}
//                 </p>
//                 <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
//                   {additionalRequirements.trim()}
//                 </p>
//               </div>
//             ) : null}
//           </div>

//           <button
//             disabled={submitting}
//             onClick={() => void publish()}
//             className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {submitting ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 {t('form.publishing')}
//               </>
//             ) : (
//               t('form.publish')
//             )}
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-5">
//       <button
//         onClick={() => router.back()}
//         className="mb-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600"
//       >
//         <ArrowLeft className="h-4 w-4" />
//         {t('form.back')}
//       </button>

//       <div className="rounded-3xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-6">
//         <h1 className="text-2xl font-bold text-slate-900">
//           {t(mode === 'edit' ? 'form.editTitle' : 'form.title')}
//         </h1>
//         <p className="mt-1 text-sm text-slate-500">
//           {t(
//             mode === 'edit'
//               ? 'form.editDescription'
//               : 'form.description',
//           )}
//         </p>

//         <div className="mt-5 space-y-5">
//           <FormSection number="1" title={t('form.need')}>
//             <div className="grid gap-4 sm:grid-cols-[1.35fr_1fr]">
//               <label className="text-sm font-semibold text-slate-700">
//                 {t('form.crop')}
//                 <select
//                   value={cropKey}
//                   onChange={(event) =>
//                     setCropKey(
//                       event.target.value as BuyerRequirementCropKey,
//                     )
//                   }
//                   className={inputClass('cropKey')}
//                 >
//                   {CROP_KEYS.map((key) => (
//                     <option key={key} value={key}>
//                       {cropLabels[key]}
//                     </option>
//                   ))}
//                 </select>
//               </label>

//               <label className="text-sm font-semibold text-slate-700">
//                 {t('form.variety')}
//                 <input
//                   value={variety}
//                   onChange={(event) => setVariety(event.target.value)}
//                   maxLength={100}
//                   placeholder={t('form.varietyPlaceholder')}
//                   className={inputClass('variety')}
//                 />
//                 {errors.variety ? (
//                   <ErrorText text={errors.variety} />
//                 ) : null}
//               </label>
//             </div>

//             {cropKey === 'other' ? (
//               <label className="mt-3 block text-sm font-semibold text-slate-700">
//                 {t('form.customCrop')}
//                 <input
//                   value={customCropName}
//                   onChange={(event) =>
//                     setCustomCropName(event.target.value)
//                   }
//                   maxLength={100}
//                   className={inputClass('customCropName')}
//                 />
//                 {errors.customCropName ? (
//                   <ErrorText text={errors.customCropName} />
//                 ) : null}
//               </label>
//             ) : null}
//           </FormSection>

//           <FormSection number="2" title={t('form.amount')}>
//             <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
//               <label className="text-sm font-semibold text-slate-700">
//                 {t('form.quantity')}
//                 <input
//                   type="number"
//                   min="0.01"
//                   step="0.01"
//                   inputMode="decimal"
//                   value={quantity}
//                   onChange={(event) =>
//                     setQuantity(event.target.value)
//                   }
//                   className={inputClass('quantity')}
//                 />
//                 {errors.quantity ? (
//                   <ErrorText text={errors.quantity} />
//                 ) : null}
//               </label>

//               <label className="text-sm font-semibold text-slate-700">
//                 {t('form.unit')}
//                 <select
//                   value={unit}
//                   onChange={(event) =>
//                     setUnit(event.target.value as BuyerRequirementUnit)
//                   }
//                   className={inputClass()}
//                 >
//                   <option value="kg">{t('units.kg')}</option>
//                   <option value="quintal">{t('units.quintal')}</option>
//                   <option value="ton">{t('units.ton')}</option>
//                 </select>
//               </label>
//             </div>
//           </FormSection>

//           <FormSection number="3" title={t('form.location')}>
//             {!editingLocation && locationText ? (
//               <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
//                 <div className="flex items-start gap-3">
//                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent shadow-sm">
//                     <MapPin className="h-5 w-5" />
//                   </div>

//                   <div className="min-w-0 flex-1">
//                     <p className="text-sm font-semibold text-slate-900">
//                       {locationText}
//                     </p>
//                     <p className="mt-1 text-xs text-slate-500">
//                       {t('form.profileLocationHint')}
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() => setEditingLocation(true)}
//                     className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                   >
//                     <Edit3 className="h-3.5 w-3.5" />
//                     {t('form.edit')}
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   {t('form.district')}
//                   <select
//                     value={district}
//                     onChange={(event) => {
//                       locationTouchedRef.current = true;
//                       setDistrict(event.target.value);
//                       setTaluka('');
//                       setVillage('');
//                     }}
//                     className={inputClass('district')}
//                   >
//                     <option value="">
//                       {t('form.selectDistrict')}
//                     </option>
//                     {districts.map((item) => (
//                       <option key={item} value={item}>
//                         {item}
//                       </option>
//                     ))}
//                   </select>
//                   {errors.district ? (
//                     <ErrorText text={errors.district} />
//                   ) : null}
//                 </label>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <label className="text-sm font-semibold text-slate-700">
//                     {t('form.taluka')}
//                     <select
//                       value={taluka}
//                       onChange={(event) => {
//                         locationTouchedRef.current = true;
//                         setTaluka(event.target.value);
//                         setVillage('');
//                       }}
//                       disabled={!district}
//                       className={inputClass('taluka')}
//                     >
//                       <option value="">
//                         {t('form.selectTaluka')}
//                       </option>
//                       {talukas.map((item) => (
//                         <option key={item} value={item}>
//                           {item}
//                         </option>
//                       ))}
//                     </select>
//                     {errors.taluka ? (
//                       <ErrorText text={errors.taluka} />
//                     ) : null}
//                   </label>

//                   <label className="text-sm font-semibold text-slate-700">
//                     {t('form.village')}
//                     <select
//                       value={village}
//                       onChange={(event) => {
//                         locationTouchedRef.current = true;
//                         setVillage(event.target.value);
//                       }}
//                       disabled={!taluka}
//                       className={inputClass('village')}
//                     >
//                       <option value="">
//                         {t('form.selectVillage')}
//                       </option>
//                       {villages.map((item) => (
//                         <option key={item} value={item}>
//                           {item}
//                         </option>
//                       ))}
//                     </select>
//                     {errors.village ? (
//                       <ErrorText text={errors.village} />
//                     ) : null}
//                   </label>
//                 </div>

//                 <div className="flex justify-end gap-2">
//                   {locationText ? (
//                     <button
//                       type="button"
//                       disabled={!district.trim() || !taluka.trim() || !village.trim()}
//                       onClick={() => {
//                         if (district.trim() && taluka.trim() && village.trim()) {
//                           setEditingLocation(false);
//                         }
//                       }}
//                       className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-surface"
//                     >
//                       {t('form.done')}
//                     </button>
//                   ) : null}
//                 </div>
//               </div>
//             )}
//           </FormSection>

//           <FormSection number="4" title={t('form.contactAndNote')}>
//             <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
//               <div>
//                 {!editingContact && contactNumber ? (
//                   <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
//                     <div className="flex items-start gap-3">
//                       <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-accent shadow-sm">
//                         <Phone className="h-4 w-4" />
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <p className="text-sm font-semibold text-slate-900">
//                           {contactNumber}
//                         </p>
//                         <p className="mt-1 text-xs text-slate-500">
//                           {t('form.profileContactHint')}
//                         </p>
//                       </div>

//                       <button
//                         type="button"
//                         onClick={() => setEditingContact(true)}
//                         className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-surface px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                       >
//                         <Edit3 className="h-3.5 w-3.5" />
//                         {t('form.edit')}
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
//                     <label className="block text-sm font-semibold text-slate-700">
//                       {t('form.contactNumber')}
//                       <input
//                         type="tel"
//                         inputMode="tel"
//                         autoComplete="tel"
//                         value={contactNumber}
//                         onChange={(event) => {
//                           contactTouchedRef.current = true;
//                           setContactNumber(event.target.value);
//                         }}
//                         maxLength={16}
//                         placeholder={t('form.contactPlaceholder')}
//                         className={inputClass('contactNumber')}
//                       />
//                       {errors.contactNumber ? (
//                         <ErrorText text={errors.contactNumber} />
//                       ) : null}
//                     </label>

//                     <div className="mt-2 flex justify-end">
//                       <button
//                         type="button"
//                         onClick={() => {
//                           const normalized = normalizeIndianMobile(
//                             contactNumber,
//                           );
//                           if (/^\+91\d{10}$/.test(normalized)) {
//                             setContactNumber(normalized);
//                             setEditingContact(false);
//                           } else {
//                             setErrors((current) => ({
//                               ...current,
//                               contactNumber: t(
//                                 'form.errors.contactNumber',
//                               ),
//                             }));
//                           }
//                         }}
//                         className="min-h-9 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-surface"
//                       >
//                         {t('form.done')}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div>
//                 {!showNote && !additionalRequirements ? (
//                   <div className="flex min-h-[92px] items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4">
//                     <div>
//                       <p className="text-sm font-semibold text-slate-700">
//                         {t('form.note')} <span className="font-normal text-slate-400">({t('form.optional')})</span>
//                       </p>
//                       <button
//                         type="button"
//                         onClick={() => setShowNote(true)}
//                         className="mt-1 text-sm font-semibold text-accent hover:text-accent"
//                       >
//                         + {t('form.addNote')}
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700">
//                       {t('form.note')} <span className="font-normal text-slate-400">({t('form.optional')})</span>
//                       <textarea
//                         value={additionalRequirements}
//                         onChange={(event) =>
//                           setAdditionalRequirements(event.target.value)
//                         }
//                         maxLength={1000}
//                         rows={3}
//                         placeholder={t('form.notePlaceholder')}
//                         className="mt-1 w-full rounded-xl border border-slate-200 bg-surface p-3 text-sm font-normal text-slate-900 outline-none focus:border-focus focus:ring-2 focus:ring-focus"
//                       />
//                     </label>
//                     <div className="mt-1 flex items-center justify-between">
//                       <span className="text-xs text-slate-400">
//                         {additionalRequirements.length}/1000
//                       </span>
//                       {additionalRequirements ? (
//                         <button
//                           type="button"
//                           onClick={() => setAdditionalRequirements('')}
//                           className="text-xs font-semibold text-slate-500 hover:text-slate-700"
//                         >
//                           {t('form.clearNote')}
//                         </button>
//                       ) : null}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </FormSection>
//         </div>

//         <button
//           onClick={() => {
//             if (validate()) setPreview(true);
//           }}
//           className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-strong"
//         >
//           {t('form.preview')}
//         </button>
//       </div>
//     </div>
//   );
// }

// function FormSection({
//   number,
//   title,
//   children,
// }: {
//   number: string;
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <section className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
//       <div className="mb-3 flex items-center gap-3">
//         <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-accent">
//           {number}
//         </span>
//         <h2 className="text-base font-bold text-slate-900">
//           {title}
//         </h2>
//       </div>
//       {children}
//     </section>
//   );
// }

// function PreviewItem({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string;
// }) {
//   return (
//     <div className="rounded-xl bg-surface p-3 shadow-sm">
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

// function ErrorText({ text }: { text: string }) {
//   return (
//     <p className="mt-1 text-xs font-medium text-danger">{text}</p>
//   );
// }


'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Check,
  Edit3,
  MapPin,
  Package,
  Phone,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getLocalizedDomainName } from '@agri/domain-data';
import { useAuth } from '@/hooks/use-auth';
import {
  getDistricts,
  getProfile,
  getStates,
  getTalukas,
  getVillages,
  type LocationOption,
} from '@/services/api/auth.api';
import {
  createBuyerRequirement,
  updateBuyerRequirement,
  type BuyerRequirement,
  type BuyerRequirementCropKey,
  type BuyerRequirementUnit,
  type CreateBuyerRequirementPayload,
} from '@/services/api/buyer-requirements.api';

const CROP_KEYS: BuyerRequirementCropKey[] = [
  'cotton',
  'groundnut',
  'wheat',
  'rice',
  'tomato',
  'onion',
  'potato',
  'chili',
  'maize',
  'bajra',
  'other',
];

function makeSubmissionKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;

  return value.trim();
}

function formatLocation(
  district?: string,
  taluka?: string,
  village?: string,
) {
  return [village, taluka, district]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');
}

export function BuyerRequirementForm({
  initial,
  mode = 'create',
}: {
  initial?: BuyerRequirement;
  mode?: 'create' | 'edit';
}) {
  const t = useTranslations('buyerRequirements');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const { user, isLoading: authLoading } = useAuth();
  const [cropKey, setCropKey] = useState<BuyerRequirementCropKey>(
    initial?.cropKey || 'cotton',
  );
  const [customCropName, setCustomCropName] = useState(
    initial?.customCropName || '',
  );
  const [variety, setVariety] = useState(initial?.variety || '');
  const [quantity, setQuantity] = useState(
    String(initial?.quantity ?? ''),
  );
  const [unit, setUnit] = useState<BuyerRequirementUnit>(
    initial?.unit || 'kg',
  );

  const [district, setDistrict] = useState(initial?.district || '');
  const [taluka, setTaluka] = useState(initial?.taluka || '');
  const [village, setVillage] = useState(initial?.village || '');

  const [contactNumber, setContactNumber] = useState(
    initial?.contact?.phoneNumber || '',
  );

  const [additionalRequirements, setAdditionalRequirements] = useState(
    initial?.additionalRequirements || '',
  );

  const [editingLocation, setEditingLocation] = useState(
    mode === 'edit'
      ? !Boolean(initial?.district && initial?.taluka && initial?.village)
      : false,
  );
  const [editingContact, setEditingContact] = useState(
    mode === 'edit' ? !Boolean(initial?.contact?.phoneNumber) : false,
  );
  const [showNote, setShowNote] = useState(
    Boolean(initial?.additionalRequirements),
  );

  // Form UI state. Keep these local to the form so preview/validation/submission
  // never depend on undeclared variables.
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const locationTouchedRef = useRef(false);
  const contactTouchedRef = useRef(false);
  const profilePrefillStartedRef = useRef(false);

  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [talukas, setTalukas] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const findOption = (options: LocationOption[], value?: string | null) => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return undefined;

    return options.find(
      (option) =>
        option.id === value || option.name.trim().toLowerCase() === normalized,
    );
  };

  useEffect(() => {
    if (authLoading || profilePrefillStartedRef.current) return;

    profilePrefillStartedRef.current = true;

    const initializeLocation = async () => {
      setLocationLoading(true);

      try {
        const profile = await getProfile();
        let stateId = profile.state?.id;

        if (!stateId) {
          const states = await getStates();
          stateId = states.find(
            (item) => item.name.trim().toLowerCase() === 'gujarat',
          )?.id;
        }

        if (!stateId) {
          throw new Error('Gujarat state was not found');
        }

        const districtOptions = await getDistricts(stateId);
        setDistricts(districtOptions);

        const initialDistrict = findOption(
          districtOptions,
          mode === 'edit' ? initial?.district : profile.district?.name,
        );

        if (!initialDistrict) return;

        setDistrict(initialDistrict.name);

        const talukaOptions = await getTalukas(initialDistrict.id);
        setTalukas(talukaOptions);

        const initialTaluka = findOption(
          talukaOptions,
          mode === 'edit' ? initial?.taluka : profile.taluka?.name,
        );

        if (!initialTaluka) return;

        setTaluka(initialTaluka.name);

        const villageOptions = await getVillages(initialTaluka.id);
        setVillages(villageOptions);

        const initialVillage = findOption(
          villageOptions,
          mode === 'edit' ? initial?.village : profile.village?.name,
        );

        if (initialVillage) {
          setVillage(initialVillage.name);
        }

        if (
          initialDistrict &&
          initialTaluka &&
          initialVillage
        ) {
          setEditingLocation(false);
        }

        if (!contactTouchedRef.current && profile.mobileNumber) {
          setContactNumber((current) => current || profile.mobileNumber);
          setEditingContact(false);
        }
      } catch {

        if (mode === 'create') {
          const fallbackDistrict = user?.location?.district?.trim() || '';
          const fallbackTaluka = user?.location?.taluka?.trim() || '';
          const fallbackVillage = user?.location?.village?.trim() || '';

          if (!locationTouchedRef.current) {
            setDistrict(fallbackDistrict);
            setTaluka(fallbackTaluka);
            setVillage(fallbackVillage);
          }

          if (!contactTouchedRef.current && user?.mobileNumber) {
            setContactNumber((current) => current || user.mobileNumber);
          }
        }
      } finally {
        setLocationLoading(false);
      }
    };

    void initializeLocation();
  }, [authLoading, initial, mode, user]);

  const handleDistrictChange = async (nextDistrictId: string) => {
    locationTouchedRef.current = true;

    const selectedDistrict = districts.find(
      (item) => item.id === nextDistrictId,
    );

    setDistrict(selectedDistrict?.name || '');
    setTaluka('');
    setVillage('');
    setTalukas([]);
    setVillages([]);

    if (!nextDistrictId) return;

    setLocationLoading(true);

    try {
      const response = await getTalukas(nextDistrictId);
      setTalukas(response);
    } catch {
      toast.error(t('form.errors.location'));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleTalukaChange = async (nextTalukaId: string) => {
    locationTouchedRef.current = true;

    const selectedTaluka = talukas.find(
      (item) => item.id === nextTalukaId,
    );

    setTaluka(selectedTaluka?.name || '');
    setVillage('');
    setVillages([]);

    if (!nextTalukaId) return;

    setLocationLoading(true);

    try {
      const response = await getVillages(nextTalukaId);
      setVillages(response);
    } catch {
      toast.error(t('form.errors.location'));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleVillageChange = (nextVillageId: string) => {
    locationTouchedRef.current = true;

    const selectedVillage = villages.find(
      (item) => item.id === nextVillageId,
    );

    setVillage(selectedVillage?.name || '');
  };

  const cropLabels = useMemo(
    () =>
      Object.fromEntries(
        CROP_KEYS.map((key) => [key, t(`crops.${key}`)]),
      ) as Record<BuyerRequirementCropKey, string>,
    [t],
  );

  const validate = () => {
    const next: Record<string, string> = {};
    const numericQuantity = Number(quantity);
    const normalizedContact = normalizeIndianMobile(contactNumber);

    if (!cropKey) next.cropKey = t('form.errors.crop');

    if (cropKey === 'other' && !customCropName.trim()) {
      next.customCropName = t('form.errors.customCrop');
    }

    if (variety.trim().length > 100) {
      next.variety = t('form.errors.variety');
    }

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      next.quantity = t('form.errors.quantity');
    }

    if (!district.trim()) {
      next.district = t('form.errors.location');
    }

    if (!taluka.trim()) {
      next.taluka = t('form.errors.location');
    }

    if (!village.trim()) {
      next.village = t('form.errors.location');
    }

    if (!/^\+91\d{10}$/.test(normalizedContact)) {
      next.contactNumber = t('form.errors.contactNumber');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = (): CreateBuyerRequirementPayload => ({
    cropKey,
    customCropName:
      cropKey === 'other' ? customCropName.trim() : undefined,
    variety: variety.trim() || undefined,
    quantity: Number(quantity),
    unit,
    district: district.trim(),
    taluka: taluka.trim(),
    village: village.trim(),
    contactNumber: normalizeIndianMobile(contactNumber),
    additionalRequirements:
      additionalRequirements.trim() || undefined,
  });

  const publish = async () => {
    if (!validate()) {
      setPreview(false);
      return;
    }

    setSubmitting(true);

    try {
      const result =
        mode === 'edit' && initial
          ? await updateBuyerRequirement(initial.id, payload())
          : await createBuyerRequirement({
              ...payload(),
              submissionKey: makeSubmissionKey(),
            });

      toast.success(mode === 'edit' ? t('updated') : t('success'));
      router.replace(
        `/${locale}/dashboard/buyer-requirements/${result.id}`,
      );
    } catch {
      toast.error(t('errors.publish'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (key?: string) =>
    `mt-1 h-11 w-full rounded-xl border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-focus focus:ring-2 focus:ring-focus ${
      key && errors[key] ? 'border-danger' : 'border-border'
    }`;

  const locationText = formatLocation(district, taluka, village);
  const normalizedContact = normalizeIndianMobile(contactNumber);

  if (preview) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
        <button
          onClick={() => setPreview(false)}
          className="mb-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('form.back')}
        </button>

        <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Check className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-foreground">
                {t(
                  mode === 'edit'
                    ? 'form.editPreviewTitle'
                    : 'form.previewTitle',
                )}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  mode === 'edit'
                    ? 'form.editPreviewDescription'
                    : 'form.previewDescription',
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl bg-surface-subtle p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('form.crop')}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {cropKey === 'other'
                  ? customCropName
                  : cropLabels[cropKey]}
              </p>
              {variety.trim() ? (
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {t('form.variety')}: {variety.trim()}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewItem
                icon={<Package className="h-4 w-4" />}
                label={t('form.quantity')}
                value={`${quantity} ${unit}`}
              />

              <PreviewItem
                icon={<MapPin className="h-4 w-4" />}
                label={t('form.location')}
                value={locationText || '—'}
              />

              <PreviewItem
                icon={<Phone className="h-4 w-4" />}
                label={t('form.contactNumber')}
                value={normalizedContact}
              />
            </div>

            {additionalRequirements.trim() ? (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('form.note')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {additionalRequirements.trim()}
                </p>
              </div>
            ) : null}
          </div>

          <button
            disabled={submitting}
            onClick={() => void publish()}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('form.publishing')}
              </>
            ) : (
              t('form.publish')
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-5">
      <button
        onClick={() => router.back()}
        className="mb-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('form.back')}
      </button>

      <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t(mode === 'edit' ? 'form.editTitle' : 'form.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            mode === 'edit'
              ? 'form.editDescription'
              : 'form.description',
          )}
        </p>

        <div className="mt-5 space-y-5">
          <FormSection number="1" title={t('form.need')}>
            <div className="grid gap-4 sm:grid-cols-[1.35fr_1fr]">
              <label className="text-sm font-semibold text-foreground">
                {t('form.crop')}
                <select
                  value={cropKey}
                  onChange={(event) =>
                    setCropKey(
                      event.target.value as BuyerRequirementCropKey,
                    )
                  }
                  className={inputClass('cropKey')}
                >
                  {CROP_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {cropLabels[key]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-foreground">
                {t('form.variety')}
                <input
                  value={variety}
                  onChange={(event) => setVariety(event.target.value)}
                  maxLength={100}
                  placeholder={t('form.varietyPlaceholder')}
                  className={inputClass('variety')}
                />
                {errors.variety ? (
                  <ErrorText text={errors.variety} />
                ) : null}
              </label>
            </div>

            {cropKey === 'other' ? (
              <label className="mt-3 block text-sm font-semibold text-foreground">
                {t('form.customCrop')}
                <input
                  value={customCropName}
                  onChange={(event) =>
                    setCustomCropName(event.target.value)
                  }
                  maxLength={100}
                  className={inputClass('customCropName')}
                />
                {errors.customCropName ? (
                  <ErrorText text={errors.customCropName} />
                ) : null}
              </label>
            ) : null}
          </FormSection>

          <FormSection number="2" title={t('form.amount')}>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="text-sm font-semibold text-foreground">
                {t('form.quantity')}
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  className={inputClass('quantity')}
                />
                {errors.quantity ? (
                  <ErrorText text={errors.quantity} />
                ) : null}
              </label>

              <label className="text-sm font-semibold text-foreground">
                {t('form.unit')}
                <select
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as BuyerRequirementUnit)
                  }
                  className={inputClass()}
                >
                  <option value="kg">{t('units.kg')}</option>
                  <option value="quintal">{t('units.quintal')}</option>
                  <option value="ton">{t('units.ton')}</option>
                </select>
              </label>
            </div>
          </FormSection>

          <FormSection number="3" title={t('form.location')}>
            {!editingLocation && locationText ? (
              <div className="rounded-2xl border border-emerald-100 bg-accent-soft/60 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {locationText}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('form.profileLocationHint')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingLocation(true)}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-subtle"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {t('form.edit')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-border bg-surface-subtle p-3">
                <label className="block text-sm font-semibold text-foreground">
                  {t('form.district')}
                  <select
                    value={findOption(districts, district)?.id ?? ''}
                    onChange={(event) => {
                      void handleDistrictChange(event.target.value);
                    }}
                    className={inputClass('district')}
                  >
                    <option value="">
                      {t('form.selectDistrict')}
                    </option>
                    {districts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {getLocalizedDomainName(item.name, locale, 'district')}
                      </option>
                    ))}
                  </select>
                  {errors.district ? (
                    <ErrorText text={errors.district} />
                  ) : null}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-foreground">
                    {t('form.taluka')}
                    <select
                      value={findOption(talukas, taluka)?.id ?? ''}
                      onChange={(event) => {
                        void handleTalukaChange(event.target.value);
                      }}
                      disabled={!district || locationLoading}
                      className={inputClass('taluka')}
                    >
                      <option value="">
                        {t('form.selectTaluka')}
                      </option>
                      {talukas.map((item) => (
                        <option key={item.id} value={item.id}>
                          {getLocalizedDomainName(item.name, locale, 'taluka')}
                        </option>
                      ))}
                    </select>
                    {errors.taluka ? (
                      <ErrorText text={errors.taluka} />
                    ) : null}
                  </label>

                  <label className="text-sm font-semibold text-foreground">
                    {t('form.village')}
                    <select
                      value={findOption(villages, village)?.id ?? ''}
                      onChange={(event) => {
                        handleVillageChange(event.target.value);
                      }}
                      disabled={!taluka || locationLoading}
                      className={inputClass('village')}
                    >
                      <option value="">
                        {t('form.selectVillage')}
                      </option>
                      {villages.map((item) => (
                        <option key={item.id} value={item.id}>
                          {getLocalizedDomainName(item.name, locale, 'village')}
                        </option>
                      ))}
                    </select>
                    {errors.village ? (
                      <ErrorText text={errors.village} />
                    ) : null}
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  {locationText ? (
                    <button
                      type="button"
                      disabled={!district.trim() || !taluka.trim() || !village.trim()}
                      onClick={() => {
                        if (district.trim() && taluka.trim() && village.trim()) {
                          setEditingLocation(false);
                        }
                      }}
                      className="min-h-10 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-surface"
                    >
                      {t('form.done')}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </FormSection>

          <FormSection number="4" title={t('form.contactAndNote')}>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
              <div>
                {!editingContact && contactNumber ? (
                  <div className="rounded-2xl border border-emerald-100 bg-accent-soft/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-accent shadow-sm">
                        <Phone className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {contactNumber}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('form.profileContactHint')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingContact(true)}
                        className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-surface-subtle"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {t('form.edit')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-surface-subtle p-3">
                    <label className="block text-sm font-semibold text-foreground">
                      {t('form.contactNumber')}
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={contactNumber}
                        onChange={(event) => {
                          contactTouchedRef.current = true;
                          setContactNumber(event.target.value);
                        }}
                        maxLength={16}
                        placeholder={t('form.contactPlaceholder')}
                        className={inputClass('contactNumber')}
                      />
                      {errors.contactNumber ? (
                        <ErrorText text={errors.contactNumber} />
                      ) : null}
                    </label>

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const normalized = normalizeIndianMobile(
                            contactNumber,
                          );
                          if (/^\+91\d{10}$/.test(normalized)) {
                            setContactNumber(normalized);
                            setEditingContact(false);
                          } else {
                            setErrors((current) => ({
                              ...current,
                              contactNumber: t(
                                'form.errors.contactNumber',
                              ),
                            }));
                          }
                        }}
                        className="min-h-9 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-surface"
                      >
                        {t('form.done')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {!showNote && !additionalRequirements ? (
                  <div className="flex min-h-[92px] items-center rounded-2xl border border-dashed border-border bg-surface-subtle px-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('form.note')} <span className="font-normal text-muted-foreground">({t('form.optional')})</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowNote(true)}
                        className="mt-1 text-sm font-semibold text-accent hover:text-accent"
                      >
                        + {t('form.addNote')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-foreground">
                      {t('form.note')} <span className="font-normal text-muted-foreground">({t('form.optional')})</span>
                      <textarea
                        value={additionalRequirements}
                        onChange={(event) =>
                          setAdditionalRequirements(event.target.value)
                        }
                        maxLength={1000}
                        rows={3}
                        placeholder={t('form.notePlaceholder')}
                        className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm font-normal text-foreground outline-none focus:border-focus focus:ring-2 focus:ring-focus"
                      />
                    </label>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {additionalRequirements.length}/1000
                      </span>
                      {additionalRequirements ? (
                        <button
                          type="button"
                          onClick={() => setAdditionalRequirements('')}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          {t('form.clearNote')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FormSection>
        </div>

        <button
          onClick={() => {
            if (validate()) setPreview(true);
          }}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-strong"
        >
          {t('form.preview')}
        </button>
      </div>
    </div>
  );
}

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border pb-5 last:border-0 last:pb-0">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
          {number}
        </span>
        <h2 className="text-base font-bold text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function PreviewItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-3 shadow-sm">
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

function ErrorText({ text }: { text: string }) {
  return (
    <p className="mt-1 text-xs font-medium text-danger">{text}</p>
  );
}
