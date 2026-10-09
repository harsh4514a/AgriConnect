'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useLocale, useSetLocale } from '@/i18n/locale-provider';
import { type Locale } from '@/i18n/config';
import { api } from '@/services/api/axios';
import { hasUsableSession } from '@/services/api/token';
import { updateCachedUserLanguage } from '@/lib/auth/session';

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

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSelect = async (lang: LanguageOption) => {
    const previousLocale = locale;
    setLocale(lang.code);
    setIsOpen(false);

    // Persist to backend only when there is a usable session.
    // Without this check, expired/dead sessions would still hit the API
    // and produce a 401 in the console even though we handle it silently.
    if (!hasUsableSession()) return;

    try {
      await api.patch('/auth/profile/language', { preferredLanguage: lang.code });
      // Keep the cached user snapshot in sync so the dashboard reflects
      // the new language immediately (not just on next login).
      updateCachedUserLanguage(lang.code);
      toast.success(t('settings.languageUpdated'));
    } catch (error) {
      // 401/403 = no valid session — the user simply isn't logged in.
      // This is NOT an error in the language switch; just skip silently.
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) return;

      // Any other failure: roll back so the UI stays synced with the server.
      setLocale(previousLocale);
      toast.error(t('settings.failedToUpdate'));
    }
  };

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className={`relative ${className ?? ''}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
        aria-label={t('nav.selectLanguage')}
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-black" />
        <span className="text-black">{current.native}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white/90 backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/20 overflow-hidden z-50"
            >
              {LANGUAGES.map((lang) => {
                const isActive = current.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang)}
                    className={
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ' +
                      (isActive
                        ? 'text-emerald-700 font-medium bg-emerald-50/50'
                        : 'text-gray-600 hover:bg-white/80')
                    }
                  >
                    <span>{lang.native}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-400">{lang.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
