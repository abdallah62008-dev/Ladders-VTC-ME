# Landing Page Growth System & Advanced Landing Page Intelligence

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001); functional UI Phase 6
**Owner:** Marketing Manager + Frontend Lead + AI Lead
**Source:** Master Plan v4 §22, §28; D-DEC-001 (Decision Engine); D-SAFE-001 (Safety claims)

> Sections C + D of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

# C. Landing Page Growth System

## C.1 Product Landing Pages

Every SKU supports **dedicated landing pages per country and locale** for paid traffic and high-intent campaigns.

URL examples:
```
/ar-sa/lp/telescopic-ladder-4-4m
/ar-eg/lp/telescopic-ladder-4-4m
/ar-iq/lp/telescopic-ladder-4-4m
/en-sa/lp/telescopic-ladder-4-4m
```

Each product landing page row in `landing_page` includes:

| Field | Notes |
|---|---|
| `country_id` | Country scope |
| `locale` | Language scope |
| `product_id` / `variant_id` | The featured SKU |
| `campaign_id` | Marketing campaign (Phase 6) |
| `marketer_id` | Attribution (Phase 5) |
| `coupon_id` | Optional active coupon |
| `pixel_overrides` | Per-page pixel config (jsonb) |
| `ab_variants` | Sibling rows in `landing_page_variant` |
| `whatsapp_cta` | Whether to surface WhatsApp button |
| `direct_buy_cta` | Whether to surface Add-to-Cart |
| `seo_title` | Meta title |
| `meta_description` | Meta description |
| `og_image_id` | OpenGraph image |
| `performance_budget` | Override of class default (rare) |
| `status` | draft / pending_review / active / archived |
| `owner_user_id` | Who maintains it |
| `review_date` | Next quarterly review |

## C.2 Product Landing Page Sections (reusable structure)

Standard 15-section template:

1. **Hero section** — headline + 8-word value prop + primary CTA
2. **Product image / video** — folded form proof shot or unfolding video
3. **Problem solved** — pain statement in customer's voice
4. **Main benefits** — 3–4 bullet icons + headlines
5. **Suitable for / Not suitable for** — honest framing
6. **Key specifications** — height, max load, folded length, weight, material, certification
7. **Comparison block** — vs. 2–3 alternatives (diff-highlighted)
8. **Fit-in-car / storage block** — folded dimensions vs. car-trunk visual
9. **Warranty and trust block** — warranty card + cert badges (real only)
10. **Delivery and payment block** — country-aware promise + payment-method icons
11. **FAQ** — 4–6 entries (FAQPage schema)
12. **Reviews / social proof** — verified-purchase only, with city
13. **WhatsApp CTA** — sticky + inline
14. **Buy-now CTA** — sticky bottom on mobile
15. **Final urgency / trust CTA** — close with last-chance copy (real urgency only — no fake countdowns)

## C.3 Category Landing Pages

Major categories/groups support dedicated landing pages:

- Telescopic One Side Ladders
- Telescopic Double Sides Ladders
- Multipurpose Ladders
- Home Step Ladders
- Villa Ladders
- Contractor Ladders
- Warehouse Ladders
- B2B Ladders

Each category landing page includes:
- Category hero
- Who it's for (2–3 personas)
- Best products (top 3 per country availability)
- Comparison table
- Ladder Finder CTA
- FAQ
- SEO copy (400–600 words native Arabic per locale)
- WhatsApp CTA
- Direct buy CTA
- Country-specific pricing (live from `variant_country_price`)
- Active product availability (live from `v_variant_country_availability`)
- Tracking events (PageView, ViewContent, etc.)

## C.4 Landing Page Builder (admin module)

New admin section: **Growth & Performance**

```
Growth & Performance
  ├── Landing Pages
  ├── Product Landing Pages
  ├── Category Landing Pages
  ├── Campaign Pages
  ├── Marketer Pages
  ├── City Pages
  ├── Problem Pages
  ├── B2B Pages
  ├── Landing Page Builder
  ├── A/B Tests
  ├── Landing Page Analytics
  ├── Script Inventory                ← Phase 6+
  ├── Performance Budgets             ← Phase 1+
  └── Page Performance History
```

Admin (per RBAC permissions in [`09-permissions-and-safety-rules.md`](./09-permissions-and-safety-rules.md)) can:
- Create landing page from template
- Select product / variant / category
- Select country + language
- Select campaign + marketer + coupon
- Assign pixels
- Choose CTA text and goal
- Preview (desktop + mobile)
- Run pre-publish quality gate (per D.1)
- Publish / unpublish
- Archive
- Duplicate
- A/B test (per `landing_page_variant` + `ab_test`)

---

# D. Advanced Landing Page Intelligence

## D.0 Build Now, Activate When Ready (🟢 D-READY-002 locked 2026-05-09)

Per the cross-platform operating principle (see `../GLOSSARY.md` + `../27-readiness-engine/01-unified-readiness.md`):

Landing pages may exist in `draft` or `pending_review` status indefinitely. They cannot publish (`status='active'`) until **all** of the following pass:

- D.1 Pre-Publish Quality Gate (16 checks)
- A.3 Performance budget enforcement (per `01-performance-engineering.md`)
- D.7 Profit guardrail
- D.8 Inventory guardrail
- D.6 Compliance check (no unsupported claims; no fake certificates per Module 25)
- Required media optimized + uploaded with alt translations

**Backend rejects** customer-facing storefront queries that would return `status != 'active'` landing page rows. **No silent fallback** — if a campaign URL points to an inactive landing page, the storefront shows an explicit "page unavailable" message, not a degraded version.

Override path: `landing_quality_gate_override` (per `../10-overrides/01-override-types.md`) — Super Admin OR Marketing Manager; reason ≥30 chars; auto-expiry 7d.

## D.1 Pre-Publish Quality Gate

Before publishing any landing page, the system runs these checks:

| Check | Severity | Block? |
|---|---|---|
| SEO title exists | 🔴 Critical | Block |
| Meta description exists | 🔴 Critical | Block |
| H1 exists | 🔴 Critical | Block |
| Product has active price for selected country | 🔴 Critical | Block |
| Product has active stock for selected country/warehouse (or marked waitlist) | 🔴 Critical | Block (override per D.8) |
| WhatsApp CTA works | 🔴 Critical | Block |
| Direct buy CTA works | 🔴 Critical | Block |
| Images optimized (per `02-image-video.md` B.2 sizes + AVIF/WebP) | 🟠 High | Approval required |
| Page speed passes budget (per `01-performance-engineering.md` A.3) | 🟠 High | Approval required |
| Pixel events configured | 🟠 High | Approval required |
| No missing translation for selected locale | 🟠 High | Approval required |
| No unsupported claims (per D.6) | 🔴 Critical | Block |
| No fake certificate claims (per D.6) | 🔴 Critical | Block |
| No expired coupon | 🔴 Critical | Block |
| Margin guardrail passes (per D.7) | 🔴 Critical | Block (override per D.7) |
| Stock guardrail passes (per D.8) | 🟠 High | Block or warn (config) |

**Hard block on Critical fail.** Approval-required on High fail. Override (per `10-overrides/`) bypasses with audit trail + reason ≥30 chars.

## D.2 Landing Page Score (0–100)

Composite score updated whenever the page or its dependencies change:

| Component | Weight |
|---|---|
| Speed / performance (Lighthouse mobile) | 20 |
| CTA clarity (heuristic + click model) | 10 |
| Image quality (per `02-image-video.md` B.4 scanner) | 10 |
| SEO completeness | 15 |
| Product availability | 10 |
| Trust / warranty block present | 5 |
| FAQ block present + non-empty | 5 |
| Pixel tracking active | 5 |
| Mobile layout passes | 10 |
| Conversion readiness (working CTAs, real urgency) | 10 |

**Status thresholds:**
- **90–100 Ready** ✅
- **75–89 Needs Review** 🟠
- **60–74 Weak** 🟠
- **Below 60 Do Not Publish** 🔴

Surfaced in Landing Page list with badge.

## D.3 Product Page Readiness Score

Per (product, country) — gates the **product** itself for storefront visibility:

| Field | Status |
|---|---|
| Country price exists | ✅ / ❌ |
| Warehouse stock available | ✅ / ❌ |
| Product images (≥3 variants) | ✅ / ❌ |
| Product video | ✅ / ⚠️ |
| Arabic copy complete | ✅ / ❌ |
| English copy complete | ✅ / ❌ |
| SEO fields complete | ✅ / ❌ |
| AI knowledge entries seeded | ✅ / ⚠️ |
| FAQ block | ✅ / ⚠️ |
| Warranty text | ✅ / ❌ |
| Delivery promise per country | ✅ / ❌ |

This drives `product_country_readiness` (already in schema per `01-database/02-tables-by-module.md` §5.7). Statuses: `not_configured | missing_price | missing_stock | missing_content | missing_media | ready | active | disabled`.

## D.4 Landing Page Blocks Library

Reusable block types in the Landing Page Builder:

| Block | Use |
|---|---|
| Hero Block | Headline + subhead + primary CTA |
| Problem Block | Pain framing |
| Benefits Block | 3–4 bullets with icons |
| Comparison Block | Table comparing this SKU to alternatives |
| Product Specs Block | Spec table |
| Trust Block | Reviews / cert badges |
| Warranty Block | Warranty card + claim process |
| Delivery Block | Country-aware promise + payment icons |
| FAQ Block | Accordion with FAQPage schema |
| Review Block | Verified-purchase reviews |
| WhatsApp CTA Block | Templated WhatsApp message preview |
| Video Block | Lazy-loaded video player |
| Offer Block | Coupon / sale banner |
| B2B CTA Block | Quote-request form trigger |

Each block has its own React component, content schema, and per-block performance budget (e.g., Video Block must lazy-load).

## D.5 AI Landing Page Draft Assistant

Admin can request an AI draft via a button on the Landing Page Builder.

Example prompt input:
> "Create a landing page for VTC-TEL-OS-4.4M for Saudi villa owners from Snapchat traffic."

AI suggests:
- Headline (in Arabic per locale tone)
- Section order (which blocks)
- FAQ entries
- CTA text variants
- Required images
- SEO keywords
- WhatsApp message template

**Hard rules:**
- AI output is **draft only**.
- **Human approval required before publishing** (gated by `landing_page.publish` permission).
- AI cannot publish a page directly; only `pending_review` status until approved.
- AI cannot bypass D.1 quality gate, D.6 compliance check, D.7 profit guardrail, or D.8 inventory guardrail.

## D.6 Landing Page Compliance Check

Pre-publish content scan looks for:

| Forbidden | Why |
|---|---|
| False safety claims (e.g., "100% accident-proof") | Legal + ethical risk |
| Fake certificate claims (ISO/CE/EN-131 if not in product_certification) | Regulatory + customer trust |
| Unsupported "best in market" claims | Competition law in some jurisdictions |
| Wrong price (mismatch with `variant_country_price`) | Customer dispute risk |
| Expired coupon | Customer disappointment + dispute |
| Wrong WhatsApp number (mismatch with `country.whatsapp_number`) | Lead leakage |
| Out-of-country product availability claim | Operations failure |
| Misleading delivery promise (faster than `lead_time_days`) | Disputes + complaints |

Output: per-cell findings shown to author; block on critical issues.

## D.7 Landing Page Profit Guardrail

Page cannot publish if offer/coupon/price violates the profit floors per `05-payments/14-profit-floors-and-guardrails.md` (KSA 20% / EG 18% / IQ 22% business; 5% marketer uniform — initial defaults, configurable).

**Override:** Manual Override with Reason (per `10-overrides/01-override-types.md` `landing_profit_guardrail_override` type) — Super Admin or Finance Admin approval, reason ≥30 chars, audit logged.

## D.8 Landing Page Inventory Guardrail

Page warns or blocks if stock is too low.

Example warning:
> "Product VTC-TEL-OS-4.4M has only 3 units in RUH-01.  
> Suggested actions:  
> • Pause page  
> • Switch to waitlist  
> • Route traffic to alternative product (VTC-TEL-OS-3.8M, 47 units)  
> • Require approval to continue campaign"

Configurable thresholds per (variant, country):
- Soft warning: `qty_available_total ≤ low_stock_threshold × 2`
- Hard block (configurable): `qty_available_total = 0` AND no inbound

Override path: marketing manager + super admin dual-approval to keep page live with explicit "out-of-stock CTA" mode (collect leads / waitlist).

## D.9 Adaptive Landing Pages (Phase 6+)

Page content adapts based on:

- Country (locale, currency, payment methods)
- City (delivery promise, warehouse routing)
- Traffic source (UTM source/medium/campaign)
- Device (mobile-first prioritization)
- Returning visitor (skip greeting block, surface "your last viewed product")
- Marketer source (apply marketer's coupon automatically)
- Campaign (apply campaign-level coupon)
- Previous product viewed (cross-sell module)

Implemented via cookie + `customer_intelligence` (per Master Plan v4 §24) read at request time.

## D.10 Smart CTA Engine

CTA text and behavior change based on context:

| Visitor context | CTA text |
|---|---|
| First visitor | "Find the right ladder" → Ladder Finder |
| Returning visitor | "Order now on WhatsApp" → WhatsApp deep-link |
| Low stock detected | "Reserve before stock ends" → reservation flow |
| Marketer campaign | "Use coupon `<code>`" → cart with coupon applied |
| B2B visitor (UA / referrer / cookie) | "Request a quotation" → B2B quote form |
| Customer with abandoned cart | "Continue your order" → resume cart |

## D.11 Campaign-Specific Variants

Examples for hero SKU `VTC-TEL-OS-4.4M`:

```
/ar-sa/lp/4-4m-villa
/ar-sa/lp/4-4m-maintenance
/ar-sa/lp/4-4m-contractor
/ar-sa/lp/4-4m-car-fit
```

Each variant tunes hero, FAQ, comparison block, and CTA messaging to the campaign angle.

## D.12 Objection-Based Landing Pages

Examples:

- Is a telescopic ladder safe?
- Which ladder fits in a car?
- Best ladder height for villa?
- Telescopic vs normal ladder?
- Can the ladder hold 150 kg?

These pages double as SEO landing pages (per `12-public-site/05-seo-page-types.md`).

## D.13 Buyer Persona Landing Pages

Examples:

- Ladders for villa owners
- Ladders for contractors
- Ladders for technicians
- Ladders for warehouses
- Ladders for home use

## D.14 City + Product Landing Pages

Examples:

- Telescopic ladder in Riyadh
- Home ladder in Jeddah
- Villa ladder in Cairo
- Ladders in Baghdad

City + product matrix generates many programmatic-SEO pages; only those with reasonable demand get built.
