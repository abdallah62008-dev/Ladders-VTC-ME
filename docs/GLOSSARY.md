# Glossary

Domain vocabulary for Smart Ladders Commerce Platform. Use these terms consistently across documentation, code (when written), and conversations.

---

## A

**ADR (Architecture Decision Record):** Lightweight document recording a single architectural decision. Stored in `00-architecture/adr/`.

**AOV (Average Order Value):** Total revenue ÷ number of orders, in a given period.

**Approval Workflow:** System primitive that gates sensitive changes through `draft → pending_approval → approved | rejected → active → archived`. See "Approval vs Override" entry below for the distinction from Override.

**Approval vs Override (🟢 clarified 2026-05-09):** Two distinct system primitives often confused. They are NOT the same:

| Aspect | **Approval** | **Override** |
|---|---|---|
| Definition | A normal review/approval for a pending business action | A controlled exception where a user bypasses or breaks a system guardrail |
| Breaks a guardrail? | No (action is permitted in principle, just needs sign-off) | **Yes** (action would otherwise be blocked) |
| Backing table | `approval` (Module 19) | `override_request` (Module 20) |
| Reason required? | Optional (depends on action) | **Mandatory** — minimum length 10 chars (or 30 chars for D-PERF-003 / Strategic Enhancement types) |
| Audit log entry? | Yes | **Yes — mandatory with frozen `context_snapshot`** |
| Auto-expiry? | No (typically) | **Yes** — per-type expiry window (6h to 30d depending on type) |
| Webhook on issue? | Optional | **Yes** — `override.requested`, `.approved`, `.rejected`, `.expired`, `.applied` |
| Server-side auto-revert on expiry? | N/A | **Yes for 5 D-PERF-003 types** (page auto-unpublishes / budget re-enforces / cleanup re-locks) |
| Dual approval? | Sometimes (per workflow rules) | Sometimes (per override type — 7 of 15 types require dual) |
| Use cases | Publishing a landing page that passes quality gate; activating a marketer; granting a refund within policy | Publishing a landing page that fails quality gate; setting a price below margin floor; running sensitive cleanup outside schedule |
| Number of types | (workflow-dependent; not enumerated as types) | **15 locked types** — see `10-overrides/01-override-types.md` |

**Quick rule of thumb:** if the action is allowed by policy but needs sign-off → **Approval**. If the action breaks a policy and needs a documented exception → **Override**.

**Cross-reference:**
- `approval` table in `01-database/02-tables-by-module.md` Module 19 (System & Audit)
- `override_request` table in `01-database/02-tables-by-module.md` Module 20 (Override Module)
- 15 override types catalogued in `10-overrides/01-override-types.md`
- Approver matrix per type in `10-overrides/03-dual-approval-rules.md`
- Anomaly detection across all 15 types in `10-overrides/05-anomaly-detection.md`
- Runbook for both flows in `10-overrides/06-override-runbook.md`
- Monthly governance review covering all 15 types in `10-overrides/07-monthly-governance-review.md`

**Auto-Reply:** A separate module from the AI agent that handles deterministic, rule-based responses. Has 6 modes: Template only, AI only, Template-first AI-fallback, AI-first template-fallback, Human only, Disabled.

**Build Now, Activate When Ready (🟢 D-READY-002 locked 2026-05-09):** Cross-platform operating principle stating that **configured ≠ active**. Modules and entities may be created in the admin dashboard early (with statuses such as `draft`, `pending_configuration`, `pending_approval`, `ready`, `paused`, `blocked`, `archived`) but **only `active + readiness_passed` items may be used customer-facing**. Activation requires all readiness, approval, configuration, safety, compliance, and business checks to pass. Manual override requires approval + reason + audit log + expiry where applicable. Applies across countries, products, country pricing, warehouse stock, shipping providers, shipping rate cards, payment providers, WhatsApp numbers, WhatsApp templates, auto replies, AI chat, landing pages, coupons, marketers, media assets, safety claims, certificates, reviews, and feature flags.

**Canonical status states** (used variably per module; principle enforced consistently regardless of which subset a module uses):

| State | Meaning | Customer-facing? |
|---|---|---|
| `draft` | Being authored; not yet submitted | ❌ |
| `pending_configuration` | Partial info entered; awaiting completion | ❌ |
| `pending_approval` | Submitted; awaiting reviewer sign-off | ❌ |
| `ready` | Passes all readiness checks; awaiting activation | ❌ (gated on manual activation) |
| `active` | Customer-facing; readiness continuously verified | ✅ |
| `paused` | Temporarily inactive; reactivatable | ❌ |
| `blocked` | Readiness regression; fix required before reactivation | ❌ |
| `archived` | Permanent retirement (Class 1 soft-delete per D-DB-010) | ❌ |

Cross-references:
- `27-readiness-engine/01-unified-readiness.md` — readiness check engine + launch gate logic
- `11-admin-ui/01-information-architecture.md` — status badge rendering + activation button rules
- `19-performance-growth/03-landing-pages.md` §D.1 — Pre-Publish Quality Gate
- `25-safety-compliance/02-safety-claim-policy.md` — claim approval workflow
- `20-shipping-logistics/01-overview.md` — provider/method/rate-card status lifecycle
- `06-whatsapp/02-templates.md` — Meta approval lifecycle

## B

**B2B Partner Tier:** Marketer tier reserved for bulk-buying business partners. Net-30 invoicing eligible.

**BNPL (Buy Now Pay Later):** Payment method (e.g., Tabby, Tamara). Mandatory display in KSA for orders over a threshold.

## C

**COD (Cash on Delivery):** Pay at delivery. Dominant payment method in Iraq, common in Egypt.

**Confidence:** AI-reported certainty of a turn (0–1). Drives handoff thresholds.

**Country Launch Readiness:** 14-point checklist (currency, tax, locale, WhatsApp, payments, shipping, warehouse, pricing, stock, auto-reply, SEO, landing pages, staff access, business hours) gating country activation.

**Country Pricing & Stock:** Per-product admin tab where pricing, costs (RLS), availability, lead time, low-stock threshold, and warehouse stock per country are managed.

## D

**Data Protection Officer (DPO) — internal designation locked 2026-05-09 (D-LAUNCH-013 🟢 Answered):** The role responsible for privacy governance across the platform, satisfying KSA PDPL + Egyptian PDPL + Iraqi data laws + consent records requirements. The internal DPO is either:
- **Legal Lead** if available (preferred — formal legal training)
- OR **Operations Director** as interim with explicit privacy responsibility + training (until legal/privacy role is formalized)

**External DPO / privacy consultant** may be added later if: customer messaging volume increases / multi-country privacy complexity grows / WhatsApp marketing automation expands / regulatory review requires external support / management decides to outsource privacy operations.

**Internal DPO responsibilities** (Phase 1+):
- Privacy governance during Phase 1 launch
- Privacy-impact decisions (PIA-equivalent reviews) for new features touching customer PII
- Customer data export approvals (per `09-import-export/01-supported-entities.md` `customer.export` permission)
- Deletion / anonymization requests handling (per D-DB-010 Class 4 anonymization workflow + `17-compliance/ksa-pdpl.md` right-to-erasure)
- Marketing consent governance (per `17-compliance/consent-records.md`)
- Cross-country PDPL compliance coordination (KSA + Egypt + Iraq)
- Liaison to regulators if subject access requests or breach notifications arise

**Important:** designation does NOT mean all privacy work is complete; it means ownership is assigned. Customer PII collection must continue to follow documented privacy rules in `17-compliance/`.

**Data Quality Center:** Dashboard detecting 16+ catalog/configuration issues (e.g., product without price, country missing payment settings).

**Decision Log:** Record of significant business decisions with rationale, expected outcome, owner, review date.

**Directus:** Headless CMS chosen for admin UI; introspects Postgres schema directly.

**Dual Approval:** Approval requirement satisfied only when two distinct user IDs from two distinct roles approve, with different IP/UA fingerprints.

## E

**ERD (Entity Relationship Diagram):** Visual representation of database schema. We use Mermaid (text in repo) and DBML (richer visuals).

**Experimentation Log:** Record of A/B tests and rollouts with hypothesis, sample size, result, decision, learnings.

## F

**Fast Landing Page:** Direct-response page with ≤80KB JS budget, single CTA goal, no global header/footer. Built via the Landing Page Builder.

**Finder (Ladder Finder):** 4-step wizard helping customers choose the right ladder.

**Freepik:** Premium-licensed stock asset source for backgrounds, lifestyle imagery, and illustrative content. **Never** for fake testimonials, fake certifications, or PDP-grade product photography.

## G

**Golden Conversation:** Scripted test conversation used in CI to detect AI regressions (50+ scenarios).

**Group Sales Page:** Per-ladder-group dedicated sales page (e.g., Telescopic, Folding, Villa). Not a category grid.

## H

**Handoff:** Transfer of an AI conversation to a human agent. Triggered by low confidence, frustration keywords, B2B intent, refund/return intent, or explicit request.

**Hreflang:** HTML attribute declaring language/region variants of a page. All 6 locales + `x-default` emitted on every page.

## I

**Inventory-Aware AI:** AI agent constraint: never recommends a SKU with `qty_available_total = 0`; suggests alternatives instead.

**ISR (Incremental Static Regeneration):** Next.js feature for static pages that refresh on schedule or tag invalidation. Used for SEO landing pages.

## L

**Landing Page Builder:** Block-based admin tool for creating fast direct-response pages with marketer attribution + A/B variants.

**LLM Provider:** Internal abstraction interface allowing swap between Anthropic Claude (default), OpenAI, Gemini, or local models per task.

## M

**Marketer Cost (`marketer_product_cost`):** Cost used to compute marketer profit. Differs from actual cost. Visible to that marketer's own row only (RLS).

**Marketer Quality Score:** Composite 0–100 metric: conversion rate vs tier average, cancellation rate, complaint rate, return rate, payment failure rate, manual penalty/bonus.

**Multi-Currency Rounding:** Per-country price rounding pattern (e.g., `..99` SAR, `..990` EGP, `..000` IQD).

## O

**Override:** Reasoned, audited, time-bounded bypass of a system safeguard. Requires written reason, approved category, and (for high-impact) dual approval.

**Override Anomaly:** Pattern alert (e.g., same actor exceeds 3 overrides per week) flagged via Smart Notification Center.

## P

**PDP (Product Detail Page):** The product detail screen on the storefront.

**PITR (Point-in-Time Recovery):** Database recovery technique using WAL (Write-Ahead Log) streaming. RPO target ≤1 hour.

**PLP (Product Listing Page):** Catalog/category listing screen on the storefront.

**Profit Guardrails:** Service that runs **before** activating a coupon, landing-page custom price, marketer cost override, bulk price adjustment, or campaign launch. Soft warning OR hard block based on configurable margin floors.

## Q

**Quiet Hours:** Per-country window (default 9pm–9am local) during which no marketing messages may be dispatched.

## R

**RLS (Row-Level Security):** Postgres feature enforcing per-row read/write access by current role. Used to isolate cost columns from non-finance roles.

**RPO (Recovery Point Objective):** Maximum tolerable data loss. Target ≤1 hour.

**RTO (Recovery Time Objective):** Maximum tolerable downtime during recovery. Target ≤4 hours for critical, ≤24 hours for non-critical.

## S

**Snapshot:** Frozen copy of financial values stored on order_line at order creation. Snapshots include selling_price, actual_cost, marketer_cost, shipping, fees, profits.

**Stock Source Priority:** Decision tree at order time selecting the source warehouse: customer city → nearest active warehouse → availability → priority → cost → speed → manual override.

## T

**Tabby / Tamara:** KSA BNPL providers. Mandatory display on PDP for orders above the threshold.

**Tier (Marketer Tier):** Starter, Silver, Gold, Platinum, VIP/Agency, B2B Partner, Affiliate Only, Internal Sales Agent.

## V

**Variant:** Specific SKU under a product (e.g., 4m height vs 5m height of the same telescopic ladder model).

## W

**Warehouse:** Physical or virtual stock location. Belongs to a country; can have many warehouses per country.

**WhatsApp Cloud API:** Meta's direct API for WhatsApp Business messaging. We use this rather than third-party resellers.

## Z

**ZATCA Phase 2:** Saudi tax authority's mandatory e-invoicing requirement (B2B and B2C).

---

*TODO: expand glossary as new terminology emerges. Owner: PM.*
