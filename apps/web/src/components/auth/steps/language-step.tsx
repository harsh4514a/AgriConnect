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
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border"
                style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(46,125,50,0.3)',
                }}
            >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2E7D32' }} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: '#2E7D32' }}>Step 2/3</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Choose your language</h2>
            <p className="mt-2 text-sm text-gray-500">Select your preferred language for the app.</p>

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
                            className="w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between"
                            style={
                                isSelected
                                    ? {
                                        borderColor: '#2E7D32',
                                        background: 'rgba(46,125,50,0.06)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        boxShadow: '0 0 0 3px rgba(46,125,50,0.1)',
                                    }
                                    : {
                                        borderColor: 'rgba(229,231,235,0.8)',
                                        background: 'rgba(255,255,255,0.65)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                    }
                            }
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl leading-none">{lang.flag}</span>
                                <div>
                                    <span className="block text-base font-semibold text-gray-900">{lang.native}</span>
                                    <span className="block text-sm text-gray-500 mt-0.5">{lang.label}</span>
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
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
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
                className="w-full h-14 rounded-full font-semibold text-base mt-6 flex items-center justify-center gap-2 transition-all duration-200"
                style={
                    selectedLanguage
                        ? {
                            background: 'linear-gradient(135deg, #2E7D32, #388E3C)',
                            color: '#fff',
                            boxShadow: '0 4px 16px rgba(46,125,50,0.3)',
                        }
                        : {
                            background: '#f3f4f6',
                            color: '#9ca3af',
                            cursor: 'not-allowed',
                        }
                }
            >
                Continue <ArrowRight className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
}
