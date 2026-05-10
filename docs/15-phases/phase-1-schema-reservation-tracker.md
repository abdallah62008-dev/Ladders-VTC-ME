# Phase 1 Schema Reservation Tracker

**Status:** Active companion to `phase-1-acceptance.md`
**Owner:** DBA + Backend Lead
**Source:** Phase 0 Architecture Review 2026-05-09 (D-PHASE1-001 scope reduction)

> This file lists **schema reservations + documentation-only items** that ship in Phase 1 migrations but **do not produce functional UI** in Phase 1. They are necessary infrastructure to avoid painful future migrations.
>
> No item here is "Should Have" — these are pure schema/docs deliverables. They land in migration files and `/docs` but produce no admin screens, no API endpoints (beyond minimal stubs), and no customer-facing surface in Phase 1.
>
> **No architectural decision was changed.** All locked decisions remain in force.

---

## Module 24 — Decision & Recommendation Engine (🟢 D-DEC-001)

- [ ] `product_variant.suitability_scores jsonb DEFAULT '{}'::jsonb` column added; verified via `information_schema.columns`.
- [ ] No functional UI yet (Phase 6 build).

---

## Module 25 — Safety & Compliance Center (🟢 D-SAFE-001)

- [ ] `safety_guideline`, `safety_claim`, `safety_claim_approval`, `safety_incident_report` tables reserved as empty schemas.
- [ ] `country.compliance_profile jsonb DEFAULT '{}'::jsonb` column added.
- [ ] **KSA `compliance_profile` populated** with: return window, warranty minimum, delivery promise enforceability, consumer protection law reference, approved certificates list, forbidden claims list.
- [ ] **AI guardrail integration live** — `04-ai/05-guardrails.md` rule active: AI cannot mention safety claim without `approval_status='approved'` row OR certificate without `product_certification` approval status.
- [ ] **Forbidden claims grep test** — CI rejects landing page draft or AI prompt containing forbidden phrasings ("100% accident-proof", "lifetime guarantee", etc.).
- [ ] **No hardcoded safety claim strings** in app code — CI grep test green; allow-list permits seed data and admin claim-management UI.

---

## Module 26 — Trust Layer (🟢 D-TRUST-001)

- [ ] `customer_review`, `customer_review_media`, `customer_review_approval_log` tables reserved as empty schemas.
- [ ] No functional UI yet (Phase 4 collection; Phase 6 surface).

---

## Module 27 — Readiness Engine (🟢 D-READY-001)

- [ ] `readiness_check_definition`, `readiness_check_run`, `readiness_blocker`, `deploy_log` tables reserved as empty schemas.
- [ ] Existing `country_launch_readiness` + `product_country_readiness` continue working unchanged.
- [ ] No unified UI yet (Phase 10 build).

---

## Data Ownership Matrix (🟢 D-OWN-001)

- [ ] **`/docs/03-rbac/matrix/data-ownership-matrix.csv` exists** with at minimum 50 entity rows.
- [ ] Companion `README.md` documents column conventions.
- [ ] CI test plan documented: cross-consistency between ownership matrix + role-permission CSV (test itself runs from Phase 1 sprint 2).

---

## Cross-cutting columns (Strategic Enhancements 2026-05-07)

- [ ] `landed_cost_components jsonb` column reserved on `variant_country_cost`.
- [ ] `media_asset.version int DEFAULT 1` column added.
- [ ] `customer.phone_normalized text UNIQUE` column added; existing `customer.phone` populates `phone_normalized` via E.164 normalization trigger.
- [ ] `product_batch.recall_flag bool DEFAULT false` + `incident_count int DEFAULT 0` columns reserved.

---

## Cost-read audit logging (strengthens D-RBAC-001)

> 🟢 **Locked 2026-05-09 (Phase 0 Cleanup Step 2):** cost_read_log instrumentation moved to **Phase 2 mandatory**. Phase 1 ships schema + retention docs + permission slug only. Phase 1 cost privacy is already enforced via RLS + API serialization + UI hiding + export restrictions + audit on writes (existing); read-path logging is Phase 2.

- [ ] `cost_read_log` table reserved as Phase 1 skeleton (per `01-database/02-tables-by-module.md` Module 19 + cross-cutting columns block).
- [ ] **Retention + purpose documented** in table spec — actor, role, entity_type, entity_id, ip, user_agent, context (API endpoint / admin screen / report path), redacted_flag, read_at. 7-year retention per Class 2 deletion policy (D-DB-010 — never hard delete).
- [ ] `cost_read_log.read` permission slug exists (Super Admin + Security Lead only; never Finance Admin to avoid conflict-of-interest).
- [ ] **Phase 1 ships NO instrumentation.** Cost-bearing endpoints are not yet writing `cost_read_log` rows.
- [ ] **Phase 2 ships full instrumentation** — every API endpoint that returns actual cost values writes a `cost_read_log` row at request time. Integration test: every cost-bearing endpoint writes exactly one row per request.

---

## Country denormalization columns (per D-CSP-004)

- [ ] `audit_log.entity_country_id uuid NULL` column added.
- [ ] `order_line.country_id_snapshot uuid NOT NULL` column added (in migration 0008).
- [ ] `order_event.country_id_snapshot uuid NOT NULL` column added.
- [ ] `cart_line.country_id uuid NOT NULL` column added.
- [ ] `cart_event.country_id uuid NOT NULL` column added.
- [ ] `payment_transaction.country_id_snapshot uuid NOT NULL` column added.
- [ ] `refund.country_id_snapshot uuid NOT NULL` column added.
- [ ] `recommendation_warning_log.country_id uuid NOT NULL` column added.

---

## Module 16 Shipping extension — table skeletons (🟢 D-OPS-010)

- [ ] **Module 16 extension tables reserved** as Phase 1 skeletons in migration 0010: `shipping_provider`, `shipping_method`, `shipping_rate_card`, `shipping_zone`, `shipping_rule`, `shipment`, `shipment_event`. Verified via `information_schema.tables`.

---

## Performance / Cleanup / Alerts table skeletons (🟢 D-PERF-001)

- [ ] `feature_flag` table reserved (Phase 1 skeleton; UI Phase 6+; runtime Phase 10).
- [ ] `script_inventory` table reserved (Phase 1 skeleton; functional Phase 6).
- [ ] `landing_page_performance_history` table reserved (Phase 1 skeleton; populated Phase 10).
- [ ] `cleanup_job` + `cleanup_job_run` tables reserved (Phase 1 skeleton; execution Phase 10).
- [ ] `retention_policy` table reserved + seeded with 13 rows (Phase 1 skeleton; admin UI Phase 10).
- [ ] `alert` table reserved (Phase 1 skeleton; full categories Phase 6/10).
- [ ] `alert_subscription` + `notification_rule` tables reserved (Phase 10).
- [ ] `media_quality_issue` table reserved (Phase 10 — Auto Image Quality Scanner).
- [ ] `landing_page_quality_gate_run` + `landing_page_compliance_rule` tables reserved (Phase 6).

---

## Staging safety + Promotion checklist (🟢 D-PERF-001)

- [ ] **`/docs/15-phases/promotion-checklist.md` exists** with critical + high + medium items defined.
- [ ] **Staging Safety Rules documented** in `00-architecture/environment-topology.md`.
- [ ] **CI workflow embeds the promotion checklist** as a hard gate (Phase 1 sprint 1).

---

## Script Inventory Phase 1 placeholder (🟢 D-PERF-001 §A.6)

- [ ] **`script_inventory` table reserved** as empty schema in Phase 1 migration.
- [ ] **Script Inventory placeholder admin page** — read-only stub at `/admin/growth-performance/script-inventory` showing "ships Phase 6" notice; route + permission slug `performance.read` wired.
- [ ] **Joint review owner documented** — Security Lead + Marketing Manager joint approval.
- [ ] **Phase 1 seed rows** for known launch scripts: Meta Pixel, TikTok Pixel, Google Ads, GTM (4 rows). Each row has `approval_status='pending'`.
- [ ] **CSP enforced from Day 1** — strict Content-Security-Policy header configured for `ladders.vtc-me.com`.

---

## How to use this tracker

This file is **not Phase 1 acceptance** — it's the schema-reservation companion.

- Items here land in `node-pg-migrate` files in `/migrations/sql/` per the migration plan.
- Items here are verifiable via `information_schema.columns` / `information_schema.tables` queries — not via UI testing.
- Items here do NOT block Phase 1 sign-off if migrations succeed and the verification queries pass.
- Items here ARE prerequisites for later-phase functional builds (Phase 4 trust collection, Phase 6 landing builder, Phase 10 cleanup automation, etc.).

If a Phase 1 deliverable here fails to land, it becomes a Phase 2 schema migration — adding work to a later phase.

---

## What's NOT in this file

- Functional UI (admin screens, customer-facing surfaces) — those are in [`phase-1-acceptance.md`](./phase-1-acceptance.md) Must Have or [`phase-1-should-have.md`](./phase-1-should-have.md).
- Operational deliverables (J&T onboarding items) — those are in [`../20-shipping-logistics/02-ksa-jt-express-onboarding.md`](../20-shipping-logistics/02-ksa-jt-express-onboarding.md).
- Phase 0 long-lead operational decisions — those are in [`PHASE_0_DECISIONS_TODO_TRACKER.md`](./PHASE_0_DECISIONS_TODO_TRACKER.md) Top 10.
