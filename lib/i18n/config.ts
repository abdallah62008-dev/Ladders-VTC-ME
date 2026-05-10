// Locale configuration per Phase 1 acceptance: 6 locales reachable
// (ar-sa, ar-eg, ar-iq, en-sa, en-eg, en-iq).
// Arabic default per Master Plan v4 §1; English secondary.
//
// D-COUNTRY-014: countries are NEVER hardcoded in business logic. This locale
// list is presentation-layer routing only. Country data (active/inactive, pricing,
// stock, payments, shipping, etc.) is read from the `country` table at runtime.

export const locales = [
  'ar-sa', // Arabic — Saudi Arabia (Phase 1 active)
  'en-sa', // English — Saudi Arabia (Phase 1 active)
  'ar-eg', // Arabic — Egypt (Phase 8+ activation)
  'en-eg', // English — Egypt (Phase 8+ activation)
  'ar-iq', // Arabic — Iraq (Phase 8+ activation)
  'en-iq', // English — Iraq (Phase 8+ activation)
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar-sa';

export const languages = ['ar', 'en'] as const;
export type Language = (typeof languages)[number];

export const countries = ['sa', 'eg', 'iq'] as const;
export type CountryCode = (typeof countries)[number];

// RTL/LTR direction by language (presentation-layer only).
export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale.startsWith('ar') ? 'rtl' : 'ltr';
}

export function getLanguage(locale: Locale): Language {
  return locale.split('-')[0] as Language;
}

export function getCountryCode(locale: Locale): CountryCode {
  return locale.split('-')[1] as CountryCode;
}

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
