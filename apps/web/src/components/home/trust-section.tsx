'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { TRUST_FEATURES } from './data';

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export function TrustSection() {
    const t = useTranslations();

    return (
        <section id="trust" className="relative py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
                >
                    {TRUST_FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.titleKey}
                                variants={item}
                                className="group relative rounded-3xl border border-gray-100 bg-white/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.06]"
                            >
                                <div
                                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow} transition-transform duration-300 group-hover:scale-110`}
                                >
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-gray-900">{t(feature.titleKey)}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                                    {t(feature.descKey)}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

