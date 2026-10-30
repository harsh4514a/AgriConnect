'use client';

import { Suspense, useState, useEffect } from 'react';
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
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import Image from 'next/image';
import { hasUsableAdminSession } from '@/services/admin-api/admin-token';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useSetLocale } from '@/i18n/locale-provider';
import { storeLocale } from '@/i18n/persist';
import { ThemeToggle } from '@/components/theme/theme-toggle';

function RedirectQuery({ onRedirectPath }: { onRedirectPath: (path: string | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onRedirectPath(searchParams.get('redirect'));
  }, [onRedirectPath, searchParams]);

  return null;
}

export function AdminLoginCard() {
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || 'en';
  const { login } = useAdminAuth();
  const setLocale = useSetLocale();

  const [redirectPath, setRedirectPath] = useState<string | null>(null);
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
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--surface-subtle)] px-4 py-8 sm:px-6">
      <Suspense fallback={null}>
        <RedirectQuery onRedirectPath={setRedirectPath} />
      </Suspense>
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/${currentLocale}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('login.backToFarmerApp')}
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
              <Globe className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
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
                className="bg-transparent py-1 pl-1 pr-2 text-xs font-medium text-foreground focus:outline-none"
              >
                {locales.map((locale) => (
                  <option key={locale} value={locale}>
                    {localeNames[locale]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_55px_rgba(15,76,45,0.08)] sm:p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-xl bg-white px-3 py-1.5">
              <Image
                src="/logo.png"
                alt="AgriConnect"
                width={540}
                height={180}
                priority
                className="h-14 w-[210px] object-contain"
              />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('login.title')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-semibold text-foreground">
                {t('login.usernameLabel')}
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                  className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-focus focus:ring-4 focus:ring-focus disabled:bg-surface-subtle"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-foreground">
                {t('login.passwordLabel')}
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                  className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-focus focus:ring-4 focus:ring-focus disabled:bg-surface-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
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
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-strong focus:outline-none focus:ring-4 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border pt-5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {t('login.securityNotice')}
          </div>
        </section>
      </div>
    </main>
  );
}
