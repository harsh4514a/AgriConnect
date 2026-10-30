'use client';

import { useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { sendOtp, verifyFirebase } from '@/services/api/auth.api';
import { createMobileNumberSchema, type MobileNumberFormData } from '@/schemas/auth.schema';
import { MOBILE_CONFIG } from '@/constants/auth.constants';
import { useLocale } from '@/i18n/locale-provider';
import { isFirebaseEnabled } from '@/lib/firebase/config';
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
                'animate-spin rounded-full border-2 border-border border-t-accent h-5 w-5' +
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
    const isMobileNumberValid = MOBILE_CONFIG.REGEX.test(rawDigits);

    const onSubmit = async (data: MobileNumberFormData) => {
        if (isSending) return;
        setIsSending(true);

        // Evaluated before try/catch so the catch block can reference it.
        const firebaseEnabled = isFirebaseEnabled();

        try {
            let verificationId: string | null = null;

            if (firebaseEnabled) {
                const {
                    sendOtpWithFirebase,
                    setPendingVerificationId,
                    clearPendingVerificationId,
                } = await import('@/lib/firebase/phone-auth');

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
        <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} noValidate className={`space-y-4 ${className ?? ''}`}>
            <div className="space-y-1.5">
                {!hideLabel && (
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-foreground">
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
                                        <span className="text-lg font-bold text-foreground">+91</span>
                                    </span>
                                    <div className="ml-3 h-6 w-px bg-border" />
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
                                        flex h-14 w-full rounded-xl border border-border bg-surface
                                        pl-[115px] pr-5 py-3
                                        text-foreground text-lg tracking-[0.15em] font-semibold
                                        placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-medium
                                        focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus focus:shadow-lg focus:shadow-green-900/20
                                        hover:border-border shadow-sm
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                        transition-all duration-200
                                        ${errors.mobileNumber ? 'border-red-400/60 focus:border-red-300 focus:ring-red-400/20' : ''}
                                    `}
                                />
                            </div>
                        );
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isSending || !isMobileNumberValid}
                className={`relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                    isSending || !isMobileNumberValid
                        ? 'cursor-not-allowed bg-surface-subtle text-muted-foreground'
                        : 'bg-accent text-accent-foreground shadow-sm hover:bg-accent-strong'
                }`}
            >
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
            </button>

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
