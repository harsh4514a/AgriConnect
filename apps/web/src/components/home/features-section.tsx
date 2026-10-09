'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FEATURES } from './data';

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

const item = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export function FeaturesSection() {
    const t = useTranslations();

    return (
        <section id="features" className="relative py-20 sm:py-24">
            {/* ambient glow */}
            <div
                className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-green-100/50 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800"
                    >
                        {t('features.badge')}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"
                    >
                        {t('features.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-3 text-lg leading-relaxed text-gray-500"
                    >
                        {t('features.subtitle')}
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
                >
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        const large = feature.className?.includes('row-span-2');
                        return (
                            <motion.div
                                key={feature.titleKey}
                                variants={item}
                                className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/[0.07] ${feature.className ?? ''}`}
                            >
                                {/* Hover glow */}
                                <div
                                    className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
                                    aria-hidden="true"
                                />

                                <div
                                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                                >
                                    <Icon className="h-6 w-6 text-white" />
                                </div>

                                <h3
                                    className={`mt-5 font-bold text-gray-900 ${large ? 'text-2xl' : 'text-lg'}`}
                                >
                                    {t(feature.titleKey)}
                                </h3>
                                <p
                                    className={`mt-2 leading-relaxed text-gray-500 ${large ? 'text-base max-w-md' : 'text-sm'
                                        }`}
                                >
                                    {t(feature.descKey)}
                                </p>

                                {large && (
                                    <div className="mt-6 hidden items-center gap-2 text-sm font-semibold text-green-700 md:inline-flex">
                                        <span>{t('features.learnMore')}</span>
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

