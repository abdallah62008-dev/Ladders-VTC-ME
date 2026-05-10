# Performance Budgets

**Status:** 🟢 Lighthouse CI thresholds locked 2026-05-09 (D-INFRA-010 Answered); other budgets per D-PERF-001
**Owner:** Frontend lead
**Last updated:** 2026-05-09

> 🟢 **D-INFRA-010 locked 2026-05-09:** Lighthouse CI per-surface thresholds finalized. Customer-facing pages stricter than admin. Desktop targets stricter than mobile. CWV targets aligned with Master Plan v4 §22 + D-PERF-001 §A.4.

---

## Targets — Lighthouse CI thresholds (🟢 D-INFRA-010 locked)

| Surface | Mobile | Desktop |
|---|---:|---:|
| **Customer-facing pages** (homepage, PLP, PDP, landing pages, checkout, SEO guides) | **≥ 90** | **≥ 95** |
| **Admin pages** (dashboard, products, country pricing/stock, warehouses, orders) | **≥ 85** | **≥ 90** |

## Targets — Core Web Vitals (🟢 D-INFRA-010 locked + D-PERF-001 §A.4)

| Metric | Target | Strict ceiling |
|---|---:|---:|
| LCP | < 2.0s | < 2.5s |
| INP | < 200ms | — |
| CLS | < 0.05 | — |

## Targets — supplementary metrics (per D-PERF-001 §A.3)

| Metric | Customer routes | Admin routes |
|---|---|---|
| TBT | < 200ms | < 300ms |
| Initial JS | < 150KB (PLP/PDP) | < 250KB |
| Initial JS (Landing Page) | < 80KB | n/a |
| Page weight (PDP) | ≤ 1.8 MB | API-focused; latency budget instead |
| Page weight (Product Landing Page) | ≤ 1.2 MB | n/a |
| Page weight (Category Landing Page) | ≤ 1.5 MB | n/a |
| Page weight (Checkout) | ≤ 1.0 MB | n/a |
| Page weight (SEO Guide) | ≤ 1.2 MB | n/a |

## CI enforcement (🟢 D-INFRA-010 locked)

Lighthouse CI runs on representative Phase 1 pages on every PR. CI fails the build if any threshold drops below approved limits.

### Phase 1 representative pages

**Customer-facing:**
- Homepage (`/ar-sa/`, `/en-sa/`)
- PLP (`/ar-sa/plp/<category>`, `/en-sa/plp/<category>`)
- PDP (`/ar-sa/product/VTC-TEL-OS-4.4M`, `/en-sa/product/VTC-TEL-OS-4.4M`)

**Admin:**
- Dashboard (`/admin/`)
- Products list (`/admin/catalog/products`)
- Country Pricing & Stock matrix (`/admin/catalog/products/<id>/pricing`)
- Warehouses (`/admin/operations/warehouses`)

### Override path

Threshold violations require an approved `performance_budget_override` (per `10-overrides/01-override-types.md`):
- Reason ≥ 30 chars
- Expiry: 14 days
- Audit log entry
- Mandatory remediation plan
- Server-side auto-revert on expiry if not remediated

Without an active override, CI hard-blocks the deploy.

## Monitoring

Real-User Monitoring (RUM) via Sentry / Cloudflare Web Analytics tracks p50/p75/p95 in production.

## Optimization checklist

- React Server Components by default
- Image: AVIF + WebP + responsive srcset
- Self-hosted fonts; subset; preload
- Lazy-load heavy modules + AI chat
- Route-level code splitting
- ISR for SEO landings
- Composite indexes on hot DB paths
- Edge caching via Cloudflare

## TODO

- TODO: per-route budget per Phase as features added.
- TODO: confirm RUM tool (Cloudflare Web Analytics + Sentry RUM per ADR-019; final pick Phase 1 sprint 1).
