'use client';

import { useEffect, useState } from 'react';
import type { CropListing } from '@/data/marketplace-listings';
import { getMyListing } from '@/services/api/listings.api';
import { ListingForm } from '@/components/marketplace/create/listing-form';
import { MarketplaceListingNotFound } from '@/components/marketplace/marketplace-listing-not-found';
import { MarketplaceListingSkeleton } from '@/components/marketplace/marketplace-listing-skeleton';

interface ListingEditContainerProps {
  id: string;
}

export function ListingEditContainer({ id }: ListingEditContainerProps) {
  const [listing, setListing] = useState<CropListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    void getMyListing(id)
      .then((response) => {
        if (mounted) setListing(response);
      })
      .catch(() => {
        if (mounted) setListing(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <MarketplaceListingSkeleton />;
  }

  if (!listing) {
    return <MarketplaceListingNotFound />;
  }

  return <ListingForm mode="edit" initialListing={listing} />;
}
