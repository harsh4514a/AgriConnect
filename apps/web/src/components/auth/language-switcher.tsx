'use client';

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useLocale, useSetLocale } from '@/i18n/locale-provider';
import { type Locale } from '@/i18n/config';
import { hasUsableSession } from '@/services/api/token';

interface LanguageOption {
  code: Locale;
  label: string;
  native: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = async (lang: LanguageOption) => {
    const previousLocale = locale;
    setLocale(lang.code);
    setIsOpen(false);

    // Persist to backend only when there is a usable session.
    // Without this check, expired/dead sessions would still hit the API
    // and produce a 401 in the console even though we handle it silently.
    if (!hasUsableSession()) return;

    try {
      const [{ api }, { updateCachedUserLanguage }] = await Promise.all([
        import('@/services/api/axios'),
        import('@/lib/auth/session'),
      ]);
      await api.patch('/auth/profile/language', { preferredLanguage: lang.code });
      // Keep the cached user snapshot in sync so the dashboard reflects
      // the new language immediately (not just on next login).
      updateCachedUserLanguage(lang.code);
      toast.success(t('settings.languageUpdated'));
    } catch (error) {
      // A missing session is expected when a login has expired.
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) return;

      // Keep the selected locale in sync if the server update fails.
      setLocale(previousLocale);
      toast.error(t('settings.failedToUpdate'));
    }
  };

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={t('nav.selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span>{compact ? current.code.toUpperCase() : current.native}</span>
      </button>

      {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="animate-navbar-drop-in motion-reduce:animate-none absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/10"
              role="menu"
            >
              {LANGUAGES.map((lang) => {
                const isActive = current.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang)}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={
                      'flex min-h-11 w-full items-center justify-between px-3.5 text-sm transition-colors' +
                      (isActive
                        ? 'bg-accent-soft font-medium text-accent-strong'
                        : 'text-foreground hover:bg-surface-subtle')
                    }
                  >
                    <span>{lang.native}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">{lang.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
      )}
    </div>
  );
}
