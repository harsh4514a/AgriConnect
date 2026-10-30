'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Locale } from '@/i18n/config';
import {
  adminChangePasswordApi,
  adminGetSettingsInfoApi,
  type AdminSettingsInfo,
} from '@/services/admin-api/admin-settings.api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIntlLocale(locale: string) {
  if (locale === 'gu') return 'gu-IN';
  if (locale === 'hi') return 'hi-IN';
  return 'en-IN';
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(num);
}

// ─── Component ───────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'security' | 'system' | 'marketPrices';

export function AdminSettings() {
  const t = useTranslations('admin');
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || 'en';

  // ─── Settings Data State ───────────────────────────────────────────────────
  const [data, setData] = useState<AdminSettingsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ─── Password Change Form State ───────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ─── Copy ID State ────────────────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState(false);

  // ─── Load Settings Info ───────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await adminGetSettingsInfoApi();
      setData(res);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t('settings.errorSubtitle');
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // ─── Copy Helper ──────────────────────────────────────────────────────────
  const handleCopyId = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
      setCopiedId(false);
    }
  }, []);

  // ─── Password Validation Checks ───────────────────────────────────────────
  const passwordChecks = useMemo(() => {
    return {
      minLength: newPassword.length >= 12,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
      match: confirmPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordChecks.minLength &&
      passwordChecks.uppercase &&
      passwordChecks.lowercase &&
      passwordChecks.number &&
      passwordChecks.special &&
      passwordChecks.match &&
      currentPassword.trim().length > 0
    );
  }, [passwordChecks, currentPassword]);

  // ─── Handle Password Submit ───────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword === currentPassword) {
      setPasswordError(t('settings.securityCard.samePasswordError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.securityCard.mismatchError'));
      return;
    }

    if (!isPasswordValid) {
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await adminChangePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess(res.message || t('settings.securityCard.successMessage'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t('settings.errorSubtitle');
      setPasswordError(msg);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Header Section ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-border-strong bg-[var(--hero)] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.12)] sm:p-7">
        <div
          className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--hero-muted)]">
              {t('settings.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--hero-foreground)] sm:text-[30px]">
              {t('settings.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--hero-muted)]">
              {t('settings.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSettings()}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground shadow-sm transition hover:bg-surface-subtle disabled:opacity-60"
          >
            <RefreshCw
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
              aria-hidden="true"
            />
            {t('settings.refresh')}
          </button>
        </div>
      </section>

      {/* ─── Error Alert if fetch failed ─── */}
      {fetchError ? (
        <section
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-soft/90 p-5 text-danger"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-danger"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold">{t('settings.errorTitle')}</p>
                <p className="mt-1 text-sm text-danger">{fetchError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadSettings()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-surface px-4 text-sm font-bold text-danger hover:bg-danger-soft"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('settings.retry')}
            </button>
          </div>
        </section>
      ) : null}

      {/* ─── Tabs Navigation ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm',
            activeTab === 'overview'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
          )}
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          {t('settings.tabs.overview')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm',
            activeTab === 'security'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
          )}
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {t('settings.tabs.security')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm',
            activeTab === 'system'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
          )}
        >
          <Server className="h-4 w-4" aria-hidden="true" />
          {t('settings.tabs.system')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketPrices')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm',
            activeTab === 'marketPrices'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
          )}
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {t('settings.tabs.marketPrices')}
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Account Status Metric */}
            <div className="rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.accountCard.title')}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <UserCheck className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                {data?.profile.username || '—'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {data?.profile.isActive
                    ? t('settings.accountCard.active')
                    : t('disabled')}
                </span>
              </div>
            </div>

            {/* Platform Runtime Metric */}
            <div className="rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.environment')}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Server className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-lg font-bold uppercase text-foreground">
                {data?.system.nodeEnv || 'development'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data?.system.applicationName || 'AgriConnect Platform'}
              </p>
            </div>

            {/* Locales Metric */}
            <div className="rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.supportedLanguages')}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Globe2 className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                {data?.system.supportedLocales.length ?? 3} Locales
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                English, ગુજરાતી, हिन्दी
              </p>
            </div>

            {/* Market Prices Sync Metric */}
            <div className="rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.marketPricesCard.totalRecords')}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-accent">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                {data ? formatNumber(data.marketPrices.totalRecords, currentLocale) : '—'}
              </p>
              <p className="mt-1 text-xs font-medium text-accent">
                {data?.marketPrices.syncEnabled
                  ? t('settings.marketPricesCard.syncEnabled')
                  : t('settings.marketPricesCard.syncDisabled')}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Cards */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t('settings.quickLinks.title')}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Link
                href={`/${currentLocale}/admin/activity`}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Activity className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground group-hover:text-accent">
                    {t('settings.quickLinks.auditLogs')}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('settings.quickLinks.auditLogsDesc')}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-accent">
                  <span>{t('nav.open')}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href={`/${currentLocale}/admin/users`}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground group-hover:text-blue-700">
                    {t('settings.quickLinks.userManagement')}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('settings.quickLinks.userManagementDesc')}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-700">
                  <span>{t('nav.open')}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href={`/${currentLocale}/admin/market-prices`}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground group-hover:text-teal-700">
                    {t('settings.quickLinks.marketPrices')}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('settings.quickLinks.marketPricesDesc')}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-700">
                  <span>{t('nav.open')}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SECURITY & ACCOUNT ─── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Administrator Profile Card */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm">
                    <Shield className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {t('settings.accountCard.title')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.accountCard.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.accountCard.username')}
                    </p>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {data?.profile.username || 'admin'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.accountCard.role')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-accent">
                      {t('settings.accountCard.administratorRole')}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.accountCard.status')}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent ring-1 ring-inset ring-focus">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {data?.profile.isActive
                          ? t('settings.accountCard.active')
                          : t('disabled')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.accountCard.accountId')}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="rounded-lg bg-surface-subtle px-2.5 py-1 font-mono text-xs text-foreground">
                        {data?.profile.id || '—'}
                      </code>
                      {data?.profile.id && (
                        <button
                          type="button"
                          onClick={() => handleCopyId(data.profile.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-surface-subtle"
                        >
                          {copiedId ? (
                            <>
                              <Check className="h-3 w-3 text-accent" />
                              <span className="text-accent">
                                {t('settings.accountCard.copied')}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>{t('settings.accountCard.copyId')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.accountCard.memberSince')}
                    </p>
                    <p className="mt-1 text-xs text-foreground">
                      {formatDate(data?.profile.createdAt, currentLocale)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session Invalidation Warning Box */}
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-warning">
                <div className="flex items-start gap-3">
                  <ShieldAlert
                    className="mt-0.5 h-5 w-5 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-warning">
                      {t('settings.securityCard.sessionNoticeTitle')}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-warning/90">
                      {t('settings.securityCard.sessionNotice')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Change Password Card */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning shadow-sm">
                    <KeyRound className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {t('settings.securityCard.title')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.securityCard.subtitle')}
                    </p>
                  </div>
                </div>

                {/* Success Banner */}
                {passwordSuccess && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4 text-accent">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div className="text-sm">
                      <p className="font-bold">{passwordSuccess}</p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {passwordError && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-danger">
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-danger"
                      aria-hidden="true"
                    />
                    <div className="text-sm">
                      <p className="font-bold">{passwordError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                  {/* Current Password Field */}
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-xs font-bold text-foreground"
                    >
                      {t('settings.securityCard.currentPasswordLabel')}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="currentPassword"
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder={t('settings.securityCard.currentPasswordPlaceholder')}
                        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-3.5 pr-10 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground"
                        aria-label={
                          showCurrent
                            ? t('settings.securityCard.hidePassword')
                            : t('settings.securityCard.showPassword')
                        }
                      >
                        {showCurrent ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password Field */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-xs font-bold text-foreground"
                    >
                      {t('settings.securityCard.newPasswordLabel')}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder={t('settings.securityCard.newPasswordPlaceholder')}
                        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-3.5 pr-10 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground"
                        aria-label={
                          showNew
                            ? t('settings.securityCard.hidePassword')
                            : t('settings.securityCard.showPassword')
                        }
                      >
                        {showNew ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Password Rules Checklist */}
                  <div className="rounded-xl border border-border/80 bg-surface-subtle/80 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.securityCard.rulesTitle')}
                    </p>
                    <div className="mt-2.5 grid gap-2 text-xs sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        {passwordChecks.minLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span
                          className={cn(
                            passwordChecks.minLength
                              ? 'font-medium text-accent'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('settings.securityCard.ruleMinLength')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordChecks.uppercase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span
                          className={cn(
                            passwordChecks.uppercase
                              ? 'font-medium text-accent'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('settings.securityCard.ruleUppercase')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordChecks.lowercase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span
                          className={cn(
                            passwordChecks.lowercase
                              ? 'font-medium text-accent'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('settings.securityCard.ruleLowercase')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordChecks.number ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span
                          className={cn(
                            passwordChecks.number
                              ? 'font-medium text-accent'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('settings.securityCard.ruleNumber')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordChecks.special ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span
                          className={cn(
                            passwordChecks.special
                              ? 'font-medium text-accent'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('settings.securityCard.ruleSpecial')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordChecks.match ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span
                          className={cn(
                            passwordChecks.match
                              ? 'font-medium text-accent'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('settings.securityCard.ruleMatch')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-bold text-foreground"
                    >
                      {t('settings.securityCard.confirmPasswordLabel')}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder={t('settings.securityCard.confirmPasswordPlaceholder')}
                        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-3.5 pr-10 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground"
                        aria-label={
                          showConfirm
                            ? t('settings.securityCard.hidePassword')
                            : t('settings.securityCard.showPassword')
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPassword || !isPasswordValid}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-sm transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingPassword ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>{t('settings.securityCard.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>{t('settings.securityCard.submit')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Session & Cryptographic Info Full Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-foreground">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('settings.sessionSecurity.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.sessionSecurity.subtitle')}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-surface-subtle/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.sessionSecurity.authType')}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {data?.security.authMethod || 'JWT Bearer'}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-subtle/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.sessionSecurity.accessToken')}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {data?.security.accessTokenExpiry || '15 minutes'}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-subtle/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.sessionSecurity.refreshToken')}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {data?.security.refreshTokenExpiry || '7 days'}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-subtle/50 p-4 sm:col-span-2 lg:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.sessionSecurity.rbac')}
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {t('settings.sessionSecurity.rbacDesc')}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-subtle/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.sessionSecurity.sessionRevocation')}
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {t('settings.sessionSecurity.sessionRevocationDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SYSTEM & ENVIRONMENT ─── */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-800 shadow-sm">
                <Server className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {t('settings.systemCard.title')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t('settings.systemCard.subtitle')}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.appName')}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {data?.system.applicationName || 'AgriConnect'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.environment')}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold uppercase text-sky-800 ring-1 ring-inset ring-sky-200">
                    {data?.system.nodeEnv || 'development'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.databaseStatus')}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-xs font-semibold text-foreground">
                    {t('settings.systemCard.databaseConnected')}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.defaultLanguage')}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  English (en)
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.apiPrefix')}
                </p>
                <code className="mt-1 inline-block rounded-lg bg-surface-subtle px-2.5 py-1 font-mono text-xs text-foreground">
                  /api
                </code>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.systemCard.serverTime')}
                </p>
                <p className="mt-1 text-xs font-medium text-foreground">
                  {new Date().toLocaleString(getIntlLocale(currentLocale))}
                </p>
              </div>
            </div>

            {/* Supported Languages List */}
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('settings.systemCard.supportedLanguages')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {(data?.system.supportedLocales ?? [
                  { code: 'en', name: 'English' },
                  { code: 'gu', name: 'ગુજરાતી' },
                  { code: 'hi', name: 'हिन्दी' },
                ]).map((loc) => (
                  <div
                    key={loc.code}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3.5 py-2 text-xs font-bold text-foreground"
                  >
                    <Globe2 className="h-3.5 w-3.5 text-accent" />
                    <span>{loc.name}</span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {loc.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: MARKET PRICES DATA ─── */}
      {activeTab === 'marketPrices' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 shadow-sm">
                  <TrendingUp className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {t('settings.marketPricesCard.title')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.marketPricesCard.subtitle')}
                  </p>
                </div>
              </div>

              <Link
                href={`/${currentLocale}/admin/market-prices`}
                className="hidden items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground shadow-sm transition hover:bg-accent-strong sm:inline-flex"
              >
                <span>{t('settings.marketPricesCard.managePrices')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.marketPricesCard.dataSource')}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 ring-1 ring-inset ring-teal-200">
                    {data?.marketPrices.dataSource || 'data.gov.in'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.marketPricesCard.syncStatus')}
                </p>
                <div className="mt-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                      data?.marketPrices.syncEnabled
                        ? 'bg-accent-soft text-accent ring-1 ring-inset ring-focus'
                        : 'bg-surface-subtle text-foreground ring-1 ring-inset ring-slate-200',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        data?.marketPrices.syncEnabled
                          ? 'bg-accent'
                          : 'bg-muted-foreground',
                      )}
                    />
                    {data?.marketPrices.syncEnabled
                      ? t('settings.marketPricesCard.syncEnabled')
                      : t('settings.marketPricesCard.syncDisabled')}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.marketPricesCard.totalRecords')}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {data
                    ? t('settings.marketPricesCard.records', {
                        count: formatNumber(
                          data.marketPrices.totalRecords,
                          currentLocale,
                        ),
                      })
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.marketPricesCard.latestDataDate')}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {data?.marketPrices.latestDataDate ||
                    t('settings.marketPricesCard.noSyncYet')}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('settings.marketPricesCard.latestFetchedAt')}
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {data?.marketPrices.latestFetchedAt
                    ? formatDate(data.marketPrices.latestFetchedAt, currentLocale)
                    : t('settings.marketPricesCard.noSyncYet')}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5 sm:hidden">
              <Link
                href={`/${currentLocale}/admin/market-prices`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold text-accent-foreground shadow-sm transition hover:bg-accent-strong"
              >
                <span>{t('settings.marketPricesCard.managePrices')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
