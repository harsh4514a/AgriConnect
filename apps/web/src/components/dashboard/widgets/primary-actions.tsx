'use client';

import { motion } from 'framer-motion';
import { PlusCircle, Store, Package, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * The first screen of the dashboard answers "What does the farmer want to do
 * today?". "Sell Crop" is the dominant, largest action — it must never compete
 * visually with the other actions. Marketplace, My Listings and Market Prices
 * follow as secondary tiles.
 */
export function PrimaryActions() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    const primary = {
        label: t('dashboard.primary.sellCrop'),
        desc: t('dashboard.primary.sellCropDesc'),
        href: '/dashboard/marketplace/create',
        icon: PlusCircle,
    };

    const secondary = [
        {
            label: t('dashboard.primary.marketplace'),
            desc: t('dashboard.primary.marketplaceDesc'),
            href: '/dashboard/marketplace',
            icon: Store,
            accent: 'text-green-300',
        },
        {
            label: t('dashboard.primary.myListings'),
            desc: t('dashboard.primary.myListingsDesc'),
            href: '/dashboard/my-listings',
            icon: Package,
            accent: 'text-amber-300',
        },
        {
            label: t('dashboard.primary.marketPrices'),
            desc: t('dashboard.primary.marketPricesDesc'),
            href: '/dashboard/market-prices',
            icon: TrendingUp,
            accent: 'text-sky-300',
        },
    ];

    return (
        <section aria-label={t('dashboard.primary.label')}>
            <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                {t('dashboard.primary.title')}
            </h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Primary — Sell Crop (largest, most prominent) */}
                <motion.button
                    onClick={() => router.push(`/${locale}${primary.href}`)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex min-h-[150px] flex-col items-start justify-between rounded-3xl border border-green-400/30 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/20 lg:col-span-1"
                    style={{
                        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                        boxShadow: '0 8px 24px rgba(46,125,50,0.35)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                            <primary.icon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">{primary.label}</p>
                            <p className="mt-0.5 text-sm text-white/70">{primary.desc}</p>
                        </div>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors group-hover:bg-white/25">
                        {t('dashboard.mobile.sellCta')}
                        <ArrowRight className="h-4 w-4" />
                    </span>
                </motion.button>

                {/* Secondary actions */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                    {secondary.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <motion.button
                                key={action.label}
                                onClick={() => router.push(`/${locale}${action.href}`)}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 + idx * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl transition-all hover:border-green-400/30 hover:bg-white/10 hover:shadow-xl hover:shadow-black/20"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <Icon className={`h-5 w-5 ${action.accent}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{action.label}</p>
                                    <p className="truncate text-xs text-white/50">{action.desc}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
