import { Suspense } from 'react';
import { MarketplaceListingDetails } from '@/components/marketplace/marketplace-listing-details';
import { MarketplaceListingSkeleton } from '@/components/marketplace/marketplace-listing-skeleton';

interface MarketplaceListingPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function MarketplaceListingPage({ params }: MarketplaceListingPageProps) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<MarketplaceListingSkeleton />}>
      <MarketplaceListingDetails id={resolvedParams.id} />
    </Suspense>
  );
}
