# Public Website Sitemap

**Status:** Draft (locked from Master Plan v4 §6)
**Owner:** Product

---

## Locked sitemap

```
/                                       middleware → /{locale}
/{locale}/                              Homepage
/{locale}/shop                          PLP all
/{locale}/shop/[category]               Category PLP
/{locale}/groups/[group]                Group sales page
                                        (telescopic|folding|extension|step|
                                         multi-purpose|home|villa|contractor|
                                         warehouse|fiberglass)
/{locale}/product/[slug]                PDP
/{locale}/compare?ids=                  Comparison
/{locale}/ladder-finder                 Wizard
/{locale}/reach-calculator              Standalone tool
/{locale}/fit-my-car                    Standalone tool
/{locale}/cart
/{locale}/checkout
/{locale}/checkout/success/[order]
/{locale}/account
/{locale}/orders/[id]                   Tracking (magic-link enabled)
/{locale}/business
/{locale}/business/quote
/{locale}/guides
/{locale}/guides/[slug]
/{locale}/shipping
/{locale}/returns
/{locale}/warranty
/{locale}/contact
/{locale}/privacy
/{locale}/terms

# Programmatic SEO
/{locale}/landing/[slug]                Country × topic
/{locale}/{city}/[topic]                City pages (e.g. /ar-sa/riyadh/telescopic-ladder)
/{locale}/height/[h]                    Height pages
/{locale}/problem/[slug]                Objection pages

# Fast direct-response (separate route group)
/lp/[slug]
/lp/{country}/[slug]

# Marketer
/r/[code]                               Short referral
/qr/[code]                              QR-only

# System
/sitemap.xml
/sitemap-{locale}.xml
/robots.txt
/api/v1/*
```

## Locales at launch

`ar-sa` · `ar-eg` · `ar-iq` · `en-sa` · `en-eg` · `en-iq`

Future locales auto-routed when `country` row added.

## Domains

- **Primary website:** `ladders.vtc-me.com` (confirmed 2026-05-07). Hosts all routes above.
- **Staging:** `staging.ladders.vtc-me.com`.
- **Dev:** `dev.ladders.vtc-me.com`.
- **Short-link / tracking (future, optional):** `tl.vtc-me.com` reserved as a possible future short domain for marketer referral and QR links (`/r/[code]`, `/qr/[code]`). Not active in Phase 0/1; decision deferred to Phase 5–6 when the marketer system ships. If activated, short links become e.g., `https://tl.vtc-me.com/r/abc123` redirecting (302) to the corresponding `/r/[code]` route on the primary domain. Until then, short links live at `https://ladders.vtc-me.com/r/[code]`.

## TODO

- TODO: exact list of group slugs.
- TODO: list of city slugs per country (initial).
- TODO: initial list of problem slugs.
- TODO: decide whether to activate `tl.vtc-me.com` in Phase 5/6.
