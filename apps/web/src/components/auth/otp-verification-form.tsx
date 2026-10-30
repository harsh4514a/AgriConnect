'use client';

import { useRef, useState, useCallback, useEffect, ClipboardEvent, KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { isFirebaseEnabled } from '@/lib/firebase/config';
import { getFirebaseErrorKey } from '@/lib/firebase/errors';
import { verifyFirebase } from '@/services/api/auth.api';
import { API_BASE_URL } from '@/lib/api-url';
import type { AuthUser } from '@/types/auth.types';
import { syncSessionHintFromStorage } from '@/services/api/token';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const VERIFY_ENDPOINT = `${API_BASE_URL}/auth/verify-otp`;

interface OtpVerificationFormProps {
    mobileNumber: string;
    onBack: () => void;
    onSuccess: (isNewUser: boolean, registrationToken?: string, user?: AuthUser) => void;
}

export function OtpVerificationForm({ mobileNumber, onBack, onSuccess }: OtpVerificationFormProps) {
    const t = useTranslations();
    const prefersReducedMotion = useReducedMotion() ?? false;
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [timer, setTimer] = useState(RESEND_COOLDOWN);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null));
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const verifyLockRef = useRef(false);

    // Format mobile number for display - handle any number of digits
    const formatMobileForDisplay = (phone: string) => {
        // Remove any non-digits except the leading +
        const cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+91')) {
            const digits = cleaned.replace(/\D/g, '').slice(2); // Remove country code digits
            if (digits.length === 10) {
                return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
            }
            return cleaned; // Return as-is if not 10 digits
        }
        return phone;
    };
    const formattedMobile = formatMobileForDisplay(mobileNumber);

    // Sanitize mobile number to ensure it is always +91 plus 10 digits.
    const sanitizeMobileNumber = (phone: string): string => {
        const digits = phone.replace(/\D/g, '');
        const cleanedDigits = digits.startsWith('91') ? digits.substring(2) : digits;
        const finalDigits = cleanedDigits.substring(0, 10);
        return `+91${finalDigits}`;
    };

    // Start countdown timer
    const startTimer = useCallback(() => {
        setTimer(RESEND_COOLDOWN);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        startTimer();
        inputRefs.current[0]?.focus();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startTimer]);

    const handleChange = useCallback((index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [otp]);

    const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [otp]);

    const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();
        if (!/^\d{6}$/.test(pastedData)) return;

        setOtp(pastedData.split(''));
        inputRefs.current[OTP_LENGTH - 1]?.focus();
    }, []);

    const handleResend = useCallback(async () => {
        if (timer > 0 || isResending) return;
        setIsResending(true);
        try {
            const sanitized = sanitizeMobileNumber(mobileNumber);

            if (isFirebaseEnabled()) {
                // Firebase resend produces a fresh verificationId and caches it.
                const { resendOtpWithFirebase } = await import('@/lib/firebase/phone-auth');
                await resendOtpWithFirebase(sanitized);
            } else {
                const response = await fetch(
                    `${API_BASE_URL}/auth/send-otp`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mobileNumber: sanitized }),
                    }
                );
                if (!response.ok) {
                    toast.error(t('otp.failedResend'));
                    return;
                }
            }

            toast.success(t('otp.otpResent'));
            setOtp(Array(OTP_LENGTH).fill(''));
            startTimer();
            inputRefs.current[0]?.focus();
        } catch (error) {
            const errorKey = isFirebaseEnabled() ? getFirebaseErrorKey(error) : 'otp.networkError';
            toast.error(t(errorKey), {
                description: t('otp.networkErrorDesc'),
            });
        } finally {
            setIsResending(false);
        }
    }, [mobileNumber, timer, isResending, startTimer, t]);

    const handleVerify = useCallback(async () => {
        if (verifyLockRef.current || isSuccess) return;

        const otpCode = otp.join('');
        if (otpCode.length !== OTP_LENGTH) return;

        // Sanitize mobile number before sending to backend
        const sanitizedMobile = sanitizeMobileNumber(mobileNumber);

        verifyLockRef.current = true;
        setIsVerifying(true);

        try {
            const firebaseEnabled = isFirebaseEnabled();

            let data: any;

            if (firebaseEnabled) {
                // Firebase flow: exchange the OTP code for an ID Token, then
                // send the ID Token to the backend which verifies it with the
                // Admin SDK (never trusting the frontend).
                const {
                    getPendingVerificationId,
                    verifyOtpWithFirebase,
                    clearPendingVerificationId,
                } = await import('@/lib/firebase/phone-auth');
                const verificationId = getPendingVerificationId();

                if (!verificationId) {
                    toast.error(t('otp.networkError'), { description: t('otp.networkErrorDesc') });
                    setIsVerifying(false);
                    verifyLockRef.current = false;
                    return;
                }

                const { idToken } = await verifyOtpWithFirebase(sanitizedMobile, verificationId, otpCode);

                const res = await verifyFirebase({
                    idToken,
                    mobileNumber: sanitizedMobile,
                });

                data = res;
                clearPendingVerificationId();
            } else {
                // Backend mock flow - use sanitized mobile number
                const response = await fetch(VERIFY_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobileNumber: sanitizedMobile, otp: otpCode }),
                });

                data = await response.json();

                if (!response.ok) {
                    const rawMessage = data?.message;
                    const message =
                        typeof rawMessage === 'string'
                            ? rawMessage
                            : Array.isArray(rawMessage)
                                ? rawMessage.join(' ')
                                : rawMessage && typeof rawMessage === 'object'
                                    ? JSON.stringify(rawMessage)
                                    : '';
                    const lower = message.toLowerCase();

                    let titleKey: string;
                    let descKey: string;

                    if (lower.includes('5 wrong')) {
                        titleKey = 'otp.maxAttemptsTitle';
                        descKey = 'otp.maxAttemptsDesc';
                    } else if (lower.includes('wrong')) {
                        titleKey = 'otp.wrongTitle';
                        descKey = 'otp.wrongDesc';
                    } else if (lower.includes('expired')) {
                        titleKey = 'otp.expiredTitle';
                        descKey = 'otp.expiredDesc';
                    } else {
                        titleKey = 'otp.invalidTitle';
                        descKey = 'otp.invalidDesc';
                    }

                    toast.error(t(titleKey), { description: t(descKey) });
                    setOtp(Array(OTP_LENGTH).fill(''));
                    inputRefs.current[0]?.focus();
                    setIsVerifying(false);
                    verifyLockRef.current = false;
                    return;
                }
            }

            setIsSuccess(true);
            toast.success(t('otp.otpVerified'));

            if (data.tokens?.accessToken) {
                localStorage.setItem('accessToken', data.tokens.accessToken);
            }
            if (data.tokens?.refreshToken) {
                localStorage.setItem('refreshToken', data.tokens.refreshToken);
            }
            syncSessionHintFromStorage();
            if (data.registrationToken) {
                localStorage.setItem('registrationToken', data.registrationToken);
            }

            setTimeout(() => {
                onSuccess(data.isNewUser, data.registrationToken, data.user);
            }, 1500);
        } catch (error) {
            const firebaseEnabled = isFirebaseEnabled();
            const errorKey = firebaseEnabled ? getFirebaseErrorKey(error) : 'otp.networkError';
            toast.error(t(errorKey), { description: t('otp.networkErrorDesc') });
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
            setIsVerifying(false);
            verifyLockRef.current = false;
        }
    }, [otp, mobileNumber, onSuccess, isSuccess, t]);

    const isOtpComplete = otp.every((digit) => digit !== '');

    if (isSuccess) {
        return (
            <motion.div
                initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center py-8"
            >
                <motion.div
                    initial={prefersReducedMotion ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
                >
                    <CheckCircle2 className="w-20 h-20 text-accent" />
                </motion.div>
                <motion.p
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.4 }}
                    className="mt-6 text-xl font-semibold text-foreground"
                >
                    {t('otp.verifiedSuccess')}
                </motion.p>
                <motion.p
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.45, duration: 0.4 }}
                    className="mt-2 text-sm text-muted-foreground"
                >
                    {t('otp.redirecting')}
                </motion.p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.button
                onClick={onBack}
                whileHover={prefersReducedMotion ? undefined : { x: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                className="mb-5 flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('otp.back')}
            </motion.button>

            <motion.h2
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.05, duration: 0.4 }}
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
                {t('otp.verifyTitle')}
            </motion.h2>

            <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.4 }}
                className="mt-3 text-sm leading-relaxed text-muted-foreground"
            >
                {t('otp.verifySubtitle')}
            </motion.p>

            <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.15, duration: 0.4 }}
                className="mt-1 text-base font-semibold text-accent"
            >
                <span>{formattedMobile}</span>
            </motion.p>

            <motion.button
                onClick={onBack}
                whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                    className="mt-1 text-xs font-medium text-accent transition-colors hover:text-accent-strong"
            >
                {t('otp.changeNumber')}
            </motion.button>

            <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2, duration: 0.4 }}
                className="mt-8 flex w-full justify-between gap-1.5 sm:justify-start sm:gap-2.5"
            >
                {otp.map((digit, index) => (
                    <motion.div
                        key={index}
                        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 + index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            aria-label={t('otp.digitAria', { index: index + 1, length: OTP_LENGTH })}
                            className={`
                                h-12 w-10 text-center text-xl font-bold sm:h-14 sm:w-11 sm:text-2xl
                                rounded-xl border-2 sm:rounded-2xl
                                transition-all duration-200
                                outline-none
                                ${digit
                                    ? 'border-focus bg-accent-soft text-foreground'
                                    : 'border-border bg-surface text-foreground hover:border-border-strong'
                                }
                                focus:border-focus focus:ring-2 focus:ring-focus
                                disabled:opacity-50 disabled:cursor-not-allowed
                                caret-transparent
                            `}
                            disabled={isVerifying}
                        />
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-6"
            >
                <Button
                    onClick={handleVerify}
                    disabled={!isOtpComplete || isVerifying}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="h-12 rounded-xl text-sm font-semibold"
                >
                    {isVerifying ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('otp.verifying')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            {t('otp.verifyButton')}
                            <motion.span
                                animate={{ x: isOtpComplete ? [0, 4, 0] : 0 }}
                                transition={{ repeat: isOtpComplete ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
                            >
                                →
                            </motion.span>
                        </span>
                    )}
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="mt-6 inline-flex max-w-full flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-subtle px-4 py-3"
            >
                <p className="text-xs font-semibold text-foreground">
                    {t('otp.didntReceive')}
                </p>

                <div className="h-4 w-px bg-border" />

                {timer > 0 ? (
                    <motion.div
                        key={timer}
                        initial={{ opacity: 0.8, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 text-xs font-bold text-accent"
                    >
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        <span className="tabular-nums">
                            {t('otp.resendIn', { time: `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`})} </span> </motion.div> ) : ( <motion.button onClick={handleResend} disabled={isResending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`
                            flex items-center gap-1.5 text-xs font-bold transition-all duration-200
                            ${isResending ? 'text-muted-foreground cursor-not-allowed' : 'text-accent hover:text-accent-strong underline underline-offset-2'}
                        `}
                    >
                        {isResending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {t('otp.resending')}
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                {t('otp.resend')}
                            </>
                        )}
                    </motion.button>
                )}
            </motion.div>
        </motion.div>
    );
}
