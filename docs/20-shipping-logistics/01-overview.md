# Shipping & Logistics — Configurable Provider System

**Status:** 🟢 **Architecture locked 2026-05-07** (D-OPS-010 🟢 Answered); KSA initial provider locked (D-OPS-003 🟢 Answered: J&T Express); schema reservations Phase 1; checkout integration Phase 2; analytics Phase 9–10
**Owner:** Operations Director + DBA + CTO
**Source:** D-OPS-003 (KSA logistics partner) + D-OPS-010 (configurable shipping architecture)

> ⚠️ **Hard rule (locked 2026-05-07):** **No shipping company, tariff, delivery promise, COD fee, return fee, or shipping rule is hardcoded in application code.** Adding a new courier OR a new rate card OR a new failed-delivery rule is a data operation in the admin dashboard, not a code change or a database schema change. CI grep test rejects hardcoded courier names / city lists / fees / SLA thresholds in any code path that evaluates shipping decisions.

---

## Table of contents

- [A. Architecture principles](#a-architecture-principles)
- [B. Schema reservations (Module 16 extension)](#b-schema-reservations-module-16-extension)
- [C. Admin section: Operations / Shipping](#c-admin-section-operations--shipping)
- [D. Shipping Providers Management](#d-shipping-providers-management)
- [E. Shipping Methods](#e-shipping-methods)
- [F. Shipping Rate Cards](#f-shipping-rate-cards)
- [G. Shipping Rules](#g-shipping-rules)
- [H. Country-Specific Shipping](#h-country-specific-shipping)
- [I. Provider-Agnostic Architecture](#i-provider-agnostic-architecture)
- [J. Audit Log](#j-audit-log)
- [K. RBAC / Permissions](#k-rbac--permissions)
- [L. Readiness / Validation](#l-readiness--validation)
- [M. Phase Placement](#m-phase-placement)
- [N. KSA Initial Provider — J&T Express](#n-ksa-initial-provider--jt-express)

---

## A. Architecture principles

0. **Build Now, Activate When Ready** (🟢 D-READY-002 locked 2026-05-09; see `../GLOSSARY.md` + `../27-readiness-engine/01-unified-readiness.md`). Shipping providers / methods / rate cards may be configured early in `pending_configuration` or `manual_mode`, but **only `active + readiness_passed` records appear in customer-facing checkout**. Activation requires: provider `status='active'` AND at least one active shipping_method AND at least one active shipping_rate_card covering target city AND delivery promise set AND city coverage documented. Example: J&T Express can be added as `pending_configuration` before API/rate card is finalized — but cannot be used in checkout until activation criteria pass. Backend rejects checkout queries that would return inactive provider rows.
1. **Configurable, not coded.** All shipping providers, methods, rate cards, zones, and rules live in the database. The application reads them at request time. Changing a courier, raising a COD fee, or adding a new city zone is a data action.
2. **Per-country.** Every shipping entity references `country_id`. Iraq's logistics setup is independent from Saudi Arabia's. Adding a new country requires only data inserts (consistent with D-COUNTRY-014).
3. **Provider-agnostic.** Multiple providers per country; multiple methods per provider; multiple rate cards per (provider × method × city). Switching primary provider OR adding a fallback provider is a flag flip in admin.
4. **Manual fallback.** Providers without API integration ship in **manual mode**: admin records label / tracking number manually; system still tracks the package via tracking number search; webhooks not required.
5. **No secret-leaking.** API tokens / webhook signing secrets / account IDs live in **1Password** (per D-BKP-001). Admin dashboard shows `api_configured = true/false` only — never the actual values.
6. **Audit everything.** Every provider/method/rate/rule change writes an `audit_log` row.

---

## B. Schema reservations (Module 16 extension)

> Tables reserved as Phase 1 skeletons; populated when checkout ships Phase 2 and operational workflows ship Phase 9.

### `shipping_provider` (Phase 1 skeleton; populated Phase 2+)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid FK → `country.id` | per-country provider |
| provider_code | text | e.g., `'jt-express'`, `'aramex'`, `'smsa'`, `'bosta'` |
| provider_name | text | display name |
| status | text | `'active' \| 'inactive' \| 'archived'` |
| supports_cod | bool | |
| supports_api | bool | |
| supports_label_generation | bool | |
| supports_tracking | bool | |
| supports_tracking_webhook | bool | |
| supports_returns | bool | |
| supports_pickup | bool | |
| account_status | text | `'pending' \| 'approved' \| 'suspended' \| 'unknown'` |
| contact_person | text | |
| contact_phone | text | |
| contact_email | text | |
| api_configured | bool | **Boolean only — actual credentials in 1Password** (per `08-backups/05-secrets-exclusion-policy.md`) |
| op_credentials_ref | text NULL | `op://vtc-prod-infra/shipping/<provider_code>` reference (no value) |
| notes | text | |
| created_at, updated_at | timestamptz | |
| archived_at, archived_by, archive_reason | per Class 1 deletion policy (D-DB-010) | |

**Class 1** (soft-delete only) per D-DB-010.

### `shipping_method` (Phase 1 skeleton; populated Phase 2+)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid FK | |
| shipping_provider_id | uuid FK | |
| method_code | text | e.g., `'standard'`, `'express'`, `'cod_delivery'`, `'return'`, `'manual'`, `'pickup'` |
| method_name | text | internal display |
| customer_visible_name_ar | text | shown to customer in checkout |
| customer_visible_name_en | text | |
| active | bool | |
| supports_cod | bool | |
| delivery_promise_min_days | int | |
| delivery_promise_max_days | int | |
| internal_notes | text | |
| created_at, updated_at | timestamptz | |

### `shipping_rate_card` (Phase 1 skeleton; populated Phase 2+)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid FK | |
| shipping_provider_id | uuid FK | |
| shipping_method_id | uuid FK | |
| city | text NULL | NULL = country-wide; non-NULL for city-specific |
| zone | text NULL | optional zone grouping (e.g., `'remote'`) |
| region | text NULL | optional region (e.g., `'central-province'`) |
| weight_from_kg | numeric(8,3) | inclusive |
| weight_to_kg | numeric(8,3) | exclusive |
| volumetric_weight_rule | jsonb | optional `{divisor: 5000, formula: 'lwh/divisor'}` |
| package_size_limit_jsonb | jsonb | optional `{max_l_cm, max_w_cm, max_h_cm, max_weight_kg}` |
| base_shipping_fee | numeric(12,2) | per D-DB-003 |
| cod_fee | numeric(12,2) | applied when payment method = COD |
| return_fee | numeric(12,2) | when customer returns |
| failed_delivery_fee | numeric(12,2) | when customer not reachable / refuses |
| remote_area_surcharge | numeric(12,2) | when delivery to remote zone |
| currency_code | text | per `country.currency_code` |
| active_from | timestamptz | |
| active_until | timestamptz NULL | |
| active | bool | |
| notes | text | |
| created_at, updated_at, deleted_at | timestamptz | Class 1 soft-delete per D-DB-010 |

Indexed `(country_id, shipping_provider_id, shipping_method_id, city, weight_from_kg, weight_to_kg)` for fast checkout lookup.

### `shipping_zone` (Phase 1 skeleton)

City / region grouping for tariff lookup — used when rate card scopes by zone rather than per-city.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid FK | |
| code | text | e.g., `'remote-northwest'`, `'major-city'` |
| name_translations | jsonb | per locale |
| city_list | text[] | array of cities in this zone |
| zone_type | text | `'standard' \| 'remote' \| 'priority'` |
| active | bool | |

### `shipping_rule` (Phase 1 skeleton; populated Phase 2)

Rule engine for free shipping, surcharges, restrictions.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid FK | |
| rule_type | text | `'free_shipping_above_amount' \| 'free_shipping_for_products' \| 'free_shipping_for_categories' \| 'remote_city_surcharge' \| 'heavy_item_surcharge' \| 'cod_fee' \| 'return_fee' \| 'failed_delivery_fee' \| 'provider_priority' \| 'city_coverage' \| 'product_restriction' \| 'category_restriction' \| 'warehouse_to_city_routing' \| 'fallback_provider'` |
| rule_payload | jsonb | flexible per rule_type |
| priority | int | lower = applied first |
| active | bool | |
| effective_from | timestamptz | |
| effective_until | timestamptz NULL | |
| created_at, updated_at | timestamptz | |
| audit_log_id_last_change | uuid FK | |

### `shipment` (already in Module 16 family; populated Phase 2+)

(Existing concept; columns refined Phase 2.) Joins to `customer_orders.id` + `shipping_provider.id` + `shipping_method.id` + tracking number.

### `shipment_event` (Phase 9 — courier webhook events)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| shipment_id | uuid FK | |
| event_type | text | `'created' \| 'picked_up' \| 'in_transit' \| 'out_for_delivery' \| 'delivered' \| 'failed_delivery' \| 'returned' \| 'lost'` |
| event_at | timestamptz | |
| courier_payload_jsonb | jsonb | raw provider response |
| created_at | timestamptz | |

---

## C. Admin section: Operations / Shipping

```
Operations
  ├── ...
  └── Shipping
        ├── Shipping Providers
        ├── Shipping Methods
        ├── Shipping Rate Cards
        ├── Delivery Zones
        ├── Shipping Rules
        ├── Failed Delivery Rules
        ├── Return Shipping Rules
        └── Shipping Provider Settings
```

---

## D. Shipping Providers Management

### Operations

Admin (with appropriate permission slugs) can:
- Add a new provider per country.
- Edit fields (name, code, contact info, capabilities).
- Activate / deactivate (active = visible in checkout; inactive = hidden but historical shipments preserve).
- Archive (Class 1 soft-delete; provider can no longer be referenced in new shipments; historical references preserved).
- Reactivate from inactive (Operations Director).
- Unarchive (Super Admin only).

### Forbidden

- Editing API credentials in dashboard (credentials live in 1Password).
- Deleting historical provider rows (Class 1 — soft-delete only).
- Changing `provider_code` after first shipment uses the provider (immutable to preserve audit chain).

### Audit

Every change writes an `audit_log` row with old/new diff.

---

## E. Shipping Methods

### Examples

| `method_code` | Use |
|---|---|
| `standard` | Default delivery; 2–5 business days |
| `express` | Next-day; surcharge applies |
| `cod_delivery` | COD-enabled; collects payment at door |
| `return` | Reverse logistics |
| `manual` | Provider has no API; admin records label/tracking manually |
| `pickup` | Customer pickup from warehouse |

### Operations

Admin can:
- Define methods per (country × provider).
- Set delivery promise min/max days (drives customer-facing message).
- Configure COD support flag (drives checkout availability).
- Set customer-visible Arabic + English names.

Inactive method hidden from checkout but historical references preserved.

---

## F. Shipping Rate Cards

### Lookup logic at checkout

Given (country_id, customer_city, total_weight_kg, package_dimensions, provider_id, method_id), find the rate card row where:
- `country_id` matches
- `shipping_provider_id` + `shipping_method_id` match
- `city` matches (or NULL = country-wide fallback)
- `weight_from_kg ≤ total_weight_kg < weight_to_kg`
- `active_from ≤ now() < (active_until OR infinity)`
- `active = true`

Compute total shipping fee:
- `base_shipping_fee` (always)
- `+ cod_fee` (if payment method is COD)
- `+ remote_area_surcharge` (if zone is remote)
- `+ shipping_rule` adjustments (free above amount, free for category, etc.)

### Operations

Admin can:
- Create rate cards for any (country × provider × method × city).
- Edit fees + weight bands + size limits.
- Time-bound rate cards via `active_from` / `active_until` (e.g., Ramadan promo with reduced shipping).
- Soft-delete rate cards that no longer apply.

---

## G. Shipping Rules

Rule engine that augments rate-card lookup. Common rules:

| `rule_type` | Example payload |
|---|---|
| `free_shipping_above_amount` | `{threshold_amount: 500, currency: 'SAR', applies_to_methods: ['standard']}` |
| `free_shipping_for_products` | `{variant_ids: [...], methods: ['standard'], expires_at: '2026-12-31'}` |
| `free_shipping_for_categories` | `{category_ids: [...], methods: ['standard']}` |
| `remote_city_surcharge` | `{zone_codes: ['remote-northwest'], surcharge_amount: 25}` |
| `heavy_item_surcharge` | `{weight_above_kg: 30, surcharge_amount: 15}` |
| `cod_fee` | `{amount: 15, currency: 'SAR', applies_when_method: 'cod_delivery'}` |
| `return_fee` | `{amount: 25, currency: 'SAR'}` |
| `failed_delivery_fee` | `{amount: 25, currency: 'SAR', applied_after_attempts: 2}` |
| `provider_priority` | `{provider_priority_list: [{provider_id: 'xxx', priority: 1}, {provider_id: 'yyy', priority: 2}]}` |
| `city_coverage` | `{provider_id: 'xxx', covered_cities: [...], excluded_cities: [...]}` |
| `product_restriction` | `{forbidden_provider_ids_for_variants: {variant_id: [provider_id, ...]}}` |
| `category_restriction` | `{forbidden_provider_ids_for_categories: {category_id: [provider_id, ...]}}` |
| `warehouse_to_city_routing` | `{routes: [{warehouse_id, city, default_provider_id, fallback_provider_id}]}` |
| `fallback_provider` | `{primary_provider_id, fallback_provider_id, conditions: ['api_unavailable', 'no_coverage']}` |

Rules apply in `priority` order; first match wins for routing decisions; surcharges accumulate.

---

## H. Country-Specific Shipping

Every shipping entity (`shipping_provider`, `shipping_method`, `shipping_rate_card`, `shipping_zone`, `shipping_rule`) is keyed by `country_id`. Examples:

- **Saudi Arabia** uses J&T Express (initial primary); Aramex / SMSA / Bosta as secondary candidates (Phase 1+).
- **Egypt** can use Bosta + Aramex Egypt later (Phase 8 launch).
- **Iraq** can use local options later (Phase 8 launch).

Adding a new country requires only data inserts — no code changes, no schema changes.

---

## I. Provider-Agnostic Architecture

### Capabilities

- **Multiple providers per country** — KSA can have J&T as primary, Aramex as fallback.
- **Multiple methods per provider** — J&T can support standard + express + COD + return.
- **Multiple rate cards per provider** — different fees for Riyadh vs Jeddah vs remote.
- **Switch primary provider** — flag flip in `shipping_rule` provider_priority rule; takes effect within 1 cache cycle.
- **Fallback provider** — `fallback_provider` rule kicks in when primary's API is unavailable OR primary has no coverage for the requested city.
- **API integration later** — provider can ship initially in `manual` mode; flip `supports_api = true` + populate `api_configured = true` (with credentials added to 1Password) when integration is ready.
- **Manual shipping mode** — `shipping_method` with `method_code='manual'` allows admin to record label/tracking number manually; system still tracks the package via tracking number search.

---

## J. Audit Log

Every change writes an `audit_log` row:

| Action | Logged |
|---|---|
| Provider created / updated / deactivated / archived / reactivated | ✅ |
| Method created / updated / deactivated | ✅ |
| Rate card created / updated / deactivated | ✅ |
| Rule created / updated / activated / deactivated | ✅ |
| Delivery promise changed (via shipping_method update) | ✅ |
| COD fee changed (via shipping_rule update) | ✅ |
| Provider priority changed | ✅ |
| Webhook arrived (shipment_event row appended) | ✅ |

Never deleted (per D-DB-010 Class 2).

---

## K. RBAC / Permissions

> Full slug list in `03-rbac/02-permissions.md`. New permission group:

### Shipping & Logistics

| Slug | Description |
|---|---|
| `shipping_provider.read` | Read provider list + status |
| `shipping_provider.create` | Add new provider |
| `shipping_provider.update` | Edit non-credential fields |
| `shipping_provider.deactivate` | Deactivate (with reason) |
| `shipping_provider.archive` | Archive (Class 1 soft-delete) |
| `shipping_provider.reactivate` | Reactivate from inactive (unarchive = super_admin only) |
| `shipping_method.read` | Read methods |
| `shipping_method.create` | Add method |
| `shipping_method.update` | Edit method |
| `shipping_method.deactivate` | Deactivate method |
| `shipping_rate.read` | Read rate cards |
| `shipping_rate.create` | Add rate card |
| `shipping_rate.update` | Edit rate card |
| `shipping_rate.deactivate` | Deactivate rate card |
| `shipping_rule.read` | Read shipping rules |
| `shipping_rule.update` | Edit / activate / deactivate rule |

### Suggested role × permission matrix

| Permission group | super_admin | operations_director | finance_admin | shipping_coordinator | admin | external_marketer |
|---|---|---|---|---|---|---|
| `shipping_provider.*` (read/create/update/deactivate/archive/reactivate) | ✅ | ✅ (excl. credential view) | read | read + limited update | read | ❌ |
| `shipping_method.*` | ✅ | ✅ | read | read + limited update | read | ❌ |
| `shipping_rate.*` (read/create/update/deactivate) | ✅ | ✅ | read + approve_pricing_changes | read | read | ❌ |
| `shipping_rule.*` | ✅ | ✅ | read | read | read | ❌ |

**Sensitive API credentials are NEVER visible in the dashboard.** Operations Director can see `api_configured = true/false` and the 1Password reference path (e.g., `op://vtc-prod-infra/shipping/jt-express`), but not the secret value.

---

## L. Readiness / Validation

### Country Launch Readiness checks (extends `country_launch_readiness`)

Per `27-readiness-engine/01-unified-readiness.md`:

- `shipping.provider_active` — at least one `shipping_provider` with `status='active'` for the country
- `shipping.method_active` — at least one `shipping_method` with `active=true` for the country × an active provider
- `shipping.rate_card_for_main_cities` — at least one active `shipping_rate_card` covering each major launch city for the country
- `shipping.delivery_promise_set` — every active method has `delivery_promise_min_days` + `delivery_promise_max_days`
- `shipping.return_rule_exists` — at least one `shipping_rule` of type `return_fee` OR explicit "no returns" policy documented
- `shipping.cod_fee_defined` — if any provider supports COD, a `cod_fee` rule exists
- `shipping.coverage_documented` — `shipping_rule` of type `city_coverage` exists for the primary provider (positive list of covered cities OR explicit national coverage)

### Product / Landing Page Readiness checks

- `product.delivery_promise_for_country` — product has a delivery promise (computed: a method exists for the country with a delivery_promise_min/max)
- `product.shipping_cost_calculable` — given product weight + dimensions + a target city, a rate card row resolves
- `product.customer_facing_delivery_message` — locale-specific delivery message exists per (country × locale)

---

## M. Phase Placement

| Phase | Work |
|---|---|
| **Phase 1** | Schema reservations (this doc); permission slugs defined; KSA J&T provider/method/rate card seeded as draft (admin can edit before production); audit log rule active; Operations / Shipping admin section structure documented. **No checkout integration yet.** |
| Phase 2 | Checkout reads `shipping_method` + `shipping_rate_card` + `shipping_rule` for fee calculation + delivery promise display; manual shipment mode active for J&T (no API yet); shipment row created on order confirmation. |
| Phase 4 | WhatsApp shipping status updates to customer (template `shipment_status_<status>_ar/_en`); customer confirmation flow when out-for-delivery. |
| Phase 7 | Payment / COD reconciliation: COD collection → `payment_transaction` posted on shipment_event=`delivered`; COD fee reconciliation per provider. |
| Phase 9 | Courier performance analytics (`courier_performance_log` per existing Module 16); returns workflow; failed delivery recovery; J&T API integration (when supports_api flips to true). |
| Phase 10 | Shipping intelligence: courier scorecards, route optimization suggestions, COD fraud pattern detection, dead-stock-by-courier-failure analysis. |

---

## N. KSA Initial Provider — J&T Express

**Status:** 🟢 **Selected 2026-05-07** as initial primary logistics provider for Saudi Arabia (D-OPS-003 🟢 Answered for selection; operational onboarding TODO).

### Why J&T Express

- KSA market presence + national coverage
- COD support (critical for Phase 1 KSA which is COD-primary)
- Competitive rates for ladder-class packages
- API + tracking webhook capability (when account-approved for API tier)

### Operational pending items (must close before Phase 2 launch)

These are NOT decisions — they are execution items. Each is a TODO with an owner.

| # | Item | Owner | Phase target |
|---|---|---|---|
| 1 | Business account approval | Operations Director | Phase 0 week 1 |
| 2 | Rate card finalized + entered into `shipping_rate_card` | Operations Director + Finance | Phase 0 week 2 |
| 3 | COD support confirmed (limit per shipment, fee, settlement cadence) | Operations Director + Finance | Phase 0 week 2 |
| 4 | Pickup process from `RUH-01` (Riyadh Main Warehouse) documented | Operations Director + Inventory Manager | Phase 0 week 3 |
| 5 | Label generation method confirmed (J&T portal vs API vs file upload) | Operations Director + Backend Lead | Phase 1 sprint 1 |
| 6 | Tracking API/webhook integration spec received | Backend Lead | Phase 1 sprint 2 |
| 7 | Return workflow documented (drop-off vs pickup; fee structure) | Operations Director | Phase 1 sprint 3 |
| 8 | Failed delivery workflow documented (re-attempt count; storage fee; return-to-warehouse trigger) | Operations Director + Customer Support Lead | Phase 1 sprint 3 |
| 9 | Reconciliation process for COD settlements | Operations Director + Finance | Phase 0 week 3 |
| 10 | City coverage list (positive / negative) entered as `shipping_rule.city_coverage` | Operations Director | Phase 0 week 3 |
| 11 | SLA by city (delivery promise per zone) entered into `shipping_method.delivery_promise_min/max_days` per zone | Operations Director | Phase 0 week 3 |
| 12 | Package size + weight limits documented + entered into `shipping_rate_card.package_size_limit` | Operations Director + Inventory Manager | Phase 0 week 3 |

See `02-ksa-jt-express-onboarding.md` for the detailed checklist.

### Fallback / future providers for KSA

- **Aramex KSA** — secondary candidate; Phase 6+ if J&T performance issues OR coverage gaps emerge
- **SMSA Express** — tertiary candidate; Phase 6+ for redundancy

Adding any of these is a data operation per the architecture above — no code changes required.

---

## O. CI / safety enforcement

CI grep tests reject:

- Hardcoded courier names (`'jt'`, `'aramex'`, `'smsa'`, `'bosta'`, `'fastbox'`, etc.) in any code path that evaluates shipping decisions (allow-list: seed migrations + admin courier-management UI + adapter files explicitly named per provider).
- Hardcoded city lists for shipping rules in code (must be `shipping_zone.city_list` data).
- Hardcoded fee values in shipping calculation code (must be `shipping_rate_card` data).
- Hardcoded delivery promises (must be `shipping_method.delivery_promise_*` data).

---

## TODO

- TODO: lock J&T Express operational onboarding items (12 sub-items in §N).
- TODO: define J&T API adapter spec once API documentation received from J&T.
- TODO: define manual-mode admin UX for label upload + tracking number entry.
- TODO: confirm whether J&T tracking webhook is push (their server → us) or pull (us polling); affects webhook receiver design.
- TODO: shipping cost simulator for finance — given (variant, country, city), show fee breakdown + delivery promise (ties to existing `price_simulation` table family).
