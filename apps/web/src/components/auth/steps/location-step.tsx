'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Navigation, ArrowRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { StepProps } from '@/types/auth-steps.types';
import { completeProfile } from '@/services/api/auth.api';
import { storeTokens, syncSessionHintFromStorage } from '@/services/api/token';
import { cacheUser } from '@/lib/auth/session';

export function LocationStep({ onNext, authData }: StepProps) {
  const t = useTranslations();
  const [state, setState] = useState(authData.state || '');
  const [district, setDistrict] = useState(authData.district || '');
  const [taluka, setTaluka] = useState(authData.taluka || '');
  const [village, setVillage] = useState(authData.village || '');
  const [latitude, setLatitude] = useState<number | null>(authData.latitude);
  const [longitude, setLongitude] = useState<number | null>(authData.longitude);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error(t('location.geolocationUnsupported'));
      return;
    }

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = await res.json();
        const addr = data.address || {};

        setState(addr.state || '');
        setDistrict(addr.state_district || addr.county || '');
        setTaluka(addr.taluka || addr.municipality || '');
        setVillage(addr.village || addr.town || addr.city || '');

        toast.success(t('location.detected'));
      } catch {
        toast.success(t('location.coordinatesCaptured'));
      }
    } catch {
      toast.error(t('location.couldNotGet'));
    } finally {
      setIsLocating(false);
    }
  }, [t]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await completeProfile({
        firstName: authData.firstName,
        lastName: authData.lastName,
        preferredLanguage: authData.preferredLanguage,
        registrationToken: authData.registrationToken!,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
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
          preferredLanguage: res.user.preferredLanguage || authData.preferredLanguage || 'en',
          role: res.user.role || 'farmer',
          isVerified: res.user.isVerified ?? true,
          avatarUrl: undefined,
        });
      }

      onNext({
        state,
        district,
        taluka,
        village,
        latitude,
        longitude,
      });
    } catch {
      toast.error(t('location.failedComplete'));
    } finally {
      setIsSubmitting(false);
    }
  }, [authData, state, district, taluka, village, latitude, longitude, onNext, t]);

  const inputClass =
    'w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-surface text-gray-900 font-medium focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus transition-all';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6">
        <span className="w-2 h-2 rounded-full bg-green-700"></span>
        <span className="text-xs font-semibold text-accent">
          {t('location.step', { current: 2, total: 2 })}
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{t('location.title')}</h2>
      <p className="mt-2 text-sm text-gray-500">{t('location.subtitle')}</p>

      <button
        onClick={handleGetLocation}
        disabled={isLocating}
        className="w-full mt-6 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLocating ? (
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full border-2 border-green-300 border-t-green-700 h-6 w-6"></div>
            <span className="text-sm font-medium text-accent">{t('location.detecting')}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <span className="block text-base font-semibold text-accent">{t('location.useCurrent')}</span>
              <span className="block text-xs text-gray-500">{t('location.autoFill')}</span>
            </div>
          </div>
        )}
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs font-medium text-gray-400">{t('location.orManual')}</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('location.state')}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder={t('location.enterState')}
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('location.district')}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={t('location.enterDistrict')}
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('location.taluka')}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              placeholder={t('location.enterTaluka')}
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('location.village')}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder={t('location.enterVillage')}
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>

        {latitude && longitude && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <p className="text-xs text-accent">
              📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !state.trim()}
          className="w-full h-14 rounded-xl font-semibold text-base mt-6 bg-green-700 text-white shadow-md flex items-center justify-center gap-2 transition-all hover:bg-green-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full border-2 border-border border-t-white h-5 w-5"></div>
              {t('location.completing')}
            </>
          ) : (
            <>
              {t('location.complete')} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

