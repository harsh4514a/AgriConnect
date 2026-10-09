'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { StepProps } from '@/types/auth-steps.types';

export function LocationPermissionStep({ onNext }: StepProps) {
    const t = useTranslations();
    const [isLocating, setIsLocating] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const handleAutoDetect = useCallback(async () => {
        if (!navigator.geolocation) {
            toast.error(t('locationPermission.geolocationUnsupported'));
            setPermissionDenied(true);
            return;
        }

        setIsLocating(true);
        setPermissionDenied(false);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
            });

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } },
                );
                const data = await res.json();
                const addr = data.address || {};

                onNext({
                    state: addr.state || '',
                    district: addr.state_district || addr.county || '',
                    taluka: addr.taluka || addr.municipality || '',
                    village: addr.village || addr.town || addr.city || '',
                    latitude: lat,
                    longitude: lng,
                });

                toast.success(t('locationPermission.detected'));
            } catch {
                toast.success(t('locationPermission.coordinates'));
                onNext({ latitude: lat, longitude: lng });
            }
        } catch {
            toast.error(t('locationPermission.couldNotGet'));
            setPermissionDenied(true);
        } finally {
            setIsLocating(false);
        }
    }, [onNext, t]);

    const handleEnterManually = useCallback(() => {
        onNext();
    }, [onNext]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-700" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('locationPermission.enable')}</h2>
                    <p className="text-sm text-gray-500">{t('locationPermission.enableDesc')}</p>
                </div>
            </div>

            <button
                onClick={handleAutoDetect}
                disabled={isLocating}
                className="w-full p-5 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLocating ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full border-2 border-green-300 border-t-green-700 h-6 w-6"></div>
                        <span className="text-sm font-medium text-green-700">{t('locationPermission.detecting')}</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Navigation className="w-6 h-6 text-green-700" />
                        </div>
                        <div className="text-left">
                            <span className="block text-base font-semibold text-green-800">{t('locationPermission.useCurrent')}</span>
                            <span className="block text-xs text-gray-500">{t('locationPermission.autoDetect')}</span>
                        </div>
                    </div>
                )}
            </button>

            {permissionDenied && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700">
                        {t('locationPermission.permissionDenied')}
                    </p>
                </div>
            )}

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-4 text-xs font-medium text-gray-400 bg-white">{t('locationPermission.or')}</span>
                </div>
            </div>

            <button
                onClick={handleEnterManually}
                className="w-full h-14 rounded-xl font-semibold text-base bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
            >
                {t('locationPermission.enterManually')} <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

