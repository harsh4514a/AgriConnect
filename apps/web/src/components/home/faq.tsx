'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Plus, Minus } from 'lucide-react';
import { FAQ_ITEMS } from './data';

export function Faq() {
    const t = useTranslations();
    const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

    return (
        <section id="faq" className="relative py-20 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800"
                    >
                        {t('faq.badge')}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"
                    >
                        {t('faq.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-3 text-lg leading-relaxed text-gray-500"
                    >
                        {t('faq.subtitle')}
                    </motion.p>
                </div>

                <div className="mt-12 space-y-3">
                    {FAQ_ITEMS.map((item, i) => {
                        const open = openId === item.id;
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.05 * i }}
                                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${open
                                        ? 'border-green-200 bg-white shadow-lg shadow-green-900/[0.06]'
                                        : 'border-gray-100 bg-white/60 hover:border-green-100 hover:bg-white'
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenId(open ? null : item.id)}
                                    aria-expanded={open}
                                    aria-controls={`faq-panel-${item.id}`}
                                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                                >
                                    <span className="text-base font-bold text-gray-900 sm:text-lg">
                                        {t(item.questionKey)}
                                    </span>
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${open
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                        aria-hidden="true"
                                    >
                                        {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {open && (
                                        <motion.div
                                            id={`faq-panel-${item.id}`}
                                            role="region"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <p className="px-6 pb-5 text-sm leading-relaxed text-gray-500 sm:text-base">
                                                {t(item.answerKey)}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

