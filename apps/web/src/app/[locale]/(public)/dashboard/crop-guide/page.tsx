import type { Metadata } from 'next';
import { CropGuideHome } from '@/components/crop-guide/crop-guide-home';

export const metadata: Metadata = {
  title: 'Crop Guide | AgriConnect',
  description: 'Practical crop cultivation guidance for farmers.',
};

export default function CropGuidePage() {
  return <CropGuideHome />;
}
