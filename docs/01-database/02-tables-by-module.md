# Tables by Module — Master Schema Reference

**Status:** Draft
**Owner:** DBA
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §6, §23

This is the **canonical schema reference**. Every table that will exist in production is listed here. **No DDL is executed from this file** — it is documentation. Migrations live in `05-migration-plan.md`.

---

## Conventions

- **Naming:** snake_case. Singular table names (with the locked exception of `customer_orders` per D-DB-001 🟢 2026-05-07). Translation tables suffix `_translation`. Junction tables join singular names (`marketer_coupon`, `variant_country_price`).
- **Primary key (🟢 D-DB-002 locked 2026-05-07):** **ALL** UUID primary keys use `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`. Sourced from the `pgcrypto` extension (enabled in migration 0001). **Forbidden:** `uuid_generate_v4()` from uuid-ossp; mixing UUID generation strategies; per-table custom UUID generators. CI grep test rejects any migration containing `uuid_generate_v4` or `CREATE EXTENSION ... uuid-ossp`.
- **Money (🟢 D-DB-003 locked 2026-05-07):** **ALL monetary columns use `numeric(12,2)`** — uniformly across SAR / EGP / IQD. Examples: `unit_selling_price`, `regular_price`, `sale_price`, `actual_product_cost`, `marketer_product_cost`, `min_selling_price`, `max_selling_price`, `suggested_selling_price`, `shipping_share`, `payment_fee_share`, `discount_share`, every `*_snapshot` column on `order_line`, `payment_transaction.amount`, `refund.amount`, `deposit.amount`, `invoice.total`, `marketer_payout.amount`. **Display vs storage separation:** the database stores full `numeric(12,2)` precision regardless of currency; display rounding happens at the presentation layer via `country.price_rounding_pattern` + `currency.decimals` (IQD displays at 0 decimals; SAR/EGP at 2). **Forbidden:** `float`, `double precision`, `real`, `money` (Postgres type), or any `numeric` with non-`(12,2)` precision on a monetary column; per-country numeric precision variation; storing minor units (halalas/piasters/cents) at the DB layer. **Payment minor-unit conversion** (e.g., Stripe expects amount in halalas = `SAR × 100`) happens in the **payment adapter layer only** — see `05-payments/02-provider-abstraction.md` §"Money & Minor Units". **Snapshot rule:** every monetary value referenced on a `customer_orders` line is snapshotted into `order_line.*_snapshot` columns at order creation; never recomputed. **Rounding:** round-half-up; banker's rounding rejected for retail consistency. CI grep test rejects any monetary column declared as `float`/`double`/`real`/`money` or `numeric(<not 12,2>)` in migration files.
- **Margin / rate / percentage:** `numeric(5,4)` (e.g., `0.2000` for 20%) — distinct from monetary columns. Used for `country.business_min_margin`, `vat_rate`, `platform_fee_percent_snapshot`. Not affected by D-DB-003 (which governs money, not ratios).
- **Timestamps:** `created_at timestamptz DEFAULT now()`, `updated_at timestamptz` updated by trigger.
- **Deletion policy (🟢 D-DB-010 locked 2026-05-07):** Mixed policy by class. Each table is annotated as **Class 1 / 2 / 3 / 4** below.
  - **Class 1 — Soft-delete / archive only** (no hard delete during normal operations): `customer_orders`, `customer`, `b2b_account`, `invoice`, `refund`, `payment_transaction`, `warranty_claim`, `service_ticket`, `product_batch`, `marketer_payout`, `approval`, `override_request`. Use `deleted_at timestamptz NULL` + `deleted_by uuid FK NULL` + `delete_reason text NULL`. Where archive lifecycle is more accurate (`product_batch`, `warehouse`, `service_ticket`), use `archived_at` + `archived_by` + `archive_reason` instead — see Module 4 warehouse lifecycle for the reference pattern.
  - **Class 2 — Never hard delete** (immutable history): `audit_log`, `country_data_audit`, `cost_history`, `variant_country_cost`, `variant_marketer_cost`, `order_profit_snapshot`, `payment_log`, `payment_transaction` within legal retention, `invoice` within legal retention, `safety_incident_report`, `stock_movement` (immutable inventory movement ledger — alignment locked 2026-05-10 to match the Sprint 2A migration 0006 BEFORE-DELETE trigger; Class 1 listing was an oversight as the table has no `deleted_at` column), `cost_read_log` (Phase 1 schema reservation; Phase 2 instrumentation; 7-year retention). **No `deleted_at` column** — these tables grow forever (or get archived to cold storage per `19-performance-growth/...` §F.7 archiving layer; archive is move-not-delete). CI grep test rejects `DELETE FROM <class-2-table>` in any migration or scheduled cleanup job. The only exception is `sensitive_cleanup_override` per `10-overrides/01-override-types.md` (Super Admin + Finance Admin dual + mandatory pre-cleanup backup).
  - **Class 3 — Hard delete allowed after retention policy**: `cart`, `cart_line`, `cart_event`, sessions, reset tokens, temporary uploads, import preview files, expired payment links, expired stock reservations after release/logging, old raw pixel events after summarization, old webhook retry logs after retention/archive. These have `retention_policy` rows (per `19-performance-growth/...` §F.2); cleanup jobs `DELETE FROM` once retention elapses. **No soft-delete columns** on these tables — they would just bloat the schema; the records are not business-meaningful after retention.
  - **Class 4 — PII anonymization (special case for `customer`)**: customer deletion requests follow PDPL right-to-erasure path — financial records (linked `customer_orders`, `invoice`, `payment_transaction`) are retained for legal reporting; `customer` row remains but PII fields (`name`, `phone`, `phone_normalized`, `email`, `customer_address.*`) replaced with `[ANONYMIZED]` markers; anonymization audit-logged with `audit_log` row + `customer_consent` row referencing the right-to-erasure request. See `17-compliance/ksa-pdpl.md` + `17-compliance/consent-records.md` for the workflow.
- **Soft delete:** legacy term — see Deletion policy above. Where this doc previously said "soft delete on customer_orders + customer," the rule is now part of Class 1.
- **JSONB:** for variable-shape attributes only. Indexed via GIN if queried.
- **RLS marker:** `[RLS]` after table name = Row-Level Security policies apply (see `03-rls-policies.md`).
- **TODO** markers = field whose default value or behavior requires business sign-off.
- **Status fields (🟢 D-READY-002 locked 2026-05-09 — Build Now, Activate When Ready):** Every entity that has a customer-facing surface MUST have a status field gating activation. Status enums vary per module (e.g., `country.launch_status`, `landing_page.status`, `shipping_provider.status`, `safety_claim.approval_status`, `payment_provider.status`, `messaging_template.approval_status`, `customer_review.approval_status`). Canonical principle: only `active + readiness_passed` rows may surface to customers. Backend rejects customer-facing queries that return `status != 'active'` rows. CI grep test rejects literal status values inside activation-decision code paths (allow-list: seed migrations + admin status-management UI). Activation is always an explicit operator action with permission slug + audit log; no automatic activation after data entry. See `27-readiness-engine/01-unified-readiness.md` for the full per-module status enum mapping + activation requirements.

---

## Module 1 — Geo & Locale

### `country`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | text UNIQUE | ISO-2 lowercase: `'sa', 'eg', 'iq', 'ae'` |
| name_ar | text | |
| name_en | text | |
| currency_code | text | ISO-4217: `'SAR', 'EGP', 'IQD'` |
| default_locale | text | references `locale.code` |
| vat_rate | numeric(5,4) | e.g., `0.1500` for 15% |
| vat_mode | text | `'inclusive' | 'exclusive'` |
| phone_code | text | e.g., `'+966'` |
| whatsapp_number | text | E.164 |
| business_hours | jsonb | per-weekday + holidays |
| business_min_margin | numeric(5,4) | **🟢 Initial defaults set 2026-05-07 (D-PAY-002, configurable — NOT hardcoded)** — KSA: `0.2000` (20%) · Egypt: `0.1800` (18%) · Iraq: `0.2200` (22%). Cache of `profit_floor_rule(scope_type='country', floor_type='business_min_margin')`; updated via trigger when rule changes. Marketer floor uniform `0.0500` (5%) per country (D-PAY-003). **All values are editable from `/admin/finance/profit-guardrails` (Super Admin + Finance Admin only). Lowering requires approval workflow OR Manual Override. Past orders never recalculated** — `order_line` snapshots immutable. See `05-payments/14-profit-floors-and-guardrails.md` §1b + §8. |
| payment_methods | jsonb | array of `payment_method.id` |
| shipping_methods | jsonb | array of `courier.id` |
| ai_tone_profile_id | uuid FK → tone_profile | |
| auto_reply_profile_id | uuid FK → reply_profile | |
| pixel_settings | jsonb | per-pixel enable/disable |
| price_rounding_pattern | jsonb | `{pattern, step, psychological, examples}` |
| launch_status | text | enum: see Country Launch Readiness |
| active | boolean DEFAULT true | |
| created_at, updated_at | timestamptz | |

### `country_launch_readiness`
| Column | Type | Notes |
|---|---|---|
| country_id | uuid PK FK → country | |
| currency_ok, tax_ok, locale_ok, whatsapp_ok, payments_ok, shipping_ok, warehouse_ok, pricing_ok, stock_ok, autoreply_ok, seo_ok, landing_pages_ok, staff_ok, business_hours_ok | bool DEFAULT false | |
| overall_status | text | computed: `'draft' | 'setup_incomplete' | 'ready_for_review' | 'active' | 'inactive' | 'archived'` |
| last_checked_at | timestamptz | |

### `locale`
| Column | Type | Notes |
|---|---|---|
| code | text PK | e.g., `'ar-sa'` |
| country_code | text FK → country.code | |
| language_code | text | `'ar' | 'en'` |
| direction | text | `'rtl' | 'ltr'` |
| name_native | text | |

### `currency`
| Column | Type | Notes |
|---|---|---|
| code | text PK | ISO-4217 |
| symbol | text | e.g., `'ر.س'` |
| symbol_position | text | `'before' | 'after'` |
| decimals | int | typical 2; IQD uses 0 |

### `tax_setting`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| country_id | uuid FK | |
| name | text | |
| rate | numeric(5,4) | |
| applies_to | jsonb | category/group filters |
| effective_from, effective_until | timestamptz | |

### `business_hours`
Embedded in `country.business_hours` jsonb. Schema:
```json
{
  "timezone": "Asia/Riyadh",
  "weekly": {
    "sunday": [{"open": "09:00", "close": "18:00"}],
    "monday": [{"open": "09:00", "close": "18:00"}],
    "..." : "..."
  },
  "holidays": [
    {"date": "2026-09-23", "name": "Saudi National Day", "closed": true}
  ]
}
```

---

## Module 2 — Catalog

### `category`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text | base slug for cross-locale reference |
| parent_id | uuid FK → category | nullable for root |
| sort | int | |
| image_id | uuid FK → media_asset | |
| active | boolean | |

### `category_translation`
| Column | Type | Notes |
|---|---|---|
| category_id | uuid FK | |
| locale | text FK → locale.code | |
| name, slug, description, meta_title, meta_desc | text | slug UNIQUE per locale |
| PK | (category_id, locale) | |

### `product_group`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text UNIQUE | |
| sort | int | |
| hero_image_id | uuid FK | |
| active | boolean | |

### `product_group_translation`
| Column | Type | Notes |
|---|---|---|
| group_id | uuid FK | |
| locale | text FK | |
| name, slug, intro_md, meta_title, meta_desc | text | |
| faq | jsonb | array of `{q, a}` |
| PK | (group_id, locale) | |

### `product`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sku | text UNIQUE | |
| brand | text | |
| status | text | `'draft' | 'active' | 'archived'` |
| group_id | uuid FK → product_group | nullable |
| primary_image_id | uuid FK → media_asset | |
| created_at, updated_at | timestamptz | |

### `product_translation`
| Column | Type | Notes |
|---|---|---|
| product_id | uuid FK | |
| locale | text FK | |
| name, slug, description, features_md, meta_title, meta_desc | text | slug UNIQUE per locale |
| use_cases | jsonb | array of strings |
| PK | (product_id, locale) | |

### `product_variant`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK | |
| sku | text UNIQUE | |
| height_cm | int | |
| max_load_kg | int | |
| folded_cm | int | |
| weight_kg | numeric(6,2) | |
| step_count | int | |
| material | text | enum: `'aluminum' | 'fiberglass' | 'steel'` |
| ladder_type | text | enum: `'telescopic' | 'folding' | 'extension' | 'step' | 'multi_purpose'` |
| attributes | jsonb | extension point for type-specific specs |
| created_at, updated_at | timestamptz | |

### `product_image`, `product_video`, `product_certification`
Schemas per Master Plan v4 §6.

---

## Module 3 — Pricing & Costs

> **🟢 Confirmed and locked 2026-05-07** — Per-country pricing & availability MUST be stored in `variant_country_price` keyed by `(variant_id, country_id)`. Hardcoded country fields (`price_sa`, `price_eg`, etc.) are **forbidden**. See `11-admin-ui/06-product-add-edit-workflow.md` for the admin matrix UI specification, and tracker decision **D-COUNTRY-014**.

### `variant_country_price`
| Column | Type | Notes |
|---|---|---|
| variant_id | uuid FK | |
| country_id | uuid FK | |
| regular_price | numeric(12,2) | |
| sale_price | numeric(12,2) | nullable |
| sale_starts_at, sale_ends_at | timestamptz | |
| currency_code | text | snapshot from `country.currency_code` |
| active | boolean DEFAULT true | per-country product activation |
| lead_time_days | int DEFAULT 2 | |
| low_stock_threshold | int DEFAULT 5 | |
| min_selling_price | numeric(12,2) | |
| max_selling_price | numeric(12,2) | |
| suggested_selling_price | numeric(12,2) | |
| tax_mode | text | inherits from country if null |
| **delivery_promise_note** | **text NULL** | **Per-(variant, country) override of country-level delivery copy. Confirmed 2026-05-07.** |
| updated_by | uuid FK → user | |
| updated_at | timestamptz | |
| PK | (variant_id, country_id) | |

### `variant_country_cost` **[RLS]**
| Column | Type | Notes |
|---|---|---|
| variant_id | uuid FK | |
| country_id | uuid FK | |
| actual_cost | numeric(12,2) | **RLS-protected** |
| currency_code | text | |
| valid_from | timestamptz | |
| updated_by | uuid FK → user | |
| updated_at | timestamptz | |
| PK | (variant_id, country_id) | |

### `variant_marketer_cost` **[RLS]**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| variant_id | uuid FK | |
| country_id | uuid FK | |
| marketer_id | uuid FK → marketer | nullable |
| tier_id | uuid FK → marketer_tier | nullable |
| campaign_id | uuid FK → campaign | nullable |
| marketer_cost | numeric(12,2) | |
| currency_code | text | |
| priority | int | specificity tie-break |
| valid_from | timestamptz | |
| updated_by | uuid FK → user | |

### `pricing_rule`, `price_simulation`, `cost_history`, `profit_floor_rule`, `profit_guardrail_log`
Schemas per Master Plan v4 §15. Detailed columns TBD; documented when Phase 5 design reviewed.

---

## Module 4 — Stock & Warehouses

> 🟢 **Inventory authority locked 2026-05-09 (D-COUNTRY-013 Answered):** **Admin Dashboard / Directus-style admin management is the Phase 1 inventory source of truth.** Warehouse stock, product-country availability, stock adjustments, and stock reservations are all managed from the platform/admin dashboard. **No external ERP is required for Phase 1; no two-way ERP sync; no ERP dependency blocks Phase 1.** ERP integration deferred to Phase 10+ or until business requirements justify it; future ERP integration must use provider-agnostic patterns (no hardcoded ERP provider). Existing n8n / WhatsApp workflows MUST read platform inventory, not an external ERP. Inventory updates respect Country Access Control (D-CSP-001) + RBAC. Stock changes audit-logged via `stock_movement` + `country_data_audit`. Manual adjustments require reason ≥ standard threshold + audit log. See `27-readiness-engine/01-unified-readiness.md` for inventory readiness checks; `11-admin-ui/01-information-architecture.md` Operations / Warehouses + Stock for the canonical admin surface.


> **🟢 Confirmed and locked 2026-05-07** — Per-warehouse stock MUST be stored in `variant_warehouse_stock` keyed by `(variant_id, warehouse_id)`. Hardcoded country/warehouse stock fields (`stock_sa`, `stock_eg`, etc.) are **forbidden**. The admin Product Add/Edit "Warehouse Stock" tab displays this dynamically. See `11-admin-ui/06-product-add-edit-workflow.md` and tracker decision **D-COUNTRY-014**.

### `warehouse`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | text UNIQUE | e.g., `'RUH-01'`. **Locked after creation** — cannot be edited (snapshotted in stock_movement and order rows). |
| name | text | |
| country_id | uuid FK | **Locked after creation** — to "move" a warehouse, archive old + create new. |
| city | text | Free text — supports new cities without code change. |
| district | text | |
| address_line | text | |
| type | text | enum: `'main' \| 'satellite' \| 'virtual' \| '3pl'` |
| manager_user_id | uuid FK → user | |
| priority | int | for Stock Source Priority engine; lower = higher priority |
| shipping_coverage | jsonb | array of city/region patterns |
| **contact_person** | **text NULL** | **NEW — Site manager name. Confirmed 2026-05-07.** |
| **phone** | **text NULL** | **NEW — Contact phone, E.164 format. Confirmed 2026-05-07.** |
| **notes** | **text NULL** | **NEW — Free-text admin notes. Confirmed 2026-05-07.** |
| **archived_at** | **timestamptz NULL** | **NEW — Set when archived; null when active or merely inactive. Confirmed 2026-05-07.** |
| **archived_by** | **uuid FK → user NULL** | **NEW — Who archived. Confirmed 2026-05-07.** |
| **archive_reason** | **text NULL** | **NEW — Min 30 chars when set. Confirmed 2026-05-07.** |
| active | boolean | `true`=active; `false`=inactive (reactivatable) OR archived (when `archived_at` not null). |
| created_at, updated_at | timestamptz | |

> **Lifecycle states (per `11-admin-ui/07-warehouse-management.md`):**
> - **Active**: `active=true, archived_at=NULL`
> - **Inactive**: `active=false, archived_at=NULL` — temporarily off, reactivatable
> - **Archived**: `archived_at IS NOT NULL` — permanent retirement; rare unarchive needs Super Admin
> - **Hard-deleted**: row removed; only allowed when zero linked records (other than audit_log entries which are preserved). Super Admin only.
>
> Stock-safety check enforced server-side before deactivate/archive: blocks if any `qty_on_hand - qty_reserved > 0`, `qty_reserved > 0`, pending `stock_transfer`, or unfulfilled order references this warehouse.

### `variant_warehouse_stock`
| Column | Type | Notes |
|---|---|---|
| variant_id | uuid FK | |
| warehouse_id | uuid FK | |
| qty_on_hand | int DEFAULT 0 | |
| qty_reserved | int DEFAULT 0 | |
| qty_damaged | int DEFAULT 0 | |
| qty_returned | int DEFAULT 0 | |
| qty_inbound | int DEFAULT 0 | |
| low_stock_threshold | int | |
| reorder_point | int | |
| restock_date | date | |
| last_counted_at | timestamptz | |
| active | boolean | |
| PK | (variant_id, warehouse_id) | |

### `stock_movement`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| variant_id | uuid FK | |
| warehouse_id | uuid FK | |
| type | text | `'inbound' | 'outbound' | 'transfer_in' | 'transfer_out' | 'damage' | 'return_to_stock' | 'count_adjustment'` |
| qty | int | signed |
| reference_type | text | `'order' | 'return' | 'transfer' | 'manual' | 'import'` |
| reference_id | uuid | |
| reason | text | |
| performed_by | uuid FK → user | |
| created_at | timestamptz | |

### `stock_reservation`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| variant_id | uuid FK | |
| warehouse_id | uuid FK | |
| qty | int | |
| cart_id | uuid FK | nullable |
| draft_order_id | uuid FK | nullable |
| order_id | uuid FK | nullable |
| expires_at | timestamptz | |
| status | text | `'active' | 'consumed' | 'expired' | 'released'` |
| created_at | timestamptz | |

### `stock_transfer`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| source_warehouse_id | uuid FK | |
| dest_warehouse_id | uuid FK | |
| variant_id | uuid FK | |
| qty | int | |
| status | text | `'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled'` |
| requested_by | uuid FK → user | |
| approved_by | uuid FK → user | nullable |
| dispatched_at, received_at | timestamptz | |
| notes | text | |

### `damaged_stock`, `returned_stock`, `inbound_stock`, `reorder_rule`
Auxiliary tables. TODO: detail when warehouse module designed in Phase 9.

---

## Module 5 — Customer

### `customer`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| phone | text UNIQUE | E.164; primary identifier |
| email | text | nullable |
| first_name, last_name | text | |
| type | text | `'b2c' | 'b2b' | 'vip'` |
| default_country_id | uuid FK | |
| default_locale | text FK | |
| last_seen_at | timestamptz | |
| created_at | timestamptz | |
| deleted_at | timestamptz | nullable (GDPR-style) |

### `customer_address`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK | |
| label | text | e.g., 'Home', 'Office' |
| country_id | uuid FK | |
| region, city, district, street, building, apartment, postal_code, landmark | text | postal optional in IQ |
| is_default | boolean | |

### `customer_intelligence`
| Column | Type | Notes |
|---|---|---|
| customer_id | uuid PK FK | |
| last_viewed_variant_id | uuid FK | |
| last_viewed_at | timestamptz | |
| product_interest_scores | jsonb | variant_id → score |
| group_interest_scores | jsonb | |
| preferred_locale, preferred_country_id, preferred_channel | text/uuid | |
| source_campaign_id, source_marketer_id, first_seen_at | mixed | |
| buying_probability | numeric(4,3) | |
| cancellation_risk | numeric(4,3) | |
| b2b_potential | numeric(4,3) | |
| avg_order_value | numeric(12,2) | |
| total_orders | int | |
| complaint_count, return_count | int | |
| last_complaint_at | timestamptz | |
| cohort | text | |
| segment_tags | jsonb | |
| updated_at | timestamptz | |

### `customer_consent`, `customer_opt_out`, `customer_segment`, `customer_segment_membership`, `customer_score`, `customer_journey_event`, `customer_preference`
Schemas detailed when Phase 4 Customer Messaging is designed.

### `b2b_account`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK | |
| company_name | text | |
| tax_id | text | KSA VAT / EG Tax ID / IQ CR |
| contact_role | text | |
| credit_terms | text | `'prepay' | 'net_30' | 'net_60'` |
| price_tier_id | uuid FK | |
| account_manager_id | uuid FK → user | |

---

## Module 6 — Cart & Order

> 🟢 **Naming convention locked 2026-05-07 (D-DB-001 Answered):**
> - **Main table = `customer_orders`** (plural). Avoids the Postgres `ORDER BY` reserved-word collision and removes any quoting friction in queries / migrations / reports / joins / APIs / future integrations. Forbidden: bare `order` table name OR quoted `"order"` references in any new schema, query, or migration. CI grep test rejects either.
> - **Child tables retain `order_*` prefix where already standardized** — `order_line`, `order_event`, `order_address`, `order_profit_snapshot`, `order_source_attribution`, `order_risk_score` — because `order_X` does not collide with the SQL `ORDER BY` keyword (only the bare token `order` does).
> - **Future child tables** follow the same rule: use `customer_order_payments`, `customer_order_addresses` etc. only if no equivalent `order_*` name is already standardized; preserve existing standardized child names.
> - **FK column names** stay as `order_id` (also non-colliding with SQL keywords; massive churn to rename across audit/cart/marketer-attribution/payments tables for marginal clarity benefit).
> - **Webhook event names** stay as `order.created`, `order.confirmed`, etc. — external API contract; entity-action dot syntax never runs as SQL. The entity backing these events is `customer_orders` (documented in `02-api/03-webhook-events.md`).

### `cart`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK | nullable for guest |
| guest_token | text | nullable for logged-in |
| country_id | uuid FK | |
| locale | text FK | |
| source | text | `'web' | 'whatsapp' | 'admin' | 'landing' | 'chat'` |
| marketer_ref | text | from cookie/utm |
| coupon_codes | jsonb | array |
| created_at, updated_at, abandoned_at | timestamptz | |

### `cart_line`, `cart_event`, `draft_order`
Per Master Plan v4 §6.

### `customer_orders` (renamed from `order` per D-DB-001 🟢 2026-05-07)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| number | text UNIQUE | human-readable e.g., `SA-2026-001247` |
| customer_id | uuid FK | |
| country_id | uuid FK | |
| locale | text FK | |
| status | text | `'pending' | 'pending_confirmation' | 'pending_cod_confirmation' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'` |
| channel | text | `'web' | 'whatsapp' | 'admin' | 'b2b' | 'landing'` |
| landing_page_id | uuid FK | nullable |
| conversation_id | uuid FK | nullable |
| marketer_id | uuid FK | nullable |
| marketer_link_id | uuid FK | nullable |
| coupon_ids | jsonb | |
| totals | jsonb | full breakdown |
| payment_method | text | |
| payment_status | text | |
| shipping_method | text | |
| shipping_status | text | |
| zatca_invoice_id | text | KSA only |
| notes | text | |
| created_at, confirmed_at, deleted_at | timestamptz | |

### `order_line` **[RLS on cost columns]**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_id | uuid FK → `customer_orders.id` | (column name preserved; references the renamed `customer_orders` table) |
| variant_id | uuid FK | |
| qty | int | |
| unit_selling_price | numeric(12,2) | |
| currency_code | text | |
| actual_cost_snapshot | numeric(12,2) | **[RLS]** |
| marketer_cost_snapshot | numeric(12,2) | **[RLS]** |
| shipping_share | numeric(12,2) | |
| payment_fee_share | numeric(12,2) | |
| discount_share | numeric(12,2) | |
| platform_fee_percent_snapshot | numeric(5,4) | **[RLS]** |
| marketer_id_snapshot | uuid | |
| marketer_tier_snapshot | uuid | |
| marketer_profit_snapshot | numeric(12,2) | |
| business_gross_profit_snapshot | numeric(12,2) | **[RLS]** |
| name_snapshot, sku_snapshot | text | |
| coupon_snapshot, campaign_snapshot | jsonb | |

### `order_address`, `order_event`, `order_profit_snapshot`, `order_source_attribution`, `order_risk_score`
Detailed in `02-tables-by-module-extras.md` (TODO).

---

## Module 7 — Payments

### `payment_provider`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | text UNIQUE | `'stripe' | 'moyasar' | 'tap' | 'paymob' | 'fawry' | 'zaincash' | 'cod'` etc. |
| name | text | |
| countries | jsonb | array of country codes |
| supported_methods | jsonb | array of payment_method codes |
| active, test_mode | boolean | |

### `payment_method`, `payment_transaction`, `payment_log`, `payment_webhook_log`, `refund`, `refund_request`, `dispute`, `payment_link`, `deposit`, `invoice`, `store_credit`
Detailed in Phase 7 design.

---

## Module 8 — Conversations & AI

### `conversation`, `chat_session`, `message`, `conversation_state_log`, `ai_tool_call`, `ai_response`, `ai_prompt`, `response_template`, `handoff_request`, `escalation_log`, `faq_policy`, `sales_playbook`, `ai_setting`, `ai_cache`
Per Master Plan v4 §6.5.

`message` notable columns: text_raw, text_redacted (PII-redacted version for analytics), intent_label, confidence, llm_model, prompt_version_id, tokens_in, tokens_out, latency_ms.

`faq_policy` includes `embedding vector(1024)` for pgvector.

---

## Module 9 — Auto Reply

`reply_profile`, `reply_template`, `reply_template_version`, `reply_rule`, `reply_channel`, `tone_profile`, `auto_reply_business_hours`, `reply_resolution_log`, `reply_approval`.

Detailed in `04-ai/05-guardrails.md` and Phase 3 design.

---

## Module 10 — Customer Messaging

`messaging_channel`, `message_template`, `message_template_version`, `message_campaign`, `message_campaign_segment`, `message_queue`, `message_log`, `message_delivery_status`, `message_reply`, `satisfaction_survey`, `satisfaction_response`, `review_request`, `review_media_permission`, `messaging_automation_rule`, `messaging_frequency_cap`, `messaging_quiet_hours`.

Detailed in Phase 4 design.

---

## Module 11 — Marketers

`marketer_tier`, `marketer`, `marketer_account`, `marketer_coupon`, `marketer_referral_link`, `marketer_campaign`, `marketer_event`, `marketer_order_attribution`, `marketer_payout`, `marketer_payout_item`, `marketer_quality_score`, `marketer_quality_log`, `marketer_fraud_flag`, `marketer_training_asset`, `marketer_content_submission`.

Detailed in Phase 5 design.

---

## Module 12 — Coupons & Campaigns

`coupon`, `coupon_rule`, `coupon_usage`, `campaign`, `campaign_group`, `campaign_product`, `campaign_attribution`, `campaign_profit_forecast`.

Detailed in Phase 5 design.

---

## Module 13 — Landing Pages & SEO

`landing_page`, `landing_page_variant`, `group_sales_page`, `seo_page`, `guide`, `faq`, `redirect`, `sitemap_entry`, `internal_link_suggestion`, `seo_audit_item`, `ab_test`, `ab_test_result`.

---

## Module 14 — Media

`media_asset`, `media_variant`, `media_manifest` (or merged with media_asset), `media_usage`, `media_performance`, `social_proof_item`, `video_asset`.

`media_asset` columns: filename, source (`'shoot' | 'freepik' | 'ai' | 'supplier'`), license_type, license_ref, edited (bool), edit_notes, dimensions, format, usage_locations jsonb, review_date, alt_translations jsonb, created_by, created_at.

---

## Module 15 — B2B

`b2b_account`, `quote_request`, `quote_item`, `quote_pdf`, `price_agreement`, `company_contact`.

Detailed in Phase 8 design.

---

## Module 16 — Operations & Maintenance

`service_ticket`, `fault_report`, `warranty_claim`, `replacement_request`, `repair_request`, `serial_number`, `product_batch`, `packing_checklist`, `pre_dispatch_photo`, `courier_performance_log`, `delivery_failure`, `return_inspection`.

Detailed in Phase 9 design.

### Shipping & Logistics extension (🟢 D-OPS-010 locked 2026-05-09)

> Configurable provider system — see `20-shipping-logistics/01-overview.md` for full spec. NO shipping company / tariff / delivery promise / COD fee / return fee / shipping rule is hardcoded in application code; all live in these tables.

| Table | Phase | Highlights |
|---|---|---|
| `shipping_provider` | Phase 1 skeleton | Per-country couriers; `api_configured` boolean only — credentials in 1Password (`op://vtc-prod-infra/shipping/<provider_code>`); Class 1 soft-delete |
| `shipping_method` | Phase 1 skeleton | Per (country × provider); `standard` / `express` / `cod_delivery` / `return` / `manual` / `pickup`; delivery promise min/max days; customer-visible names per locale |
| `shipping_rate_card` | Phase 1 skeleton | Per (country × provider × method × city/zone); `numeric(12,2)` fees per D-DB-003; weight bands; volumetric rule; package size limits; time-bounded via `active_from` / `active_until`; Class 1 soft-delete |
| `shipping_zone` | Phase 1 skeleton | City / region grouping for tariff lookup |
| `shipping_rule` | Phase 1 skeleton | Rule engine: free shipping above amount, free shipping for products/categories, remote surcharge, heavy item surcharge, COD fee, return fee, failed delivery fee, provider priority, city coverage, restrictions, warehouse-to-city routing, fallback provider |
| `shipment` | Phase 2+ populate | Joins to `customer_orders.id` + provider + method; tracking number; status |
| `shipment_event` | Phase 9 populate | Courier webhook events: created / picked_up / in_transit / out_for_delivery / delivered / failed_delivery / returned / lost |

Full column specs in `20-shipping-logistics/01-overview.md` §B.

**KSA initial primary provider:** **J&T Express** (D-OPS-003 🟢 Answered 2026-05-09). Operational onboarding TODO list in `20-shipping-logistics/02-ksa-jt-express-onboarding.md`. Aramex / SMSA / Bosta listed as fallback / future providers (Phase 6+).

---

## Module 17 — API & Integrations

`api_client`, `api_token`, `api_scope`, `webhook_endpoint`, `webhook_log`, `webhook_delivery`, `integration_setting`, `pixel_event_log`.

---

## Module 18 — Reports & Intelligence

`report_definition`, `scheduled_report`, `report_export`, `dashboard_widget`, `notification_rule`, `data_quality_issue`, `decision_log`, `experimentation_log`, `ai_daily_brief`.

Detailed in Phase 10 design.

---

## Module 19 — System & Audit

### `user`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE | |
| hashed_password | text | bcrypt or argon2 |
| name | text | |
| role_id | uuid FK | |
| country_scope | jsonb | array of country codes; null = all |
| active | boolean | |
| last_login_at | timestamptz | |
| created_at | timestamptz | |

### `role`, `permission`, `role_permission`
Standard RBAC. Permission slugs in `03-rbac/02-permissions.md`.

### `user_country_access` (🟢 D-CSP-001 locked 2026-05-09; Phase 1 schema reservation; functional UI Phase 6)

Canonical source of truth for country access. `user.country_scope` jsonb is a denormalized read cache kept in sync via trigger.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → `user.id` | |
| country_id | uuid FK → `country.id` | |
| access_level | text | `'read' \| 'write' \| 'manage'` |
| assigned_by_user_id | uuid FK → `user.id` | who granted |
| assigned_at | timestamptz | |
| revoked_at | timestamptz NULL | Class 1 soft-delete column per D-DB-010 |
| revoked_by_user_id | uuid FK NULL | |
| revoke_reason | text NULL | required when revoked_at set |
| active | bool | denormalized: `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())` |
| expires_at | timestamptz NULL | optional time-limited grant |
| notes | text | |
| created_at, updated_at | timestamptz | |
| audit_log_id_last_change | uuid FK → `audit_log.id` | |

Indexes: `(user_id, active)`, `(country_id, active)`, `(user_id, country_id) WHERE revoked_at IS NULL` UNIQUE.

Class 1 soft-delete per D-DB-010. Full spec in `03-rbac/03-scopes.md` §C.

### `audit_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid FK → user | nullable for system |
| actor_type | text | `'user' | 'system' | 'api' | 'ai'` |
| action | text | |
| entity | text | table name |
| entity_id | uuid | |
| entity_country_id | uuid NULL | **🟢 D-CSP-004 added 2026-05-09** — country scope of the audited entity (NULL for global entities; non-NULL for country-scoped). Enables country-filtered audit views. Populated by insert trigger derived from entity FK where possible. |
| diff | jsonb | before/after |
| override_request_id | uuid FK | nullable, links to override |
| import_job_id | uuid FK | nullable, links to bulk import |
| ip | inet | |
| user_agent | text | |
| created_at | timestamptz | |

### `country_data_audit`
Specialized audit for country-scoped changes (price/cost/qty/active flag). See `03-rls-policies.md` for redaction rules.

### `approval`, `notification`, `export`, `backup`, `system_setting`
Standard system tables.

---

## Module 20 — Override Module (v4 addition)

### `override_request`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| override_type | text | enum (8 types) |
| entity, entity_id | text/uuid | |
| context_snapshot | jsonb | frozen state |
| proposed_action | jsonb | |
| guardrail_output | jsonb | nullable |
| reason | text NOT NULL | min 10 chars |
| reason_category | text NOT NULL | enum per type |
| expected_business_impact | numeric | nullable |
| expected_marketer_impact | numeric | nullable |
| status | text | `'pending' | 'approved' | 'rejected' | 'auto_approved' | 'expired'` |
| approval_required_role | text | |
| requires_dual_approval | boolean | |
| requested_by, approved_by, second_approved_by | uuid FK | |
| requested_at, approved_at, second_approved_at, rejected_at, applied_at, expires_at | timestamptz | |
| rejection_reason | text | |
| audit_log_id | uuid FK | |
| related_escalation_id | uuid FK | |
| created_at | timestamptz | |

### `override_policy`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| override_type | text UNIQUE | |
| default_approver_role | text | |
| requires_dual_approval | boolean | |
| max_validity_hours | int | |
| allowed_reason_categories | jsonb | array |
| notification_recipients | jsonb | |
| active | boolean | |

### `override_usage_summary` (materialized view)
Refreshed daily. Columns: override_type, period (day/week/month), count_requested, count_approved, count_rejected, count_auto_approved, total_business_impact, top_requesters, top_reasons.

---

## Module 21 — Import / Export Module (v4 addition)

### `import_export_job`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | text | `'import' | 'export'` |
| format | text | `'csv' | 'xlsx' | 'pdf' | 'json'` |
| entity | text | enum |
| status | text | `'queued' | 'validating' | 'preview_ready' | 'importing' | 'completed' | 'failed' | 'cancelled'` |
| source_file_url, output_file_url | text | |
| total_rows, valid_rows, invalid_rows | int | |
| preview_data | jsonb | |
| validation_errors | jsonb | per-row |
| options | jsonb | `{update_existing, dry_run, country_scope}` |
| guardrail_results | jsonb | nullable |
| initiated_by, approved_by | uuid FK | |
| started_at, finished_at, created_at | timestamptz | |

### `import_template`, `import_validation_rule`, `export_request`
Per v4 §1.1.

---

## Module 22 — Backup & Restore Module (v4 addition)

### `backup_job`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | text | `'full' | 'database' | 'media' | 'files'` |
| trigger | text | `'manual' | 'scheduled' | 'pre_risky_change'` |
| related_action_id, related_action_type | text/uuid | nullable |
| status | text | |
| size_bytes | bigint | |
| storage_url | text | |
| encryption_status | text | |
| checksum | text | SHA-256 |
| retention_until | timestamptz | |
| requested_by | uuid FK | |
| started_at, finished_at | timestamptz | |
| error | text | |

### `backup_schedule`, `restore_job`, `backup_verification`
Per v4 §1.2.

---

## Module 23 — Performance, Cleanup, Landing Intelligence & Alerts (v4 addition)

**Status:** 🟢 Schema reservations confirmed and locked 2026-05-07.
**Source:** `19-performance-growth/00-index.md` (D-PERF-001 🟢 Answered; module split into 9 per-topic files 2026-05-09).
**Phase placement:** Tables reserved-from-day-1 in Phase 1 migrations as empty schemas where applicable, populated when their UI module ships. Most tables ship Phase 6 (landing builder + intelligence) or Phase 10 (cleanup automation + alert engine). **No migration runs in Phase 0.**

> ⚠️ All schemas below are **planning-stage reservations**. Final column types and indexes are confirmed during the relevant phase design window. The reservation here prevents painful migrations later.

### `feature_flag` (Phase 10 — UI ships Phase 6+)

Per `19-performance-growth/...` §I.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| key | text UNIQUE | e.g., `enable_ai_chat`, `enable_landing_ab_test` |
| description | text | Plain-language purpose |
| status | text | `'active' \| 'paused' \| 'archived'` |
| country_id | uuid FK NULL | Per-country rollout (NULL = global) |
| locale | text NULL | Per-locale rollout |
| user_role | text NULL | Restrict to specific role(s) |
| percentage_rollout | int | 0–100 |
| start_at, end_at | timestamptz | Time-windowed activation |
| rollback_url | text | One-click disable endpoint |
| owner_user_id | uuid FK | |
| audit_log_id_last_change | uuid FK | Pointer to audit row of last flip |
| created_at, updated_at | timestamptz | |

Audit trigger required: every flag flip writes an `audit_log` row.

### `script_inventory` (Phase 6)

Per §A.6. Owner: **Security Lead + Marketing Manager jointly** (Security Lead approves risk/security; Marketing Manager owns business justification + activation need).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| script_name | text | E.g., "Meta Pixel", "TikTok Pixel" |
| source_url | text | URL of the script |
| owner_role | text | Marketing Manager (default) |
| security_reviewer_user_id | uuid FK | Security Lead approver |
| business_owner_user_id | uuid FK | Marketing Manager owner |
| active_pages | text[] | homepage, landing, all, etc. |
| size_kb | int | Compressed wire size |
| performance_impact_lcp_ms | int | Measured LCP delta in ms |
| last_review_date | date | Quarterly review cycle |
| approval_status | text | `'pending' \| 'approved' \| 'paused'` |
| can_disable_without_reapproval | bool | Marketing autonomy flag |
| sandbox_required | bool | Custom scripts forced sandboxed in Cloudflare Worker |
| csp_directives | jsonb | CSP rules enforced |
| created_at, updated_at | timestamptz | |

Re-approval required if `last_review_date < now() - 90 days` (alert generated per §H.2.1).

### `landing_page_performance_history` (Phase 10)

Per §H.7.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| landing_page_id | uuid FK → `landing_page` | |
| measured_at | timestamptz | |
| lighthouse_mobile | int | 0–100 |
| lcp_ms | int | |
| inp_ms | int | |
| cls | numeric(4,3) | |
| page_weight_kb | int | |
| score | int | Composite score per §D.2 (0–100) |
| score_status | text | `'ready' \| 'needs_review' \| 'weak' \| 'do_not_publish'` |
| best_score_ever | int | Rolling max |
| worst_score_ever | int | Rolling min |
| regression_detected_at | timestamptz NULL | When score dropped >5 pts |
| regression_reason_auto | text NULL | Auto-detected hypothesis (heavy image, new script, cache miss spike) |
| owner_user_id | uuid FK | |
| last_optimized_at | timestamptz NULL | |

Indexed `(landing_page_id, measured_at DESC)` for fast history view.

### `cleanup_job` (Phase 1 reservation; cleanup execution Phase 10)

Per §F.3.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text UNIQUE | E.g., `expired_carts`, `orphan_media` |
| description | text | What it cleans + why |
| retention_policy_id | uuid FK → `retention_policy` | |
| schedule_cron | text | E.g., `0 3 * * *` (daily 03:00) |
| risk_level | text | `'low' \| 'medium' \| 'high'` |
| requires_approval | bool | High-risk = true |
| requires_pre_backup | bool | Triggers pre-risky-change auto-backup |
| owner_role | text | E.g., `dba`, `infra_lead` |
| status | text | `'enabled' \| 'paused' \| 'archived'` |
| last_run_id | uuid FK → `cleanup_job_run` | |
| created_at, updated_at | timestamptz | |

### `cleanup_job_run` (Phase 1 reservation; populated Phase 10)

Per §F.4 / §F.6.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| cleanup_job_id | uuid FK → `cleanup_job` | |
| triggered_at | timestamptz | |
| triggered_by | text | `'schedule' \| 'manual' \| 'incident'` |
| triggered_by_user_id | uuid FK NULL | NULL when schedule |
| approval_id | uuid FK → `approval` NULL | If approval gate |
| pre_backup_job_id | uuid FK → `backup_job` NULL | If `requires_pre_backup` |
| preview_summary | jsonb | records_affected, sample_rows, estimated_space_saved_bytes, affected_tables |
| status | text | `'preview' \| 'pending_approval' \| 'running' \| 'completed' \| 'failed' \| 'rolled_back'` |
| records_affected | bigint | |
| space_saved_bytes | bigint | |
| started_at, finished_at | timestamptz | |
| error | text NULL | |
| audit_log_id | uuid FK → `audit_log` | Mandatory audit entry |
| rollback_available | bool | true if reversible from backup |

### `retention_policy` (Phase 1 reservation; admin UI Phase 10)

Per §F.2. Editable from `/admin/system/retention-policies` by Super Admin + Finance Admin only.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| data_type | text UNIQUE | E.g., `orders`, `audit_logs`, `webhook_logs`, `temporary_uploads` |
| retention_duration_days | int | Default per §F.2 |
| legal_basis | text NULL | E.g., "KSA tax law 7-year retention" |
| country_id | uuid FK NULL | NULL = global; non-NULL for country-specific legal retention |
| editable_by_role | text | Default: `'super_admin,finance_admin'` |
| min_retention_days | int | Lower bound (cannot lower below this without legal sign-off) |
| max_retention_days | int NULL | Upper bound |
| current_value_changed_by | uuid FK | |
| current_value_changed_at | timestamptz | |
| audit_log_id | uuid FK → `audit_log` | Pointer to last change |
| created_at, updated_at | timestamptz | |

Versioning: every change inserts a `retention_policy_history` row (Phase 10 add-on).

### `alert` (Phase 1 reservation skeleton; engine Phase 10)

Per §H.4. Phase 1 ships read-only Alerts Center with Performance + Database + Backup category support; remaining categories (Landing/Cleanup/Payment/WhatsApp/AI/Business) light up Phase 6/10.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| category | text | One of `'performance' \| 'landing_page' \| 'database' \| 'data_cleanup' \| 'payment' \| 'whatsapp_messaging' \| 'ai' \| 'business'` |
| severity | text | `'info' \| 'low' \| 'medium' \| 'high' \| 'critical'` |
| title | text | One-line summary |
| description | text | Details + context |
| affected_entity_type | text | E.g., `'landing_page' \| 'product' \| 'order' \| 'webhook' \| 'job'` |
| affected_entity_id | uuid NULL | |
| country_id | uuid FK NULL | Country scope |
| owner_role | text | Auto-assigned by category |
| owner_user_id | uuid FK NULL | Specific assignee |
| status | text | `'triggered' \| 'assigned' \| 'acknowledged' \| 'investigating' \| 'resolved' \| 'closed'` |
| triggered_at | timestamptz | |
| acknowledged_at | timestamptz NULL | |
| resolved_at | timestamptz NULL | |
| resolution_notes | text NULL | |
| related_dashboard_url | text NULL | |
| related_runbook_url | text NULL | |
| sla_seconds | int NULL | E.g., 900 for Critical |
| escalated_at | timestamptz NULL | If SLA breached |
| created_at, updated_at | timestamptz | |

Indexed `(status, severity, triggered_at DESC)` for Alerts Center list view; `(owner_user_id, status)` for "my open alerts."

### `alert_subscription` (Phase 10)

Per §H. Defines who gets notified for which categories/severities/countries.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| role | text NULL | Optional role-based rule (when user_id is NULL) |
| category | text | Or `'*'` for all categories |
| min_severity | text | `'info' \| 'low' \| 'medium' \| 'high' \| 'critical'` |
| country_id | uuid FK NULL | Country scope; NULL = all |
| channels | text[] | E.g., `['whatsapp','email','dashboard']` |
| escalate_after_seconds | int NULL | Personal escalation override |
| active | bool | |
| created_at, updated_at | timestamptz | |

### `notification_rule` (Phase 10)

Per §H. Rule engine that maps alert (category, severity) → notification template + recipient set.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text UNIQUE | |
| match_category | text | Or `'*'` |
| match_min_severity | text | |
| match_country_id | uuid FK NULL | |
| recipient_role | text NULL | |
| recipient_user_ids | uuid[] NULL | |
| channels | text[] | |
| template_key | text | Reference to `messaging_template` |
| escalation_rule_id | uuid FK NULL | Self-reference for escalation chain |
| active | bool | |
| created_at, updated_at | timestamptz | |

### `media_quality_issue` (Phase 10 — Auto Image Quality Scanner)

Per §B.4. Output of nightly scanner.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| media_asset_id | uuid FK → `media_asset` | |
| issue_type | text | `'oversized' \| 'missing_alt' \| 'duplicate' \| 'wrong_dimensions' \| 'unused' \| 'low_quality_bg' \| 'wrong_branding' \| 'missing_product_association'` |
| severity | text | `'low' \| 'medium' \| 'high'` |
| detection_rule_version | text | E.g., `'v1.0'` |
| detected_at | timestamptz | |
| context_jsonb | jsonb | E.g., perceptual hash, OCR result, file size |
| suggested_fix | text | |
| resolved_at | timestamptz NULL | |
| resolved_by | uuid FK NULL | |
| resolution_action | text NULL | E.g., `'recompressed'`, `'replaced'`, `'archived'` |

### `landing_page_quality_gate_run` (Phase 6)

Per §D.1. One row per pre-publish quality gate check execution.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| landing_page_id | uuid FK → `landing_page` | |
| triggered_at | timestamptz | |
| triggered_by_user_id | uuid FK | |
| trigger | text | `'publish' \| 'preview' \| 'scheduled_recheck' \| 'dependency_change'` |
| overall_status | text | `'passed' \| 'blocked' \| 'pending_approval' \| 'overridden'` |
| critical_failures | jsonb | Array of `{check_key, details}` |
| high_warnings | jsonb | Array |
| info_findings | jsonb | Array |
| score_snapshot | int | Landing Page Score at run time (per §D.2) |
| approver_user_id | uuid FK NULL | Who approved (if pending_approval cleared) |
| override_request_id | uuid FK → `override_request` NULL | If `landing_quality_gate_override` was used |
| created_at | timestamptz | |

### `landing_page_compliance_rule` (Phase 6)

Per §D.6. Pattern catalogue used by the compliance scanner.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| rule_key | text UNIQUE | E.g., `false_safety_claim`, `fake_certificate`, `unsupported_best_in_market` |
| description | text | Plain-language explanation |
| pattern_type | text | `'regex' \| 'keyword_set' \| 'cert_cross_check' \| 'price_cross_check' \| 'whatsapp_cross_check'` |
| pattern_payload | jsonb | E.g., regex strings, keyword arrays, target table for cross-check |
| severity | text | `'critical' \| 'high'` |
| applies_to_locales | text[] | E.g., `['ar-sa','ar-eg','ar-iq']` for Arabic-only checks |
| applies_to_countries | uuid[] NULL | NULL = all |
| forbidden_examples | jsonb | Sample bad strings |
| allowed_examples | jsonb | Sample acceptable phrasings |
| jurisdiction_basis | text NULL | E.g., "KSA Saudi Standards Org" |
| active | bool | |
| created_at, updated_at | timestamptz | |

---

### Reservation summary table

| Table | Phase reserved (empty migration) | Phase populated / UI ships |
|---|---|---|
| `feature_flag` | Phase 1 (skeleton) | UI Phase 6+; runtime Phase 10 |
| `script_inventory` | Phase 6 | Phase 6 (landing builder ship) |
| `landing_page_performance_history` | Phase 6 | Phase 10 (RUM-fed history) |
| `cleanup_job` | Phase 1 (skeleton) | Phase 10 (cleanup automation) |
| `cleanup_job_run` | Phase 1 (skeleton) | Phase 10 |
| `retention_policy` | Phase 1 (skeleton + 13 seed rows per §F.2) | Phase 10 (admin UI) |
| `alert` | Phase 1 (read-only skeleton) | Phase 6/10 (full categories) |
| `alert_subscription` | Phase 10 | Phase 10 |
| `notification_rule` | Phase 10 | Phase 10 |
| `media_quality_issue` | Phase 10 | Phase 10 (Auto Image Quality Scanner) |
| `landing_page_quality_gate_run` | Phase 6 | Phase 6 |
| `landing_page_compliance_rule` | Phase 6 | Phase 6 |

**Cross-references:**
- Module 13 (`landing_page`, `landing_page_variant`, `ab_test`) — extended schema fields per §C.1.
- Module 14 (`media_asset`, `media_variant`) — `media_quality_issue` joins via `media_asset_id`.
- Module 19 (`audit_log`) — every cleanup/feature-flag/retention-policy change writes `audit_log` row.
- Module 20 (`override_request`, `override_policy`) — 5 new override types per `10-overrides/01-override-types.md`.
- Module 22 (`backup_job`) — pre-cleanup auto-backup writes `backup_job` row first.

---

## Module 24 — Decision & Recommendation Engine (v4.5 addition)

**Status:** 🟢 Schema reservations confirmed and locked 2026-05-07 (D-DEC-001).
**Source:** `24-decision-engine/01-overview.md`.
**Phase placement:** Phase 1 reserves `product_variant.suitability_scores jsonb` column. Other tables ship Phase 6.

| Table | Phase | Highlights |
|---|---|---|
| `product_variant.suitability_scores` (column) | Phase 1 | jsonb — keys are use-case slugs; values are 0–100 scores |
| `recommendation_use_case` | Phase 6 | Use-case taxonomy: villa, home, contractor, electrician, warehouse, technician, B2B, car-fit |
| `recommendation_rule` | Phase 6 | Per (use_case, variant) computed score + reasoning template + hard-constraint snapshot |
| `recommendation_event` | Phase 6 | One row per recommendation served on any surface |
| `recommendation_warning_log` | Phase 6 | "Don't sell wrong ladder" warning audit |

Full column specs in `24-decision-engine/01-overview.md`.

---

## Module 25 — Safety & Compliance (v4.5 addition)

**Status:** 🟢 Schema reservations confirmed and locked 2026-05-07 (D-SAFE-001).
**Source:** `25-safety-compliance/01-overview.md`.
**Phase placement:** Phase 1 reserves all schemas + AI guardrail integration. Admin UI Phase 6.

| Table / column | Phase | Highlights |
|---|---|---|
| `safety_guideline` | Phase 6 | Approved truth source for what platform can say |
| `safety_claim` | Phase 6 | Approved claims with evidence + jurisdictions + valid_until |
| `safety_claim_approval` | Phase 6 | Audit history per approval workflow event |
| `safety_incident_report` | Phase 6 | 10-year retention; auto-Critical-alert on insert |
| `country.compliance_profile` (column) | Phase 1 jsonb | KSA seeded Phase 1; EG/IQ Phase 8 |

Full column specs in `25-safety-compliance/01-overview.md`.

---

## Module 26 — Trust Layer (v4.5 addition)

**Status:** 🟢 Schema reservations confirmed and locked 2026-05-07 (D-TRUST-001).
**Source:** `26-trust-layer/01-overview.md`.
**Phase placement:** Phase 1 reserves review tables. Collection Phase 4 (WhatsApp). Surface Phase 6.

| Table | Phase | Highlights |
|---|---|---|
| `customer_review` | Phase 1 reserve / Phase 4 collect | Order-linked verified reviews; 5-star schema |
| `customer_review_media` | Phase 4 | Customer photos with explicit publish-permission |
| `customer_review_approval_log` | Phase 4 | Audit trail per review approval event |
| `v_verified_purchase_review` (view) | Phase 6 | Read-side derivation: order_id NOT NULL + order delivered |

Full column specs in `26-trust-layer/01-overview.md`.

---

## Module 27 — Readiness Engine (v4.5 addition)

**Status:** 🟢 Schema reservations confirmed and locked 2026-05-07 (D-READY-001).
**Source:** `27-readiness-engine/01-unified-readiness.md`.
**Phase placement:** Phase 1 reserves `readiness_check_run`. Existing `country_launch_readiness` + `product_country_readiness` + `landing_page_quality_gate_run` continue Phase 1; Phase 6 refactor unifies them. Phase 10 ships dashboard.

| Table | Phase | Highlights |
|---|---|---|
| `readiness_check_definition` | Phase 6 | Catalogue of all things checkable (~50 entries) |
| `readiness_check_run` | Phase 1 reserve / Phase 6+ populate | One row per check execution |
| `readiness_blocker` | Phase 6 | Aggregated open failures per entity |
| `deploy_log` | Phase 1 reserve / Phase 10 UI | Promotion checklist evidence per deploy |

Full column specs in `27-readiness-engine/01-unified-readiness.md`.

---

## Country denormalization columns added Phase 1 (🟢 D-CSP-004 locked 2026-05-09)

Per `03-rbac/03-scopes.md` §E. Every leaf-level country-scoped table includes `country_id` (or `country_id_snapshot` for immutable historical records) directly. Drift mitigation via CHECK constraint or trigger asserting parent country match.

| Table | Column added | Type | Notes |
|---|---|---|---|
| `audit_log` | `entity_country_id` | uuid NULL | NULL for global entities; non-NULL for country-scoped (already added above) |
| `order_line` | `country_id_snapshot` | uuid NOT NULL | snapshot at order creation; immutable; matches `customer_orders.country_id` at insert time |
| `order_event` | `country_id_snapshot` | uuid NOT NULL | matches parent customer_orders |
| `cart_line` | `country_id` | uuid NOT NULL | drift-checked against parent cart |
| `cart_event` | `country_id` | uuid NOT NULL | matches parent cart |
| `payment_transaction` | `country_id_snapshot` | uuid NOT NULL | snapshot at transaction creation |
| `refund` | `country_id_snapshot` | uuid NOT NULL | snapshot at refund creation |
| `recommendation_warning_log` | `country_id` | uuid NOT NULL | per-recommendation country |

These columns enable simple, index-friendly RLS policies per the country-scope template in `01-database/03-rls-policies.md`.

## Cross-cutting columns added Phase 1 (per Strategic Enhancements 2026-05-07)

| Column | Table | Notes |
|---|---|---|
| `suitability_scores jsonb` | `product_variant` | Module 24; default `'{}'::jsonb` |
| `landed_cost_components jsonb` | `variant_country_cost` | Reservation; populated Phase 8 (multi-country); breakdown: supplier_cost, intl_shipping, customs, local_handling, storage, damage_allowance, payment_fees |
| `compliance_profile jsonb` | `country` | Module 25; KSA seeded Phase 1 |
| `version int DEFAULT 1` | `media_asset` | Asset versioning for evidence-of-claim regulations |
| `recall_flag bool DEFAULT false` | `product_batch` | Phase 1 reserve; populated Phase 9 |
| `incident_count int DEFAULT 0` | `product_batch` | Increment-on-incident-insert via trigger |
| `phone_normalized text UNIQUE` | `customer` | Phone deduplication per D-OWN-001 (sugg. I); E.164 format |
| `outcome_category text` | `return_inspection` | Phase 9; defective / wrong-size / customer-changed-mind / damage-in-transit / fraud |

---

## Cost-read audit logging (D-RBAC-001 strengthening — Phase 1)

New table `cost_read_log` reserved Phase 1; populated when cost-bearing endpoint is hit.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| actor_user_id | uuid FK | |
| actor_role | text | |
| read_at | timestamptz | |
| entity_type | text | `variant_country_cost` / `variant_marketer_cost` / `order_line.actual_cost_snapshot` / etc. |
| entity_id | uuid | |
| ip | inet | |
| user_agent | text | |
| context | text | API endpoint / admin screen / report path |
| redacted | bool | true if value was returned redacted |

Indexed `(actor_user_id, read_at DESC)` for "who read what cost" queries.

Strengthens D-RBAC-001 by adding read-path audit (writes already covered by `country_data_audit`).

---

## TODO

- TODO: detail every Phase 4–10 table schema during respective phase design windows.
- ~~TODO: confirm `order` table reserved-word collision in Postgres; consider `customer_order` if needed.~~ — 🟢 **ANSWERED 2026-05-07 (D-DB-001):** renamed to `customer_orders` (plural). See Module 6 callout.
- ~~TODO: confirm UUID generation strategy (`gen_random_uuid()` from pgcrypto vs `uuid_generate_v4()` from uuid-ossp).~~ — 🟢 **ANSWERED 2026-05-07 (D-DB-002):** `gen_random_uuid()` from pgcrypto for ALL UUID PKs; `uuid_generate_v4()` and uuid-ossp forbidden. See Conventions section above.
- ~~TODO: review numeric precision per currency (IQD has 0 decimals)~~ — 🟢 **ANSWERED 2026-05-07 (D-DB-003):** `numeric(12,2)` for all monetary columns; display rounding via `country.price_rounding_pattern` + `currency.decimals`; minor-unit conversions in payment adapter only. See Conventions section above.
