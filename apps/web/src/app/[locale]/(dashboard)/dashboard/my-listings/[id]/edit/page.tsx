import { ListingEditContainer } from '@/components/marketplace/create/listing-edit-container';

interface EditListingPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const resolvedParams = await params;
  return <ListingEditContainer id={resolvedParams.id} />;
}
