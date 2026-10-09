'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CropListing } from '@/data/marketplace-listings';
import { cn } from '@/utils/cn';

interface MarketplaceListingGalleryProps {
  listing: CropListing;
}

export function MarketplaceListingGallery({ listing }: MarketplaceListingGalleryProps) {
  const t = useTranslations();

  // Combine primary image with optional additional images
  const allImages = [listing.image, ...(listing.additionalImages || [])];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const activeImage = allImages[selectedImageIndex] || listing.image;

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage}
            src={activeImage}
            alt={`${listing.imageAlt} - ${listing.farmerName}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Gradient shadow overlay for badge readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Top-left: Verified Farmer */}
        {listing.verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-green-900/80 px-2.5 py-1 text-xs font-semibold text-green-200 backdrop-blur-md border border-green-500/20">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('dashboard.marketplaceBrowse.detail.verifiedFarmer')}
          </span>
        )}

        {/* Top-right: Ready to Sell */}
        {listing.readyToSell && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
            {t('dashboard.marketplaceBrowse.detail.readyToSell')}
          </span>
        )}
      </div>

      {/* Thumbnails (only when > 1 image) */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === selectedImageIndex}
              aria-label={`View image ${idx + 1}`}
              onClick={() => setSelectedImageIndex(idx)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-green-400',
                idx === selectedImageIndex
                  ? 'border-green-400 ring-2 ring-green-400/40 opacity-100 scale-105'
                  : 'border-white/10 opacity-60 hover:opacity-100 bg-white/5',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
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
