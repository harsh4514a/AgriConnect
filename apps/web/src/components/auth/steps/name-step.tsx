'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StepProps } from '@/types/auth-steps.types';

export function NameStep({ onNext, authData }: StepProps) {
    const t = useTranslations();
    const [firstName, setFirstName] = useState(authData.firstName || '');
    const [lastName, setLastName] = useState(authData.lastName || '');
    const firstNameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        firstNameInputRef.current?.focus();
    }, []);

    const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-300" />
                <span className="text-xs font-semibold tracking-wide text-white/90">
                    {t('name.step', { current: 1, total: 2 })}
                </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t('name.title')}</h2>
            <p className="mt-2 text-sm text-white/60">{t('name.subtitle')}</p>

            <div className="mt-8 space-y-4">
                {/* First Name Input */}
                <div className="relative">
                    <label htmlFor="firstName" className="block text-xs font-semibold text-white/70 mb-2">
                        {t('profile.firstName')} *
                    </label>
                    <User className="absolute left-4 top-10 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                        ref={firstNameInputRef}
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t('profile.enterFirstName')}
                        autoFocus
                        className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-white/25 bg-white/10 backdrop-blur-md text-white text-lg font-medium placeholder:text-white/40 focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-400/20 transition-all"
                    />
                </div>

                {/* Last Name Input */}
                <div className="relative">
                    <label htmlFor="lastName" className="block text-xs font-semibold text-white/70 mb-2">
                        {t('profile.lastName')} *
                    </label>
                    <User className="absolute left-4 top-10 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t('profile.enterLastName')}
                        className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-white/25 bg-white/10 backdrop-blur-md text-white text-lg font-medium placeholder:text-white/40 focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-400/20 transition-all"
                    />
                </div>

                <button
                    onClick={() => onNext({ firstName: firstName.trim(), lastName: lastName.trim() })}
                    disabled={!isFormValid}
                    className="w-full h-14 rounded-xl font-semibold text-base mt-8 flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg shadow-green-900/30 hover:shadow-xl disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed"
                >
                    {t('name.continue')} <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

