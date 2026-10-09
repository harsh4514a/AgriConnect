'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Store, ShieldCheck, Languages, Sparkles, Leaf, Wheat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { STATS } from './data';

interface HeroProps {
    onGetStarted: () => void;
    onExplore: () => void;
}

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

/* ── Floating particles for ambient interactivity ── */
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (i * 37 + 13) % 100,
    y: (i * 53 + 29) % 100,
    duration: 8 + ((i * 7) % 13),
    delay: (i * 5) % 6,
    icon: i % 3 === 0 ? '🌾' : i % 3 === 1 ? '🍃' : '✨',
}));

function Particles() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {PARTICLES.map((p) => (
                <motion.span
                    key={p.id}
                    className="absolute text-base opacity-20"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    animate={{
                        y: [0, -30, 0, 20, 0],
                        x: [0, 15, -10, 8, 0],
                        opacity: [0.15, 0.35, 0.15, 0.3, 0.15],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: p.delay,
                    }}
                >
                    {p.icon}
                </motion.span>
            ))}
        </div>
    );
}

export function Hero({ onGetStarted, onExplore }: HeroProps) {
    const t = useTranslations();

    return (
        <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
            {/* Background image */}
            <Image
                src="/Background_Image.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                quality={75}
                className="object-cover"
                aria-hidden="true"
            />

            {/* Primary dark green overlay — covers the baked-in watermark text */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-950/75 via-green-900/55 to-green-800/30" />
            {/* Top mask — specifically hides the "AGRI MARKETPLACE / FAIRTRADE MADE EASY" watermark */}
            <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-green-950/80 via-green-950/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-green-950/40 via-transparent to-transparent" />

            {/* Subtle ambient green glow */}
            <div className="pointer-events-none absolute left-1/3 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400/15 blur-[120px]" aria-hidden="true" />
            <div className="pointer-events-none absolute right-1/4 top-2/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-[100px]" aria-hidden="true" />

            {/* Floating particles */}
            <Particles />

            {/* Animated leaf overlay (bottom right) */}
            <motion.div
                className="pointer-events-none absolute bottom-10 right-10 text-6xl opacity-10"
                aria-hidden="true"
                animate={{ rotate: [0, 15, 0, -10, 0], scale: [1, 1.1, 1, 1.05, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Leaf className="h-24 w-24 text-green-300" />
            </motion.div>

            <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 mt-24">
                {/* Left: copy */}
                <div>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={0}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-green-300" />
                        <span className="text-xs font-semibold text-white/90">{t('home.badge')}</span>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={1}
                        className="mt-9"
                    >
                        <h1 className="text-4xl font-black leading-tight tracking-tighter text-white sm:text-5xl lg:text-6xl">
                            {t('hero.titleLine1')}
                        </h1>
                        <div className="h-4 sm:h-5 lg:h-6" />
                        <div className="text-4xl mb-9 font-black leading-tight tracking-tighter text-white sm:text-5xl lg:text-6xl">
                            {t('hero.titleLine2')}{' '}
                            <span className="bg-gradient-to-r from-green-300 via-emerald-200 to-lime-300 bg-clip-text text-transparent">
                                {t('hero.titleAccent')}
                            </span>
                        </div>
                    </motion.div>

                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={2}
                        className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-white/85"
                    >
                        {t('hero.subtitle')}
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={3}
                        className="mt-12 flex flex-wrap items-center gap-4"
                    >
                        <button
                            onClick={onGetStarted}
                            className="group inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                                boxShadow: '0 4px 24px rgba(46,125,50,0.45)',
                            }}
                        >
                            <Wheat className="h-5 w-5" />
                            {t('hero.ctaPrimary')}
                            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </button>
                        <button
                            onClick={onExplore}
                            className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 active:scale-[0.98]"
                        >
                            <Store className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                            {t('hero.ctaSecondary')}
                        </button>
                    </motion.div>

                    {/* Trust badges with animated icons */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={4}
                        className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/80"
                    >
                        {[
                            { icon: ShieldCheck, key: 'trustSecure', color: 'text-green-300' },
                            { icon: Store, key: 'trustNoMiddlemen', color: 'text-emerald-300' },
                            { icon: Languages, key: 'trustLanguages', color: 'text-lime-300' },
                        ].map((badge) => {
                            const Icon = badge.icon;
                            return (
                                <motion.span
                                    key={badge.key}
                                    className="inline-flex items-center gap-2"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                >
                                    <Icon className={`h-4 w-4 ${badge.color}`} />
                                    {t(`hero.${badge.key}`)}
                                </motion.span>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Right: floating statistics cards */}
                <div className="relative hidden h-[480px] lg:block">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="relative h-80 w-80">
                            {/* Glow disc */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl"
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            {/* Orbiting ring */}
                            <motion.div
                                className="absolute inset-4 rounded-full border border-white/10"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Central live marketplace badge */}
                            <motion.div
                                animate={{ y: [0, -14, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-center backdrop-blur-2xl"
                            >
                                <motion.span
                                    className="text-2xl"
                                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    🌾
                                </motion.span>
                                <p className="mt-1 px-4 text-sm font-bold leading-tight text-white">
                                    {t('hero.liveMarket')}
                                </p>
                                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-green-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-200">
                                    <motion.span
                                        className="h-1.5 w-1.5 rounded-full bg-green-300"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    {t('hero.live')}
                                </span>
                            </motion.div>

                            {/* Floating stat cards — improved visibility */}
                            {STATS.map((stat, i) => {
                                const Icon = stat.icon;
                                const positions = [
                                    '-left-6 top-8',
                                    '-right-6 top-28',
                                    'left-0 bottom-2',
                                ] as const;
                                const delays = [0, 0.8, 1.6];
                                return (
                                    <motion.div
                                        key={stat.labelKey}
                                        animate={{ y: [0, i % 2 === 0 ? -14 : 14, 0] }}
                                        transition={{
                                            duration: 5 + i,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay: delays[i],
                                        }}
                                        className={`absolute ${positions[i]} flex items-center gap-3 rounded-2xl border border-white/30 bg-white/20 px-5 py-4 shadow-xl shadow-black/30 backdrop-blur-xl`}
                                        whileHover={{ scale: 1.08 }}
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-900/40">
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black leading-none text-white drop-shadow-sm">{stat.value}</p>
                                            <p className="mt-1 text-xs font-semibold leading-tight text-white/80">
                                                {t(stat.labelKey)}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll hint — enhanced */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Scroll</span>
                    <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1.5">
                        <motion.div
                            className="h-2 w-1 rounded-full bg-white/60"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
