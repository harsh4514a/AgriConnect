import { Suspense } from 'react';
import { MarketplacePage } from '@/components/marketplace/marketplace-page';
import { MarketplaceSkeleton } from '@/components/marketplace/marketplace-skeleton';

export default function MarketplaceRoute() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplacePage />
    </Suspense>
  );
}
