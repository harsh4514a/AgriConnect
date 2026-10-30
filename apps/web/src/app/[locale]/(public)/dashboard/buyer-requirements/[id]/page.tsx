import { BuyerRequirementDetail } from '@/components/buyer-requirements/buyer-requirement-detail';

export default async function BuyerRequirementDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BuyerRequirementDetail id={id} />;
}
