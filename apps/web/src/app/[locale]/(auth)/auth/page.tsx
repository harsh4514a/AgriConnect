'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Shield, TrendingUp, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { MobileNumberForm } from '@/components/auth/mobile-number-form';
import { OtpVerificationForm } from '@/components/auth/otp-verification-form';
import { NameStep } from '@/components/auth/steps/name-step';
import { ManualLocationStep } from '@/components/auth/steps/manual-location-step';
import { AuthStepRenderer } from '@/components/auth/auth-step-renderer';
import { useLocale } from '@/i18n/locale-provider';
import { cacheUser, getCachedUser } from '@/lib/auth/session';
import { AuthStep, AuthData, INITIAL_AUTH_DATA } from '@/types/auth-steps.types';
import type { AuthUser } from '@/types/auth.types';

export default function AuthLoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const appLocale = useLocale();

  const [step, setStep] = useState<AuthStep>('mobile');
  const [authData, setAuthData] = useState<AuthData>(INITIAL_AUTH_DATA);

  // Keep authData.preferredLanguage in sync with the navbar-selected locale,
  // so the registration (completeProfile) stores exactly what the user chose.
  useEffect(() => {
    setAuthData((prev) => {
      if (prev.preferredLanguage === appLocale) return prev;
      return { ...prev, preferredLanguage: appLocale };
    });
  }, [appLocale]);

  const handleMobileSuccess = useCallback((phone: string) => {
    setAuthData((prev) => ({ ...prev, mobileNumber: phone }));
    setStep('otp');
  }, []);

  const handleOtpSuccess = useCallback(
    (isNewUser: boolean, registrationToken?: string, user?: AuthUser) => {
      if (isNewUser) {
        if (registrationToken) {
          setAuthData((prev) => ({ ...prev, registrationToken }));
        }
        setStep('name');
      } else {
        // Existing user: cache the profile snapshot returned by the backend so
        // the dashboard can greet them by name (no `/auth/me` endpoint yet).
        if (user) {
          cacheUser({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            mobileNumber: user.mobileNumber || '',
            preferredLanguage: user.preferredLanguage || 'en',
            role: user.role || 'farmer',
            isVerified: user.isVerified,
            avatarUrl: undefined,
          });
        }
        router.push(`/${locale}/dashboard`);
      }
    },
    [router, locale],
  );

  const handleAuthComplete = useCallback(() => {
    // Cache a minimal user snapshot if not already cached so the dashboard can greet the user by name.
    const existing = getCachedUser();
    if (!existing) {
      cacheUser({
        id: '',
        firstName: authData.firstName || '',
        lastName: authData.lastName || '',
        mobileNumber: authData.mobileNumber || '',
        preferredLanguage: appLocale || 'en',
        role: 'farmer',
        isVerified: true,
        avatarUrl: undefined,
      });
    }
    router.push(`/${locale}/dashboard`);
  }, [router, locale, authData.firstName, authData.lastName, authData.mobileNumber, appLocale]);

  const handleBackToMobile = useCallback(() => setStep('mobile'), []);

  // Gated flow: mobile -> otp -> name -> location.
  // Each step only advances via onNext (OTP gating enforced by the forms).
  const handleStepNext = useCallback((data?: Partial<AuthData>) => {
    if (data) setAuthData((prev) => ({ ...prev, ...data }));
    setStep((current) => {
      const flow: AuthStep[] = ['mobile', 'otp', 'name', 'location'];
      const idx = flow.indexOf(current);
      return idx < flow.length - 1 ? flow[idx + 1] : current;
    });
  }, []);

  const handleStepBack = useCallback(() => {
    setStep((current) => {
      const map: Record<string, AuthStep> = { otp: 'mobile', name: 'otp', location: 'name' };
      return map[current] || 'mobile';
    });
  }, []);

  const features = [
    { icon: Shield, title: t('auth.secureSafe'), desc: t('auth.secureSafeDesc'), bg: 'bg-emerald-400/20', color: 'text-emerald-300' },
    { icon: TrendingUp, title: t('auth.fairTransparent'), desc: t('auth.fairTransparentDesc'), bg: 'bg-amber-400/20', color: 'text-amber-300' },
    { icon: Users, title: t('auth.strongerTogether'), desc: t('auth.strongerTogetherDesc'), bg: 'bg-green-400/20', color: 'text-green-300' },
  ];

  const onboardingSteps = [
    { key: 'name' as AuthStep, component: NameStep },
    { key: 'location' as AuthStep, component: ManualLocationStep },
  ];

  const isOnboarding = ['name', 'location'].includes(step);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/Background_Image.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Same green-tinted overlays as the home page hero */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/50 via-green-900/25 to-green-800/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-transparent to-green-950/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-green-950/20" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex h-16 items-center">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5"
              aria-label="AgriConnect — Go to home page"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                  boxShadow: '0 4px 12px rgba(46,125,50,0.35)',
                }}
              >
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">AgriConnect</span>
            </Link>
            <LanguageSwitcher className="[&_button]:text-gray-700 [&_button]:hover:bg-gray-100 [&_button]:hover:text-gray-900" />
          </div>
        </header>

        {isOnboarding ? (
          <div className="flex-1 flex items-center px-8 pl-8 sm:pl-16 lg:pl-24 xl:pl-32">
            <div className="w-full max-w-[520px] py-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                <span className="text-xs font-semibold text-white/90">{t('auth.completeProfile')}</span>
              </div>
              <AuthStepRenderer
                currentStep={step}
                steps={onboardingSteps}
                authData={authData}
                onNext={handleStepNext}
                onBack={handleStepBack}
                onComplete={handleAuthComplete}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center px-8 pl-8 sm:pl-16 lg:pl-24 xl:pl-32">
            <div className="w-full max-w-[520px] py-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-300"></span>
                <span className="text-xs font-semibold text-white/90">{t('auth.empowering')}</span>
              </div>
              <AnimatePresence mode="wait">
                {step === 'mobile' ? (
                  <motion.div
                    key="mobile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h1 className="text-5xl font-extrabold leading-tight text-white tracking-tighter drop-shadow-sm">
                      {t('auth.welcomeTo')} <span className="text-green-300">AgriConnect</span>
                    </h1>
                    <p className="mt-4 text-lg text-white/80 font-medium leading-relaxed">
                      {t('auth.subtitle1')}
                      <br />
                      {t('auth.subtitle2')}
                    </p>
                    <div className="mt-8 max-w-[460px]">
                      <MobileNumberForm hideLabel onSuccess={handleMobileSuccess} />
                    </div>
                    <div className="mt-10 grid grid-cols-3 gap-3">
                      {features.map((f) => {
                        const Icon = f.icon;
                        return (
                          <motion.div
                            whileHover={{ y: -3 }}
                            key={f.title}
                            className="flex flex-col gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-lg shadow-black/20 hover:shadow-xl hover:bg-white/15 transition-all"
                          >
                            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}>
                              <Icon className={`h-5 w-5 ${f.color}`} />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-white leading-tight">{f.title}</p>
                              <p className="text-[11px] text-white/70 mt-0.5 leading-snug">{f.desc}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <OtpVerificationForm
                      mobileNumber={authData.mobileNumber || ''}
                      onBack={handleBackToMobile}
                      onSuccess={handleOtpSuccess}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="px-8 pb-8">
          <p className="text-sm text-white/50 text-center font-medium">
            &copy; 2026 AgriConnect. {t('common.allRightsReserved')}
          </p>
        </div>
      </div>
    </div>
  );
}
