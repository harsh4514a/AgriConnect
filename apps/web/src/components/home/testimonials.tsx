'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Quote, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { TESTIMONIALS } from './data';

const AUTOPLAY_MS = 6000;

export function Testimonials() {
    const t = useTranslations();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const count = TESTIMONIALS.length;

    const go = useCallback((dir: 1 | -1) => {
        setIndex((prev) => (prev + dir + count) % count);
    }, [count]);

    useEffect(() => {
        if (paused) return;
        const id = window.setInterval(() => go(1), AUTOPLAY_MS);
        return () => window.clearInterval(id);
    }, [paused, go]);

    const active = TESTIMONIALS[index];

    return (
        <section
            id="testimonials"
            className="relative overflow-hidden py-20 sm:py-24"
            aria-label={t('testimonials.title')}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* ambient */}
            <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100/40 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800"
                    >
                        {t('testimonials.badge')}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"
                    >
                        {t('testimonials.title')}
                    </motion.h2>
                </div>

                <div className="relative mt-12">
                    {/* Glass card */}
                    <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-black/[0.06] backdrop-blur-2xl sm:min-h-[300px] sm:p-12">
                        <Quote className="absolute right-8 top-8 h-16 w-16 text-green-100" aria-hidden="true" />

                        <AnimatePresence mode="wait">
                            <motion.figure
                                key={active.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -24 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="relative"
                            >
                                <blockquote className="text-xl font-semibold leading-relaxed text-gray-800 sm:text-2xl sm:leading-relaxed">
                                    &ldquo;{t(active.quoteKey)}&rdquo;
                                </blockquote>

                                <figcaption className="mt-8 flex items-center gap-4">
                                    <div
                                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${active.avatarHue} text-lg font-black text-white shadow-lg`}
                                        aria-hidden="true"
                                    >
                                        {t(active.nameKey).charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-gray-900">{t(active.nameKey)}</p>
                                        <p className="text-sm font-medium text-green-700">{t(active.roleKey)}</p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                            <MapPin className="h-3 w-3" />
                                            {t(active.locationKey)}
                                        </p>
                                    </div>
                                </figcaption>
                            </motion.figure>
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    <div className="mt-8 flex items-center justify-center gap-5">
                        <button
                            onClick={() => go(-1)}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-green-300 hover:text-green-700"
                            aria-label={t('testimonials.prev')}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2">
                            {TESTIMONIALS.map((item, i) => (
                                <button
                                    key={item.id}
                                    onClick={() => setIndex(i)}
                                    aria-label={t('testimonials.dotAria', { index: i + 1 })}
                                    aria-current={i === index}
                                    className={`h-2.5 rounded-full transition-all duration-300 ${i === index
                                            ? 'w-7 bg-gradient-to-r from-green-500 to-emerald-600'
                                            : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => go(1)}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-green-300 hover:text-green-700"
                            aria-label={t('testimonials.next')}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

