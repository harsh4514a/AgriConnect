'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sprout,
  Coins,
  MapPin,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { CROP_IMAGES, type CropListing, type CropKey, type UnitKey } from '@/data/marketplace-listings';
import { useProfileLocation } from '@/hooks/use-profile-location';
import { createListing, updateListing, uploadListingImages } from '@/services/api/listings.api';
import { StepCropInfo } from '@/components/marketplace/create/step-crop-info';
import { StepQuantityPricing } from '@/components/marketplace/create/step-quantity-pricing';
import { StepLocationDetails } from '@/components/marketplace/create/step-location-details';
import { StepImagesReview } from '@/components/marketplace/create/step-images-review';
import { ListingSuccessModal } from '@/components/marketplace/create/listing-success-modal';
import { cn } from '@/utils/cn';
import type { ListingImage } from '@/components/marketplace/create/listing-image';

interface ListingFormProps {
  mode?: 'create' | 'edit';
  initialListing?: CropListing;
}

export function ListingForm({ mode = 'create', initialListing }: ListingFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const isEdit = mode === 'edit';
  const { village: profileVillage, taluka: profileTaluka, district: profileDistrict } = useProfileLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cropKey, setCropKey] = useState<CropKey | ''>(initialListing?.cropKey || '');
  const [customCropName, setCustomCropName] = useState<string>(initialListing?.customCropName || '');
  const [variety, setVariety] = useState<string>(initialListing?.variety || '');
  const [qualityGrade] = useState<string>(initialListing?.qualityGrade || 'A Grade');
  const [quantity, setQuantity] = useState<number | ''>(initialListing?.quantity || '');
  const [unit, setUnit] = useState<UnitKey>(initialListing?.unit || 'quintal');
  const [price, setPrice] = useState<number | ''>(initialListing?.price || '');
  const [primaryUnit, setPrimaryUnit] = useState<string>(initialListing?.primaryUnit || '20 kg');
  const [district, setDistrict] = useState<string>(initialListing?.district || profileDistrict || '');
  const [taluka, setTaluka] = useState<string>(initialListing?.taluka || profileTaluka || '');
  const [village, setVillage] = useState<string>(initialListing?.village || profileVillage || '');
  const [state] = useState<string>(initialListing?.state || 'Gujarat');
  const [cropDate, setCropDate] = useState<string>(
    initialListing?.cropDate || new Date().toISOString().split('T')[0],
  );
  const [description, setDescription] = useState<string>(initialListing?.description || '');
  const [images, setImages] = useState<ListingImage[]>(
    initialListing?.image
      ? [initialListing.image, ...(initialListing.additionalImages || [])].map((url) => ({ url }))
      : [],
  );
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => () => {
    imagesRef.current.forEach((image) => {
      if (image.file) URL.revokeObjectURL(image.url);
    });
  }, []);

  const hasInitializedLocationRef = useRef(false);
  useEffect(() => {
    if (!isEdit && !hasInitializedLocationRef.current) {
      if (profileDistrict || profileTaluka || profileVillage) {
        if (profileDistrict) setDistrict(profileDistrict);
        if (profileTaluka) setTaluka(profileTaluka);
        if (profileVillage) setVillage(profileVillage);
        hasInitializedLocationRef.current = true;
      }
    }
  }, [profileVillage, profileTaluka, profileDistrict, isEdit]);

  const isPrefilledFromProfile = Boolean(
    profileDistrict &&
      profileTaluka &&
      profileVillage &&
      district === profileDistrict &&
      taluka === profileTaluka &&
      village === profileVillage,
  );

  const cropDisplayName =
    cropKey === 'other'
      ? customCropName.trim()
      : cropKey
        ? t(`dashboard.marketplaceBrowse.crop.${cropKey}`)
        : '';

  const steps = [
    { id: 1, label: t('dashboard.createListing.steps.step1'), icon: Sprout },
    { id: 2, label: t('dashboard.createListing.steps.step2'), icon: Coins },
    { id: 3, label: t('dashboard.createListing.steps.step3'), icon: MapPin },
    { id: 4, label: t('dashboard.createListing.steps.step4'), icon: ImageIcon },
  ];

  const getStepErrors = (stepNumber: number): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!cropKey) {
        nextErrors.cropKey = t('dashboard.createListing.errors.cropRequired');
      } else if (cropKey === 'other' && !customCropName.trim()) {
        nextErrors.customCropName = t('dashboard.createListing.errors.customCropRequired');
      }
    } else if (stepNumber === 2) {
      if (!quantity || Number(quantity) <= 0) {
        nextErrors.quantity = t('dashboard.createListing.errors.quantityRequired');
      }
      if (!price || Number(price) <= 0) {
        nextErrors.price = t('dashboard.createListing.errors.priceRequired');
      }
    } else if (stepNumber === 3) {
      if (!district) {
        nextErrors.district = t('dashboard.createListing.errors.districtRequired');
      }
      if (!taluka) {
        nextErrors.taluka = t('dashboard.createListing.errors.talukaRequired');
      }
      if (!village) {
        nextErrors.village = t('dashboard.createListing.errors.villageRequired');
      }
      if (!cropDate) {
        nextErrors.cropDate = t('dashboard.createListing.errors.cropDateRequired');
      }
    }

    return nextErrors;
  };

  const validateStep = (stepNumber: number): boolean => {
    const nextErrors = getStepErrors(stepNumber);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const allErrors = {
      ...getStepErrors(1),
      ...getStepErrors(2),
      ...getStepErrors(3),
    };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error(t('dashboard.createListing.errors.incompleteFields'));
      if (getStepErrors(1).cropKey || getStepErrors(1).customCropName) {
        setCurrentStep(1);
      } else if (getStepErrors(2).quantity || getStepErrors(2).price) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    if (!cropKey || !quantity || !price) return;

    const trimmedCustomName = customCropName.trim();
    const trimmedVariety = variety.trim();
    if (isSubmitting) return;

    const listingFields = {
      cropKey: cropKey as CropKey,
      variety: trimmedVariety || undefined,
      customCropName: cropKey === 'other' ? trimmedCustomName : undefined,
      qualityGrade,
      quantity: Number(quantity),
      unit,
      price: Number(price),
      primaryUnit,
      district,
      taluka: taluka.trim() || village.trim(),
      village: village.trim(),
      state,
      cropDate,
      description: description.trim(),
      imageAlt: cropDisplayName || cropKey,
    };

    setIsSubmitting(true);
    try {
      const selectedFiles = images.flatMap((image) => image.file ? [image.file] : []);
      const uploadedUrls = selectedFiles.length
        ? await uploadListingImages(selectedFiles)
        : [];
      if (uploadedUrls.length !== selectedFiles.length) {
        throw new Error('Cloudinary did not return a URL for each image');
      }
      let uploadedIndex = 0;
      const savedImages = images.map((image) => {
        if (!image.file) return image.url;
        URL.revokeObjectURL(image.url);
        return uploadedUrls[uploadedIndex++];
      });

      // Keep successful uploads in the form if saving the listing itself needs a retry.
      setImages(savedImages.map((url) => ({ url })));

      const listingPayload = {
        ...listingFields,
        image: savedImages[0] || CROP_IMAGES[cropKey] || CROP_IMAGES.wheat,
        additionalImages: savedImages.slice(1),
      };
      const savedListing = isEdit && initialListing
        ? await updateListing(initialListing.id, listingPayload)
        : await createListing(listingPayload);

      setPublishedListingId(savedListing.id);
    } catch {
      toast.error(t('errors.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCropKey('');
    setCustomCropName('');
    setVariety('');
    setQuantity('');
    setPrice('');
    setDistrict(profileDistrict || '');
    setTaluka(profileTaluka || '');
    setVillage(profileVillage || '');
    setCropDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    images.forEach((image) => {
      if (image.file) URL.revokeObjectURL(image.url);
    });
    setImages([]);
    setCurrentStep(1);
    setErrors({});
    setPublishedListingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/my-listings`)}
            className="mb-2 inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('dashboard.createListing.actions.back')}</span>
          </button>

          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            {isEdit
              ? t('dashboard.createListing.header.editTitle')
              : t('dashboard.createListing.header.title')}
          </h1>
          <p className="mt-1 text-xs text-white/60 sm:text-sm">
            {isEdit
              ? t('dashboard.createListing.header.editSubtitle')
              : t('dashboard.createListing.header.subtitle')}
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-bold text-green-300 backdrop-blur-xl">
          {t('dashboard.createListing.step', { current: currentStep, total: 4 })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const isCompleted = currentStep > s.id;
          const isCurrent = currentStep === s.id;

          return (
            <button
              key={s.id}
              type="button"
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => {
                if (isCompleted) {
                  setErrors({});
                  setCurrentStep(s.id);
                }
              }}
              disabled={!isCompleted && !isCurrent}
              className={cn(
                'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 sm:p-3',
                isCurrent
                  ? 'border-green-400 bg-green-900/30 text-green-300 ring-2 ring-green-400/30'
                  : isCompleted
                    ? 'cursor-pointer border-white/20 bg-white/10 text-white/80 hover:bg-white/15'
                    : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-white/40',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-8 sm:w-8',
                  isCurrent
                    ? 'bg-green-400 text-green-950 shadow-md'
                    : isCompleted
                      ? 'bg-green-700 text-white'
                      : 'bg-white/10 text-white/40',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
              </div>

              <span className="max-w-full truncate text-[10px] font-semibold sm:text-[11px]">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 1 && (
                <StepCropInfo
                  cropKey={cropKey}
                  customCropName={customCropName}
                  variety={variety}
                  errors={errors}
                  onChange={(fields) => {
                    if (fields.cropKey !== undefined) setCropKey(fields.cropKey);
                    if (fields.customCropName !== undefined) setCustomCropName(fields.customCropName);
                    if (fields.variety !== undefined) setVariety(fields.variety);
                    setErrors((prev) => ({ ...prev, cropKey: '', customCropName: '' }));
                  }}
                />
              )}

              {currentStep === 2 && (
                <StepQuantityPricing
                  quantity={quantity}
                  unit={unit}
                  price={price}
                  primaryUnit={primaryUnit}
                  errors={errors}
                  onChange={(fields) => {
                    if (fields.quantity !== undefined) setQuantity(fields.quantity);
                    if (fields.unit !== undefined) setUnit(fields.unit);
                    if (fields.price !== undefined) setPrice(fields.price);
                    if (fields.primaryUnit !== undefined) setPrimaryUnit(fields.primaryUnit);
                    setErrors((prev) => ({ ...prev, quantity: '', price: '' }));
                  }}
                />
              )}

            {currentStep === 3 && (
              <StepLocationDetails
                village={village}
                taluka={taluka}
                district={district}
                cropDate={cropDate}
                description={description}
                errors={errors}
                isPrefilledFromProfile={isPrefilledFromProfile}
                onChange={(fields) => {
                  if (fields.village !== undefined) setVillage(fields.village);
                  if (fields.taluka !== undefined) setTaluka(fields.taluka);
                  if (fields.district !== undefined) setDistrict(fields.district);
                  if (fields.cropDate !== undefined) setCropDate(fields.cropDate);
                  if (fields.description !== undefined) setDescription(fields.description);
                  setErrors((prev) => ({ ...prev, village: '', taluka: '', district: '', cropDate: '' }));
                }}
              />
            )}

            {currentStep === 4 && (
              <StepImagesReview
                cropKey={cropKey}
                cropDisplayName={cropDisplayName}
                variety={variety}
                quantity={quantity}
                unit={unit}
                price={price}
                primaryUnit={primaryUnit}
                village={village}
                taluka={taluka}
                district={district}
                cropDate={cropDate}
                description={description}
                images={images}
                onChange={(fields) => {
                  if (fields.images !== undefined) setImages(fields.images);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-3 z-10 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-green-950/85 p-3 backdrop-blur-xl sm:static sm:rounded-none sm:border-0 sm:border-t sm:border-white/10 sm:bg-transparent sm:p-0 sm:pt-6 sm:backdrop-blur-none">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-12 min-w-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition-all hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('dashboard.createListing.actions.back')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/dashboard/my-listings`)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
            >
              <span>{t('dashboard.createListing.actions.cancel')}</span>
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-300 active:scale-95 sm:px-8"
              style={{
                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                boxShadow: '0 4px 16px rgba(46,125,50,0.35)',
              }}
            >
              <span>{t('dashboard.createListing.actions.continue')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:px-8"
              style={{
                background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                boxShadow: '0 4px 20px rgba(46,125,50,0.5)',
              }}
            >
              <Save className="h-4 w-4" />
              <span>
                {isEdit
                  ? t('dashboard.createListing.actions.saveChanges')
                  : t('dashboard.createListing.actions.publish')}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>

      {publishedListingId && (
        <ListingSuccessModal
          listingId={publishedListingId}
          isEdit={isEdit}
          onReset={handleResetForm}
        />
      )}
    </div>
  );
}
