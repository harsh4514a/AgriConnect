import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GovernmentSchemesHome } from '@/components/government-schemes/government-schemes-home';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'governmentSchemes' });

  return {
    title: `${t('title')} | AgriConnect`,
    description: t('subtitle'),
  };
}

export default function GovernmentSchemesPage() {
  return <GovernmentSchemesHome />;
}
