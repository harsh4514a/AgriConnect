'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/home/navbar';
import { Footer } from '@/components/home/footer';
import { MobileNumberForm } from '@/components/auth/mobile-number-form';
import { useLocale } from '@/i18n/locale-provider';
import { cacheUser, getCachedUser } from '@/lib/auth/session';
import { AuthStep, AuthData, INITIAL_AUTH_DATA } from '@/types/auth-steps.types';
import type { AuthUser } from '@/types/auth.types';

const OtpVerificationForm = dynamic(
  () => import('@/components/auth/otp-verification-form').then((module) => module.OtpVerificationForm),
  { loading: () => <div className="min-h-64" aria-busy="true" /> },
);
const AuthStepRenderer = dynamic(
  () => import('@/components/auth/auth-step-renderer').then((module) => module.AuthStepRenderer),
  { loading: () => <div className="min-h-64" aria-busy="true" /> },
);
const NameStep = dynamic(
  () => import('@/components/auth/steps/name-step').then((module) => module.NameStep),
);
const ManualLocationStep = dynamic(
  () => import('@/components/auth/steps/manual-location-step').then((module) => module.ManualLocationStep),
);

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

  const onboardingSteps = [
    { key: 'name' as AuthStep, component: NameStep },
    { key: 'location' as AuthStep, component: ManualLocationStep },
  ];
  const sectionLabel = step === 'location'
    ? t('manual.title')
    : step === 'name'
      ? t('name.title')
      : step === 'otp'
        ? t('otp.verifyTitle')
        : t('auth.loginTitle');

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-foreground">
        <Navbar variant="solid" />

        <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-[0_18px_50px_rgba(20,55,38,0.10)] sm:p-8"
            aria-label={sectionLabel}
          >
            <div className="mb-6 flex justify-center">
              <Image
                src="/logo.png"
                alt="AgriConnect"
                width={510}
                height={170}
                priority
                className="h-12 w-[144px] object-contain sm:h-14 sm:w-[168px]"
              />
            </div>

            {['name', 'location'].includes(step) ? (
              <AuthStepRenderer
                currentStep={step}
                steps={onboardingSteps}
                authData={authData}
                onNext={handleStepNext}
                onBack={handleStepBack}
                onComplete={handleAuthComplete}
              />
            ) : (
              step === 'mobile' ? (
                  <div key="mobile">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                      {t('auth.loginTitle')}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                      {t('auth.loginDescription')}
                    </p>
                    <MobileNumberForm onSuccess={handleMobileSuccess} className="mt-6" />
                    <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                      {t('auth.otpPrivacyNote')}
                    </p>
                  </div>
                ) : (
                  <div key="otp">
                    <OtpVerificationForm
                      mobileNumber={authData.mobileNumber || ''}
                      onBack={handleBackToMobile}
                      onSuccess={handleOtpSuccess}
                    />
                  </div>
                )
            )}
          </section>
        </main>

        <Footer compact />
    </div>
  );
}
