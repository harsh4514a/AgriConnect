'use client';

import { useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { sendOtp, verifyFirebase } from '@/services/api/auth.api';
import { createMobileNumberSchema, type MobileNumberFormData } from '@/schemas/auth.schema';
import { MOBILE_CONFIG } from '@/constants/auth.constants';
import { useLocale } from '@/i18n/locale-provider';
import { isFirebaseEnabled } from '@/lib/firebase/client';
import { sendOtpWithFirebase, setPendingVerificationId, clearPendingVerificationId } from '@/lib/firebase/phone-auth';
import { getFirebaseErrorKey } from '@/lib/firebase/errors';

interface MobileNumberFormProps {
    hideLabel?: boolean;
    hideIcon?: boolean;
    className?: string;
    onSuccess?: (mobileNumber: string) => void;
}

function LoadingSpinner({ className }: { className?: string }) {
    return (
        <div
            className={
                'animate-spin rounded-full border-2 border-white/30 border-t-white h-5 w-5 ' +
                (className ?? '')
            }
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

export function MobileNumberForm({ hideLabel, hideIcon, className, onSuccess }: MobileNumberFormProps) {
    const t = useTranslations();
    const locale = useLocale();
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Re-create schema whenever the locale changes so validation messages are localized.
    const mobileNumberSchema = useMemo(() => createMobileNumberSchema(locale), [locale]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<MobileNumberFormData>({
        resolver: zodResolver(mobileNumberSchema),
        defaultValues: {
            mobileNumber: '',
        },
    });

    const mobileValue = watch('mobileNumber');
    // Safely extract just the 10 digits from the form field value
    let rawDigits = '';
    if (mobileValue) {
        // Remove all non-digits first
        const allDigits = mobileValue.replace(/\D/g, '');
        // Remove country code (91) from the start if present
        if (allDigits.startsWith('91')) {
            rawDigits = allDigits.substring(2);
        } else {
            rawDigits = allDigits;
        }
    }
    const hasDigits = rawDigits.length > 0;

    const onSubmit = async (data: MobileNumberFormData) => {
        if (isSending) return;
        setIsSending(true);

        // Evaluated before try/catch so the catch block can reference it.
        const firebaseEnabled = isFirebaseEnabled();

        try {
            let verificationId: string | null = null;

            if (firebaseEnabled) {
                // Firebase Phone Auth: Firebase sends the OTP via SMS. The
                // verificationId is cached for the OTP form to exchange the
                // code for an ID Token (which the backend verifies).
                clearPendingVerificationId();
                verificationId = await sendOtpWithFirebase(data.mobileNumber);
                setPendingVerificationId(verificationId);
            } else {
                // Backend mock OTP: backend generates + stores the OTP and
                // prints it to the console for development.
                await sendOtp({ mobileNumber: data.mobileNumber });
            }

            toast.success(t('mobile.otpSent'), {
                description: t('mobile.otpSentDesc'),
            });

            if (onSuccess) {
                onSuccess(data.mobileNumber);
            }
        } catch (error) {
            const errorKey = firebaseEnabled ? getFirebaseErrorKey(error) : 'mobile.failedSend';
            toast.error(t(errorKey));
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const handleInvalidSubmit = () => {
        const firstError = errors.mobileNumber?.message;
        if (firstError) {
            toast.error(t('mobile.invalidMobile'), {
                description: firstError,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} noValidate className={`space-y-5 ${className ?? ''}`}>
            <div className="space-y-1.5">
                {!hideLabel && (
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-white/80">
                        {t('mobile.label')}
                    </label>
                )}

                <Controller
                    name="mobileNumber"
                    control={control}
                    render={({ field }) => {
                        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            // Extract ONLY the digits from whatever the user typed
                            let allDigits = e.target.value.replace(/\D/g, '');

                            // Remove country code (91) from the START if present (only once)
                            if (allDigits.startsWith('91')) {
                                allDigits = allDigits.substring(2);
                            }

                            // Take only the first 10 digits
                            const digits = allDigits.substring(0, MOBILE_CONFIG.MAX_LENGTH);

                            // Always set the field with exactly "+91" + 10 digits (or less if user hasn't finished typing)
                            field.onChange(`${MOBILE_CONFIG.COUNTRY_CODE}${digits}`);
                        };

                        return (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                                    <span className="flex items-center gap-1.5">
                                        <span className="leading-none text-2xl mr-0.5">🇮🇳</span>
                                        <span className="text-lg font-bold text-white">+91</span>
                                    </span>
                                    <div className="ml-3 h-6 w-px bg-white/30" />
                                </div>

                                <input
                                    id="mobileNumber"
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    placeholder={t('mobile.placeholder')}
                                    maxLength={MOBILE_CONFIG.MAX_LENGTH}
                                    disabled={isSending}
                                    value={rawDigits}
                                    onChange={handleChange}
                                    onBlur={field.onBlur}
                                    ref={(e) => {
                                        field.ref(e);
                                        if (e) (inputRef as React.MutableRefObject<HTMLInputElement>).current = e;
                                    }}
                                    aria-invalid={errors.mobileNumber ? 'true' : 'false'}
                                    aria-describedby={errors.mobileNumber ? 'mobile-error' : undefined}
                                    className={`
                                        flex h-14 w-full rounded-full bg-white/10 backdrop-blur-md border border-white/25
                                        pl-[115px] pr-5 py-3
                                        text-white text-lg tracking-[0.15em] font-semibold
                                        placeholder:text-white/40 placeholder:tracking-normal placeholder:font-medium
                                        focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-400/20 focus:shadow-lg focus:shadow-green-900/20
                                        hover:border-white/40 shadow-lg shadow-black/10
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                        transition-all duration-200
                                        ${errors.mobileNumber ? 'border-red-400/60 focus:border-red-300 focus:ring-red-400/20' : ''}
                                    `}
                                />
                            </div>
                        );
                    }}
                />

                <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-white/40 font-light" />
                </div>

                <motion.button
                    type="submit"
                    disabled={isSending || !hasDigits}
                    whileHover={!isSending && hasDigits ? { scale: 1.01 } : {}}
                    whileTap={!isSending && hasDigits ? { scale: 0.98 } : {}}
                    className="relative w-full h-14 rounded-full font-semibold text-base overflow-hidden transition-all duration-300 ease-out flex items-center justify-center gap-2.5"
                    style={
                        isSending || !hasDigits
                            ? { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
                            : {
                                backgroundColor: '#2E7D32',
                                color: '#ffffff',
                                boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)',
                            }
                    }
                >
                    {!isSending && hasDigits && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                    )}

                    {isSending ? (
                        <>
                            <LoadingSpinner />
                            <span>{t('mobile.sendingOtp')}</span>
                        </>
                    ) : (
                        <>
                            <span>{t('mobile.continue')}</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </motion.button>
            </div>

            {/* Invisible reCAPTCHA container for Firebase Phone Auth.
                Only used when NEXT_PUBLIC_FIREBASE_* is configured.
                Note: no aria-hidden — Firebase/invisible reCAPTCHA injects a
                focusable iframe; aria-hidden on an ancestor of focusable
                content triggers an a11y console error. */}
            <div
                id="firebase-recaptcha-container"
                aria-label="reCAPTCHA"
                role="presentation"
                className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none"
                style={{ width: '256px', height: '60px' }}
            />
        </form>
    );
}
