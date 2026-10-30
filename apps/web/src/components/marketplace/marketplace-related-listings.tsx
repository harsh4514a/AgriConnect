'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

import type { CropListing } from '@/data/marketplace-listings';
import { getRelatedListings } from '@/services/api/listings.api';
import { MarketplaceCard } from '@/components/marketplace/marketplace-card';

interface MarketplaceRelatedListingsProps {
  currentListing: CropListing;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
}

export function MarketplaceRelatedListings({
  currentListing,
  isAuthenticated,
  isAuthLoading = false,
}: MarketplaceRelatedListingsProps) {
  const t = useTranslations();

  const [relatedListings, setRelatedListings] = useState<CropListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    setRelatedListings([]);

    void getRelatedListings(currentListing.id)
      .then((listings) => {
        if (!mounted) return;

        /*
         * Extra frontend safety:
         *
         * The backend already filters by cropKey, but we also verify
         * the result here so a card with a different crop can never
         * accidentally appear in the "You May Like" section.
         */
        const filteredListings = listings.filter(
          (listing) =>
            listing.id !== currentListing.id &&
            listing.cropKey === currentListing.cropKey &&
            listing.status !== 'inactive',
        );

        setRelatedListings(filteredListings.slice(0, 4));
      })
      .catch(() => {
        if (!mounted) return;

        // If related listings cannot be loaded, don't show
        // unrelated/static/fake cards.
        setRelatedListings([]);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentListing.id, currentListing.cropKey]);

  /*
   * Don't render anything while loading or when the database
   * has no actually related listings.
   *
   * This prevents unrelated cards from appearing.
   */
  if (isLoading || relatedListings.length === 0) {
    return null;
  }

  const cropLabel = t(
    `dashboard.marketplaceBrowse.crop.${currentListing.cropKey}`,
  );

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 text-foreground">
        <Sparkles
          className="h-5 w-5 text-warning"
          aria-hidden="true"
        />

        <h2 className="text-xl font-bold">
          {t('dashboard.marketplaceBrowse.detail.relatedListings')}
        </h2>

        <span className="text-sm font-medium text-muted-foreground">
          • {cropLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {relatedListings.map((listing, index) => (
          <MarketplaceCard
            key={listing.id}
            listing={listing}
            index={index}
            isAuthenticated={isAuthenticated}
            isAuthLoading={isAuthLoading}
          />
        ))}
      </div>
    </div>
  );
}
