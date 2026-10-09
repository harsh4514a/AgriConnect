'use client';

import {
  MapPin,
  Navigation,
} from 'lucide-react';

import { useLocale, useTranslations } from 'next-intl';

import type { CropListing } from '@/data/marketplace-listings';
import { getLocalizedDomainName } from '@agri/domain-data';

interface MarketplaceListingLocationProps {
  listing: CropListing;
  computedDistanceKm?: number;
}

export default function MarketplaceListingLocation({
  listing,
  computedDistanceKm,
}: MarketplaceListingLocationProps) {
  const t = useTranslations();
  const locale = useLocale();
  const districtLabel = getLocalizedDomainName(listing.district, locale, 'district');

  const distance =
    computedDistanceKm ??
    listing.distanceKm;

  /*
   * ONE clean location string.
   *
   * We intentionally don't show:
   *
   * Jasdan, Jasdan, Rajkot, Gujarat
   *
   * followed by another set of location boxes.
   */
  const locationParts = [
    getLocalizedDomainName(listing.village, locale, 'village'),
    getLocalizedDomainName(listing.taluka, locale, 'taluka'),
    districtLabel,
    getLocalizedDomainName(listing.state, locale, 'state'),
  ].filter(Boolean);

  /*
   * Remove duplicate consecutive values.
   *
   * Example:
   * Jasdan, Jasdan, Rajkot
   *
   * becomes:
   * Jasdan, Rajkot
   */
  const uniqueLocationParts =
    locationParts.filter(
      (value, index, array) =>
        array.indexOf(value) === index,
    );

  return (
    <section className="rounded-2xl bg-white/[0.035] p-5 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <MapPin
          className="h-5 w-5 text-emerald-300"
          aria-hidden="true"
        />

        <h2 className="text-lg font-bold text-white">
          {t(
            'dashboard.marketplaceBrowse.detail.listingLocation',
          )}
        </h2>
      </div>

      {/* LOCATION */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
          <MapPin
            className="h-5 w-5 text-emerald-300"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white">
            {uniqueLocationParts.join(
              ', ',
            )}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
            <Navigation
              className="h-3 w-3 text-emerald-400"
              aria-hidden="true"
            />

            <span>
              {distance}{' '}
              {t(
                'dashboard.marketplaceBrowse.detail.kmAway',
              )}
            </span>
          </div>
        </div>
      </div>

      {/* PRIVACY NOTE */}
      <p className="mt-4 text-[10px] leading-5 text-white/30">
        {t(
          'dashboard.marketplaceBrowse.detail.locationPrivacyNotice',
        )}
      </p>
    </section>
  );
}
