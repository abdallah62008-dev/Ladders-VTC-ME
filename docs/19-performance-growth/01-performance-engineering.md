# Performance Engineering System

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001)
**Owner:** CTO + Frontend Lead + Infra Lead
**Source:** Master Plan v4 §22; ADR-014 (Cloudflare); ADR-019 (Observability)

> Section A of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## A.1 CDN strategy

**Provider:** Cloudflare (per ADR-014). All traffic terminates at Cloudflare edge.

**Caching layers:**

| Layer | What | Where | TTL guidance |
|---|---|---|---|
| Edge cache (Cloudflare) | Static assets (JS, CSS, fonts, images), public HTML, programmatic SEO landing pages | All Cloudflare PoPs | 1y for versioned URLs; 1h ISR for landing pages |
| Application cache (Next.js ISR) | Per-route static-ish HTML refreshed on tag invalidation | Origin (Hetzner / Vercel) | 1h–24h depending on route class |
| API response cache (Redis) | Hot API reads (product cards, country settings, shipping zones) | Hetzner Redis | 5min–1h depending on volatility |
| Browser cache | Assets fetched from Cloudflare | Customer browser | Per `Cache-Control` header |

**Country-aware caching rules:**

Cache key includes `(locale, country, currency, variant)` for any path that varies by country. Mistakes here cause cross-country price/stock leakage; tested in Phase 1 acceptance.

```
Cache key examples:
  /ar-sa/product/sku-123             → key (path, locale=ar-sa, country=sa)
  /ar-eg/product/sku-123             → key (path, locale=ar-eg, country=eg)
  /lp/villa-4-4m?ref=xyz             → key (path, locale, country, variant_cookie)
```

**Page-class cache profiles:**

| Page class | Cache | Country-aware key | Edge TTL | Origin TTL (ISR) |
|---|---|---|---|---|
| Homepage | Yes | Yes | 5 min | 1 h |
| Group sales pages | Yes | Yes | 1 h | 1 h |
| Programmatic SEO landings | Yes | Yes | 1 h | 1 h |
| Fast direct-response landing pages | Yes | Yes (incl. variant cookie) | 5 min | 5 min |
| PDP | Yes | Yes | 15 min | 15 min |
| Category PLP | Yes | Yes | 5 min per filter combo | 1 h base |
| Guides | Yes | Yes (locale only) | 1 h | 1 h |
| Cart | **No** | — | bypass | — |
| Checkout | **No** | — | bypass | — |
| Account / Orders | **No** | — | bypass | — |
| Admin | **No** | — | bypass | — |
| Webhook receivers | **No** | — | bypass | — |

## A.2 Page rendering strategy

| Page | Strategy | Phase |
|---|---|---|
| Product landing pages | **Static / ISR / cache-first** for ad traffic. Pre-rendered with country/variant cookie split via Cloudflare Worker if needed. | Phase 6 |
| Category landing pages | **Static / ISR / cache-first** | Phase 6 |
| PDP | **ISR with 15-min revalidate** + tag invalidation on price/stock change | Phase 1 |
| Cart, checkout, admin, payment, customer pages | **Always dynamic** — no edge cache | Phase 2+ |
| AI Chat widget | **Lazy loaded** — `dynamic({ ssr: false })` after viewport idle | Phase 3 |
| Heavy widgets (Compare, Finder, Reach Calculator, Fit-My-Car) | **Loaded on user interaction** (button click, scroll into view) | Phase 6 |

## A.3 Performance budgets by page type (locked)

These are **enforced budgets** — Phase 1 onwards CI rejects any page exceeding them.

| Page Type | Max Page Weight | Lighthouse Mobile | Notes |
|---|---:|---:|---|
| Product Landing Page | **1.2 MB** | **95+** | Fastest ad pages; minimal JS; pre-loaded hero |
| Category Landing Page | **1.5 MB** | **92+** | Comparison + product cards |
| Product Detail Page | **1.8 MB** | **90+** | More images/specs; PDP gallery |
| Checkout | **1.0 MB** | **90+** | Minimal JS; payment provider script late-loaded |
| SEO Guide Page | **1.2 MB** | **92+** | Content-first |
| Admin Dashboard | API-focused | N/A | Use API latency + query performance budgets instead |

Budget violations:
- CI gates regression at PR time.
- Production runtime alert if RUM (Real-User Monitoring) p75 score drops below threshold for 30+ minutes.
- Override required to ship a page exceeding budget; reason logged in `override_request` (per `10-overrides/01-override-types.md` — `performance_budget_override` type).

## A.4 Core Web Vitals targets (locked)

- **LCP** under 2 seconds where possible (under 2.5s strict ceiling)
- **INP** under 200ms
- **CLS** under 0.05
- **TTFB** monitored by country (Cloudflare Web Analytics + Sentry RUM)
- **Landing pages must be the strictest** — same targets but tested against ad-network traffic profile (typically slower mobile networks)

## A.5 JavaScript control

| Rule | Status |
|---|---|
| Avoid heavy JS on landing pages | 🟢 Locked |
| AI chat lazy loaded | 🟢 Locked |
| Compare / Finder / Reach Calculator / Fit-My-Car loaded on user interaction | 🟢 Locked |
| Pixels reviewed before activation (per A.6) | 🟢 Locked |
| Custom scripts restricted to super_admin + audited | 🟢 Locked |

## A.6 Script Weight Governance

Every analytics/tracking script must be registered in `script_inventory` with:

| Field | Description |
|---|---|
| `script_name` | E.g., "Meta Pixel", "TikTok Pixel" |
| `source` | URL of the script |
| `business_owner` | **Marketing Manager** — owns business justification + activation need |
| `security_reviewer` | **Security Lead** — approves risk/security |
| `active_pages` | Where the script runs (homepage, landing, all) |
| `size_kb` | Compressed wire size |
| `performance_impact` | LCP delta in ms (measured) |
| `last_review_date` | Quarterly review cycle |
| `approval_status` | pending / approved / paused |
| `can_disable` | Whether marketing can pause without re-approval |

### Joint review ownership (🟢 locked 2026-05-07)

Script inventory follows a **dual-ownership model**: every script row has both a Marketing Manager (business owner) and a Security Lead (security reviewer). Approval requires **both**:

| Role | Responsibility |
|---|---|
| **Security Lead** | Approves risk/security: CSP impact, sandboxing requirement, third-party data exposure, supply-chain risk, exfiltration vector review. Has veto right on security grounds. |
| **Marketing Manager** | Owns business justification + activation need: campaign attribution requirement, ROAS measurement need, audience pixel requirement, business value vs performance cost. Has veto right on business grounds. |

A script row enters `approval_status='approved'` only when both reviewers have signed off in the same quarterly review cycle. Either reviewer can flip status back to `'paused'` unilaterally; reactivation requires both again.

**Schema columns:** `script_inventory.security_reviewer_user_id` + `script_inventory.business_owner_user_id` (per `01-database/02-tables-by-module.md` Module 23). Both required NOT NULL on any active row.

**Quarterly review cycle:** scripts unreviewed for 90+ days flagged via alert (per `07-alerts.md` §H.2.1). Re-review requires both reviewers' fresh sign-off. Marketing Manager cannot self-approve; Security Lead cannot self-approve.

**Custom scripts (super_admin only) sandboxed in a Cloudflare Worker; CSP enforced.** Custom-script approval requires Security Lead lead-review (not just sign-off) plus Marketing Manager business case plus Super Admin final authorization (3-party approval).

**Required Script Weight Report** covers:

- Meta Pixel
- TikTok Pixel
- Snapchat Pixel
- Google Ads
- GTM
- LinkedIn Insight
- Chat widgets (Cloudflare Turnstile, etc.)
- WhatsApp widget
- Any custom script

**Hard rules:**

- Scripts above performance impact threshold (e.g., LCP +100ms) must justify presence (joint Security Lead + Marketing Manager re-review).
- Scripts unreviewed for 90+ days flagged for re-approval; both Security Lead + Marketing Manager must sign off in the same cycle.
- Custom scripts (super_admin only) sandboxed in a Cloudflare Worker; CSP enforced; approval requires Security Lead lead-review + Marketing Manager business case + Super Admin final authorization (3-party sign-off).
- Either reviewer can pause a script unilaterally; reactivation requires both sign-offs again.
