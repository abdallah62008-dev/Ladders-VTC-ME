import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n/config';

// Locale routing middleware — Phase 1 acceptance: all 6 locales reachable.
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // every URL prefixed with locale; matches storefront sitemap
  localeDetection: true,
});

export const config = {
  // Match all paths except API routes, _next, static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
