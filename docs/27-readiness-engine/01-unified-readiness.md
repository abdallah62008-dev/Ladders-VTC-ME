# Module 27 — Unified Readiness Engine

**Status:** 🟢 **Documentation locked 2026-05-07** (D-READY-001 🟢 Answered); schema reservation Phase 1; unified UI Phase 10
**Owner:** PM + CTO + Operations Director
**Source:** Strategic Enhancements Evaluation (2026-05-08)

> ⚠️ **This module unifies three readiness systems that already exist** as scattered tables. The unification is a Phase 10 dashboard; the schema reservations land Phase 1 so the existing systems can refactor cleanly later.

---

## Operating principle: Build Now, Activate When Ready (🟢 D-READY-002 locked 2026-05-09)

**Configured ≠ active.** Entities may exist in the admin dashboard early (in statuses `draft`, `pending_configuration`, `pending_approval`, `ready`, `paused`, `blocked`, `archived`) but only **`active + readiness_passed`** items may be used customer-facing.

This is the **doctrine** that the Readiness Engine enforces. Without it, configured-but-incomplete entities leak into customer-facing surfaces and cause:

- Half-built shipping providers appearing in checkout
- Unapproved WhatsApp templates sending to customers
- Products without country price/stock surfacing on storefront
- Landing pages publishing without quality gate
- Coupons activating before profit guardrail review

### Applies across (locked 2026-05-09)

| Module | Entity | Status states (canonical or per-module variant) | Activation requires |
|---|---|---|---|
| Countries (Module 1) | `country` | `draft → setup_incomplete → ready_for_review → active → inactive → archived` | All 14 `country_launch_readiness` checks pass + 7 shipping checks (D-OPS-010) + 4 country-access checks (D-CSP-001) |
| Products (Module 2) | `product` + `product_variant` | `draft → ready → active → disabled` | Per-country readiness via `product_country_readiness`: price + stock + media + copy + SEO + AI knowledge + delivery promise |
| Country pricing (Module 3) | `variant_country_price` | `active = true/false` | Profit Guardrails pass + min/max selling price set + delivery promise note + cost configured (cost.read role) |
| Warehouse stock (Module 4) | `variant_warehouse_stock` | `active = true/false` | qty_on_hand entered + low_stock_threshold + reorder_point + warehouse status = active |
| Shipping providers (Module 16-ext) | `shipping_provider` | `active / inactive / archived` | account_status='approved' + at least one active method + at least one rate card + city coverage + delivery promise (D-OPS-010) |
| Shipping rate cards (Module 16-ext) | `shipping_rate_card` | `active = true/false` + `active_from / active_until` | Provider active + method active + weight bands defined + currency code set |
| Payment providers (Module 7) | `payment_provider` | `pending_approval / sandbox / active / paused / disabled` | Account approved + credentials configured (op:// reference) + webhook signing secret in 1Password + at least one supported method per country |
| WhatsApp numbers (Module 9/10) | `country.whatsapp_number` | `pending_procurement / pending_meta_verification / active` | Meta verified + Cloud API approved + display name approved |
| WhatsApp templates (Module 10) | `messaging_template` | `draft / submitted / pending_meta_approval / approved / paused / rejected` | Meta approved + active for at least one country + content reviewed |
| Auto replies (Module 9) | `reply_profile` + `reply_rule` | `draft / pending_approval / active / paused` | Reviewed by AI Supervisor + per-country tone profile attached |
| AI chat (Module 8) | overall feature flag | `enable_ai_chat = true/false` | Phase 3+ ship; AI guardrails + tool whitelist + golden conversations corpus |
| Landing pages (Module 13) | `landing_page` | `draft → pending_review → active → archived` | Pre-Publish Quality Gate (16 checks) + Profit Guardrail + Inventory Guardrail + Compliance Check (per `19-performance-growth/03-landing-pages.md` §D) |
| Coupons (Module 12) | `coupon` | `draft / pending_approval / active / expired / archived` | Profit Guardrail (per `05-payments/14-profit-floors-and-guardrails.md`) + activation by Marketing Manager + audit log |
| Marketers (Module 11) | `marketer` | `pending_application / approved / active / suspended / terminated` | Marketer onboarding + tier assignment + country scope + payout-method verified |
| Media assets (Module 14) | `media_asset` | `pending / processing / approved / active / archived` | 6 variants generated + alt_translations populated for active locales + license validated |
| Safety claims (Module 25) | `safety_claim` | `pending / approved / rejected / expired` | Compliance Officer + Product Manager dual approval + evidence_document_url + jurisdictions set + valid_until set |
| Certificates (Module 2 / 25) | `product_certification` | `pending / approved / expired / revoked` | Compliance Officer approval + document uploaded + expiry_date set |
| Reviews / Trust Layer (Module 26) | `customer_review` | `pending / approved / rejected / flagged` | Order linked + Customer Support review + safety-keyword auto-flag clear + media permission captured |
| Feature flags (Module 23) | `feature_flag` | `active / paused / archived` | Audit log per flip + rollback URL + owner_user_id |

### Examples

**Shipping:**
J&T Express can be added as `pending_configuration` or `manual_mode` before API/rate card is finalized. It cannot be used in checkout until provider `status='active'` AND at least one rate card is `active=true` AND delivery promise is set per the country-launch readiness shipping checks.

**Payment:**
Stripe / Tap / Paymob can exist as `pending_approval` or `sandbox`. They cannot appear to customers until provider `status='active'` AND credentials are configured via 1Password reference AND webhook signing secret is set.

**WhatsApp:**
Templates can be `draft / submitted / pending_meta_approval`. They cannot be used in customer flows until `approved` by Meta AND `active=true` AND template content reviewed.

**Product:**
Product master can exist globally in `draft` or `ready` status. Product cannot be sold in a country until per-(product, country) readiness passes: country price + stock + delivery promise + media readiness + SEO + AI knowledge.

**Landing Page:**
Landing page can be `draft`. It cannot publish until quality gate (16 checks per §D.1), performance budget (per §A.3), profit guardrail (per §D.7), inventory guardrail (per §D.8), compliance check (per §D.6), and required media all pass.

### Hard rules (locked 2026-05-09)

1. **No unfinished provider / payment / WhatsApp / template / page / product can be customer-facing.** Backend rejects any customer-facing query that returns `status != 'active'` rows.
2. **No default fallback** that hides missing configuration. If readiness fails, the customer-facing surface shows an explicit message ("currently unavailable in your country") not a silent degradation.
3. **No hardcoded activation.** Status fields are data, not code. CI grep test rejects literal status values inside activation-decision code paths (allow-list: seed migrations + admin status-management UI).
4. **No automatic activation after data entry.** Activation is a manual action requiring an operator with appropriate permission slug (e.g., `country.activate`, `landing_page.publish`, `safety.claim.approve`).
5. **Manual override requires approval, reason, audit log, and expiry where applicable.** Override path uses the existing 15-type override system (see `10-overrides/01-override-types.md` — e.g., `country_activation`, `landing_quality_gate_override`, `safety_claim_override`).
6. **All activation/deactivation actions must be audit-logged** with actor, timestamp, prior status, new status, reason, and override_request_id (if applicable).

### Phase placement

| Phase | Build Now, Activate When Ready scope |
|---|---|
| **Phase 1** | Document the principle (this section); foundation modules (country, product, warehouse, pricing, stock) implement status fields per existing schema; admin dashboard shows status badge + readiness score for foundation modules; no full advanced readiness dashboard required |
| **Phase 2+** | Checkout uses ONLY active shipping/payment/product-country records; rejects rows where `active=false` regardless of admin filter |
| **Phase 4+** | WhatsApp uses ONLY approved + active numbers/templates; auto-replies activated per-country tone profile |
| **Phase 6+** | Landing pages full Pre-Publish Quality Gate + Profit Guardrail + Inventory Guardrail + Compliance Check; Decision Engine recommendations only return active products with active country pricing |
| **Phase 10** | Advanced readiness automation: nightly job re-runs all readiness checks; `blocked` status auto-set on regression; alerts on activated entity going `blocked` (severity per category) |

---

## Why a unified engine

Today, "readiness" is checked in three places:

1. **`country_launch_readiness`** (Module 1) — 14 boolean flags per country (`pricing_ok`, `whatsapp_ok`, `payments_ok`, etc.)
2. **`product_country_readiness`** (Module 2) — per (product, country) status (`not_configured | missing_price | missing_stock | missing_content | missing_media | ready | active | disabled`)
3. **`landing_page_quality_gate_run`** (Module 23, D-PERF-001) — pre-publish 16-check gate per landing page

Plus implicit:
- Campaign readiness checks scattered across Profit Guardrails + Inventory Guardrails
- Operational readiness checks pre-launch (CI gates, secrets, backups)

A customer-facing or campaign-facing launch is **the AND of all of them**. Without a unified view, launches fail in unexpected places (e.g., country active but landing page references missing certificate). The Readiness Engine is one dashboard / one query that answers: **"is X ready to go live?"**

---

## Phase 1 schema reservation (Module 27)

> Reserved Phase 1; existing tables (`country_launch_readiness`, `product_country_readiness`, `landing_page_quality_gate_run`) become specializations.

### `readiness_check_definition` (Phase 6)

The catalogue of all things that can be checked.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| key | text UNIQUE | e.g., `country.pricing_seeded`, `product.images_complete`, `landing_page.no_forbidden_claims` |
| entity_type | text | `country` / `product` / `landing_page` / `campaign` / `operational` |
| name_translations | jsonb | |
| description_translations | jsonb | |
| severity | text | `critical` / `high` / `medium` / `low` |
| auto_check_query | text NULL | optional SQL-template for automated check |
| owner_role | text | who is responsible if this check fails |
| active | bool | |

### `readiness_check_run` (Phase 1 reservation; populated Phase 6+)

One row per check execution.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| readiness_check_definition_id | uuid FK | |
| entity_type | text | |
| entity_id | uuid | |
| status | text | `passed` / `failed` / `warning` / `skipped` / `pending_approval` |
| evidence_jsonb | jsonb | what was checked, what value was returned |
| failure_reason | text NULL | |
| owner_role | text | inherited from definition |
| acknowledged_by_user_id | uuid FK NULL | for warnings that require ack |
| run_at | timestamptz | |
| triggered_by | text | `'schedule' \| 'pre_publish' \| 'manual' \| 'change_detected'` |

### `readiness_blocker` (Phase 6)

Aggregated open failures — what's blocking a launch.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| entity_type | text | |
| entity_id | uuid | |
| readiness_check_definition_id | uuid FK | |
| first_observed_at | timestamptz | |
| last_observed_at | timestamptz | |
| status | text | `open` / `resolved` / `overridden` |
| owner_user_id | uuid FK NULL | |
| override_request_id | uuid FK NULL | |
| resolved_at | timestamptz NULL | |
| resolution_notes | text NULL | |

---

## Specializations (existing tables become readiness sources)

Phase 1 keeps existing tables intact. Phase 6 refactors them so each row writes a corresponding `readiness_check_run` entry:

| Existing table | Maps to readiness checks (entity_type) |
|---|---|
| `country_launch_readiness` | `country` (14 checks: pricing, whatsapp, payments, **shipping** [extended], warehouse, locale, currency, tax, etc.) |
| `product_country_readiness` | `product` (price, stock, images, copy, SEO, AI knowledge, **delivery promise**) |
| `landing_page_quality_gate_run` | `landing_page` (16 checks per D-PERF-001 §D.1) |
| (new) campaign readiness | `campaign` (offer / coupon / pixel / inventory / margin checks) |
| (new) operational readiness | `operational` (CI green, backups verified, secrets refreshed, on-call assigned) |

### Inventory readiness — Phase 1 source of truth (added 2026-05-09 — D-COUNTRY-013)

Inventory readiness checks read from the **Admin Dashboard (Phase 1 inventory authority)**, not from an external ERP. Per D-COUNTRY-013 locked 2026-05-09:

| Check key | Severity | Definition |
|---|---|---|
| `inventory.stock_present` | High | At least one `variant_warehouse_stock` row with `qty_on_hand > 0` exists for the launch warehouse for each launch SKU |
| `inventory.thresholds_set` | Medium | `low_stock_threshold` and `reorder_point` populated on each `variant_warehouse_stock` row |
| `inventory.reservations_active` | Medium | `stock_reservation` table is wired and reading from platform (not from external ERP) |
| `inventory.audit_log_active` | High | `stock_movement` rows write on every stock change; `country_data_audit` rows write on adjustments |
| `inventory.no_erp_dependency` | Critical | No code path reads stock counts from an external ERP. CI grep test rejects ERP-provider hardcoding (e.g., `'odoo'`, `'netsuite'`, `'sap'`) in stock-decision code paths. (Phase 10+ may introduce ERP via provider-agnostic adapter; Phase 1 must remain ERP-free.) |
| `inventory.country_scope_respected` | High | Inventory updates respect `user_country_access` + Country Access Control (D-CSP-001); operators cannot adjust stock for countries outside their scope |

Phase 1 inventory authority is the platform itself. Future ERP integration is Phase 10+ via provider-agnostic patterns — schema must remain ERP-agnostic.

### Country Access Control readiness checks (added 2026-05-09 — D-CSP-001)

Per `03-rbac/03-scopes.md`. Country Launch Readiness extends with country-access checks:

| Check key | Severity | Definition |
|---|---|---|
| `country_access.has_managers` | High | At least one user has `user_country_access` row for the country with `access_level='manage'` |
| `country_access.has_operators` | Medium | At least one user has `user_country_access` row for the country with `access_level='write'` |
| `country_access.no_orphan_data` | Critical | No country-scoped data exists for a country with zero active `user_country_access` rows (would mean nobody can manage it) |
| `country_access.audit_pipeline_active` | Medium | `audit_log` entries for country-scoped events (`user_country_access.*`, `denied_cross_country_access_attempt`, `cross_country_*`) write correctly per the schema in `03-rbac/03-scopes.md` §J |

These prevent the failure mode where a country goes live but no admin user has access to manage it (orphan country data).

### Shipping readiness checks (added 2026-05-09 — D-OPS-010)

Per `20-shipping-logistics/01-overview.md` §L. Extends `country_launch_readiness` and `product_country_readiness`:

#### Country-level shipping readiness (7 checks)

| Check key | Severity | Definition |
|---|---|---|
| `shipping.provider_active` | Critical | At least one `shipping_provider` with `status='active'` for the country |
| `shipping.method_active` | Critical | At least one `shipping_method` with `active=true` for an active provider in the country |
| `shipping.rate_card_for_main_cities` | Critical | At least one active `shipping_rate_card` covering each major launch city |
| `shipping.delivery_promise_set` | High | Every active method has `delivery_promise_min_days` + `delivery_promise_max_days` populated |
| `shipping.return_rule_exists` | High | At least one `shipping_rule` of type `return_fee` OR explicit "no returns" policy |
| `shipping.cod_fee_defined` | Critical (when COD enabled) | If any provider supports COD, a `cod_fee` shipping rule exists |
| `shipping.coverage_documented` | Medium | `shipping_rule` of type `city_coverage` exists for the primary provider (positive list OR explicit national coverage) |

#### Product-level shipping readiness (3 checks)

| Check key | Severity | Definition |
|---|---|---|
| `product.delivery_promise_for_country` | Critical | Product has a delivery promise (computed: a method exists for the country with delivery_promise_min/max) |
| `product.shipping_cost_calculable` | Critical | Given product weight + dimensions + a target city, a rate card row resolves |
| `product.customer_facing_delivery_message` | High | Locale-specific delivery message exists per (country × locale) |

---

## Readiness Dashboard (Phase 10 UI)

Single admin page at `/admin/system/readiness`:

```
Readiness Dashboard
  ├── Countries
  │     [KSA: 🟢 Ready] [EG: 🟠 4 blockers] [IQ: 🔴 11 blockers]
  ├── Products
  │     [VTC-TEL-OS-4.4M: 🟢 Ready in KSA] [9 other SKUs: 🟠 missing images/copy]
  ├── Landing Pages
  │     [12 active: all 🟢] [3 pending review: 🟠]
  ├── Campaigns
  │     [Ramadan-2026: 🟢] [Black-Friday-2026: 🟠 2 blockers]
  └── Operational
        [CI: 🟢] [Backups: 🟢] [On-call: 🟠 unassigned for next week]
```

Click a row → drill-down to `readiness_check_run` results + open `readiness_blocker` rows.

---

## Launch gate logic

A launch (country activation, product publish, landing page publish, campaign go-live) is allowed when:

1. All `severity='critical'` checks for the target entity = `passed`
2. All `severity='high'` checks = `passed` OR have an open `override_request_id` referencing an approved override
3. `severity='medium'` and `low` checks may be `failed` but surface in dashboard for follow-up

Override path: `country_activation` (existing override type) for country gate; `landing_quality_gate_override` for landing page; new generic `readiness_override` may be added Phase 6 if needed (single approver: Super Admin or Operations Director, dual when multiple Critical fails).

---

## Integration with existing modules

| Module | Integration |
|---|---|
| **Module 1** | `country_launch_readiness` rows produce `readiness_check_run` entries |
| **Module 2** | `product_country_readiness` rows produce `readiness_check_run` entries |
| **Module 23** | `landing_page_quality_gate_run` rows produce `readiness_check_run` entries |
| **Module 12** | Campaign profit guardrails (existing) populate campaign-readiness checks |
| **Module 19** | Every state change writes `audit_log` |
| **Module 23 — `alert`** | New alert sub-category `readiness_block` |

---

## RBAC (per `03-rbac/02-permissions.md`)

| Slug | Owner |
|---|---|
| `readiness.read` | All admin roles (scoped) |
| `readiness.run_check` | Operations Director + DBA + Infra Lead |
| `readiness.acknowledge` | Owner role of the failing check |
| `readiness.override_block` | Super Admin + Operations Director (dual; reason ≥30 chars) |

---

## Alerts (per `19-performance-growth/...` §H)

New alert category extension:
- Medium: planned launch < 7 days with readiness incomplete
- High: critical readiness check failed on currently-active entity
- Low: medium-severity blocker open > 14 days

---

## Phase placement

| Phase | Work |
|---|---|
| **Phase 1** | Schema reservation: `readiness_check_definition`, `readiness_check_run`, `readiness_blocker`. Existing tables continue working unchanged. |
| Phase 6 | Refactor: existing readiness tables write parallel `readiness_check_run` rows; readiness_blocker aggregation; first batch of `readiness_check_definition` rows seeded |
| Phase 10 | Unified Readiness Dashboard UI; alert integration; readiness drift report (entity that was ready becomes unready — e.g., certificate expired) |

---

## TODO

- TODO: lock initial `readiness_check_definition` catalogue (~50 checks expected covering country, product, landing page, campaign, operational).
- TODO: design refactor migration that moves existing readiness tables into the unified model without breaking ongoing Phase 1 usage.
- TODO: confirm whether `readiness_override` becomes a new override type or inherits from existing per-entity types (recommendation: inherit; add new only if a use case emerges).
