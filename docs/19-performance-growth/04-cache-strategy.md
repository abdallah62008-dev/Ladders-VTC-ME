# Cache Strategy

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001)
**Owner:** Frontend Lead + Infra Lead
**Source:** ADR-014 (Cloudflare CDN); Master Plan v4 §22

> Section E of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## E.1 What can be cached

- Homepage
- Product pages (PDP)
- Product landing pages
- Category landing pages
- SEO pages (programmatic country×topic, city, height, problem)
- FAQ
- Country settings (read-mostly)
- Shipping rules
- Payment methods
- Public media (always)

## E.2 What should NOT be globally cached

- Cart
- Checkout
- Admin
- Customer account
- Payment pages
- Live stock reservations
- Customer-specific pricing (B2B negotiated rates)

These bypass edge cache; use Redis short TTLs only for performance.

## E.3 Static Landing Page Snapshots

For ad-traffic landing pages, generate **fully static HTML snapshots** at publish time. Cloudflare serves the snapshot directly; the origin is hit only on cache miss or revalidation.

Workflow:
1. Author finalizes page + passes pre-publish quality gate.
2. Build worker generates static HTML snapshot.
3. Snapshot uploaded to Cloudflare R2 with versioned filename.
4. Cloudflare Worker serves snapshot for matching URL.
5. On publish update: new snapshot generated, old snapshot retained for rollback (30-day retention).

## E.4 Edge Cache by Country

Cache key separated by:
- Locale
- Country
- Currency (cosmetic)
- Product availability (cache-busted on `variant_country_price.active` or `qty_available_total = 0` transition)
- Campaign (if landing page has campaign-specific variant)

## E.5 Stale-While-Revalidate

Use SWR for:
- Product pages
- Category pages
- Landing pages
- SEO pages

`Cache-Control: max-age=300, stale-while-revalidate=86400` — visitor sees cached page instantly while edge fetches fresh.

## E.6 Smart Cache Invalidation

When product price/stock/media changes, invalidate **only**:
- Affected product page
- Affected landing pages (joined via `landing_page.product_id`)
- Affected category pages (joined via `product.group_id`)
- Affected country/locale cache (via `revalidateTag(country:sa)`, `tag(group:telescopic)`)

**Never** purge whole site. Tag-based invalidation per Next.js + Cloudflare API.
