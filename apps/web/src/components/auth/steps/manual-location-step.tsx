'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Loader2,
    LocateFixed,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
    completeProfile,
    getDistricts,
    getStates,
    getTalukas,
    getVillages,
    type LocationOption,
} from '@/services/api/auth.api';
import { useLocale } from '@/i18n/locale-provider';
import { normalizeLocale } from '@/i18n/config';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';
import { storeTokens, syncSessionHintFromStorage } from '@/services/api/token';
import { cacheUser } from '@/lib/auth/session';
import type { StepProps } from '@/types/auth-steps.types';

type LocationMode = 'idle' | 'detecting' | 'manual' | 'granted';
type LocationField = 'state' | 'district' | 'taluka' | 'village';

interface LocationData {
    stateId: string;
    districtId: string;
    talukaId: string;
    villageId: string;
    latitude: number | null;
    longitude: number | null;
}

const emptyLocationData: LocationData = {
    stateId: '',
    districtId: '',
    talukaId: '',
    villageId: '',
    latitude: null,
    longitude: null,
};

function cleanString(str: string): string {
    return str
        .toLowerCase()
        .replace(/\b(taluka|district|tehsil|subdistrict|sub-district|village|gam|sim|road|bypass|highway|nh\d+|state|city|town|rural|urban|nagar|society|plot|station|ward|quarter)\b/gi, ' ')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function stringSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

function matchesLocation(optionName: string, candidate: string): boolean {
    const optClean = cleanString(optionName);
    const candClean = cleanString(candidate);
    if (!optClean || !candClean) return false;

    // Direct match
    if (optClean === candClean) return true;

    // Substring / word match
    if (candClean.length >= 3 && (optClean.includes(candClean) || optClean.split(' ').includes(candClean))) return true;
    if (optClean.length >= 3 && (candClean.includes(optClean) || candClean.split(' ').includes(optClean))) return true;

    // Word-level and overall fuzzy similarity
    let score = stringSimilarity(optClean, candClean);
    const words = optClean.split(' ');
    for (const w of words) {
        if (w.length >= 3) {
            const wScore = stringSimilarity(w, candClean);
            if (wScore > score) score = wScore;
        }
    }
    return score >= 0.75;
}

function getCandidateNames(address: Record<string, unknown>) {
    return [
        address.subdistrict,
        address.taluka,
        address.tehsil,
        address.municipality,
        address.city_district,
        address.county,
        address.county_name,
        address.district,
        address.state_district,
        address.village,
        address.town,
        address.city,
        address.locality,
        address.suburb,
        address.hamlet,
        address.neighbourhood,
        address.residential,
        address.quarter,
        address.ward,
        address.road,
        address.postcode,
    ]
        .map((value) => (typeof value === 'string' ? value : ''))
        .filter(Boolean);
}

function findBestMatch(options: LocationOption[], candidates: string[], fallbackHqName?: string): LocationOption | null {
    // 1. Direct or fuzzy candidate matching
    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'string' || !candidate.trim()) continue;
        const directMatch = options.find((option) => matchesLocation(option.name, candidate));
        if (directMatch) return directMatch;
    }

    // 2. If fallback headquarters name provided (e.g. Taluka headquarter village with same name as Taluka)
    if (fallbackHqName) {
        const cleanHq = cleanString(fallbackHqName);
        const hqMatch = options.find((option) => cleanString(option.name) === cleanHq);
        if (hqMatch) return hqMatch;
    }

    return null;
}

export function ManualLocationStep({ onBack, onComplete, authData }: StepProps) {
    const t = useTranslations();
    // Live locale from the navbar switcher — guaranteed non-empty at submit time.
    const appLocale = useLocale();
    const [locationMode, setLocationMode] = useState<LocationMode>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [states, setStates] = useState<LocationOption[]>([]);
    const [districts, setDistricts] = useState<LocationOption[]>([]);
    const [talukas, setTalukas] = useState<LocationOption[]>([]);
    const [villages, setVillages] = useState<LocationOption[]>([]);
    const [locationData, setLocationData] = useState<LocationData>({
        ...emptyLocationData,
        latitude: authData.latitude,
        longitude: authData.longitude,
    });
    const submitLockRef = useRef(false);
    const villageSelectRef = useRef<HTMLSelectElement>(null);

    const currentState = useMemo(() => states.find((state) => state.id === locationData.stateId) || null, [states, locationData.stateId]);
    const currentDistrict = useMemo(() => districts.find((district) => district.id === locationData.districtId) || null, [districts, locationData.districtId]);
    const currentTaluka = useMemo(() => talukas.find((taluka) => taluka.id === locationData.talukaId) || null, [talukas, locationData.talukaId]);
    const currentVillage = useMemo(() => villages.find((village) => village.id === locationData.villageId) || null, [villages, locationData.villageId]);

    const loadInitialStates = useCallback(async () => {
        try {
            const response = await getStates(appLocale);
            setStates(response);
            setIsLoaded(true);
        } catch {
            toast.error(t('manual.failedLoadStates'));
        }
    }, [appLocale, t]);

    useEffect(() => {
        void loadInitialStates();
    }, [loadInitialStates]);

    const ensureStatesLoaded = useCallback(async () => {
        if (states.length > 0) return;
        await loadInitialStates();
    }, [loadInitialStates, states.length]);

    const selectState = useCallback(async (stateId: string) => {
        setLocationData((prev) => ({ ...prev, stateId, districtId: '', talukaId: '', villageId: '' }));
        setDistricts([]);
        setTalukas([]);
        setVillages([]);

        if (!stateId) return;

        try {
            const response = await getDistricts(stateId, appLocale);
            setDistricts(response);
        } catch {
            toast.error(t('manual.failedLoadDistricts'));
        }
    }, [appLocale, t]);

    const selectDistrict = useCallback(async (districtId: string) => {
        setLocationData((prev) => ({ ...prev, districtId, talukaId: '', villageId: '' }));
        setTalukas([]);
        setVillages([]);

        if (!districtId) return;

        try {
            const response = await getTalukas(districtId, appLocale);
            setTalukas(response);
        } catch {
            toast.error(t('manual.failedLoadTalukas'));
        }
    }, [appLocale, t]);

    const selectTaluka = useCallback(async (talukaId: string) => {
        setLocationData((prev) => ({ ...prev, talukaId, villageId: '' }));
        setVillages([]);

        if (!talukaId) return;

        try {
            const response = await getVillages(talukaId, appLocale);
            setVillages(response);
        } catch {
            toast.error(t('manual.failedLoadVillages'));
        }
    }, [appLocale, t]);

    const selectVillage = useCallback((villageId: string) => {
        setLocationData((prev) => ({ ...prev, villageId }));
    }, []);

    const applyReverseGeocode = useCallback(async (latitude: number, longitude: number) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } },
        );

        if (!response.ok) {
            throw new Error('Unable to detect location');
        }

        const data = await response.json();
        const address = (data.address || {}) as Record<string, unknown>;
        const stateName = address.state || '';
        const districtName = address.state_district || address.county || '';
        const talukaName = address.taluka || address.subdistrict || address.tehsil || address.municipality || address.county || '';
        const villageName = address.village || address.hamlet || address.town || address.city || address.suburb || address.neighbourhood || address.locality || '';

        const displayNameParts = typeof data.display_name === 'string'
            ? data.display_name.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
        const candidates = [
            ...getCandidateNames(address),
            ...(typeof data.name === 'string' ? [data.name] : []),
            ...displayNameParts,
        ];

        const nextState = findBestMatch(states, [String(stateName), ...candidates]);
        if (!nextState) {
            toast.error(t('manual.couldNotMapState'));
            setLocationMode('manual');
            return;
        }

        setLocationMode('detecting');

        const districtResponse = await getDistricts(nextState.id, appLocale);
        setDistricts(districtResponse);
        const nextDistrict = findBestMatch(districtResponse, [String(districtName), ...candidates]);
        if (!nextDistrict) {
            setLocationData({
                ...emptyLocationData,
                stateId: nextState.id,
                latitude,
                longitude,
            });
            toast.error(t('manual.couldNotMapDistrict'));
            setLocationMode('manual');
            return;
        }

        const talukaResponse = await getTalukas(nextDistrict.id, appLocale);
        setTalukas(talukaResponse);
        const nextTaluka = findBestMatch(talukaResponse, [String(talukaName), ...candidates]);
        if (!nextTaluka) {
            setLocationData({
                ...emptyLocationData,
                stateId: nextState.id,
                districtId: nextDistrict.id,
                latitude,
                longitude,
            });
            toast.error(t('manual.couldNotMapTaluka'));
            setLocationMode('manual');
            return;
        }

        const villageResponse = await getVillages(nextTaluka.id, appLocale);
        setVillages(villageResponse);
        const nextVillage = findBestMatch(villageResponse, [String(villageName), ...candidates], nextTaluka.name);

        if (nextVillage) {
            setLocationData({
                stateId: nextState.id,
                districtId: nextDistrict.id,
                talukaId: nextTaluka.id,
                villageId: nextVillage.id,
                latitude,
                longitude,
            });
            setLocationMode('granted');
            toast.success(t('manual.locationFetched'));
        } else {
            setLocationData({
                stateId: nextState.id,
                districtId: nextDistrict.id,
                talukaId: nextTaluka.id,
                villageId: '',
                latitude,
                longitude,
            });
            setLocationMode('granted');
            toast.success(t('manual.locationDetectedSelectVillage'));
            setTimeout(() => {
                villageSelectRef.current?.focus();
            }, 100);
        }
    }, [appLocale, states, t]);

    const handleUseCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            toast.error(t('manual.geolocationUnsupported'));
            setLocationMode('manual');
            return;
        }

        setIsLocating(true);

        try {
            await ensureStatesLoaded();
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                });
            });

            await applyReverseGeocode(position.coords.latitude, position.coords.longitude);
        } catch (error) {
            if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
                toast.error(t('manual.permissionDenied'));
            } else {
                toast.error(t('manual.unableToDetect'));
            }
            setLocationMode('manual');
        } finally {
            setIsLocating(false);
        }
    }, [applyReverseGeocode, ensureStatesLoaded, t]);

    const validateRequiredFields = useCallback(() => {
        if (!locationData.stateId) {
            toast.error(t('manual.stateRequired'));
            return false;
        }
        if (!locationData.districtId) {
            toast.error(t('manual.districtRequired'));
            return false;
        }
        if (!locationData.talukaId) {
            toast.error(t('manual.talukaRequired'));
            return false;
        }
        if (!locationData.villageId) {
            toast.error(t('manual.villageRequired'));
            return false;
        }
        return true;
    }, [locationData, t]);

    const handleSubmit = useCallback(async () => {
        if (submitLockRef.current) return;
        if (!validateRequiredFields()) return;

        const registrationToken =
            authData.registrationToken ||
            (typeof window !== 'undefined' ? localStorage.getItem('registrationToken') || '' : '');

        if (!registrationToken) {
            toast.error(t('manual.sessionExpired'));
            return;
        }

        submitLockRef.current = true;
        setIsSubmitting(true);

        try {
            const res = await completeProfile({
                firstName: authData.firstName,
                lastName: authData.lastName,
                // The navbar-selected language is the source of truth. Fall back
                // to authData only as a safety net (should never be empty now).
                preferredLanguage: appLocale || normalizeLocale(authData.preferredLanguage) || 'en',
                registrationToken,
                stateId: locationData.stateId,
                districtId: locationData.districtId,
                talukaId: locationData.talukaId,
                villageId: locationData.villageId,
                latitude: locationData.latitude ?? undefined,
                longitude: locationData.longitude ?? undefined,
            });

            if (res?.tokens?.accessToken && res?.tokens?.refreshToken) {
                storeTokens(res.tokens.accessToken, res.tokens.refreshToken);
            } else if (res?.tokens?.accessToken) {
                localStorage.setItem('accessToken', res.tokens.accessToken);
            }
            if (res?.tokens?.refreshToken) {
                localStorage.setItem('refreshToken', res.tokens.refreshToken);
            }
            syncSessionHintFromStorage();
            if (typeof window !== 'undefined') {
                localStorage.removeItem('registrationToken');
            }

            if (res?.user) {
                cacheUser({
                    id: res.user.id,
                    firstName: res.user.firstName || authData.firstName || '',
                    lastName: res.user.lastName || authData.lastName || '',
                    mobileNumber: res.user.mobileNumber || authData.mobileNumber || '',
                    preferredLanguage: res.user.preferredLanguage || appLocale || 'en',
                    role: res.user.role || 'farmer',
                    isVerified: res.user.isVerified ?? true,
                    avatarUrl: undefined,
                    location: {
                        district: currentDistrict?.name,
                        taluka: currentTaluka?.name,
                        village: currentVillage?.name,
                        latitude: locationData.latitude ?? undefined,
                        longitude: locationData.longitude ?? undefined,
                    },
                });
            }

            toast.success(t('manual.profileCompleted'));
            onComplete?.();
        } catch {
            toast.error(t('manual.failedComplete'));
        } finally {
            setIsSubmitting(false);
            submitLockRef.current = false;
        }
    }, [
        appLocale,
        authData,
        currentDistrict,
        currentTaluka,
        currentVillage,
        locationData,
        onComplete,
        validateRequiredFields,
        t,
    ]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.button
                onClick={onBack}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="mb-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('manual.back')}
            </motion.button>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold tracking-wide text-accent">
                    {t('manual.step', { current: 2, total: 2 })}
                </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('manual.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('manual.subtitle')}</p>

            <div className="mt-6 space-y-4">
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className={cn(
                        'w-full rounded-xl border border-border bg-surface-subtle px-4 py-3 text-left transition-colors',
                        'hover:border-border-strong hover:bg-surface',
                        isLocating && 'opacity-60 cursor-not-allowed',
                    )}
                >
                    {isLocating ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-accent" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">{t('manual.fetching')}</p>
                                <p className="text-xs text-muted-foreground">{t('manual.allowAccess')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                            >
                                <LocateFixed className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{t('manual.fetch')}</p>
                                <p className="text-xs text-muted-foreground">{t('manual.fetchDesc')}</p>
                            </div>
                        </div>
                    )}
                </button>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 inline-block rounded-md text-sm font-semibold text-foreground">{t('manual.state')}</label>
                        <div className="relative">
                            <select
                                value={locationData.stateId}
                                onChange={(event) => {
                                    void selectState(event.target.value);
                                    setLocationMode('manual');
                                }}
                                disabled={!isLoaded}
                                className={cn(
                                    'h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-foreground',
                                    'focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus',
                                    locationData.stateId ? 'border-accent' : 'hover:border-border-strong',
                                )}
                            >
                                <option value="" className="bg-surface text-foreground">{t('manual.selectState')}</option>
                                {states.map((state) => (
                                    <option key={state.id} value={state.id} className="bg-surface text-foreground">{getLocalizedDomainName(state.name, appLocale, 'state')}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 inline-block rounded-md text-sm font-semibold text-foreground">{t('manual.district')}</label>
                        <div className="relative">
                            <select
                                value={locationData.districtId}
                                onChange={(event) => {
                                    void selectDistrict(event.target.value);
                                    setLocationMode('manual');
                                }}
                                disabled={!locationData.stateId || districts.length === 0}
                                className={cn(
                                    'h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-foreground',
                                    'focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus',
                                    locationData.districtId ? 'border-accent' : 'hover:border-border-strong',
                                    !locationData.stateId && 'opacity-60 cursor-not-allowed',
                                )}
                            >
                                <option value="" className="bg-surface text-foreground">{locationData.stateId ? t('manual.selectDistrict') : t('manual.selectStateFirst')}</option>
                                {districts.map((district) => (
                                    <option key={district.id} value={district.id} className="bg-surface text-foreground">{getLocalizedDomainName(district.name, appLocale, 'district')}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 inline-block rounded-md text-sm font-semibold text-foreground">{t('manual.taluka')}</label>
                        <div className="relative">
                            <select
                                value={locationData.talukaId}
                                onChange={(event) => {
                                    void selectTaluka(event.target.value);
                                    setLocationMode('manual');
                                }}
                                disabled={!locationData.districtId || talukas.length === 0}
                                className={cn(
                                    'h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-foreground',
                                    'focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus',
                                    locationData.talukaId ? 'border-accent' : 'hover:border-border-strong',
                                    !locationData.districtId && 'opacity-60 cursor-not-allowed',
                                )}
                            >
                                <option value="" className="bg-surface text-foreground">{locationData.districtId ? t('manual.selectTaluka') : t('manual.selectDistrictFirst')}</option>
                                {talukas.map((taluka) => (
                                    <option key={taluka.id} value={taluka.id} className="bg-surface text-foreground">{getLocalizedDomainName(taluka.name, appLocale, 'taluka')}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 inline-block rounded-md text-sm font-semibold text-foreground">{t('manual.village')}</label>
                        <div className="relative">
                            <select
                                ref={villageSelectRef}
                                value={locationData.villageId}
                                onChange={(event) => {
                                    selectVillage(event.target.value);
                                    setLocationMode('manual');
                                }}
                                disabled={!locationData.talukaId || villages.length === 0}
                                className={cn(
                                    'h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-foreground',
                                    'focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus',
                                    locationData.villageId ? 'border-accent' : 'hover:border-border-strong',
                                    !locationData.talukaId && 'opacity-60 cursor-not-allowed',
                                )}
                            >
                                <option value="" className="bg-surface text-foreground">{locationData.talukaId ? t('manual.selectVillage') : t('manual.selectTalukaFirst')}</option>
                                {villages.map((village) => (
                                    <option key={village.id} value={village.id} className="bg-surface text-foreground">{getLocalizedDomainName(village.name, appLocale, 'village')}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                <motion.button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-surface"
                >
                    <RefreshCw className="h-3.5 w-3.5 text-accent" />
                    {t('manual.reDetect')}
                </motion.button>

                <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.01, y: -1 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                        isSubmitting
                            ? 'cursor-not-allowed bg-surface-subtle text-muted-foreground'
                            : 'bg-accent text-accent-foreground shadow-sm hover:bg-accent-strong'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('manual.saving')}
                        </>
                    ) : (
                        <>
                            {t('manual.complete')} <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}
