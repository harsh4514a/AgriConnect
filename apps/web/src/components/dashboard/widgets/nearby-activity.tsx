'use client';

import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const DUMMY_ACTIVITY = [
    { key: 'wheat', titleKey: 'dashboard.widgets.nearbyActivity.wheat', detailKey: 'dashboard.widgets.nearbyActivity.district', distance: '12 km' },
    { key: 'buyer', titleKey: 'dashboard.widgets.nearbyActivity.buyer', detailKey: 'dashboard.widgets.nearbyActivity.buyerDetail', distance: '8 km' },
    { key: 'tomato', titleKey: 'dashboard.widgets.nearbyActivity.tomato', detailKey: 'dashboard.widgets.nearbyActivity.district', distance: '21 km' },
];

export function NearbyActivity() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
            <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{t('dashboard.widgets.nearbyActivity.title')}</h3>
                <button
                    onClick={() => router.push(`/${locale}/dashboard/nearby-listings`)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-green-300 transition-colors hover:text-green-200"
                >
                    {t('dashboard.widgets.viewAll')}
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>

            <ul className="space-y-3">
                {DUMMY_ACTIVITY.map((item) => (
                    <li key={item.key} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                            <MapPin className="h-4 w-4 text-green-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{t(item.titleKey)}</p>
                            <p className="truncate text-[11px] text-white/40">{t(item.detailKey)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                            {item.distance}
                        </span>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}
