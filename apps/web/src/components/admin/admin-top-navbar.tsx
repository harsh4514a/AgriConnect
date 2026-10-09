'use client';

import { useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSetLocale } from '@/i18n/locale-provider';
import { storeLocale } from '@/i18n/persist';
import { Globe2, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface AdminTopNavbarProps {
  onOpenMobile: () => void;
}

export function AdminTopNavbar({ onOpenMobile }: AdminTopNavbarProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = (params?.locale as Locale) || 'en';
  const { admin, logout } = useAdminAuth();
  const setLocale = useSetLocale();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    storeLocale(newLocale);
    setLocale(newLocale);

    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] && locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }

    router.replace(`/${segments.join('/')}`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-[#d7ddd6] bg-[#f4f5f1]/95 px-4 shadow-[0_1px_8px_rgba(15,23,42,0.03)] backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 lg:hidden"
          aria-label={t('layout.openSidebar')}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-slate-950">
            {t('layout.topTitle')}
          </p>
          <p className="hidden truncate text-[11px] font-medium text-slate-400 sm:block">
            {t('layout.topSubtitle')}
          </p>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="flex items-center rounded-xl border border-[#d8e4da] bg-white p-1 shadow-sm">
          <Globe2 className="ml-1.5 h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          <label className="sr-only" htmlFor="admin-language">
            {t('layout.languageSelector')}
          </label>
          <select
            id="admin-language"
            value={currentLocale}
            onChange={(event) => handleLocaleChange(event.target.value as Locale)}
            className="max-w-[96px] cursor-pointer bg-transparent py-1.5 pl-1.5 pr-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {localeNames[locale]}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden items-center gap-2.5 rounded-xl border border-[#d8e4da] bg-white px-3 py-1.5 shadow-sm sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="max-w-36 truncate text-xs font-bold text-slate-800">
              {admin?.username || t('layout.defaultAdministrator')}
            </p>
            <p className="text-[10px] font-semibold text-emerald-700">
              {admin?.isActive ? t('active') : t('disabled')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5"
          aria-label={isLoggingOut ? t('layout.loggingOut') : t('layout.logout')}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden md:inline">{isLoggingOut ? t('layout.loggingOut') : t('layout.logout')}</span>
        </button>
      </div>
    </header>
  );
}
