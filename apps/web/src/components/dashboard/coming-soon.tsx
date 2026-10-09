'use client';

import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function ComingSoon() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 220 }}
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10"
            >
                <Construction className="h-10 w-10 text-green-300" />
            </motion.div>

            <h2 className="mt-6 text-2xl font-bold text-white">{t('dashboard.comingSoon.title')}</h2>
            <p className="mt-2 max-w-md text-sm text-white/60">{t('dashboard.comingSoon.desc')}</p>

            <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                    boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                }}
            >
                <ArrowLeft className="h-4 w-4" />
                {t('dashboard.comingSoon.backToDashboard')}
            </button>
        </motion.div>
    );
}
