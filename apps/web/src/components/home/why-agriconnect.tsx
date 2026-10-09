'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { BENEFITS } from './data';

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, x: 24 },
    show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
};

export function WhyAgriConnect() {
    const t = useTranslations();

    return (
        <section id="about" className="relative overflow-hidden py-20 sm:py-24">
            {/* soft background split */}
            <div
                className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-br from-green-50/80 via-white to-emerald-50/40 lg:w-3/5"
                aria-hidden="true"
            />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
                {/* Illustration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative order-2 lg:order-1"
                >
                    <div className="relative mx-auto max-w-md">
                        <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-green-500/20 to-emerald-400/20 blur-2xl" aria-hidden="true" />
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-green-100 bg-white shadow-2xl shadow-green-900/10">
                            <Image
                                src="/Background_Image1.jpg"
                                alt={t('why.imageAlt')}
                                width={1672}
                                height={941}
                                priority={false}
                                className="h-72 w-full object-cover"
                            />
                            {/* floating stat chip */}
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -left-4 top-32 rounded-2xl border border-white/60 bg-white/90 px-5 py-3 shadow-xl shadow-black/10 backdrop-blur-xl"
                            >
                                <p className="text-2xl font-black text-green-700">{t('why.incomeStat')}</p>
                                <p className="text-xs font-semibold text-gray-500">{t('why.incomeLabel')}</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Benefits */}
                <div className="order-1 lg:order-2">
                    <motion.span
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800"
                    >
                        {t('why.badge')}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"
                    >
                        {t('why.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-3 max-w-xl text-lg leading-relaxed text-gray-500"
                    >
                        {t('why.subtitle')}
                    </motion.p>

                    <motion.ul
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.15 }}
                        className="mt-8 space-y-4"
                    >
                        {BENEFITS.map((benefit) => {
                            const Icon = benefit.icon;
                            return (
                                <motion.li
                                    key={benefit.titleKey}
                                    variants={item}
                                    className="group flex items-start gap-4 rounded-2xl border border-transparent bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-100 hover:bg-white hover:shadow-lg hover:shadow-black/[0.05]"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-600/20 transition-transform duration-300 group-hover:scale-110">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{t(benefit.titleKey)}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                            {t(benefit.descKey)}
                                        </p>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </motion.ul>
                </div>
            </div>
        </section>
    );
}
