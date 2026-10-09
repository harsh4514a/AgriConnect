'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { hasUsableAdminSession } from '@/services/admin-api/admin-token';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useSetLocale } from '@/i18n/locale-provider';
import { storeLocale } from '@/i18n/persist';

export function AdminLoginCard() {
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const currentLocale = (params?.locale as Locale) || 'en';
  const redirectPath = searchParams.get('redirect');
  const { login } = useAdminAuth();
  const setLocale = useSetLocale();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hasUsableAdminSession()) {
      router.replace(`/${currentLocale}/admin`);
    }
  }, [currentLocale, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ username: username.trim(), password }, redirectPath);
    } catch (error) {
      setIsSubmitting(false);
      const requestError = error as { message?: string; status?: number };

      if (requestError.status === 401) {
        setErrorMessage(t('login.invalidCredentials'));
      } else if (requestError.status === 429) {
        setErrorMessage(t('login.tooManyAttempts'));
      } else {
        setErrorMessage(requestError.message || t('login.genericError'));
      }
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#eef3ef] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/${currentLocale}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('login.backToFarmerApp')}
          </Link>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <Globe className="ml-1.5 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <label className="sr-only" htmlFor="admin-login-language">
              {t('login.languageSelector')}
            </label>
            <select
              id="admin-login-language"
              value={currentLocale}
              onChange={(event) => {
                const nextLocale = event.target.value as Locale;
                storeLocale(nextLocale);
                setLocale(nextLocale);
                router.replace(`/${nextLocale}/admin/login`);
              }}
              className="bg-transparent py-1 pl-1 pr-2 text-xs font-medium text-slate-700 focus:outline-none"
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {localeNames[locale]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="rounded-3xl border border-[#d8e4da] bg-[#fbfdfb] p-6 shadow-[0_20px_55px_rgba(15,76,45,0.08)] sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f5b3b] text-white shadow-lg shadow-emerald-950/10">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {t('login.title')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t('login.subtitle')}
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-semibold text-slate-800">
                {t('login.usernameLabel')}
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t('login.usernamePlaceholder')}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-800">
                {t('login.passwordLabel')}
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || !password}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b4d32] focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('login.loggingIn')}
                </>
              ) : (
                t('login.submitButton')
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            {t('login.securityNotice')}
          </div>
        </section>
      </div>
    </main>
  );
}
