'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { StepProps } from '@/types/auth-steps.types';

const LANGUAGES = [
    { code: 'english', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hindi', label: 'हिन्दी', native: 'Hindi', flag: '🇮🇳' },
    { code: 'gujarati', label: 'ગુજરાતી', native: 'Gujarati', flag: '🪔' },
];

export function LanguageStep({ onNext, authData }: StepProps) {
    const [selectedLanguage, setSelectedLanguage] = useState(authData.preferredLanguage || '');

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-1.5"
            >
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold tracking-wide text-accent">Step 2/3</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Choose your language</h2>
            <p className="mt-2 text-sm text-muted-foreground">Select your preferred language for the app.</p>

            <div className="mt-8 space-y-3">
                {LANGUAGES.map((lang, index) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                        <motion.button
                            key={lang.code}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + index * 0.06, duration: 0.3 }}
                            onClick={() => setSelectedLanguage(lang.code)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            className={`flex w-full items-center justify-between rounded-2xl border-2 bg-surface p-4 text-left transition-all duration-200 ${
                                isSelected ? 'border-accent bg-accent-soft shadow-sm' : 'border-border hover:border-border-strong hover:bg-surface-subtle'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl leading-none">{lang.flag}</span>
                                <div>
                                    <span className="block text-base font-semibold text-foreground">{lang.native}</span>
                                    <span className="mt-0.5 block text-sm text-muted-foreground">{lang.label}</span>
                                </div>
                            </div>
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-accent" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            <motion.button
                onClick={() => onNext({ preferredLanguage: selectedLanguage })}
                disabled={!selectedLanguage}
                whileHover={selectedLanguage ? { scale: 1.01, y: -1 } : {}}
                whileTap={selectedLanguage ? { scale: 0.98 } : {}}
                className={`mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-all duration-200 ${
                    selectedLanguage
                        ? 'bg-accent text-accent-foreground shadow-sm hover:bg-accent-strong'
                        : 'cursor-not-allowed bg-surface-subtle text-muted-foreground'
                }`}
            >
                Continue <ArrowRight className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
}
