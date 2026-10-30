'use client';

import { motion } from 'framer-motion';
import { PlusCircle, Store, Package, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * The first screen of the dashboard answers "What does the farmer want to do * today?". Selling stays the clearest action, with the other frequent routes
 * presented as compact links instead of competing cards.
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
            accent: 'text-accent',
        },
        {
            label: t('dashboard.primary.myListings'),
            desc: t('dashboard.primary.myListingsDesc'),
            href: '/dashboard/my-listings',
            icon: Package,
            accent: 'text-warning',
        },
        {
            label: t('dashboard.primary.marketPrices'),
            desc: t('dashboard.primary.marketPricesDesc'),
            href: '/dashboard/market-prices',
            icon: TrendingUp,
            accent: 'text-accent',
        },
    ];

    return (
        <section aria-label={t('dashboard.primary.label')}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
                {t('dashboard.primary.title')}
            </h2>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
                {/* Primary — Sell Crop (largest, most prominent) */}
                <motion.button
                    onClick={() => router.push(`/${locale}${primary.href}`)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex min-h-[132px] flex-col items-start justify-between rounded-2xl border border-accent bg-accent p-5 text-left text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/10">
                            <primary.icon className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{primary.label}</p>
                            <p className="mt-0.5 text-sm opacity-80">{primary.desc}</p>
                        </div>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                        {t('dashboard.mobile.sellCta')}
                        <ArrowRight className="h-4 w-4" />
                    </span>
                </motion.button>

                {/* Secondary actions */}
                <div className="grid grid-cols-1 divide-y divide-border rounded-2xl border border-border bg-surface px-4 sm:px-5">
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
                                className="group flex min-h-[64px] items-center gap-3 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                                    <Icon className={`h-5 w-5 ${action.accent}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent-strong">{action.label}</p>
                                    <p className="truncate text-xs text-muted-foreground">{action.desc}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
