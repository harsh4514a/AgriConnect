/**
 * Maps legacy free-text language values (used by earlier app versions)
 * to the standardized locale codes used by the frontend (en/gu/hi).
 *
 * Legacy values: 'english', 'hindi', 'gujarati' (case-insensitive).
 * Unknown values fall back to the default 'en'.
 */
export function normalizePreferredLanguage(value: string | null | undefined): string {
  if (!value) return 'en';

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
      return 'en';
  }
}

