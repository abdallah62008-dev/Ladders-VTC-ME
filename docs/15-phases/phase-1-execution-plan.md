# Phase 1 Execution Plan — Foundation MVP (KSA)

**Status:** Draft (becomes active when Phase 0 closes)
**Owner:** PM + CTO
**Duration:** 4 weeks
**Source:** Master Plan v4 §24, Phase 0 §22 acceptance

---

## Goal

Prove the hardest technical decisions on a real surface: locale routing, RTL/LTR, dynamic country/warehouse/pricing/stock schema with RLS-enforced cost privacy, daily backups, and one product live in `ar-sa` + `en-sa`.

## Scope (locked)

1. Next.js 15 App Router + TypeScript + Tailwind v4 + shadcn/ui scaffold.
2. pnpm workspace, ESLint + Prettier, GitHub Actions CI.
3. Locale routing for 6 locales via `next-intl` (placeholders for non-KSA).
4. RTL/LTR design system validated on 3 reference screens; visual regression in CI.
5. PostgreSQL schema migrated via **`node-pg-migrate`** (per ADR-027, D-INFRA-004 🟢) for catalog + customer + cost + country + warehouse modules with **RLS policies enforced**. All migrations follow the locked rules in `01-database/05-migration-plan.md`: explicit SQL DDL in `/migrations/sql/`, rollback section where safe, RLS + audit triggers ship as migration files, **no migration runs without explicit approval**. **Per D-DB-001 🟢 Answered 2026-05-07:** main orders table is `customer_orders` (plural) — NOT `order` and NOT quoted `"order"`. CI grep test rejects either pattern. Child tables retain `order_*` prefix where standardized. **Per D-DB-002 🟢 Answered 2026-05-07:** ALL UUID primary keys default to `gen_random_uuid()` from `pgcrypto` (enabled in migration 0001); `uuid_generate_v4()` and `uuid-ossp` extension are forbidden; CI grep test rejects either pattern. **Per D-DB-003 🟢 Answered 2026-05-07:** ALL monetary columns use `numeric(12,2)` (homogeneous across SAR/EGP/IQD); display rounding via `country.price_rounding_pattern` + `currency.decimals`; payment provider minor-unit conversions in adapter layer only (per `05-payments/02-provider-abstraction.md` §"Money & Minor Units"); `float`/`double precision`/`real`/`money`/non-`(12,2)` numeric forbidden on monetary columns; CI grep test rejects forbidden types.
6. Directus deployed on **Hetzner Frankfurt** (per ADR-018, D-INFRA-001 🟢 Answered 2026-05-07; AWS me-south-1 reserved as future migration option), schema introspected.
7. Cloudflare CDN in front; R2 wired for media.
8. One product fully entered (ar-sa + en-sa) with images, video, certifications, country pricing for KSA, warehouse stock at **Riyadh Main Warehouse (`RUH-01`)** — the locked Phase 1 warehouse per `LAUNCH_CATALOG.md` §6.
9. Homepage, PLP, PDP rendering correctly in `ar-sa` and `en-sa`.
10. WhatsApp "Order Now" button on PDP linking to KSA WhatsApp number.
11. System → Countries admin functional (add/edit/activate/deactivate).
12. Operations → Warehouses admin functional.
13. Product → Country Pricing & Stock tab functional with Profit Guardrails **soft warnings** (hard enforcement lands Phase 5).
14. Audit log triggers active on price/cost/stock changes.
15. **Daily Postgres backup running with checksum verification.**
16. Lighthouse mobile ≥ 90 on PDP; visual regression CI green in both directions.
17. RLS test in CI: non-finance role returns 0 rows on `actual_cost` SELECT.
18. Country dynamism test in CI: adding a 4th country requires zero code changes.

## Out of scope

- Checkout (Phase 2)
- Cart logic beyond data model (Phase 2)
- AI chat (Phase 3)
- Multi-country (Phase 7+)
- B2B (Phase 8)
- Maintenance/warranty (Phase 9)
- Most of the override module UI (Phase 5; schema reserved Phase 1)
- Most of the import/export UI (Phase 2; schema reserved Phase 1)

## Sprint breakdown

### Sprint 1 (week 1)
- Repo + CI + scaffold
- Locale routing 6 locales
- RTL/LTR tokens
- Reference screens validated

### Sprint 2 (week 2)
- Postgres migrations 0001–0011
- RLS policies + CI tests passing
- Directus deployed and introspecting

### Sprint 3 (week 3)
- Catalog admin (translations, variants, images, certs)
- 1 product entered fully ar-sa + en-sa
- Homepage / PLP / PDP rendering ar-sa
- Cloudflare in front

### Sprint 4 (week 4)
- en-sa rendering validated
- Lighthouse mobile ≥ 90
- WhatsApp button live
- System → Countries + Operations → Warehouses + Country Pricing & Stock tab functional
- Audit log triggers + Smart Notification skeletons
- Daily backup running and verified
- Phase 1 demo to stakeholders

## Acceptance criteria

See `phase-1-acceptance.md`.

## Risks Phase 1 must manage

- RLS edge cases (P0-11)
- RTL bugs in third-party libs (#12)
- Migration ordering data loss (#30)
- Backup not restorable (#46)
- Bulk import wipes data (#41) — schema reserved; UI not built yet, low risk in Phase 1
- AI hallucination (#1) — n/a Phase 1; no AI yet

## Dependencies on Phase 0

- All ADRs accepted.
- Schema design complete in `01-database/02-tables-by-module.md`.
- RLS policies designed in `03-rls-policies.md`.
- Backup destination provisioned.
- Encryption key generated and escrowed.
- WhatsApp KSA number verified (for the button).
- Photography of hero SKU `VTC-TEL-OS-4.4M` complete (full shot set).
- Arabic copywriter delivered first product copy for `VTC-TEL-OS-4.4M` in `ar-sa` + `en-sa`.

## Launch catalog reference

The hero SKU for Phase 1 storefront is **`VTC-TEL-OS-4.4M` (Telescopic One Side 4.4m)**, selected from the 10-SKU launch catalog locked in `LAUNCH_CATALOG.md`. The other 9 SKUs are seeded as draft catalog rows in Phase 1 migration 0012 but ship to storefront progressively in Phase 2+.

Schema seed (per migration 0012) creates:
- 10 `product` rows + 10 `product_variant` rows
- 30 `variant_country_price` rows (10 SKUs × 3 countries: KSA active=true with real prices; EG + IQ rows present with active=false until Phase 8 readiness passes)
- KSA `variant_country_cost` rows for all 10 SKUs (Finance fills)
- 1 `warehouse` row: `RUH-01` (Riyadh Main Warehouse, KSA, type=`main`, active=true)
- 10 `variant_warehouse_stock` rows at RUH-01 — hero SKU `qty_on_hand > 0`; other 9 SKUs `qty_on_hand = 0` initially (brought live in Phase 2 as physical stock arrives)

## Strategic Enhancements — Phase 1 schema-reservation tasks (added 2026-05-07)

> Per D-DEC-001 / D-SAFE-001 / D-TRUST-001 / D-READY-001 / D-OWN-001 — Phase 1 absorbs **schema reservations + AI guardrail integration + documentation only**. Functional UI builds in later phases per `15-phases/PROJECT_TIMELINE_AND_PHASE_REQUIREMENTS.md`.

### Schema reservations (added to existing migrations 0001–0013)

- [ ] **Module 24 (Decision Engine):** `product_variant.suitability_scores jsonb DEFAULT '{}'::jsonb` column added in migration 0004 (catalog).
- [ ] **Module 25 (Safety & Compliance):** `safety_guideline`, `safety_claim`, `safety_claim_approval`, `safety_incident_report` tables reserved as empty schemas in migration 0010 (system primitives reserved-from-day-1). KSA `country.compliance_profile jsonb` populated via migration 0012 (seed).
- [ ] **Module 26 (Trust Layer):** `customer_review`, `customer_review_media`, `customer_review_approval_log` tables reserved in migration 0010.
- [ ] **Module 27 (Readiness Engine):** `readiness_check_definition`, `readiness_check_run`, `readiness_blocker`, `deploy_log` tables reserved in migration 0010.
- [ ] **Cross-cutting columns:** `variant_country_cost.landed_cost_components jsonb` (migration 0005); `media_asset.version int` (migration 0010); `customer.phone_normalized text UNIQUE` + E.164 trigger (migration 0007); `product_batch.recall_flag bool` + `incident_count int` (migration 0010); `cost_read_log` table (migration 0002, with RLS policy on read access).

### Permission cache layer (D-CACHE-001 — lands Phase 1)

- [ ] **Phase 1 sprint 1:** implement Redis cache key structure (`permcache:user:{user_id}:session:{session_id}`) + serialization (compact bitmap or jsonb).
- [ ] **Phase 1 sprint 1:** wire pub/sub invalidation event handlers for all 7 triggers (role change, permission change, user_country_access change, country_scope.all grant/revoke, user deactivation, session logout, time-limited grant expiry).
- [ ] **Phase 1 sprint 1:** cache-fallback fast path on cache miss (DB query → re-cache result).
- [ ] **Phase 1 sprint 2:** integration tests for all 7 invalidation triggers.
- [ ] **Phase 1 sprint 4:** cache invalidation timing test (revoke user access; verify next request from that user fails within 60 seconds).
- [ ] **Hard rule:** RLS remains authoritative at DB layer regardless of cache state. Cache is application-layer optimization only. Sensitive actions (cost reads / override approvals / `restore.production` / `country_scope.all` grants / `sensitive_cleanup_override`) bypass cache and query DB directly.

### cost_read_log instrumentation deferred to Phase 2 (locked 2026-05-09)

- [ ] **Phase 1:** reserve `cost_read_log` schema/table only (skeleton in migration 0010).
- [ ] **Phase 1:** document table purpose + retention rules + RLS policy in `01-database/02-tables-by-module.md`.
- [ ] **Phase 1:** `cost_read_log.read` permission slug exists (Super Admin + Security Lead only).
- [ ] **Phase 1:** **NO instrumentation** of cost-bearing endpoints. Phase 1 cost privacy is enforced via RLS + API serialization + UI hiding + export restrictions + audit on writes (existing).
- [ ] **Phase 2:** mandatory instrumentation of cost-bearing endpoints. Every API endpoint that returns actual cost values writes a `cost_read_log` row at request time (actor, role, entity_type, entity_id, ip, user_agent, context, redacted_flag).
- [ ] **Phase 2:** integration test: every cost-bearing endpoint writes exactly one `cost_read_log` row per request.

### Country Access Control schema reservations (D-CSP-001/002/003/004 — lands Phase 1)

- [ ] **`user_country_access` table reserved** in migration 0002 (RBAC + audit module) per spec in `03-rbac/03-scopes.md` §C. Indexes + UNIQUE constraint included.
- [ ] **Cache-sync trigger** authored as function in migration 0011; activation in sprint 2.
- [ ] **`country_scope.all` + 5 other permission slugs** seeded in migration 0002 `role_permission` rows for super_admin, finance_admin, read_only_auditor, developer_api_admin.
- [ ] **Country denormalization columns** added per D-CSP-004:
  - `audit_log.entity_country_id` (migration 0002)
  - `cart_line.country_id`, `cart_event.country_id` (migration 0008)
  - `order_line.country_id_snapshot`, `order_event.country_id_snapshot` (migration 0008)
  - `payment_transaction.country_id_snapshot`, `refund.country_id_snapshot` (migration 0010 — payments module reservation)
  - `recommendation_warning_log.country_id` (migration 0010 — Module 24 reservation)
- [ ] **Drift-mitigation triggers** asserting parent country match (migration 0011 triggers + functions).
- [ ] **RLS policy template** applied to every country-scoped table (migration 0011 — extends existing RLS file).
- [ ] **CI grep test** for `country_scope_mode` declaration on every admin route file (Phase 1 sprint 1).
- [ ] **API middleware** validates `X-Country-Context` header per endpoint class (`scoped` / `aware` / `global`); 400 / 403 behavior matrix per `02-api/01-conventions.md`.
- [ ] **Admin top-bar Country Context Switcher** scaffold wired (read-only — uses cached jsonb from `user.country_scope`).
- [ ] **Audit log instrumentation** for 9 new event types: `user_country_access.granted/revoked/modified`, `country_scope.all.granted/revoked`, `cross_country_export`, `cross_country_report_run`, `denied_cross_country_access_attempt`, `country_scoped_sensitive_data_edit`.
- [ ] **Alert sub-categories** wired under existing `business` category per `03-rbac/03-scopes.md` §J.

### Shipping & Logistics schema reservations (D-OPS-010 — lands Phase 1; D-OPS-003 KSA = J&T Express)

- [ ] **7 new tables reserved** in migration 0010: `shipping_provider`, `shipping_method`, `shipping_rate_card`, `shipping_zone`, `shipping_rule`, `shipment`, `shipment_event` (per `20-shipping-logistics/01-overview.md` §B).
- [ ] **Audit triggers** attached to provider/method/rate/rule tables (per `01-database/07-triggers.md` pattern).
- [ ] **CI grep tests** for forbidden hardcoded couriers / cities / fees / SLAs in shipping decision code paths.
- [ ] **Migration 0012 seed** includes KSA J&T draft provider + 4 methods (standard / cod_delivery / return / manual) + initial rate card stubs for major KSA cities.
- [ ] **`role_permission` CSV** (per D-PERF-004) updated with 16 new shipping permission slugs.
- [ ] **Operations / Shipping admin section** route stubs wired Phase 1 with read-only views; full editing UI lands Phase 2.
- [ ] **KSA J&T onboarding deliverables tracked** in `20-shipping-logistics/02-ksa-jt-express-onboarding.md` (Phase 0 weeks 1–3 + Phase 1 sprints 1–3 split).

### Deletion policy enforcement (D-DB-010 — lands Phase 1)

- [ ] **Class 1 columns added** to migrations 0007 (`customer`), 0008 (`customer_orders`), 0010 (skeletons for `b2b_account`, `invoice`, `refund`, `payment_transaction`, `warranty_claim`, `service_ticket`, `product_batch`, `stock_movement`, `marketer_payout`, `approval`, `override_request`). Each gets `deleted_at` + `deleted_by` + `delete_reason` (or `archived_at` + `archived_by` + `archive_reason` where archive lifecycle applies).
- [ ] **Class 2 enforcement** — no `deleted_at` column on `audit_log`, `country_data_audit`, `cost_history`, `variant_country_cost`, `variant_marketer_cost`, `order_profit_snapshot`, `payment_log`, `safety_incident_report`. CI grep test wired (per ADR-027 CI fail rules).
- [ ] **Class 3 retention seed** — 13 retention-policy rows seeded in migration 0012 (per `19-performance-growth/...` §F.2). Cleanup-job table populated with stub rows.
- [ ] **Class 4 anonymization workflow** documented in `17-compliance/ksa-pdpl.md` + `17-compliance/consent-records.md`. UI lands Phase 4.

### AI guardrail integration (lands Phase 1 — not deferred)

- [ ] `04-ai/05-guardrails.md` rules active: Wrong-Ladder Warning Rules + Safety Claim Restrictions enforced from first AI deployment.
- [ ] CI grep test rejects forbidden safety claim phrasings (per `25-safety-compliance/02-safety-claim-policy.md`).
- [ ] Hard constraint blocks (aluminum-for-electrician, storage-mismatch, load-mismatch) defined in `recommendation_use_case` seed data.

### Documentation deliverables (already created in /docs)

- [ ] `/docs/24-decision-engine/01-overview.md`
- [ ] `/docs/25-safety-compliance/01-overview.md` + `02-safety-claim-policy.md` + `03-incident-response.md` + `04-certificates-policy.md`
- [ ] `/docs/26-trust-layer/01-overview.md`
- [ ] `/docs/27-readiness-engine/01-unified-readiness.md`
- [ ] `/docs/15-phases/promotion-checklist.md`
- [ ] `/docs/03-rbac/matrix/data-ownership-matrix.csv` + `README.md`
- [ ] 6 runbook stubs under `/docs/18-runbooks/`

### Phase 1 build scope explicitly NOT expanded

These items are **deferred** out of Phase 1 to avoid scope creep:
- Decision Engine functional UI (Phase 6)
- Safety & Compliance admin screens (Phase 6)
- Trust Layer review surfaces (Phase 6)
- Readiness Engine unified dashboard (Phase 10)
- Warranty registration UI (Phase 9)
- Landed cost component populating (Phase 8)
- Offer Intelligence (Phase 5/6 rule-based; Phase 10 ML)
- True Net Profit reporting full formula (Phase 10)

## Phase 1 Start Prerequisites

Before Phase 1 sprint 1 begins, verify ALL of the following are complete (per `phase-0-close-meeting-agenda.md` + `phase-0-close-summary.md`):

- [ ] **Phase 0 close meeting completed** with quorum (CTO + Finance Director + Ops Director + Security Lead + PM + DPO/Legal — all 6 required attendees present or delegated authority)
- [ ] **Stakeholder sign-offs recorded** in meeting minutes (5 sign-off rows per `phase-0-close-meeting-agenda.md` §E)
- [ ] **Day-1 operational actions initiated** (8 items per `phase-0-execution-plan.md` Day-1 Parallel-Track Operational Actions section: photography, copywriter, WhatsApp Cloud API, WhatsApp number, payment providers, brand assets, hosting budget, DPO designation)
- [ ] **Engineering team allocated** (D-LAUNCH-007 closed in close meeting — Frontend 2 + Backend 2 + DBA + DevOps minimum for Phase 1; AI specialist Phase 3+)
- [ ] **Phase 1 starter prompt approved** (`phase-1-prompt.md` reviewed and approved by PM + CTO)
- [ ] **Repo + tooling decisions locked** (D-INFRA-006/007/008/009/010 — all 🟢 Answered; CI pipeline 12-step spec ready)
- [ ] **No new scope added before sprint 1** — any feature surfacing in sprint planning that wasn't in Phase 0 documentation is redirected to its target later phase per `phase-0-close-summary.md` "What Phase 1 must NOT expand into" list

**Hard rule:** if any prerequisite is incomplete, sprint 1 does NOT start. Reschedule to the following week and resolve the gap. The 4-week Phase 1 capacity assumes sprint 1 begins on a clean foundation; starting sprint 1 with unclosed prerequisites pushes scope into sprint 2-3 and risks the 4-week ceiling.

## Inventory authority locked (🟢 D-COUNTRY-013 Answered 2026-05-09)

Phase 1 inventory authority = **Admin Dashboard / Directus-style admin management only.**

- The platform itself IS the inventory source of truth in Phase 1.
- Warehouse stock, product-country availability, stock adjustments, and stock reservations all managed from platform/admin dashboard.
- **No external ERP is required for Phase 1; no two-way ERP sync; no ERP dependency blocks Phase 1.**
- ERP integration deferred to Phase 10+ or until business requirements justify it.
- Future ERP integration uses provider-agnostic patterns (no hardcoded ERP provider).
- Existing n8n / WhatsApp workflows (when shipped later phases) MUST read platform inventory, not an external ERP.
- Inventory updates respect Country Access Control (D-CSP-001) + RBAC.
- CI grep test rejects ERP-provider hardcoding (`'odoo'`, `'netsuite'`, `'sap'`, `'oracle'`, `'dynamics'`) in stock-decision code paths.

Phase 1 schema reservations for stock + warehouse continue per migration 0006 (warehouses & stock); no schema changes from this lock.

## Tooling locked (🟢 D-INFRA-006/007/008/009/010 Answered 2026-05-09)

Phase 1 CI stack fully locked. Phase 1 sprint 1 wires all 5 tools into CI from Day 1.

- **Package manager: pnpm** (D-INFRA-006). `pnpm-lock.yaml` committed; CI uses `pnpm install --frozen-lockfile`; no mixed lockfiles (CI rejects PRs introducing `package-lock.json` or `yarn.lock`).
- **Linter + formatter: ESLint + Prettier** (D-INFRA-007). CI fails on lint/format errors. Biome NOT in Phase 1.
- **Test framework: Vitest + Playwright** (D-INFRA-008). Vitest for unit/integration; Playwright for E2E/browser. Both layers run in CI. Phase 1 ships foundation tests only.
- **Visual regression: Playwright snapshots** (D-INFRA-009). In-repo snapshots per Playwright conventions. Chromatic/Percy NOT in Phase 1.
- **Lighthouse CI thresholds** (D-INFRA-010). Customer mobile ≥ 90 / desktop ≥ 95; Admin mobile ≥ 85 / desktop ≥ 90; CWV: LCP < 2.0s, INP < 200ms, CLS < 0.05. CI runs on Phase 1 representative pages: homepage / PLP / PDP / dashboard / products / country pricing/stock / warehouses. Override via `performance_budget_override` (reason ≥30 chars + expiry + audit + remediation plan).
- Migration commands per ADR-027: `pnpm db:migrate create <slug>` / `pnpm db:migrate up` / `pnpm db:migrate down` / `pnpm db:migrate up --to=<ts>`.

### Phase 1 sprint 1 CI pipeline

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (ESLint) + `pnpm format:check` (Prettier)
3. `pnpm typecheck` (TypeScript)
4. `pnpm test:unit` (Vitest)
5. `pnpm test:integration` (Vitest + supertest)
6. `pnpm test:rls` (custom Postgres test runner — D-RBAC-001 cost privacy)
7. `pnpm test:e2e` (Playwright)
8. `pnpm test:visual` (Playwright snapshots)
9. `pnpm test:lighthouse` (Lighthouse CI on representative pages)
10. CI grep tests: D-PAY (no literal margin values); D-COUNTRY-014 (no hardcoded country strings); D-DB-001 (no bare `order` / `"order"`); D-DB-002 (no `uuid_generate_v4` / `uuid-ossp`); D-DB-003 (no forbidden monetary types); D-CSP-002 (every admin route declares `country_scope_mode`); D-OPS-010 (no hardcoded couriers/cities/fees); D-SAFE-001 (no forbidden safety claim phrasings); D-INFRA-006 (no `package-lock.json` / `yarn.lock`).
11. Trufflehog secret scan
12. Promotion checklist gate (per `15-phases/promotion-checklist.md`) for production-bound deploys

## TODO

- TODO: lock sprint plan after team capacity review.
- TODO: hire / assign engineers per workstream.
