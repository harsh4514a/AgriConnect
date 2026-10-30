'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StepProps } from '@/types/auth-steps.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold tracking-wide text-accent">
                    {t('name.step', { current: 1, total: 2 })}
                </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('name.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('name.subtitle')}</p>

            <div className="mt-8 space-y-4">
                {/* First Name Input */}
                <div className="relative">
                    <Label htmlFor="firstName" className="mb-2 block font-semibold">
                        {t('profile.firstName')} *
                    </Label>
                    <Input
                        ref={firstNameInputRef}
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t('profile.enterFirstName')}
                        autoFocus
                        leftIcon={<User className="h-5 w-5" aria-hidden="true" />}
                        className="h-12 text-base font-medium"
                    />
                </div>

                {/* Last Name Input */}
                <div className="relative">
                    <Label htmlFor="lastName" className="mb-2 block font-semibold">
                        {t('profile.lastName')} *
                    </Label>
                    <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t('profile.enterLastName')}
                        leftIcon={<User className="h-5 w-5" aria-hidden="true" />}
                        className="h-12 text-base font-medium"
                    />
                </div>

                <button
                    onClick={() => onNext({ firstName: firstName.trim(), lastName: lastName.trim() })}
                    disabled={!isFormValid}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted-foreground"
                >
                    {t('name.continue')} <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

