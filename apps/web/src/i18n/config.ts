export const locales = ['en', 'gu', 'hi'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  gu: 'ગુજરાતી',
  hi: 'हिन्दी',
};

export type Messages = typeof import('../../messages/en.json');

/**
 * Normalize any legacy / external language value to the canonical locale code.
 * e.g. 'english' -> 'en', 'gujarati' -> 'gu', 'hindi' -> 'hi'
 */
export function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case 'en':
    case 'english':
      return 'en';
    case 'gu':
    case 'gujarati':
      return 'gu';
    case 'hi':
    case 'hindi':
      return 'hi';
    default:
      return null;
  }
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
