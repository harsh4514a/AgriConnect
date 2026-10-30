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
  isAuthenticated: boolean;
}

export default function MarketplaceListingLocation({
  listing,
  computedDistanceKm,
  isAuthenticated,
}: MarketplaceListingLocationProps) {
  const t = useTranslations();
  const locale = useLocale();
  const districtLabel = getLocalizedDomainName(listing.district, locale, 'district');

  const distance =
    computedDistanceKm ??
    listing.distanceKm;

  const locationParts = [
    ...(isAuthenticated && listing.village ? [getLocalizedDomainName(listing.village, locale, 'village')] : []),
    ...(isAuthenticated && listing.taluka ? [getLocalizedDomainName(listing.taluka, locale, 'taluka')] : []),
    districtLabel,
    ...(isAuthenticated && listing.state ? [getLocalizedDomainName(listing.state, locale, 'state')] : []),
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
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <MapPin
          className="h-5 w-5 text-accent"
          aria-hidden="true"
        />

        <h2 className="text-lg font-bold text-foreground">
          {t(
            'dashboard.marketplaceBrowse.detail.listingLocation',
          )}
        </h2>
      </div>

      {/* LOCATION */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <MapPin
            className="h-5 w-5 text-accent"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">
            {uniqueLocationParts.join(
              ', ',
            )}
          </p>

          {Number.isFinite(distance) && distance > 0 ? <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation
              className="h-3 w-3 text-accent"
              aria-hidden="true"
            />

            <span>
              {distance}{' '}
              {t(
                'dashboard.marketplaceBrowse.detail.kmAway',
              )}
            </span>
          </div> : null}
        </div>
      </div>

      {/* PRIVACY NOTE */}
      <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
        {t(
          'dashboard.marketplaceBrowse.detail.locationPrivacyNotice',
        )}
      </p>
    </section>
  );
}
