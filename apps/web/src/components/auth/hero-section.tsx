'use client';

import { motion } from 'framer-motion';
import { Sprout, Wheat, Tractor } from 'lucide-react';
import { TrustBadges } from './trust-badges';

export function HeroSection() {
    return (
        <div className="relative h-full min-h-[600px] flex flex-col justify-between p-8 lg:p-12 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />

            {/* Floating decorative elements */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-20 right-20 w-32 h-32 rounded-full bg-brand-400/20 blur-3xl"
            />
            <motion.div
                animate={{
                    y: [0, 15, 0],
                    rotate: [0, -3, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-40 left-10 w-48 h-48 rounded-full bg-emerald-300/15 blur-3xl"
            />
            <motion.div
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute top-40 right-40 w-24 h-24 rounded-full bg-yellow-400/10 blur-2xl"
            />

            {/* Decorative icons */}
            <motion.div
                animate={{ y: [0, -12, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-28 left-16 text-accent/20"
            >
                <Sprout className="h-16 w-16" />
            </motion.div>
            <motion.div
                animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute bottom-32 right-16 text-accent/15"
            >
                <Wheat className="h-20 w-20" />
            </motion.div>
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                className="absolute top-1/2 left-3/4 text-accent/10"
            >
                <Tractor className="h-12 w-12" />
            </motion.div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Top area */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-border mb-8"
                    >
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs font-medium text-white/80">Farmers Marketplace</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight text-balance"
                    >
                        Connecting Farmers
                        <br />

                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">
                            Directly with Buyers
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-4 text-base text-white/70 max-w-md leading-relaxed"
                    >
                        India&apos;s smart agricultural marketplace that empowers farmers to sell directly,
                        eliminating middlemen and ensuring fair prices for their produce.
                    </motion.p>
                </div>

                {/* Bottom area */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12"
                >
                    <TrustBadges />
                </motion.div>
            </div>
        </div>
    );
}

