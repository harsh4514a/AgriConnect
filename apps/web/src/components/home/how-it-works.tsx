'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { STEPS } from './data';

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

const item = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export function HowItWorks() {
    const t = useTranslations();

    return (
        <section id="how" className="relative py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800"
                    >
                        {t('how.badge')}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"
                    >
                        {t('how.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-3 text-lg leading-relaxed text-gray-500"
                    >
                        {t('how.subtitle')}
                    </motion.p>
                </div>

                <motion.ol
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Animated connector line (desktop) */}
                    <div
                        className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-green-300 via-green-500 to-green-300 lg:block"
                        aria-hidden="true"
                    />
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                            <motion.li key={step.number} variants={item} className="group relative text-center">
                                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-green-600 shadow-lg shadow-black/[0.06] ring-4 ring-green-50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                                    <Icon className="h-7 w-7" />
                                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-[11px] font-black text-white shadow-md">
                                        {step.number}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-gray-900">{t(step.titleKey)}</h3>
                                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                                    {t(step.descKey)}
                                </p>
                            </motion.li>
                        );
                    })}
                </motion.ol>
            </div>
        </section>
    );
}

