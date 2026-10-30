'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, Sprout } from 'lucide-react';
import {
  CROP_IMAGES,
  PREDEFINED_CROPS,
  type CropKey,
} from '@/data/marketplace-listings';
import { cn } from '@/utils/cn';

interface StepCropInfoProps {
  cropKey: CropKey | '';
  customCropName: string;
  variety: string;
  errors: Record<string, string>;
  onChange: (fields: {
    cropKey?: CropKey;
    customCropName?: string;
    variety?: string;
  }) => void;
}

const VARIETY_SUGGESTIONS: Partial<Record<CropKey, string[]>> = {
  cotton: ['Shankar-6', 'BT-2', 'DCH-32'],
  groundnut: ['GG-20', 'J-24', 'TAG-24'],
  wheat: ['Sharbati', 'GW-496', 'Lokwan', 'Tukdi'],
  rice: ['Gurjari', 'Mahi Sugandha', 'GR-11', 'Jaya'],
  tomato: ['Abhinav Hybrid', 'Himsona', 'Rashmi'],
  onion: ['Gujarat Red (N-53)', 'Bhima Super', 'White Onion'],
  potato: ['Kufri Pukhraj', 'Kufri Jyoti', 'LR Potato'],
  chili: ['G-4 (Green)', 'Resham Patti', 'Jwala'],
  maize: ['Ganga-11', 'African Tall', 'Sweet Corn'],
  bajra: ['GHB-558', 'Pioneer 86M84', 'Dhanshakti'],
};

export function StepCropInfo({
  cropKey,
  customCropName,
  variety,
  errors,
  onChange,
}: StepCropInfoProps) {
  const t = useTranslations();
  const customNameRef = useRef<HTMLInputElement>(null);
  const isOtherCrop = cropKey === 'other';
  const suggestions = cropKey && !isOtherCrop ? VARIETY_SUGGESTIONS[cropKey] || [] : [];

  useEffect(() => {
    if (isOtherCrop) {
      customNameRef.current?.focus();
    }
  }, [isOtherCrop]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label id="crop-select-label" className="block text-sm font-semibold text-foreground">
          {t('dashboard.createListing.fields.cropName')} <span className="text-danger">*</span>
        </label>

        {errors.cropKey && (
          <p id="crop-select-error" role="alert" className="text-xs font-medium text-danger">
            {errors.cropKey}
          </p>
        )}

        <div
          role="radiogroup"
          aria-labelledby="crop-select-label"
          aria-describedby={errors.cropKey ? 'crop-select-error' : undefined}
          aria-invalid={errors.cropKey ? 'true' : 'false'}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5"
        >
          {PREDEFINED_CROPS.map((crop) => {
            const isSelected = cropKey === crop;
            const cropLabel = t(`dashboard.marketplaceBrowse.crop.${crop}`);
            const imageSrc = CROP_IMAGES[crop];

            return (
              <button
                key={crop}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange({ cropKey: crop })}
                className={cn(
                  'group relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  isSelected
                    ? 'border-accent bg-accent-soft shadow-sm ring-2 ring-focus'
                    : 'border-border bg-surface-subtle hover:border-border hover:bg-surface-subtle',
                )}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}

                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-surface-subtle p-1.5 transition-transform group-hover:scale-105">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="" className="h-full w-full object-contain" />
                </div>

                <span
                  className={cn(
                    'truncate text-xs font-bold leading-tight',
                    isSelected ? 'text-accent' : 'text-foreground',
                  )}
                >
                  {cropLabel}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={isOtherCrop}
            onClick={() => onChange({ cropKey: 'other' })}
            className={cn(
              'group relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              isOtherCrop
                ? 'border-accent bg-accent-soft shadow-sm ring-2 ring-focus'
                : 'border-dashed border-border bg-surface-subtle hover:border-border hover:bg-surface-subtle',
            )}
          >
            {isOtherCrop && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}

            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                isOtherCrop ? 'bg-accent-soft text-accent' : 'bg-surface-subtle text-foreground',
              )}
            >
              <Sprout className="h-6 w-6" />
            </div>

            <span
              className={cn(
                'truncate text-xs font-bold leading-tight',
                isOtherCrop ? 'text-accent' : 'text-foreground',
              )}
            >
              {t('dashboard.createListing.fields.otherCrop')}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOtherCrop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-1">
              <label htmlFor="customCropName" className="block text-sm font-semibold text-foreground">
                {t('dashboard.createListing.fields.customCropName')}{' '}
                <span className="text-danger">*</span>
              </label>
              <input
                ref={customNameRef}
                id="customCropName"
                type="text"
                value={customCropName}
                onChange={(e) => onChange({ customCropName: e.target.value })}
                placeholder={t('dashboard.createListing.fields.customCropPlaceholder')}
                autoComplete="off"
                aria-required="true"
                aria-invalid={errors.customCropName ? 'true' : 'false'}
                aria-describedby={errors.customCropName ? 'custom-crop-error' : undefined}
                className={cn(
                  'h-12 w-full rounded-xl border bg-surface-subtle px-4 text-sm text-foreground placeholder-muted-foreground backdrop-blur-xl transition-all focus:bg-surface-subtle focus:outline-none focus:ring-2',
                  errors.customCropName
                    ? 'border-red-400 focus:border-red-400 focus:ring-danger/30'
                    : 'border-border focus:border-focus focus:ring-focus',
                )}
              />
              {errors.customCropName && (
                <p id="custom-crop-error" role="alert" className="text-xs font-medium text-danger">
                  {errors.customCropName}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <label htmlFor="variety" className="block text-sm font-semibold text-foreground">
          {t('dashboard.createListing.fields.varietyOptional')}
        </label>

        <input
          id="variety"
          type="text"
          value={variety}
          onChange={(e) => onChange({ variety: e.target.value })}
          placeholder={t('dashboard.createListing.fields.varietyPlaceholder')}
          className="h-12 w-full rounded-xl border border-border bg-surface-subtle px-4 text-sm text-foreground placeholder-muted-foreground backdrop-blur-xl transition-all focus:border-focus focus:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-focus"
        />

        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-warning" aria-hidden />
              <span>{t('dashboard.createListing.fields.suggestions')}</span>
            </span>
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => onChange({ variety: sug })}
                className={cn(
                  'min-h-8 rounded-full px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  variety === sug
                    ? 'border border-accent/30 bg-accent-soft text-accent'
                    : 'border border-border bg-surface-subtle text-foreground hover:bg-surface-subtle hover:text-foreground',
                )}
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
