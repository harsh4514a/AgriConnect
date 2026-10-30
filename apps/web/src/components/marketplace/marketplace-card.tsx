'use client';

import { useEffect, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BadgeCheck, Clock, MapPin, Navigation, Phone, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import type { CropListing } from '@/data/marketplace-listings';
import { CROP_IMAGES } from '@/data/marketplace-listings';
import { formatListingCreatedAt } from '@/utils/listing-date';
import { normalizePhoneNumber } from '@/utils/phone-number';
import { getLocalizedDomainName } from '@agri/domain-data';
import { OptimizedListingImage } from './optimized-listing-image';

interface MarketplaceCardProps {
  listing: CropListing;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  index?: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

function toQuintals(listing: CropListing): number {
  switch (listing.unit) {
    case 'ton': return listing.quantity * 10;
    case 'kg': return listing.quantity / 100;
    case 'quintal': return listing.quantity;
  }
}

export function MarketplaceCard({
  listing,
  isAuthenticated,
  isAuthLoading = false,
  index = 0,
}: MarketplaceCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const farmerName = listing.farmerName?.trim() || listing.farmerNameShort?.trim();
  const postedAt = formatListingCreatedAt(listing.createdAt, locale);
  const searchParams = useSearchParams();
  const fallbackImage = CROP_IMAGES[listing.cropKey] || CROP_IMAGES.other;
  const [imageSrc, setImageSrc] = useState(listing.image || fallbackImage);
  const [imageUnavailable, setImageUnavailable] = useState(false);

  useEffect(() => {
    setImageSrc(listing.image || fallbackImage);
    setImageUnavailable(false);
  }, [fallbackImage, listing.image]);

  const cropSource = listing.customCropName || listing.cropKey;
  const cropLabel = listing.cropKey === 'other' && !listing.customCropName
    ? t('dashboard.marketplaceBrowse.crop.other')
    : getLocalizedDomainName(cropSource, locale, 'crop');
  const districtLabel = getLocalizedDomainName(listing.district, locale, 'district');
  const locationParts = isAuthenticated
    ? [
        listing.village ? getLocalizedDomainName(listing.village, locale, 'village') : '',
        listing.taluka ? getLocalizedDomainName(listing.taluka, locale, 'taluka') : '',
        districtLabel,
      ]
    : [districtLabel];
  const locationLabel = [...new Set(locationParts.filter(Boolean))].join(', ');
  const phone = isAuthenticated ? normalizePhoneNumber(listing.mobileNumber) : null;
  const browseQuery = searchParams.toString();
  const detailHref = `/${locale}/dashboard/marketplace/${listing.id}${browseQuery ? `?from=${encodeURIComponent(browseQuery)}` : ''}`;
  const quintals = toQuintals(listing);
  const kilograms = Math.round(quintals * 100);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow duration-200 hover:border-accent/30 hover:shadow-lg"
    >
      <Link
        href={detailHref}
        prefetch={false}
        aria-label={`${t('dashboard.marketplaceBrowse.ux.viewDetails')}: ${cropLabel}, ${formatPrice(listing.price)} / ${listing.primaryUnit}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-focus"
      >
        <span className="sr-only">{t('dashboard.marketplaceBrowse.ux.viewDetails')}</span>
      </Link>

      <div className="relative z-[1] aspect-[2/1] overflow-hidden bg-surface-subtle pointer-events-none">
        {imageUnavailable ? (
          <div className="flex h-full items-center justify-center bg-accent-soft/40 text-sm font-medium text-muted-foreground">
            {cropLabel}
          </div>
        ) : (
          <OptimizedListingImage
            src={imageSrc}
            alt={listing.imageAlt || cropLabel}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index === 0}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => {
              if (imageSrc !== fallbackImage) setImageSrc(fallbackImage);
              else setImageUnavailable(true);
            }}
          />
        )}

        {listing.verified ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-green-900/80 px-2 py-1 text-[10px] font-semibold text-white">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            {t('dashboard.marketplaceBrowse.ux.verifiedFarmer')}
          </span>
        ) : null}
        {listing.readyToSell ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-surface/95 px-2 py-1 text-[10px] font-semibold text-foreground">
            {t('dashboard.marketplaceBrowse.ux.readyToSell')}
          </span>
        ) : null}
      </div>

      <div className="relative z-[1] flex flex-1 flex-col p-3.5 pointer-events-none">
        <h3 className="truncate text-base font-bold text-foreground">
          {cropLabel}
        </h3>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold leading-none text-accent">{formatPrice(listing.price)}</span>
          <span className="text-[11px] font-medium text-muted-foreground">
            /{getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}
          </span>
        </div>
        <p className="mt-2 text-xs text-foreground">
          <span className="font-semibold">
            {t('dashboard.marketplaceBrowse.ux.quantityLabel')}: {quintals} {t('dashboard.marketplaceBrowse.ux.quintals')}
          </span>{' '}
          <span className="text-muted-foreground">({kilograms} {t('dashboard.marketplaceBrowse.ux.kilograms')})</span>
        </p>

        <div className="mt-2 space-y-1.5 text-xs">
          {locationLabel ? (
            <p className="flex items-center gap-1.5 text-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null}
          {isAuthenticated && farmerName ? (
            <p className="flex items-center gap-1.5 text-foreground">
              <User className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0 break-words">{farmerName}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex min-h-4 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {listing.locationDistanceVerified && Number.isFinite(listing.distanceKm) ? (
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3 w-3" aria-hidden="true" />
              {listing.distanceKm < 1 ? '<1' : listing.distanceKm < 10 ? listing.distanceKm.toFixed(1) : Math.round(listing.distanceKm)} {t('dashboard.marketplaceBrowse.ux.kmAway')}
            </span>
          ) : null}
          {postedAt ? (
            <time dateTime={postedAt.iso} className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {t('dashboard.marketplaceBrowse.ux.postedAt', { date: postedAt.label })}
            </time>
          ) : null}
        </div>

        <div className="relative z-10 mt-3 pointer-events-auto">
          {isAuthenticated && phone ? (
            <a
              href={`tel:${phone.tel}`}
              aria-label={`${t('dashboard.marketplaceBrowse.ux.callFarmer')}${farmerName ? ` ${farmerName}` : ''}`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.marketplaceBrowse.ux.callFarmer')}
            </a>
          ) : !isAuthenticated && isAuthLoading ? (
            <div className="h-10 rounded-xl bg-surface-subtle" aria-hidden="true" />
          ) : !isAuthenticated ? (
            <Link
              href={`/${locale}/auth`}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-accent/20 bg-accent-soft px-3 text-center text-xs font-semibold text-accent transition-colors hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-focus"
            >
              {t('dashboard.marketplaceBrowse.ux.signInToContact')}
            </Link>
          ) : (
            <p className="rounded-xl bg-surface-subtle px-3 py-2.5 text-center text-xs text-muted-foreground">
              {t('dashboard.marketplaceBrowse.detail.contactUnavailable')}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}
