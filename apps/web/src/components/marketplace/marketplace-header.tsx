'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * Marketplace page header — title + subtitle.
 * Uses the existing dashboard glassmorphism design language.
 */
export function MarketplaceHeader() {
    const t = useTranslations();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-1.5"
        >
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t('dashboard.marketplaceBrowse.header.title')}
            </h1>
            <p className="text-sm text-white/60">{t('dashboard.marketplaceBrowse.header.subtitle')}</p>
        </motion.div>
    );
}
