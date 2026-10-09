'use client';

import { useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import {
  CROP_IMAGES,
  type CropKey,
  type UnitKey,
} from '@/data/marketplace-listings';
import type { ListingImage } from './listing-image';
import { MAX_LISTING_IMAGES, MAX_LISTING_IMAGE_SIZE } from './listing-image';
import { toast } from 'sonner';

interface StepImagesReviewProps {
  cropKey: CropKey | '';
  cropDisplayName: string;
  variety: string;
  quantity: number | '';
  unit: UnitKey;
  price: number | '';
  primaryUnit: string;
  village: string;
  taluka?: string;
  district: string;
  cropDate: string;
  description: string;
  images: ListingImage[];
  onChange: (fields: { images?: ListingImage[] }) => void;
}

export function StepImagesReview({
  cropKey,
  cropDisplayName,
  variety,
  quantity,
  unit,
  price,
  primaryUnit,
  village,
  taluka,
  district,
  cropDate,
  description,
  images,
  onChange,
}: StepImagesReviewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    if (images.length + selectedFiles.length > MAX_LISTING_IMAGES) {
      toast.error(t('dashboard.createListing.errors.maxImages'));
      e.target.value = '';
      return;
    }

    if (selectedFiles.some((file) => file.size > MAX_LISTING_IMAGE_SIZE)) {
      toast.error(t('dashboard.createListing.errors.imageTooLarge'));
      e.target.value = '';
      return;
    }

    const newImages = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    onChange({ images: [...images, ...newImages] });
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const removed = images[index];
    if (removed?.file) URL.revokeObjectURL(removed.url);
    onChange({ images: images.filter((_, i) => i !== index) });
  };

  const handleUsePreset = () => {
    const presetUrl = cropKey && cropKey !== 'other' ? CROP_IMAGES[cropKey] : CROP_IMAGES.other;
    if (images.some((image) => image.url === presetUrl)) return;
    if (images.length >= MAX_LISTING_IMAGES) {
      toast.error(t('dashboard.createListing.errors.maxImages'));
      return;
    }
    onChange({ images: [...images, { url: presetUrl }] });
  };

  const districtLabel = district
    ? t(`dashboard.marketplaceBrowse.district.${district}`)
    : '—';
  const unitLabel = t(`dashboard.marketplaceBrowse.unit.${unit}`);
  const priceTypeLabel =
    primaryUnit === 'kg'
      ? t('dashboard.createListing.priceUnits.perKg')
      : primaryUnit === 'quintal'
        ? t('dashboard.createListing.priceUnits.perQuintal')
        : t('dashboard.createListing.priceUnits.per20kg');

  const cropDateLabel = cropDate
    ? new Date(`${cropDate}T00:00:00`).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const summaryRows = [
    { label: t('dashboard.createListing.review.crop'), value: cropDisplayName || '—' },
    ...(variety.trim()
      ? [{ label: t('dashboard.createListing.review.variety'), value: variety.trim() }]
      : []),
    {
      label: t('dashboard.createListing.review.quantity'),
      value: quantity ? `${quantity} ${unitLabel}` : '—',
    },
    {
      label: t('dashboard.createListing.review.price'),
      value: price ? `₹${new Intl.NumberFormat('en-IN').format(Number(price))}` : '—',
    },
    { label: t('dashboard.createListing.review.priceType'), value: priceTypeLabel },
    { label: t('dashboard.createListing.review.village'), value: village || '—' },
    ...(taluka ? [{ label: t('dashboard.createListing.review.taluka'), value: taluka }] : []),
    { label: t('dashboard.createListing.review.district'), value: districtLabel },
    { label: t('dashboard.createListing.review.cropDate'), value: cropDateLabel },
    ...(description.trim()
      ? [{ label: t('dashboard.createListing.review.description'), value: description.trim() }]
      : []),
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-sm font-semibold text-white">
            {t('dashboard.createListing.fields.images')}{' '}
            <span className="text-xs font-medium text-white/45">
              ({t('dashboard.createListing.fields.optional')})
            </span>
          </label>
          {cropKey && (
            <button
              type="button"
              onClick={handleUsePreset}
              className="min-h-10 text-xs font-semibold text-green-300 underline hover:text-green-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
            >
              {t('dashboard.createListing.fields.usePresetCrop')}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          id="listing-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileUpload}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center transition-all hover:border-green-400/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-green-300 transition-transform group-hover:scale-110">
            <UploadCloud className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-bold text-white">
            {t('dashboard.createListing.fields.uploadInstructions')}
          </p>
          <p className="mt-1 text-xs text-white/40">{t('dashboard.createListing.fields.uploadNote')}</p>
        </button>

        {images.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white/40">
              <ImageIcon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {t('dashboard.createListing.fields.imagesEmpty')}
              </p>
              <p className="text-xs text-white/50">
                {t('dashboard.createListing.fields.imagesEmptyHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={t('dashboard.createListing.review.photoAlt', { index: idx + 1 })}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label={t('dashboard.createListing.fields.remove')}
                  className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <div>
          <h3 className="text-base font-bold text-white">{t('dashboard.createListing.review.title')}</h3>
          <p className="mt-1 text-xs text-white/50">{t('dashboard.createListing.review.subtitle')}</p>
        </div>

        <dl className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {summaryRows.map((row) => (
            <div key={row.label} className="grid grid-cols-3 gap-3 px-4 py-3 sm:grid-cols-4">
              <dt className="col-span-1 text-xs font-semibold text-white/50">{row.label}</dt>
              <dd className="col-span-2 break-words text-sm font-semibold text-white sm:col-span-3">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/50">
              {t('dashboard.createListing.review.photos')}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`review-${img.url}-${idx}`}
                  src={img.url}
                  alt={t('dashboard.createListing.review.photoAlt', { index: idx + 1 })}
                  className="h-16 w-full rounded-xl border border-white/10 object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
