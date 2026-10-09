import { z } from 'zod';
import type { Locale } from '@/i18n/config';

interface ValidationDictionary {
    mobileRequired: string;
    mobileInvalid: string;
    firstNameMin: string;
    firstNameMax: string;
    lastNameMin: string;
    lastNameMax: string;
    languageRequired: string;
}

const validationMessages: Record<Locale, ValidationDictionary> = {
    en: {
        mobileRequired: 'Mobile number is required.',
        mobileInvalid: 'Please enter a valid 10-digit Indian mobile number.',
        firstNameMin: 'First name must be at least 2 characters.',
        firstNameMax: 'First name must not exceed 50 characters.',
        lastNameMin: 'Last name must be at least 2 characters.',
        lastNameMax: 'Last name must not exceed 50 characters.',
        languageRequired: 'Please select a language.',
    },
    gu: {
        mobileRequired: 'મોબાઇલ નંબર જરૂરી છે.',
        mobileInvalid: 'કૃપા કરીને 10-અંકનો માન્ય ભારતીય મોબાઇલ નંબર દાખલ કરો.',
        firstNameMin: 'પહેલું નામ ઓછામાં ઓછું 2 અક્ષરનું હોવું જોઈએ.',
        firstNameMax: 'પહેલું નામ 50 અક્ષરોથી વધુ ન હોવું જોઈએ.',
        lastNameMin: 'અટક ઓછામાં ઓછું 2 અક્ષરનું હોવું જોઈએ.',
        lastNameMax: 'અટક 50 અક્ષરોથી વધુ ન હોવું જોઈએ.',
        languageRequired: 'કૃપા કરીને ભાષા પસંદ કરો.',
    },
    hi: {
        mobileRequired: 'मोबाइल नंबर आवश्यक है।',
        mobileInvalid: 'कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें।',
        firstNameMin: 'पहला नाम कम से कम 2 अक्षरों का होना चाहिए।',
        firstNameMax: 'पहला नाम 50 अक्षरों से अधिक नहीं होना चाहिए।',
        lastNameMin: 'अंतिम नाम कम से कम 2 अक्षरों का होना चाहिए।',
        lastNameMax: 'अंतिम नाम 50 अक्षरों से अधिक नहीं होना चाहिए।',
        languageRequired: 'कृपया भाषा चुनें।',
    },
};

function getValidationMessages(locale: Locale): ValidationDictionary {
    return validationMessages[locale];
}

/**
 * Factory that creates a mobile number schema with localized error messages.
 * Must be re-created (via useMemo) whenever the active locale changes.
 */
export function createMobileNumberSchema(locale: Locale) {
    const m = getValidationMessages(locale);
    return z.object({
        mobileNumber: z
            .string()
            .min(1, m.mobileRequired)
            .regex(/^\+91[6-9]\d{9}$/, m.mobileInvalid),
    });
}

export type MobileNumberFormData = z.infer<ReturnType<typeof createMobileNumberSchema>>;

export function createCompleteProfileSchema(locale: Locale) {
    const m = getValidationMessages(locale);
    return z.object({
        firstName: z.string().min(2, m.firstNameMin).max(50, m.firstNameMax),
        lastName: z.string().min(2, m.lastNameMin).max(50, m.lastNameMax),
        preferredLanguage: z.string().min(1, m.languageRequired),
        stateId: z.string().uuid().optional(),
        districtId: z.string().uuid().optional(),
        talukaId: z.string().uuid().optional(),
        villageId: z.string().uuid().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
    });
}

export type CompleteProfileFormData = z.infer<ReturnType<typeof createCompleteProfileSchema>>;

// Backwards-compatible exports for any code that still imports the static schemas.
export const mobileNumberSchema = createMobileNumberSchema('en');
export const completeProfileSchema = createCompleteProfileSchema('en');
