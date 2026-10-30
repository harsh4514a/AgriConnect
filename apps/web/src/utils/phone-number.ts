export interface NormalizedPhoneNumber {
  tel: string;
  whatsapp: string;
}

/** Normalize a user-supplied phone number without assuming an Indian prefix. */
export function normalizePhoneNumber(value: unknown): NormalizedPhoneNumber | null {
  if (typeof value !== 'string') return null;

  const input = value.trim();
  if (!input || !/^\+?[\d\s().-]+$/.test(input)) return null;

  const digits = input.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  if (/^0+$/.test(digits)) return null;

  // Infer India only for a valid 10-digit mobile or its 0-prefixed local form.
  // An explicit + country code is always preserved as supplied.
  const isExplicitInternational = input.startsWith('+');
  const isIndianMobile = /^[6-9]\d{9}$/.test(digits);
  const isIndianLocalMobile = /^0[6-9]\d{9}$/.test(digits);
  const internationalDigits = isExplicitInternational
    ? digits
    : isIndianMobile
      ? `91${digits}`
      : isIndianLocalMobile
        ? `91${digits.slice(1)}`
        : digits;

  if (!isExplicitInternational && digits.length <= 10 && !isIndianMobile) return null;
  if (!isExplicitInternational && digits.length === 11 && digits.startsWith('0') && !isIndianLocalMobile) return null;

  if (internationalDigits.length > 15) return null;

  return {
    tel: `+${internationalDigits}`,
    whatsapp: internationalDigits,
  };
}
