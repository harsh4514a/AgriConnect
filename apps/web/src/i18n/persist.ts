import { type Locale, isLocale } from './config';

const STORAGE_KEY = 'agri_locale';

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

