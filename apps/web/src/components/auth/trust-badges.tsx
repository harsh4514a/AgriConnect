'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound, Zap } from 'lucide-react';

const BADGES = [
    {
        icon: ShieldCheck,
        text: 'Secure OTP Login',
        description: 'End-to-end encrypted',
    },
    {
        icon: KeyRound,
        text: 'No Password Required',
        description: 'Simple & hassle-free',
    },
    {
        icon: Zap,
        text: 'Fast & Easy Registration',
        description: 'Takes less than 30 seconds',
    },
];

export function TrustBadges() {
    return (
        <div className="space-y-4">
            {BADGES.map((badge, index) => (
                <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.15, duration: 0.5 }}
                    className="flex items-start gap-3"
                >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <badge.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{badge.text}</p>
                        <p className="text-xs text-white/60">{badge.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

