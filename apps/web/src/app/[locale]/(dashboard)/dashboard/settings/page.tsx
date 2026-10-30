'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import {
  Bell,
  ChevronRight,
  FileText,
  Globe2,
  Info,
  LockKeyhole,
  LogOut,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { APP_VERSION } from '@/constants/app';
import { useLocale } from '@/i18n/locale-provider';

type LocationPermissionState = 'loading' | 'granted' | 'denied' | 'prompt' | 'unsupported';


function SettingRow({
  icon: Icon,
  title,
  description,
  value,
  onClick,
  href,
  disabled = false,
  trailing,
}: {
  icon: typeof Globe2;
  title: string;
  description?: string;
  value?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
        )}
      </span>

      <span className="ml-3 flex shrink-0 items-center gap-2">
        {value && <span className="max-w-[120px] truncate text-xs font-medium text-accent">{value}</span>}
        {trailing}
        {(onClick || href) && !disabled && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
    </>
  );

  const className =
    'flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/[0.04] px-4 py-3.5 text-left transition-colors' +
    (disabled
      ? 'cursor-not-allowed opacity-70'
      : 'hover:border-border hover:bg-surface/[0.07] focus-visible:bg-surface/[0.07]');

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className} aria-disabled={disabled || undefined}>
      {content}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`settings-${title}`}>
      <h2 id={`settings-${title}`} className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { logout } = useAuth();

  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionState>('loading');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const readLocationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationPermission('unsupported');
      return;
    }

    if (!('permissions' in navigator)) {
      setLocationPermission('prompt');
      return;
    }

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });

      setLocationPermission(permission.state as LocationPermissionState);

      permission.onchange = () => {
        setLocationPermission(permission.state as LocationPermissionState);
      };
    } catch {
      // Some browsers expose geolocation but do not expose its permission
      // state through Permissions API. We can still offer a one-time request.
      setLocationPermission('prompt');
    }
  }, []);

  useEffect(() => {
    void readLocationPermission();
  }, [readLocationPermission]);

  useEffect(() => {
    if (!aboutOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAboutOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aboutOpen]);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error(t('settings.location.unsupported'));
      setLocationPermission('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission('granted');
        toast.success(t('settings.location.allowedToast'));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          toast.error(t('settings.location.deniedToast'));
        } else {
          void readLocationPermission();
          toast.error(t('settings.location.requestFailed'));
        }
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 10 * 1000,
      },
    );
  };

  const handleLogout = () => {
    setLoggingOut(true);
    logout();
  };

  const locationValue: Record<LocationPermissionState, string> = {
    loading: t('settings.location.checking'),
    granted: t('settings.location.allowed'),
    denied: t('settings.location.notAllowed'),
    prompt: t('settings.location.notSet'),
    unsupported: t('settings.location.unsupported'),
  };

  const locationAction =
    locationPermission === 'prompt'
      ? t('settings.location.allow')
      : locationPermission === 'denied'
        ? t('settings.location.retry')
        : undefined;

  return (
    <>
      <div className="mx-auto max-w-4xl pb-8">
        <div className="mb-7">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-accent">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('settings.badge')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('settings.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('settings.description')}
          </p>
        </div>

        <div className="space-y-7">
          <Section title={t('settings.sections.preferences')}>
            <SettingRow
              icon={Globe2}
              title={t('settings.language.title')}
              description={t('settings.language.description')}
              value={t(`settings.language.${locale}`)}
              trailing={
                <LanguageSwitcher className="[&_button]:!px-2 [&_button]:!py-1.5 [&_button]:!text-xs [&_button]:!text-foreground [&_button]:!bg-surface-subtle [&_button]:hover:!bg-surface-subtle [&_button>svg]:!text-accent [&_button>span]:!text-muted-foreground" />
              }
            />

            <SettingRow
              icon={Bell}
              title={t('settings.notifications.title')}
              description={t('settings.notifications.unavailableDescription')}
              value={t('settings.notifications.unavailable')}
              disabled
              trailing={
                <span
                  className="relative h-6 w-11 rounded-full bg-surface-subtle"
                  aria-hidden="true"
                >
                  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-surface-subtle" />
                </span>
              }
            />
          </Section>

          <Section title={t('settings.sections.privacy')}>
            <SettingRow
              icon={MapPin}
              title={t('settings.location.title')}
              description={t('settings.location.description')}
              value={locationValue[locationPermission]}
              onClick={
                locationPermission === 'prompt' || locationPermission === 'denied'
                  ? requestLocation
                  : undefined
              }
              disabled={locationPermission === 'loading' || locationPermission === 'unsupported'}
              trailing={
                locationAction ? (
                  <span className="hidden text-xs font-semibold text-accent sm:inline">
                    {locationAction}
                  </span>
                ) : null
              }
            />

          </Section>

          <Section title={t('settings.sections.information')}>
            <SettingRow
              icon={FileText}
              title={t('settings.terms.title')}
              href={`/${locale}/dashboard/terms`}
            />

            <SettingRow
              icon={LockKeyhole}
              title={t('settings.privacyPolicy.title')}
              href={`/${locale}/dashboard/privacy-policy`}
            />

            <SettingRow
              icon={Info}
              title={t('settings.about.title')}
              description={t('settings.about.description')}
              value={t('settings.about.version', { version: APP_VERSION })}
              onClick={() => setAboutOpen(true)}
            />
          </Section>

          <Section title={t('settings.sections.account')}>
            <SettingRow
              icon={LogOut}
              title={t('settings.logout.title')}
              description={t('settings.logout.description')}
              onClick={handleLogout}
              disabled={loggingOut}
            />
          </Section>
        </div>
      </div>

      {aboutOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAboutOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-agriconnect-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  {t('settings.about.label')}
                </p>
                <h2 id="about-agriconnect-title" className="mt-2 text-2xl font-bold text-foreground">
                  AgriConnect
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                aria-label={t('settings.about.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-foreground">
              {t('settings.about.appDescription')}
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-surface/[0.04] p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t('settings.about.versionLabel')}</span>
                <span className="font-semibold text-foreground">{APP_VERSION}</span>
              </div>
              <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {t('settings.about.copyright', { year: new Date().getFullYear() })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
