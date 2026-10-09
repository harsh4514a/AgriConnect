'use client';

import { motion } from 'framer-motion';
import { CloudSun } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Weather widget placeholder.
 *
 * There is no live weather API integrated yet, so this renders a clean,
 * compact placeholder card (clearly labeled "coming soon") that does not
 * occupy premium space on the first screen. Swap in real data later.
 */
export function WeatherWidget() {
    const t = useTranslations();

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <CloudSun className="h-6 w-6 text-amber-300" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{t('dashboard.weather.unavailableTitle')}</p>
                <p className="mt-0.5 text-xs text-white/50">{t('dashboard.weather.unavailableDesc')}</p>
            </div>
        </motion.div>
    );
}
