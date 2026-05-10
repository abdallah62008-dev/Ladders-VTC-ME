import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { languages, countries } from './lib/i18n/config';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

// Phase 1 sprint 1 review fix (2026-05-09):
//   The locale URL pattern is computed from the canonical locale list in
//   `lib/i18n/config.ts` — that file is the single source of truth for the
//   supported locale set (D-COUNTRY-014 spirit: no hardcoded country list
//   duplicated across files). Adding a country requires editing config.ts
//   only — this header rule stays in sync automatically at build time.
const localePattern = `(?:${languages.join('|')})-(?:${countries.join('|')})`;

const config: NextConfig = {
  // D-PERF-001 §A.3: performance budgets enforced via CI Lighthouse check
  // D-CSP-001: country-aware caching applied via cache keys (Phase 2 wires fully)
  reactStrictMode: true,
  poweredByHeader: false,

  // Image optimization — 6 required variants per D-PERF-001 §B.2
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [200, 600, 768, 1200, 1920],
    imageSizes: [200, 600, 800],
  },

  // Country-aware cache headers added in middleware per D-CSP-001
  async headers() {
    return [
      {
        // Storefront pages — country-aware cache; final cache strategy per
        // 19-performance-growth/04-cache-strategy.md
        source: `/:locale(${localePattern})/:path*`,
        headers: [
          // Phase 1 documents the rule; Phase 2 wires per-page-class TTLs
          { key: 'X-Country-Aware', value: 'true' },
        ],
      },
      {
        // Never-cache list per 19-performance-growth/04-cache-strategy.md §E.2
        source: '/:locale/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
