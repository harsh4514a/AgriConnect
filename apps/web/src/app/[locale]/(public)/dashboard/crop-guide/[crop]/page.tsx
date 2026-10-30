import type { Metadata } from 'next';
import { CropGuideDetailPage } from '@/components/crop-guide/crop-guide-detail-page';

export const metadata: Metadata = {
  title: 'Crop Guide | AgriConnect',
  description: 'Farmer-friendly crop cultivation guidance from trusted agricultural sources.',
};

export default function CropGuideDetailRoute() {
  return <CropGuideDetailPage />;
}
