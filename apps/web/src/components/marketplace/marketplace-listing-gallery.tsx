'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CropListing } from '@/data/marketplace-listings';
import { CROP_IMAGES } from '@/data/marketplace-listings';
import { cn } from '@/utils/cn';
import { OptimizedListingImage } from './optimized-listing-image';

interface MarketplaceListingGalleryProps {
  listing: CropListing;
}

export function MarketplaceListingGallery({ listing }: MarketplaceListingGalleryProps) {
  const t = useTranslations();

  const fallbackImage = CROP_IMAGES[listing.cropKey] || CROP_IMAGES.other;
  const allImages = [listing.image, ...(listing.additionalImages || [])].filter(Boolean);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const activeSource = allImages[selectedImageIndex] || fallbackImage;
  const activeImage = failedImages.has(activeSource) ? fallbackImage : activeSource;

  useEffect(() => {
    setSelectedImageIndex(0);
    setFailedImages(new Set());
  }, [listing.id, listing.image]);

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-subtle shadow-sm">
        <AnimatePresence mode="wait">
        {failedImages.has(activeImage) ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground" role="img" aria-label={listing.imageAlt || listing.cropKey}>
              {listing.customCropName || t(`dashboard.marketplaceBrowse.crop.${listing.cropKey}`)}
            </div>
          ) : <motion.div
            key={activeImage}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <OptimizedListingImage
              src={activeImage}
              alt={listing.imageAlt || listing.customCropName || listing.cropKey}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={selectedImageIndex === 0}
              onError={() => setFailedImages((current) => new Set(current).add(activeImage))}
              className="object-cover"
            />
          </motion.div>
          }
        </AnimatePresence>

        {/* Gradient shadow overlay for badge readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Top-left: Verified Farmer */}
        {listing.verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-green-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-green-500/20">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('dashboard.marketplaceBrowse.detail.verifiedFarmer')}
          </span>
        )}

        {/* Top-right: Ready to Sell */}
        {listing.readyToSell && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-md border border-border">
            {t('dashboard.marketplaceBrowse.detail.readyToSell')}
          </span>
        )}
      </div>

      {/* Thumbnails (only when > 1 image) */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('dashboard.marketplaceBrowse.detail.imageGalleryLabel')}>
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === selectedImageIndex}
              aria-label={t('dashboard.marketplaceBrowse.detail.viewImage', { number: idx + 1 })}
              onClick={() => setSelectedImageIndex(idx)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-focus',
                idx === selectedImageIndex
                  ? 'border-green-400 ring-2 ring-focus opacity-100 scale-105'
                  : 'border-border opacity-60 hover:opacity-100 bg-surface-subtle',
              )}
            >
              <OptimizedListingImage
                src={img}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
