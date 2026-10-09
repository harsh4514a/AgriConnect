import { MarketplaceListingDetails } from '@/components/marketplace/marketplace-listing-details';

interface MarketplaceListingPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function MarketplaceListingPage({ params }: MarketplaceListingPageProps) {
  const resolvedParams = await params;
  return <MarketplaceListingDetails id={resolvedParams.id} />;
}
