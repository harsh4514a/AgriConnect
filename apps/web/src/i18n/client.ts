import { type Locale, type Messages, defaultLocale } from './config';

/**
 * Module-level current locale used by non-React code (e.g. the axios
 * interceptor) so error/toast messages are translated synchronously.
 * The LocaleProvider keeps this in sync via `setClientLocale`.
 */
let currentLocale: Locale = defaultLocale;
let currentMessages: Messages | null = null;

export function setClientLocale(locale: Locale, messages?: Messages): void {
  currentLocale = locale;
  if (messages) currentMessages = messages;
}

export function getClientLocale(): Locale {
  return currentLocale;
}

/**
 * Minimal key-based translator for usage outside React components.
 * Supports ICU-style interpolation of `{param}` placeholders.
 */
export function translate(key: string, params?: Record<string, string | number>): string {
  const segments = key.split('.');
  let value: unknown = currentMessages;

  for (const segment of segments) {
    if (value && typeof value === 'object' && segment in value) {
      value = (value as Record<string, unknown>)[segment];
    } else {
      return key;
    }
  }

  if (typeof value !== 'string') return key;

  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}
