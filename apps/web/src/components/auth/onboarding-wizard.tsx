'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NameStep } from '@/components/auth/steps/name-step';
import { ManualLocationStep } from '@/components/auth/steps/manual-location-step';
import { useLocale } from '@/i18n/locale-provider';
import { INITIAL_AUTH_DATA, type AuthData, type AuthStep } from '@/types/auth-steps.types';

interface OnboardingWizardProps {
    onComplete: () => void;
    onBack: () => void;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

export function OnboardingWizard({ onComplete, onBack }: OnboardingWizardProps) {
    const t = useTranslations();
    const appLocale = useLocale();
    const [step, setStep] = useState<AuthStep>('name');
    const [direction, setDirection] = useState(1);
    const [authData, setAuthData] = useState<AuthData>(INITIAL_AUTH_DATA);

    // Keep the registration payload in sync with the locale chosen in the
    // navbar so completeProfile() persists exactly what the user selected.
    useEffect(() => {
        setAuthData((prev) => {
            if (prev.preferredLanguage === appLocale) return prev;
            return { ...prev, preferredLanguage: appLocale };
        });
    }, [appLocale]);

    useEffect(() => {
        setAuthData((prev) => ({
            ...prev,
            registrationToken:
                typeof window !== 'undefined'
                    ? localStorage.getItem('registrationToken') || undefined
                    : undefined,
        }));
    }, []);

    const goTo = useCallback((nextStep: AuthStep, nextDirection = 1) => {
        setDirection(nextDirection);
        setStep(nextStep);
    }, []);

    const handleNameNext = useCallback((data?: Partial<AuthData>) => {
        if (data) setAuthData((prev) => ({ ...prev, ...data }));
        goTo('location', 1);
    }, [goTo]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.button
                onClick={step === 'name' ? onBack : () => goTo('name', -1)}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('common.back')}
            </motion.button>

            <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-300">{t('wizard.mobile')}</span>
                </div>
                <div className="w-6 h-px bg-white/20" />
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-300">{t('wizard.otp')}</span>
                </div>
                <div className="w-6 h-px bg-white/20" />
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">{t('wizard.profile')}</span>
                </div>
            </div>

            <AnimatePresence mode="wait" custom={direction}>
                {step === 'name' && (
                    <motion.div
                        key="name"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <NameStep authData={authData} onBack={onBack} onNext={handleNameNext} />
                    </motion.div>
                )}

                {step === 'location' && (
                    <motion.div
                        key="location"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <ManualLocationStep
                            authData={authData}
                            onBack={() => goTo('name', -1)}
                            onNext={(data) => {
                                if (data) setAuthData((prev) => ({ ...prev, ...data }));
                            }}
                            onComplete={onComplete}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

