'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, PhoneCall } from 'lucide-react';

interface FinalCtaProps {
    onGetStarted: () => void;
}

export function FinalCta({ onGetStarted }: FinalCtaProps) {
    const t = useTranslations();

    return (
        <section id="cta" className="relative py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 32, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-16 sm:py-20"
                    style={{
                        background: 'linear-gradient(135deg, #14532d 0%, #166534 45%, #2E7D32 100%)',
                    }}
                >
                    {/* decorative glows */}
                    <div
                        className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl"
                        aria-hidden="true"
                    />

                    {/* floating emoji accents */}
                    <motion.span
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        className="pointer-events-none absolute left-8 top-8 text-3xl opacity-30"
                        aria-hidden="true"
                    >
                        🌾
                    </motion.span>
                    <motion.span
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="pointer-events-none absolute bottom-8 right-10 text-3xl opacity-30"
                        aria-hidden="true"
                    >
                        🚜
                    </motion.span>

                    <div className="relative">
                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl sm:leading-tight"
                        >
                            {t('cta.title')}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.18 }}
                            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg"
                        >
                            {t('cta.subtitle')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.26 }}
                            className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
                        >
                            <button
                                onClick={onGetStarted}
                                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-black text-green-800 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-black/30"
                            >
                                {t('cta.getStarted')}
                                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                            <button
                                onClick={onGetStarted}
                                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                            >
                                <PhoneCall className="h-5 w-5" />
                                {t('cta.joinNow')}
                            </button>
                        </motion.div>

                        <p className="mt-6 text-xs font-medium text-white/50">{t('cta.freeNote')}</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

