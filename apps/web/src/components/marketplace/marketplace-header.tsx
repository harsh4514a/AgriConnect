'use client';

import { useTranslations } from 'next-intl';
import { PageIntro } from '@/components/ui/page-intro';

/**
 * Marketplace page header — title + subtitle.
 * Uses the existing dashboard glassmorphism design language.
 */
export function MarketplaceHeader() {
    const t = useTranslations();

    return (
        <PageIntro
            title={t('dashboard.marketplaceBrowse.header.title')}
            description={t('dashboard.marketplaceBrowse.header.subtitle')}
        />
    );
}
