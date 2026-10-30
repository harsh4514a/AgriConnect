import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GovernmentSchemeDetailPage } from '@/components/government-schemes/government-scheme-detail-page';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'governmentSchemes' });

  return {
    title: `${t('detailTitle')} | AgriConnect`,
    description: t('subtitle'),
  };
}

export default function GovernmentSchemeDetailRoute() {
  return <GovernmentSchemeDetailPage />;
}
