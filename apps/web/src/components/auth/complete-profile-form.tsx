'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Loader2,
    CheckCircle2,
    ChevronDown,
    User,
    Languages,
    LocateFixed,
    Navigation,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { completeProfile as completeProfileApi } from '@/services/api/auth.api';
import { storeTokens, syncSessionHintFromStorage } from '@/services/api/token';
import { cacheUser } from '@/lib/auth/session';
import { useLocale, useSetLocale } from '@/i18n/locale-provider';

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
] as const;

type LocationMode = 'idle' | 'detecting' | 'granted' | 'denied' | 'manual';
type DropdownType = 'state' | 'district' | 'taluka' | 'village';

interface LocationData {
    state: string;
    district: string;
    taluka: string;
    village: string;
    latitude: number;
    longitude: number;
}

export function CompleteProfileForm() {
    const t = useTranslations();
    const router = useRouter();
    const locale = useLocale();
    const setLocale = useSetLocale();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>(locale);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // If the user switches language from the navbar while filling the form,
    // reflect it in the selected preference so completeProfile stores it.
    useEffect(() => {
        setSelectedLanguage(locale);
    }, [locale]);

    const [locationMode, setLocationMode] = useState<LocationMode>('idle');
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<DropdownType | null>(null);
    const submitLockRef = useRef(false);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const dropdownRefs = useRef<Record<DropdownType, HTMLDivElement | null>>({
        state: null,
        district: null,
        taluka: null,
        village: null,
    });

    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openDropdown) {
                const ref = dropdownRefs.current[openDropdown];
                if (ref && !ref.contains(e.target as Node)) {
                    setOpenDropdown(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const mockOptions: Record<DropdownType, string[]> = {
        state: ['Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh'],
        district: ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot', 'Bhavnagar'],
        taluka: ['Daskroi', 'Sanand', 'Viramgam', 'Mandal', 'Detroj'],
        village: ['Sarkhej', 'Bopal', 'Gota', 'Ranip', 'Odhav'],
    };

    const validateFirstName = useCallback((name: string) => {
        if (name.length < 2) {
            toast.error(t('profile.invalidName'), {
                description: t('validation.firstNameMin'),
            });
            return false;
        }
        if (name.length > 50) {
            toast.error(t('profile.invalidName'), {
                description: t('validation.firstNameMax'),
            });
            return false;
        }
        return true;
    }, [t]);

    const validateLastName = useCallback((name: string) => {
        if (name.length < 2) {
            toast.error(t('profile.invalidName'), {
                description: t('validation.lastNameMin'),
            });
            return false;
        }
        if (name.length > 50) {
            toast.error(t('profile.invalidName'), {
                description: t('validation.lastNameMax'),
            });
            return false;
        }
        return true;
    }, [t]);

    const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
    }, []);

    const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLastName(e.target.value);
    }, []);

    const handleLanguageSelect = useCallback(
        (code: string) => {
            setSelectedLanguage(code);
            // Switching the app language instantly reflects the preference.
            // The user can also change it anytime via navbar.
        },
        [],
    );

    const handleUseCurrentLocation = useCallback(async () => {
        setIsDetecting(true);
        setLocationMode('detecting');

        if (!navigator.geolocation) {
            setLocationMode('denied');
            setIsDetecting(false);
            return;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                });
            });

            const { latitude, longitude } = position.coords;

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=4`,
                { headers: { 'Accept-Language': 'en' } },
            );

            if (!response.ok) throw new Error('Unable to detect location');

            const data = await response.json();
            const address = data.address || {};

            setLocationData({
                state: address.state || '',
                district: address.state_district || address.county || '',
                taluka: address.taluka || address.municipality || '',
                village: address.village || address.town || address.city || address.municipality || '',
                latitude,
                longitude,
            });
            setLocationMode('granted');
            toast.success(t('profile.detectedSuccess'));
        } catch (err) {
            if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
                toast.error(t('profile.permissionDeniedToast'));
            } else {
                toast.error(t('profile.unableToDetect'));
            }
            setLocationMode('denied');
        } finally {
            setIsDetecting(false);
        }
    }, [t]);

    const toggleDropdown = useCallback((type: DropdownType) => {
        setOpenDropdown((prev) => (prev === type ? null : type));
    }, []);

    const handleManualSelect = useCallback((type: DropdownType, value: string) => {
        setLocationData((prev) => ({
            ...(prev || { state: '', district: '', taluka: '', village: '', latitude: 0, longitude: 0 }),
            [type]: value,
        }));
        setOpenDropdown(null);
        setLocationMode('manual');
    }, []);

    const handleSubmit = useCallback(async () => {
        if (submitLockRef.current) return;

        if (!firstName.trim()) {
            toast.error(t('validation.firstNameRequired'), {
                description: t('validation.firstNameMin'),
            });
            nameInputRef.current?.focus();
            return;
        }
        if (!validateFirstName(firstName.trim())) return;

        if (!lastName.trim()) {
            toast.error(t('validation.lastNameRequired'), {
                description: t('validation.lastNameMin'),
            });
            return;
        }
        if (!validateLastName(lastName.trim())) return;

        if (!selectedLanguage) {
            toast.error(t('profile.languageRequired'), {
                description: t('profile.selectLanguage'),
            });
            return;
        }

        submitLockRef.current = true;
        setIsSubmitting(true);

        try {
            const registrationToken =
                typeof window !== 'undefined'
                    ? localStorage.getItem('registrationToken') || ''
                    : '';

            if (!registrationToken) {
                toast.error(t('profile.sessionExpired'), {
                    description: t('profile.verifyOtpAgain'),
                });
                submitLockRef.current = false;
                setIsSubmitting(false);
                return;
            }

            const result = await completeProfileApi({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                preferredLanguage: selectedLanguage,
                registrationToken,
                ...(locationData ? { latitude: locationData.latitude, longitude: locationData.longitude } : {}),
            });

            if (result.tokens?.accessToken && result.tokens?.refreshToken) {
                storeTokens(result.tokens.accessToken, result.tokens.refreshToken);
            } else {
                if (result.tokens?.accessToken) localStorage.setItem('accessToken', result.tokens.accessToken);
                if (result.tokens?.refreshToken) localStorage.setItem('refreshToken', result.tokens.refreshToken);
                syncSessionHintFromStorage();
            }
            if (typeof window !== 'undefined') {
                localStorage.removeItem('registrationToken');
            }

            if (result.user) {
                cacheUser({
                    id: result.user.id,
                    firstName: result.user.firstName || firstName.trim(),
                    lastName: result.user.lastName || lastName.trim(),
                    mobileNumber: result.user.mobileNumber || '',
                    preferredLanguage: result.user.preferredLanguage || selectedLanguage || 'en',
                    role: result.user.role || 'farmer',
                    isVerified: result.user.isVerified ?? true,
                    avatarUrl: undefined,
                });
            }

            // Persist the chosen language as the user's preference.
            setLocale(selectedLanguage as (typeof LANGUAGES)[number]['code']);

            setIsSuccess(true);
            setTimeout(() => router.push(`/${locale}/dashboard`), 2000);
        } catch (err: any) {
            toast.error(err?.message || t('errors.unexpectedError'));
        } finally {
            setIsSubmitting(false);
            submitLockRef.current = false;
        }
    }, [firstName, lastName, selectedLanguage, locationData, validateFirstName, validateLastName, router, t, setLocale, locale]);

    if (isSuccess) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center py-12"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 150, damping: 15 }}
                >
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-14 h-14 text-accent" />
                    </div>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="mt-8 text-2xl sm:text-3xl font-bold text-gray-900 text-center"
                >
                    {t('profile.welcome')}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.4 }}
                    className="mt-3 text-base text-gray-500 text-center"
                >
                    {t('profile.profileReady')}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="mt-8"
                >
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.3 }}
                className="flex items-center gap-2 mb-8"
            >
                {[
                    { label: t('profile.mobile'), done: true },
                    { label: t('profile.otp'), done: true },
                    { label: t('profile.profile'), done: false },
                ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                        <div
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300',
                                step.done ? 'bg-green-100 text-accent' : 'bg-brand-100 text-accent',
                            )}
                        >
                            {step.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-brand-500 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-surface" />
                                </span>
                            )}
                            <span>{step.label}</span>
                        </div>
                        {i < 2 && <div className={cn('w-8 h-px', step.done ? 'bg-green-300' : 'bg-gray-200')} />}
                    </div>
                ))}
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.4 }}
                className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight"
            >
                {t('profile.completeTitle')}
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
                className="mt-2 text-sm text-gray-500 leading-relaxed"
            >
                {t('profile.subtitle')}
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.4 }}
                className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
                {/* First Name */}
                <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('profile.firstName')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            ref={nameInputRef}
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={handleFirstNameChange}
                            onBlur={() => firstName && validateFirstName(firstName)}
                            placeholder={t('profile.enterFirstName')}
                            autoComplete="given-name"
                            maxLength={50}
                            className={cn(
                                'w-full h-14 pl-12 pr-4 rounded-xl border-2 bg-surface text-gray-900 text-base font-medium',
                                'transition-all duration-200 outline-none',
                                'placeholder:text-gray-400 placeholder:font-normal',
                                'focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
                                firstName
                                    ? 'border-green-400 bg-green-50/30'
                                    : 'border-gray-200 hover:border-gray-300',
                            )}
                        />
                    </div>
                </div>

                {/* Last Name */}
                <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('profile.lastName')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={handleLastNameChange}
                            onBlur={() => lastName && validateLastName(lastName)}
                            placeholder={t('profile.enterLastName')}
                            autoComplete="family-name"
                            maxLength={50}
                            className={cn(
                                'w-full h-14 pl-12 pr-4 rounded-xl border-2 bg-surface text-gray-900 text-base font-medium',
                                'transition-all duration-200 outline-none',
                                'placeholder:text-gray-400 placeholder:font-normal',
                                'focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
                                lastName
                                    ? 'border-green-400 bg-green-50/30'
                                    : 'border-gray-200 hover:border-gray-300',
                            )}
                        />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                className="mt-7"
            >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-gray-400" />
                        {t('profile.preferredLanguage')}
                    </span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {LANGUAGES.map((lang, i) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                            <motion.button
                                key={lang.code}
                                type="button"
                                onClick={() => handleLanguageSelect(lang.code)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-xl border-2 transition-all duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                                    isSelected
                                        ? 'border-green-500 bg-green-50/80 shadow-sm'
                                        : 'border-gray-200 bg-surface hover:border-gray-300 hover:bg-gray-50/50',
                                )}
                                aria-pressed={isSelected}
                                aria-label={`Select ${lang.label}`}
                            >
                                <span className={cn('text-lg font-semibold transition-colors duration-200', isSelected ? 'text-gray-900' : 'text-gray-600')}>
                                    {lang.native}
                                </span>
                                <span className={cn('text-xs transition-colors duration-200', isSelected ? 'text-accent font-medium' : 'text-gray-400')}>
                                    {lang.label}
                                </span>
                                <motion.div
                                    initial={false}
                                    animate={isSelected ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute -top-2 -right-2"
                                >
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </motion.div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="mt-8"
            >
                <div className="rounded-2xl border border-gray-200 bg-surface p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">{t('profile.location')}</h3>
                            <p className="mt-0.5 text-sm text-gray-500">{t('profile.locationDesc')}</p>
                        </div>
                    </div>

                    {locationMode === 'idle' && (
                        <motion.button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isDetecting}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                'w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border-2 font-semibold text-sm transition-all duration-200',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                                'border-brand-200 bg-brand-50 text-accent hover:border-brand-300 hover:bg-brand-100',
                                isDetecting && 'opacity-50 cursor-not-allowed',
                            )}
                        >
                            <LocateFixed className="w-4 h-4" />
                            {t('profile.useMyLocation')}
                        </motion.button>
                    )}

                    {locationMode === 'detecting' && (
                        <div className="flex flex-col items-center justify-center py-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Navigation className="w-8 h-8 text-accent" />
                            </motion.div>
                            <p className="mt-3 text-sm font-medium text-gray-600">{t('profile.detecting')}</p>
                            <p className="mt-1 text-xs text-gray-400">{t('profile.allowAccess')}</p>
                        </div>
                    )}

                    {locationMode === 'granted' && locationData && (
                        <div className="space-y-3">
                            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                    <span className="text-sm font-semibold text-accent">{t('profile.locationDetected')}</span>
                                </div>
                                <p className="text-xs text-accent">{t('profile.youCanEdit')}</p>
                            </div>
                            {(['state', 'district', 'taluka', 'village'] as const).map((type) => (
                                <div key={type} className="relative" ref={(el) => { dropdownRefs.current[type] = el; }}>
                                    <label className="block text-xs font-semibold text-gray-600 capitalize tracking-wider mb-1.5">
                                        {t(`manual.${type === 'taluka' ? 'taluka' : type === 'village' ? 'village' : type}`)}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown(type)}
                                        className={cn(
                                            'w-full flex items-center justify-between h-11 px-4 rounded-xl border-2 bg-surface text-sm font-medium transition-all duration-200',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                            openDropdown === type ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200 hover:border-gray-300',
                                        )}
                                    >
                                        <span className={locationData[type] ? 'text-gray-900' : 'text-gray-400'}>
                                            {locationData[type] || t(`profile.${type === 'state' ? 'selectState' : type === 'district' ? 'selectDistrict' : type === 'taluka' ? 'selectTaluka' : 'selectVillage'}`)}
                                        </span>
                                        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', openDropdown === type && 'rotate-180')} />
                                    </button>
                                    <AnimatePresence>
                                        {openDropdown === type && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                                exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                                className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-surface shadow-lg overflow-hidden"
                                            >
                                                {mockOptions[type].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => handleManualSelect(type, option)}
                                                        className={cn(
                                                            'w-full text-left px-4 py-2.5 text-sm transition-colors duration-100',
                                                            'hover:bg-brand-50 hover:text-accent',
                                                            locationData[type] === option && 'bg-brand-50 text-accent font-medium',
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            <motion.button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                disabled={isDetecting}
                                whileHover={{ x: 2 }}
                                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent transition-colors mt-2"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                {t('profile.reDetect')}
                            </motion.button>
                        </div>
                    )}

                    {locationMode === 'denied' && (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-amber-700">{t('profile.permissionDenied')}</span>
                                </div>
                                <p className="text-xs text-amber-600">{t('profile.selectManually')}</p>
                            </div>
                            {(['state', 'district', 'taluka', 'village'] as const).map((type) => (
                                <div key={type} className="relative" ref={(el) => { dropdownRefs.current[type] = el; }}>
                                    <label className="block text-xs font-semibold text-gray-600 capitalize tracking-wider mb-1.5">
                                        {t(`manual.${type === 'taluka' ? 'taluka' : type === 'village' ? 'village' : type}`)}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown(type)}
                                        className={cn(
                                            'w-full flex items-center justify-between h-11 px-4 rounded-xl border-2 bg-surface text-sm font-medium transition-all duration-200',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                            openDropdown === type ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200 hover:border-gray-300',
                                        )}
                                    >
                                        <span className={locationData?.[type] ? 'text-gray-900' : 'text-gray-400'}>
                                            {locationData?.[type] || t(`profile.${type === 'state' ? 'selectState' : type === 'district' ? 'selectDistrict' : type === 'taluka' ? 'selectTaluka' : 'selectVillage'}`)}
                                        </span>
                                        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', openDropdown === type && 'rotate-180')} />
                                    </button>
                                    <AnimatePresence>
                                        {openDropdown === type && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                                exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                                className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-surface shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                                            >
                                                {mockOptions[type].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => handleManualSelect(type, option)}
                                                        className={cn(
                                                            'w-full text-left px-4 py-2.5 text-sm transition-colors duration-100',
                                                            'hover:bg-brand-50 hover:text-accent',
                                                            locationData?.[type] === option && 'bg-brand-50 text-accent font-medium',
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            <motion.button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                disabled={isDetecting}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent transition-colors mt-2 w-full"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t('profile.tryAgain')}
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-7"
            >
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !firstName.trim() || !lastName.trim() || !selectedLanguage}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="h-14 text-base font-semibold rounded-xl"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('profile.creating')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            {t('profile.complete')}
                            <motion.span
                                animate={{ x: firstName.trim() && lastName.trim() && selectedLanguage ? [0, 4, 0] : 0 }}
                                transition={{ repeat: firstName.trim() && lastName.trim() && selectedLanguage ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
                            >
                                →
                            </motion.span>
                        </span>
                    )}
                </Button>
            </motion.div>
        </motion.div>
    );
}

