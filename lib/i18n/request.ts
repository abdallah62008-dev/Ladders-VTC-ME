// next-intl request config — per-request locale resolution.
import { getRequestConfig } from 'next-intl/server';
import { isValidLocale, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isValidLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${getLanguage(locale)}.json`)).default,
  };
});

function getLanguage(locale: string): 'ar' | 'en' {
  return locale.startsWith('ar') ? 'ar' : 'en';
}
