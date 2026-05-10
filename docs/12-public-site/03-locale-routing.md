# Locale Routing

**Status:** Draft (stub)
**Owner:** Frontend lead

---

## Library

`next-intl` (per ADR-025).

## Detection precedence

On first visit to `/`:
1. URL explicit (skip if `/{locale}/` already specified)
2. Cookie from prior visit
3. `Cf-IPCountry` header → maps to country, defaults to Arabic
4. `Accept-Language` → if explicit English in supported, use English of detected country
5. Fallback: `ar-sa`

## Cookies

- `locale` (preferred locale code)
- `country` (preferred country code; can differ from locale's country)

## Switcher behavior

- Locale switch within same country → same URL, just locale segment changes; cart preserved.
- Country switch → cart warning if non-empty; new cart per country.

## Hreflang

Every page emits all 6 locale alternates + `x-default`. Validated in CI via Screaming Frog or similar.

## Canonical

Self-referential per locale.

## TODO

- TODO: confirm `next-intl` config structure.
- TODO: middleware logic spec.
