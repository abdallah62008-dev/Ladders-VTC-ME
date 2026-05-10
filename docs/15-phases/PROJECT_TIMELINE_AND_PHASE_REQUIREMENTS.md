# Smart Ladders Commerce Platform
# Project Timeline & Phase Requirements

**Primary domain:** `ladders.vtc-me.com`
**Document purpose:** This file organizes the project timeline, phase-by-phase requirements, dependencies, deliverables, and acceptance criteria.
**Status:** Planning reference document. No implementation code.
**Prepared for:** Claude Code / Project Management / Phase Planning
**Last updated:** 2026-05-07

---

## 1. Executive Timeline Summary

This project should be managed as a staged platform build, not as one large uncontrolled implementation.

The recommended execution model:

| Stage | Main Goal | Estimated Duration | Output |
|---|---|---:|---|
| Phase 0 | Planning, documentation, decisions, approvals | 3 weeks | Approved documentation and Phase 1 readiness |
| Phase 1 | Foundation MVP for KSA | 4 weeks | Basic platform scaffold, country/warehouse/product foundation |
| Phase 2 | Commerce Core | 4 weeks | Cart, draft orders, checkout, stock reservation, COD flow |
| Phase 3 | AI Chat MVP + Auto Reply | 5 weeks | Website AI assistant, state machine, handoff, reply engine |
| Phase 4 | Customer Messaging / WhatsApp Retention | 3 weeks | WhatsApp confirmation, satisfaction, review request |
| Phase 5 | Marketers + Coupons + Profit Guardrails | 5 weeks | Marketer tiers, coupons, payouts, guardrails |
| Phase 6 | Landing Pages + Smart Buying Tools | 4 weeks | Group pages, fast landing pages, Ladder Finder, comparison |
| Phase 7 | Payments + Finance Expansion | 4 weeks | Stripe/local gateways, refunds, invoices, deposits |
| Phase 8 | Multi-country + B2B | 5 weeks | Egypt/Iraq expansion, B2B quote flow |
| Phase 9 | Operations + Maintenance/Warranty | 4 weeks | Packing, delivery failure, warranty, service tickets |
| Phase 10 | Intelligence + Advanced Reporting | Ongoing | Dashboards, AI daily brief, data quality, report builder |

**Estimated controlled build duration:** 10–14 months for full system maturity.
**Soft launch target:** KSA + core product experience + AI chat MVP after approximately 12 weeks, if Phase 0 is completed correctly.

---

## 2. High-Level Gantt-Style View

| Month | Main Focus |
|---|---|
| Month 1 | Phase 0 + Phase 1 start |
| Month 2 | Phase 1 completion + Phase 2 |
| Month 3 | Phase 3 AI Chat MVP + Auto Reply |
| Month 4 | Phase 4 Customer Messaging + Phase 5 start |
| Month 5 | Phase 5 Marketers/Coupons/Profit Guardrails |
| Month 6 | Phase 6 Landing Pages + Smart Tools |
| Month 7 | Phase 7 Payment Expansion |
| Month 8 | Phase 8 Egypt/Iraq + B2B |
| Month 9 | Phase 9 Operations + Maintenance |
| Month 10+ | Phase 10 Intelligence, optimization, reporting, scaling |

---

## 3. Phase 0 — Planning, Decisions, and Documentation

### Duration

**3 weeks**

### Objective

Convert the approved Master Plan into complete implementation-ready documentation.

### Scope

- Architecture decisions.
- Final stack decision.
- Database schema design on paper.
- RBAC/RLS plan.
- AI architecture.
- WhatsApp architecture.
- Payment architecture.
- Reporting and dashboard definitions.
- Backup/restore policy.
- Import/export policy.
- Manual override policy.
- Admin and public site wireframes.
- Phase 1 prompt and acceptance criteria.

### Explicit Exclusions

- No application code.
- No database tables created.
- No migrations.
- No package installs.
- No production secrets.
- No live payments.
- No Directus collection creation.
- No frontend/backend UI build.

### Key Requirements

| Requirement | Details |
|---|---|
| Domain confirmed | `ladders.vtc-me.com` |
| Documentation folder | `/docs` exists and is organized |
| Decision tracker | All open decisions tracked |
| Phase 1 blockers | Must be answered before implementation |
| ADRs | Major architecture decisions documented |
| Schema | Database model documented only |
| RBAC/RLS | Cost privacy and roles documented |
| External applications | WhatsApp/payment/provider applications submitted if possible |

### People / Roles Needed

| Role | Need |
|---|---|
| Project Owner | Business decisions and final approval |
| CTO / Technical Lead | Architecture decisions |
| DBA / Backend Lead | Database schema and RLS |
| Security Lead | Cost privacy, secrets, backup |
| AI Lead | AI assistant and guardrails |
| Ops Lead | Warehouses, WhatsApp, logistics |
| Finance Lead | Costs, margins, payment decisions |
| Marketing Lead | Marketer system, campaigns, SEO |
| Designer | Wireframes and UI structure |
| Arabic Copywriter | KSA-native content planning |

### Key Deliverables

- `/docs/00-architecture`
- `/docs/01-database`
- `/docs/03-rbac`
- `/docs/04-ai`
- `/docs/05-payments`
- `/docs/06-whatsapp`
- `/docs/07-reporting`
- `/docs/08-backups`
- `/docs/09-import-export`
- `/docs/10-overrides`
- `/docs/11-admin-ui`
- `/docs/12-public-site`
- `/docs/15-phases`
- Phase 1 execution prompt.

### Acceptance Criteria

| Criteria | Status Required |
|---|---|
| All critical Phase 1 blockers answered | Yes |
| Domain updated in docs | Yes |
| Stack selected | Yes |
| Secrets manager selected | Yes |
| Backup destination selected | Yes |
| `cost.read` roles decided | Yes |
| KSA SKU list decided | Yes |
| KSA warehouse plan decided | Yes |
| WhatsApp number plan decided | Yes |
| Margin floors decided | Yes |
| Phase 1 prompt approved | Yes |

---

## 4. Phase 1 — Foundation MVP for Saudi Arabia

### Duration

**4 weeks**

### Objective

Build the technical foundation for the KSA MVP.

### Scope

- Next.js scaffold.
- Locale routing for 6 locales.
- RTL/LTR base.
- Country model.
- Warehouse model.
- Product/variant model.
- Country pricing.
- Warehouse stock.
- RLS/cost privacy foundation.
- Directus/admin foundation.
- Homepage, PLP, PDP.
- Basic WhatsApp CTA.
- Basic media handling.
- Basic SEO.
- Daily backup.
- CI and quality gates.
- **Country Access Control — RBAC extension schema + spine** (per D-CSP-001/002/003/004 🟢 Answered 2026-05-09; `03-rbac/03-scopes.md`):
  - `user_country_access` table reserved as canonical source of truth (migration 0002).
  - `user.country_scope` jsonb preserved as denormalized read cache (existing column unchanged).
  - Cache-sync trigger reserved (activation Phase 1 sprint 2).
  - 6 new permission slugs added: `country_scope.all`, `country_access.read`, `country_access.write`, `country_access.audit.read`, `report.cross_country.read`, `export.cross_country`.
  - Default `country_scope.all` grants seeded for super_admin, finance_admin, read_only_auditor, developer_api_admin.
  - Country denormalization columns added per D-CSP-004: `audit_log.entity_country_id`; `country_id_snapshot` on order_line / order_event / payment_transaction / refund; `country_id` on cart_line / cart_event / recommendation_warning_log.
  - Drift-mitigation triggers asserting parent country match on insert/update.
  - RLS policy template applied to every country-scoped table.
  - **CI grep test** for `country_scope_mode` declaration on every admin route file (🛑 Phase 1 blocker per D-CSP-002).
  - **`X-Country-Context` API header convention** active (per `02-api/01-conventions.md`).
  - **Admin top-bar Country Context Switcher scaffold** (read-only — uses cached jsonb).
  - 9 new audit log event types + 3 new alert sub-categories under `business`.
- **Shipping & Logistics — configurable provider system schema reservation** (per D-OPS-010 🟢 Answered 2026-05-09; `20-shipping-logistics/01-overview.md`):
  - Module 16 extension: 7 new tables reserved (`shipping_provider`, `shipping_method`, `shipping_rate_card`, `shipping_zone`, `shipping_rule`, `shipment`, `shipment_event`).
  - **NO hardcoded couriers / cities / fees / SLAs in code** — CI grep test rejects.
  - KSA J&T Express seeded as draft provider in migration 0012 (D-OPS-003 🟢 Answered); manual mode initially (no API).
  - Operations / Shipping admin section structure wired with read-only stubs for 8 sub-pages.
  - 16 new shipping permission slugs in `role_permission` CSV.
  - Audit log triggers active on all shipping tables.
  - Country Launch Readiness extends with 7 shipping readiness checks.
- **Strategic enhancements — schema reservations + safety guardrail integration + data ownership** (per Strategic Enhancements 2026-05-07):
  - Module 24 Decision Engine: `product_variant.suitability_scores jsonb` column reserved (no UI Phase 1).
  - Module 25 Safety & Compliance: schema reserved + AI guardrail integration ACTIVE Phase 1 (forbidden claims grep test green; AI cannot mention unapproved certs/claims); KSA `country.compliance_profile` seeded.
  - Module 26 Trust Layer: review schemas reserved (no collection Phase 1 — that's Phase 4 WhatsApp).
  - Module 27 Readiness Engine: schemas reserved; existing readiness tables continue working (Phase 6 refactor).
  - Data Ownership Matrix CSV exists at `03-rbac/matrix/data-ownership-matrix.csv` — required before role_permission migration 0002.
  - Promotion Checklist at `15-phases/promotion-checklist.md` enforced as CI gate from Phase 1 sprint 1.
  - Staging Safety Rules documented in `00-architecture/environment-topology.md` and enforced.
  - `cost_read_log` table reserved (strengthens D-RBAC-001).
  - Cross-cutting columns: `variant_country_cost.landed_cost_components jsonb`, `media_asset.version`, `customer.phone_normalized` (E.164 dedup), `product_batch.recall_flag` + `incident_count`.
  - 6 runbook stubs under `/docs/18-runbooks/`.
- **Performance budgets enforced via CI** (per `19-performance-growth/01-performance-engineering.md` §A.3): PDP ≤1.8 MB / Lighthouse ≥90 mobile; product LP ≤1.2 MB / Lighthouse ≥95 (when shipped Phase 6).
- **Core Web Vitals monitoring** (per §A.4): LCP <2s; INP <200ms; CLS <0.05.
- **Image variants pipeline live** (per §B.2): 6 variants per asset (Hero Desktop/Mobile, Product Card, Thumbnail, OG, WhatsApp preview); AVIF + WebP + JPG fallback ladder.
- **Basic alerts skeleton** (per §H): Performance + Database + Backup alert categories with Critical SLA wiring; Alerts Center read-only in admin.
- **Retention rules documented + cleanup framework** (per §F.2–F.4): 13-row retention table seeded; safe cleanup workflow + `cleanup_job` table reserved (jobs auto-run from Phase 10).

### Key Requirements

| Requirement | Details |
|---|---|
| Primary market | Saudi Arabia |
| Languages active | `ar-sa`, `en-sa` |
| Placeholder locales | `ar-eg`, `en-eg`, `ar-iq`, `en-iq` |
| Products | **10 SKUs locked in `LAUNCH_CATALOG.md`, available in all 3 launch countries (KSA, EG, IQ).** Hero SKU for Phase 1 = `VTC-TEL-OS-4.4M` (telescopic 4.4m). Other 9 SKUs progressively brought live across Phases 2–8. |
| Domain | `ladders.vtc-me.com` |
| Cost privacy | `actual_product_cost` visible only to Super Admin + Finance Admin |
| Dynamic countries | Adding a new country must not require schema changes |
| Dynamic warehouses | Warehouse linked to country/city |
| Dynamic pricing | Price by variant + country |
| Dynamic stock | Quantity by variant + warehouse |

### Deliverables

| Deliverable | Description |
|---|---|
| Project scaffold | Next.js + TypeScript + Tailwind + shadcn/ui |
| Locale routing | 6 locale paths |
| Database migration | Catalog, country, warehouse, stock, cost tables |
| RLS tests | Cost privacy enforced |
| Directus setup | Admin foundation |
| Homepage | Basic KSA Arabic and English |
| PLP | Product listing |
| PDP | Product detail page |
| WhatsApp CTA | KSA number button |
| Audit log | Price/cost/stock changes logged |
| Backup | Daily Postgres backup with checksum |
| Lighthouse | Mobile PDP ≥90 |
| Visual regression | RTL/LTR baseline |

### Dependencies

- Phase 0 completed.
- Stack finalized.
- Hosting environment ready.
- Secrets manager selected.
- KSA WhatsApp number ready or temporary placeholder approved.
- Product media available or placeholder allowed for staging.
- First product data ready.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Homepage works | `ar-sa` and `en-sa` |
| PDP works | `ar-sa` and `en-sa` |
| RLS cost test | Non-finance returns 0 rows |
| Country dynamism test | 4th country added as data only |
| Audit log test | Price/cost/stock changes logged |
| Backup test | Daily backup + checksum |
| Performance | Lighthouse mobile ≥90 on PDP |

---

## 4b. Phase 2 — Country Access Control checkout integration (D-CSP-001)

- **Checkout + order list functional country filter.** Cart and order operations read active country from `X-Country-Context` header; data restricted to user's allowed countries. RLS enforces at DB layer.
- **Order list admin page** filters orders by `customer_orders.country_id` matching active country selector.

---

## 4a. Phase 2 — Shipping integration (D-OPS-010)

(per Strategic Enhancements 2026-05-09; integrated into Phase 2 Commerce Core scope)

- **Checkout reads `shipping_method` + `shipping_rate_card` + `shipping_rule`** for fee calculation + delivery promise display per cart (country, city, weight, dimensions).
- **Manual shipment mode for J&T** until API integration lands Phase 9 (admin records label + tracking number after physical pickup).
- **`shipment` row created on order confirmation** with status `pending_pickup`; joins to `customer_orders.id` + provider + method + tracking number.
- **Provider priority + fallback rules applied** at fee-calculation time; if primary has no city coverage, fallback provider used per `shipping_rule` config.
- **Shipping cost simulator** in admin (Operations + Finance) for "what-if" pricing scenarios.

---

## 5. Phase 2 — Commerce Core

### Duration

**4 weeks**

### Objective

Enable real customer order flow.

### Scope

- Cart.
- Draft orders.
- Checkout foundation.
- COD flow.
- WhatsApp order flow.
- Customer records.
- Stock reservation.
- Order attribution basics.
- Payment provider abstraction stub.

### Key Requirements

| Requirement | Details |
|---|---|
| Cart by country | Cart cannot mix countries |
| Stock reservation | Reserve stock during checkout/WhatsApp confirmation |
| COD support | KSA initial, expand later |
| Draft orders | Created from website or WhatsApp |
| Order confirmation | Explicit confirmation required |
| Customer model | Name, phone, city, address |
| Attribution | Basic source/UTM/WhatsApp tracking |

### Deliverables

| Deliverable | Description |
|---|---|
| Cart | Add/remove/update items |
| Checkout | Customer and address collection |
| Draft order | Before confirmation |
| Order statuses | Pending, confirmed, cancelled, etc. |
| Stock reservation | TTL release |
| COD flow | Confirmation before shipping |
| Basic attribution | Source/campaign/WhatsApp |

### Dependencies

- Phase 1 schema and product foundation.
- Warehouse stock model.
- Country pricing.
- KSA shipping/COD rules.
- WhatsApp number.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Add to cart | Works with country pricing |
| Checkout | Creates draft order |
| Stock reservation | Prevents overselling |
| TTL release | Releases stock if not confirmed |
| COD flow | Works end-to-end |
| Confirmation required | No confirmed order without explicit confirmation |

---

## 6. Phase 3 — AI Chat MVP + Auto Reply

### Duration

**5 weeks**

### Objective

Launch the first AI sales assistant and auto-reply rule engine.

### Scope

- Website chat.
- Conversation state machine.
- AI provider abstraction.
- Product recommendation tools.
- Inventory-aware AI.
- Human handoff.
- Auto reply templates.
- Reply rules.
- Testing sandbox.
- AI logs.

### Key Requirements

| Requirement | Details |
|---|---|
| AI facts | Must come from database/tools |
| No hallucination | AI cannot invent price/stock/certifications |
| Inventory-aware | AI does not recommend unavailable products |
| Handoff | Required for low confidence and sensitive cases |
| Draft order from chat | AI can create draft order |
| Explicit confirmation | AI must ask customer to confirm |
| Auto-reply sandbox | Test before activation |

### Deliverables

| Deliverable | Description |
|---|---|
| AI widget | Website chat |
| State machine | Conversation states |
| Tools | Search, product, stock, shipping, draft order |
| Guardrails | Prompt injection, refusal, factual constraints |
| Handoff inbox | Human takeover |
| Auto-reply module | Templates and rules |
| AI logs | Tool calls, confidence, state |

### Dependencies

- Product data.
- FAQ corpus.
- Shipping/payment rules.
- Conversation schema.
- AI budget.
- Provider selection.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| AI recommendation | Works with product data |
| Out-of-stock test | Suggests alternative |
| Draft order | Created from chat |
| Handoff | Appears in admin |
| 200 conversation audit | Zero fabricated specs |
| Auto-reply sandbox | Works before activation |

---

## 7. Phase 4 — Customer Messaging and WhatsApp Retention

### Duration

**3 weeks**

### Objective

Use WhatsApp for order confirmation, satisfaction, review collection, and future retention.

### Scope

- WhatsApp order confirmation.
- Message logs.
- Confirmation statuses.
- Satisfaction surveys.
- Review requests.
- Bad rating creates service ticket.
- Opt-out basics.
- Frequency caps.
- Quiet hours.
- Message templates.

### Key Requirements

| Requirement | Details |
|---|---|
| Transactional vs marketing | Must be separated |
| Opt-out | Required |
| Consent | Required for marketing |
| Bad rating | Creates service ticket |
| Complaint suppression | Stop marketing while complaint open |
| Country/language templates | Different by country and language |

### Deliverables

| Deliverable | Description |
|---|---|
| Confirmation flow | WhatsApp confirmation |
| Satisfaction flow | 1–5 rating |
| Review flow | Ask permission to publish |
| Message logs | Sent/read/replied/failed |
| Opt-out | Arabic and English keywords |
| Template management | Country/language templates |

### Dependencies

- WhatsApp API approval.
- Meta templates.
- Customer/order data.
- Service ticket schema.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Confirmation status | Updates from WhatsApp reply |
| No reply handling | Follow-up/reminder |
| Satisfaction survey | Sent after delivery |
| Bad rating | Creates ticket |
| Opt-out | Prevents marketing |
| Message logs | Fully stored |

---

## 8. Phase 5 — Marketers, Coupons, and Profit Guardrails

### Duration

**5 weeks**

### Objective

Launch marketer management, coupon logic, attribution, payouts, and profit protection.

### Scope

- Marketer accounts.
- Tiers.
- Referral links.
- Coupons.
- Marketer costs.
- Marketer prices.
- Payouts.
- Quality score.
- Fraud detection.
- Profit guardrails.
- Price simulator.
- Campaign profit forecasting.
- Override module.

### Key Requirements

| Requirement | Details |
|---|---|
| Actual cost hidden | Never visible to marketer |
| Marketer cost separate | Can differ from actual cost |
| Profit formula | Marketer and business profit snapshotted |
| Coupons checked | Guardrails before activation |
| Attribution | Coupon/referral/campaign source |
| Payout approval | Finance-controlled |
| Override reason | Required for exceptions |

### Deliverables

| Deliverable | Description |
|---|---|
| Marketer dashboard | Own sales/profit/links |
| Admin marketer module | Manage tiers/costs/payouts |
| Coupons | Rules and limits |
| Attribution | Links, coupons, UTM |
| Profit guardrails | Blocks unsafe campaigns |
| Payout flow | Pending/approved/paid |
| Fraud flags | Risky marketer patterns |

### Dependencies

- Phase 2 order model.
- Phase 4 messaging optional.
- Finance margin decisions.
- Payout policy.
- Marketer agreement rules.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Marketer link | Tracks order |
| Coupon | Applies with guardrails |
| Profit snapshot | Stored on order |
| Marketer dashboard | No actual cost shown |
| Payout | Requires approval |
| Override | Requires reason and audit |

---

## 8a. Phase 4 — Strategic enhancements layered in

(per Strategic Enhancements 2026-05-07; integrated into existing Phase 4 customer messaging scope)

- **Trust Layer collection** (D-TRUST-001): Review request via WhatsApp post-delivery (5–7 days after delivered status). Template `review_request_with_photo_ar/_en` (Meta approval needed). AI moderation auto-flags safety mentions → routes to Module 25.
- **Warranty registration via WhatsApp** (proposal #5 partial): Phase 4 collects warranty registration via WhatsApp template post-delivery; full UI Phase 9.
- **WhatsApp shipment status updates** (D-OPS-010 Phase 4 piece): Templates approved for `shipment_picked_up_ar/_en`, `shipment_in_transit_ar/_en`, `shipment_out_for_delivery_ar/_en`, `shipment_delivered_ar/_en`, `shipment_failed_delivery_ar/_en`; customer confirmation flow when out-for-delivery.
- **Country Access Control — WhatsApp + Customer Messaging country scoping** (D-CSP-001 Phase 4 piece): Conversation list filtered by `conversation.country_id IN user_country_access`. WhatsApp number/template isolation per country (no cross-country sends). Customer Messaging broadcasts target a country; multi-country broadcast requires `country_scope.all`. AI guardrails enforce no cross-country price/stock/promise mixing per `04-ai/05-guardrails.md`.

---

## 9. Phase 6 — Landing Pages and Smart Buying Tools

### Duration

**4 weeks**

### Objective

Increase conversion using group sales pages, fast landing pages, and selection tools.

### Scope

- Group sales pages.
- Fast landing pages.
- Campaign landing pages.
- Marketer landing pages.
- Landing page builder.
- A/B testing basics.
- Ladder Finder.
- Reach Calculator.
- Fit My Car.
- Product comparison.
- Pixel events.
- **Growth & Performance admin module live** (per `19-performance-growth/03-landing-pages.md` §C.4): Product/Category/Campaign/Marketer/City/Problem/B2B Pages + Landing Page Builder + A/B Tests + Landing Page Analytics + Script Inventory.
- **Pre-Publish Quality Gate** (per §D.1): 16 checks with hard-block on Critical fail; AI-generated copy always lands as `pending_review`.
- **Landing Page Score 0–100** (per §D.2): badge visible in landing page list; 90–100 Ready, <60 Do Not Publish.
- **AI Landing Page Draft Assistant** (per §D.5): human approval required before publish; cannot bypass quality/compliance/profit/inventory guardrails.
- **Smart CTA Engine** (per §D.10): 6 visitor contexts.
- **Adaptive Landing Pages** (per §D.9): country/city/source/device/visitor/marketer/campaign-aware content.
- **Static Landing Page Snapshots** (per §E.3): build at publish time; 30-day rollback retention.
- **Profit Guardrail + Inventory Guardrail** (per §D.7–D.8): blocks at publish time; override with reason ≥30 chars.
- **Script Inventory + Script Weight Governance** (per §A.6): `script_inventory` rows for Meta Pixel, TikTok, Snap, Google Ads, GTM, LinkedIn Insight, chat widgets, WhatsApp; quarterly review cycle.
- **Decision & Recommendation Engine functional build** (D-DEC-001): `recommendation_rule`, `recommendation_event`, `recommendation_warning_log`, `recommendation_use_case` populate; `recommendation.evaluate` AI tool integrated; warning layer surfaces on PDP + checkout + chat; Ladder Finder UX rebuilt as customer-facing surface of the engine.
- **Safety & Compliance admin UI** (D-SAFE-001): Admin screens for Safety Guidelines, Approved Safety Claims, Certificates, Pending Approvals, Incident Reports, Compliance Profiles. Pre-Publish Compliance Check enforced for all landing pages.
- **Trust Layer surface rendering** (D-TRUST-001): PDP / PLP / Landing Pages render approved reviews + verified-purchase badge + customer photos with publish-permission. Phase 4 collection feeds Phase 6 surfaces.
- **Campaign Profit Gate** (proposal #13 unified): Single function library called by landing-page publish + coupon activate + marketer campaign launch + paid-ad campaign + WhatsApp broadcast. Reuses existing Profit Guardrails (D-PAY-002/003) + new override types from D-PERF-003 (`landing_profit_guardrail_override`, `campaign_loss`).
- **Out-of-Stock CTA Catalogue** (suggestion C): 4 modes × 6 locales = 24 standard CTA blocks (waitlist / lead-collect / redirect-to-alternative / preorder).
- **Marketer Quality × Margin joint dashboard** (suggestion E): Joint score per marketer combining `marketer_quality_score` + average margin contribution.
- **Translation Feedback** (suggestion J): Small in-product capture for customer flagging of poor wording.

### Key Requirements

| Requirement | Details |
|---|---|
| Fast pages | Minimal JS, mobile-first |
| Group pages | Not generic category pages |
| Marketer pages | Attribution and coupon |
| A/B tests | Server-side split |
| Smart tools | Help choose correct ladder |
| SEO support | FAQ/schema/internal links |

### Deliverables

| Deliverable | Description |
|---|---|
| Group pages | Telescopic/Home/Villa/Contractor |
| Landing builder | Template-based |
| Campaign pages | Product/offer pages |
| Ladder Finder | Smart recommendation |
| Reach Calculator | Suggested height |
| Fit My Car | Folded size logic |
| Comparison | Products vs customer need |
| Pixels | Events fired |

### Dependencies

- Product data.
- Media.
- Copywriting.
- Marketer module.
- Pixel integration plan.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| 4 group pages | Render correctly |
| Landing pages | Fast/mobile-first |
| Ladder Finder | Completion >40% |
| A/B test | 50/50 distribution |
| Pixel events | Logged |
| SEO schema | Valid |

---

## 10. Phase 7 — Payments and Finance Expansion

### Duration

**4 weeks**

### Objective

Enable online payments, payment links, deposits, refunds, and invoices.

### Scope

- Stripe.
- Local payment gateways.
- Payment provider abstraction.
- Payment links.
- Deposits.
- Partial payments.
- Refunds.
- Disputes.
- Invoices.
- Payment routing.
- Payment risk score.

### Key Requirements

| Requirement | Details |
|---|---|
| Stripe supported | But not hardcoded only |
| Local gateways | Per country |
| Webhooks | Signature verified |
| Idempotency | Required |
| Refunds | Approval flow |
| Payment links | For WhatsApp/B2B |
| Deposits | High-risk COD or B2B |

### Deliverables

| Deliverable | Description |
|---|---|
| Payment abstraction | Provider interface |
| Stripe integration | Checkout/Payment Intents |
| Local adapters | According to approvals |
| Refund module | Full/partial |
| Payment links | Secure expiring links |
| Invoices | Customer and B2B |
| Webhook logs | Retry and audit |

### Dependencies

- Payment provider approvals.
- Finance rules.
- Legal/tax requirements.
- Phase 2 order flow.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Payment success | Updates order |
| Failed payment | Logged and handled |
| Refund | Full/partial works |
| Webhook | Signature verified |
| Payment link | Works for draft/order |
| Invoice | Generated |

---

## 11. Phase 8 — Multi-Country Expansion and B2B

### Duration

**5 weeks**

### Objective

Expand from KSA to Egypt and Iraq, and add B2B quote management.

### Scope

- Egypt country launch.
- Iraq country launch.
- Country launch readiness.
- Country-specific pricing/stock/payment/shipping.
- Country-specific AI tone.
- Country WhatsApp numbers.
- B2B accounts.
- RFQ.
- Quote PDFs.
- Price agreements.
- Sales rep follow-up.

### Key Requirements

| Requirement | Details |
|---|---|
| Country dynamic | No schema/code changes for new country |
| Country readiness | Blocks incomplete launch |
| Separate stock | By country/warehouse |
| Separate prices | By country |
| Separate WhatsApp | Per country |
| B2B flow | Formal quote process |

### Deliverables

| Deliverable | Description |
|---|---|
| Egypt launch config | Country, currency, pricing, stock |
| Iraq launch config | Country, currency, pricing, stock |
| Country readiness | Checklist |
| B2B RFQ | Quote request |
| Quote PDF | Generated |
| Price agreements | B2B pricing |
| Sales rep follow-up | Pipeline |

### Dependencies

- Country settings.
- Warehouses.
- Payment/shipping partners.
- Copywriting per country.
- WhatsApp numbers.
- B2B policy.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Add country | Data only |
| Country launch | Blocked if incomplete |
| AI tone | Differs per country |
| B2B quote | PDF generated |
| Country pricing | Correct currency |
| Stock | Correct warehouse source |

---

## 12. Phase 9 — Operations, Maintenance, and Warranty

### Duration

**4 weeks**

### Objective

Strengthen fulfillment, service, and after-sales operations.

### Scope

- Packing checklist.
- Pre-dispatch photo proof.
- Courier performance.
- Delivery failure recovery.
- Return-to-stock.
- Service tickets.
- Fault reports.
- Warranty claims.
- Replacement/repair.
- Serial numbers.
- Product batches.
- Service analytics.

### Key Requirements

| Requirement | Details |
|---|---|
| Packing proof | Prevent wrong item claims |
| Pre-dispatch photo | Required before shipping |
| Courier analytics | Delivery failure/cost |
| Warranty tickets | Track issues |
| Serial/batch | Identify defective batches |
| AI service handoff | Complaint creates ticket |

### Deliverables

| Deliverable | Description |
|---|---|
| Packing module | Checklist |
| Photo proof | Before dispatch |
| Courier dashboard | Performance |
| Return inspection | Sellable/damaged/repair |
| Service tickets | Fault/warranty |
| Serial tracking | Unit-level |
| Batch analytics | Defect rate |

### Dependencies

- Order/shipping flow.
- Warehouse process.
- Warranty policy.
- Staff roles.
- Service team.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Ship without photo | Blocked |
| Service ticket | Created from admin/chat |
| Warranty claim | Full workflow |
| Batch alert | Fires on threshold |
| Courier dashboard | Shows performance |
| Return-to-stock | Requires inspection |

---

## 13. Phase 10 — Intelligence, Reporting, and Optimization

### Duration

**Ongoing**

### Objective

Build management intelligence, reporting, automation, and advanced optimization.

### Scope

- Executive dashboard.
- Command Center.
- Finance dashboard.
- Marketing dashboard.
- Marketer dashboard.
- Warehouse dashboard.
- AI dashboard.
- SEO dashboard.
- Data Quality Center.
- Report Builder.
- AI Daily Business Brief.
- Smart Notification Center.
- Decision Log.
- Experimentation Log.
- **Strategic enhancements — Phase 10 deliverables** (per Strategic Enhancements 2026-05-07):
  - **Decision Engine AI-assisted scoring** (D-DEC-001 enhancement): rule-based score augmented by AI for nuanced edge cases; drift detection between rule and AI surfaces in Recommendation Engine Disagreement runbook.
  - **Recommendation Acceptance Rate dashboard**: % conversions from recommended SKU vs alternative + customer override rate.
  - **Wrong-Ladder Save Rate dashboard**: drop-off rate after warning issued (KPI for warning effectiveness).
  - **Compliance Profile drift dashboard**: country-level compliance posture vs jurisdictional changes.
  - **Cross-jurisdiction safety claim coverage report**: which approved claims valid in which countries.
  - **Trust Layer Coverage report**: % products with reviews / photos / videos / warranties.
  - **Offer Intelligence ML augmentation** (proposal #12): rule-based scaffolding from Phase 5/6 augmented with conversion-margin-return predictive model.
  - **True Net Profit reporting full formula** (proposal #9): all 5 profit levels (Gross / Contribution / Marketing Net / Marketer Net / True Net) populated; materialized view per country.
  - **AI Conversation Drift Detection** (suggestion F): weekly batch report comparing AI recommendation distribution vs expected; alert if drift > threshold.
  - **Readiness Engine unified dashboard** (D-READY-001 build): single admin page rolling up country / product / landing page / campaign / operational readiness with drill-down to `readiness_check_run` results.
  - **Cost-Read Audit Logging dashboard** (suggestion D): "who read what cost when" report; insider-abuse deterrence; only Super Admin + Security Lead can view.
  - **Customer Risk Score** (suggestion B; Phase 7 origin, Phase 10 ML): RFM + fake-address + COD-default risk scoring per customer.
  - **Returns Outcome Tracking** (suggestion A; Phase 9 collection, Phase 10 reporting): defective / wrong-size / customer-changed-mind / damage-in-transit / fraud breakdown by SKU/batch/country.
- **Auto Image Quality Scanner** (per `19-performance-growth/02-image-video.md` §B.4): nightly job flagging oversized/missing-alt/duplicate/wrong-dim/unused/low-quality/wrong-branding images; output to `media_quality_issue` surfaced in Data Quality Center.
- **Cleanup automation full** (per §F.3): all 14 scheduled cleanup jobs running; Cleanup Preview Reports + history; Sensitive cleanup approval workflow live.
- **Database partitioning** (per §G.2): 8 candidate tables partitioned at 50M-rows / 50GB threshold (`message_log`, `ai_tool_call`, `webhook_log`, `pixel_event_log`, `audit_log`, `order_event`, `customer_journey_event`, `event`).
- **Summary tables auto-refresh** (per §G.3): 8 daily/hourly summary tables (`daily_sales_summary`, `daily_country_summary`, `daily_product_summary`, `daily_marketer_summary`, `daily_campaign_summary`, `daily_ai_summary`, `daily_warehouse_summary`, `daily_landing_page_summary`) powering all dashboards.
- **3 new materialized views** (per §G.4): `mv_landing_page_performance` (hourly), `mv_script_weight_impact` (daily), `mv_cleanup_history` (weekly).
- **Performance Incident System** (per §H.6): auto-incident creation when Lighthouse drops below threshold; assigned to Media Manager / DBA / Marketing Manager by category.
- **Page Performance History** (per §H.7): `landing_page_performance_history` table tracks current/best/worst score + regression detection.
- **Revenue Impact of Slowness reports** (per §H.8): conversion-loss estimates from page-speed regressions surfaced in Marketing Dashboard.
- **Slow Query Business Impact reports** (per §H.9): joins `pg_stat_statements` to affected feature/page + suggested optimization.
- **Feature Flag admin UI** (per §I): manage 16+ flags with country/locale/role/percentage/time-window/rollback controls.
- **Database Health Dashboard** (per §G.1): single-pane view for DBA + Infra + Super Admin.
- **Alerts Center full alerting flow** (per §H): all 8 alert categories live; 5 severity levels enforced; Critical SLA escalation; multi-channel notifications (WhatsApp + email + dashboard banner).

### Key Requirements

| Requirement | Details |
|---|---|
| Reports role-based | Cost hidden from non-finance |
| Export supported | CSV/XLSX/PDF |
| Dashboards filtered | Country/date/product/campaign |
| Data quality | Detect missing price/stock/SEO |
| AI brief | Based on real data only |
| Notifications | Role/country scoped |

### Deliverables

| Deliverable | Description |
|---|---|
| Executive dashboard | Owner view |
| Command Center | Live operations |
| Finance reports | Profit/cost/payment |
| Marketing reports | ROAS/CAC/campaigns |
| AI reports | Conversations/conversion |
| Data Quality Center | Issue detection |
| Report Builder | Custom reports |
| AI Daily Brief | Daily advisory summary |

### Dependencies

- Enough historical data.
- Reporting schema.
- Dashboards metrics definitions.
- Role permissions.

### Acceptance Criteria

| Criteria | Target |
|---|---|
| Executive dashboard | Accurate live KPIs |
| Data Quality Center | Detects core issue types |
| Report export | CSV/XLSX/PDF |
| AI Daily Brief | Generated daily |
| Notifications | Routed correctly |
| Cost reports | Restricted |

---

## 14. Phase Requirements Matrix

| Phase | Must Have Before Start | Main Output | Must Not Start Without |
|---|---|---|---|
| Phase 0 | Approved master plan | Documentation and decisions | Project owner approval |
| Phase 1 | Phase 0 complete | KSA foundation MVP | Stack, domain, SKU list, RLS plan |
| Phase 2 | Product/country/warehouse foundation | Order and checkout core | Stock/pricing/country model |
| Phase 3 | Product/order data | AI chat and auto reply | FAQ, AI budget, guardrails |
| Phase 4 | WhatsApp approval | Confirmation and retention | Message templates and opt-out |
| Phase 5 | Order and attribution data | Marketers/coupons/profit | Margin floors and payout rules |
| Phase 6 | Product/media/copy | Landing pages and tools | Photos, copy, pixel plan |
| Phase 7 | Payment approvals | Online payments and refunds | Provider accounts and finance policy |
| Phase 8 | Multi-country configuration | Egypt/Iraq + B2B | Country readiness inputs |
| Phase 9 | Operations process | Service/warranty workflows | Shipping and warehouse procedures |
| Phase 10 | Operational data | Advanced dashboards | Stable data sources |

---

## 15. Resource Needs by Phase

| Phase | Business | Design | Engineering | Ops | Finance | Marketing |
|---|---|---|---|---|---|---|
| Phase 0 | High | Medium | Medium | High | High | Medium |
| Phase 1 | Medium | High | High | Medium | Medium | Medium |
| Phase 2 | Medium | Medium | High | High | Medium | Low |
| Phase 3 | Medium | Medium | High | Medium | Low | Medium |
| Phase 4 | Medium | Low | Medium | High | Low | Medium |
| Phase 5 | High | Low | High | Medium | High | High |
| Phase 6 | Medium | High | High | Medium | Medium | High |
| Phase 7 | High | Low | High | Medium | High | Medium |
| Phase 8 | High | Medium | High | High | High | High |
| Phase 9 | Medium | Low | Medium | High | Medium | Low |
| Phase 10 | High | Medium | High | High | High | High |

---

## 16. Critical Dependencies

| Dependency | Needed By | Why |
|---|---|---|
| ~~KSA SKU list~~ Launch catalog (10 SKUs × 3 countries) | Phase 1 + Phase 8 | Product pages, photography, warehouse setup — 🟢 **CONFIRMED** in `LAUNCH_CATALOG.md` |
| Real product photos | Phase 1/6 | PDPs and landing pages — sized for 10 SKUs |
| Arabic copywriter | Phase 1/6 | Native Arabic product and SEO copy across 6 locales |
| WhatsApp API | Phase 3/4 | AI/WhatsApp order and retention |
| KSA WhatsApp number | Phase 1/4 | CTA and confirmation |
| Egypt + Iraq WhatsApp numbers | Phase 8 | Per-country WhatsApp button + confirmation flow |
| Payment providers | Phase 7 | Online payments |
| ~~Secrets manager~~ Secrets manager locked | Phase 1 | 🟢 **CONFIRMED 2026-05-07 (D-BKP-001)**: 1Password Secrets Automation. 7-vault structure (`vtc-prod-payment` / `vtc-prod-whatsapp` / `vtc-prod-ai` / `vtc-prod-infra` / `vtc-prod-backup-keys` / `vtc-staging` / `vtc-dev`). Hardware MFA mandatory on super-vault holders. See ADR-022. |
| ~~Backup destination~~ Backup destinations locked | Phase 1 | 🟢 **CONFIRMED 2026-05-07 (D-BKP-002)**: Cloudflare R2 primary + Backblaze B2 offsite. Replication R2 → B2 via scheduled BullMQ worker. AES-256 at rest. See ADR-023. |
| ~~Warehouse cities~~ Launch warehouse plan | Phase 1/2 (KSA), Phase 8 (EG, IQ) | 🟢 **CONFIRMED 2026-05-07**: KSA Phase 1 = Riyadh Main (RUH-01); KSA Phase 2 = +Jeddah (JED-01); Egypt Phase 8 = Cairo (CAI-01); Iraq Phase 8 = Baghdad (BGD-01). Stock per (variant_id, warehouse_id) — dynamic. |
| ~~Margin floors per country (3)~~ Margin floors locked | Phase 1/5 | 🟢 **CONFIRMED 2026-05-07 (D-PAY-002 + D-PAY-003)**: KSA business 20% / EG 18% / IQ 22%; marketer 5% uniform. See `05-payments/14-profit-floors-and-guardrails.md`. |
| Logistics partners per country | Phase 2/9 (KSA), Phase 8 (EG, IQ) | Shipping and delivery |
| ZATCA partner | Phase 7/8 | Saudi invoices |

---

## 17. Phase Risk Summary

| Phase | Top Risk | Mitigation |
|---|---|---|
| Phase 0 | Decisions remain open | Decision tracker and owner assignment |
| Phase 1 | Architecture wrong from start | ADR and schema review before code |
| Phase 2 | Overselling stock | Reservation and DB row locks |
| Phase 3 | AI hallucination | Tool-based facts and audit tests |
| Phase 4 | WhatsApp restrictions | Early Meta approval and opt-out compliance |
| Phase 5 | Campaigns lose money | Profit guardrails and override reason |
| Phase 6 | Landing pages slow | Strict performance budgets |
| Phase 7 | Payment/webhook errors | Idempotency and signed webhooks |
| Phase 8 | Country launch incomplete | Country Launch Readiness gate |
| Phase 9 | Warranty chaos | Ticket workflow and serial/batch tracking |
| Phase 10 | Reports inaccurate | Metric definitions and single source of truth |

---

## 18. Immediate Next Actions

| Priority | Action | Owner | Target | Status |
|---|---|---|---|---|
| ~~1~~ | ~~Confirm 10 KSA SKUs~~ Confirm launch catalog (10 SKUs × 3 countries) | Product + Ops | Before Phase 1 | 🟢 **DONE 2026-05-07** — see `LAUNCH_CATALOG.md` |
| 1 | Book photography/video shoot — sized for 10 SKUs | Design + Ops | During Phase 0 | 🔴 Open |
| 2 | Contract Saudi Arabic copywriter | Content Lead | During Phase 0 | 🔴 Open |
| 3 | Submit WhatsApp Business Cloud API | Ops | Immediately | 🔴 Open |
| 4 | Procure KSA WhatsApp number | Ops | Immediately | 🔴 Open |
| ~~5~~ | ~~Confirm hosting region~~ — Hetzner Frankfurt for Phase 1 backend; AWS me-south-1 reserved as future migration option | Infra | Before Phase 1 | 🟢 **DONE 2026-05-07** — see ADR-018 |
| ~~6~~ | ~~Select secrets manager~~ — 1Password Secrets Automation, 7-vault structure | Security | Before Phase 1 | 🟢 **DONE 2026-05-07** — see ADR-022 |
| ~~7~~ | ~~Select backup destination~~ — Cloudflare R2 primary + Backblaze B2 offsite | Infra | Before Phase 1 | 🟢 **DONE 2026-05-07** — see ADR-023 |
| 5 | Finalize brand assets (logo, palette, typography pair) | Design lead + CEO | During Phase 0 | 🔴 Open — promoted to Top 10 |
| 6 | Confirm engineering team allocation per workstream | CTO | Before Phase 1 | 🔴 Open — promoted to Top 10 |
| 7 | Confirm inventory authority (Directus admin only Phase 1) | CTO + Ops | Before Phase 1 | 🔴 Open — promoted to Top 10 |
| 8 | Confirm `cost.read` roles | Finance | Before Phase 1 | 🔴 Open |
| ~~9~~ | ~~Confirm margin floors (KSA + EG + IQ)~~ — KSA 20% / EG 18% / IQ 22% business + 5% marketer uniform | Finance | Before Phase 1 | 🟢 **DONE 2026-05-07** — see `05-payments/14-profit-floors-and-guardrails.md` |
| 9 | Submit all payment provider applications (Stripe, Moyasar, Tap, Tabby, Tamara, Paymob, ZainCash) Day 1 of Phase 0 | Finance + Ops | Immediately | 🔴 Open — promoted from honorable mentions |
| ~~10~~ | ~~Confirm initial KSA warehouse(s)~~ — Riyadh Main Warehouse Phase 1; Jeddah/Cairo/Baghdad planned later | Inventory Manager | Before Phase 1 | 🟢 **DONE 2026-05-07** — see `LAUNCH_CATALOG.md` §6 |
| ~~10~~ | ~~Pick schema migration tool~~ — `node-pg-migrate` (SQL-first; ORM-free; explicit RLS / triggers / views) | DBA | Before Phase 1 | 🟢 **DONE 2026-05-07** — see ADR-027 |
| 10 | Resolve `order` reserved-word collision (rename to `customer_order` or quote `"order"` consistently) | DBA + Backend lead | Before Phase 1 migration 0008 | 🔴 Open — promoted to Top 10 |

---

## 19. Claude Code Instruction to Add This File

Use this prompt if you want Claude Code to add this file to the project documentation:

```txt
Create the following documentation file:

/docs/15-phases/PROJECT_TIMELINE_AND_PHASE_REQUIREMENTS.md

ALLOW Claude Code to read, inspect, analyze, create, edit, and save documentation files only inside /docs.

Use the content of the provided Project Timeline & Phase Requirements document.

Restrictions:
- Do not write application code.
- Do not create database tables.
- Do not run migrations.
- Do not install packages.
- Do not touch .env or secrets.
- Do not modify files outside /docs.
- Add a short CHANGELOG entry noting the creation of the timeline document.

At the end, report:
- file created
- changelog updated
- any remaining timeline-related TODOs
```

---

## 20. Final Recommendation

Do not start Phase 1 until:

1. The decision tracker has no Critical Phase 1 blockers.
2. The 10 KSA SKUs are confirmed.
3. Hosting, secrets, backups, and cost privacy decisions are answered.
4. KSA product data, media, and first warehouse plan are ready.
5. Phase 1 acceptance criteria are approved.

The project is large. The correct way to win is not speed alone.
The correct way is controlled execution, phase gates, and no hidden assumptions.
