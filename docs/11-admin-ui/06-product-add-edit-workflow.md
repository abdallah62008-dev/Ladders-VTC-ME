# Product Add / Edit Workflow

**Status:** 🟢 **Confirmed (locked) — 2026-05-07**
**Owner:** Product + Backend lead + Design lead
**Source:** Master Plan v4 §5 + business requirement confirmed 2026-05-07

> ⚠️ This is a **locked architectural and UI requirement**. Phase 1 implementation must follow this exactly. Any deviation requires an Override (D-OVR) with super-admin approval.

---

## 1. Confirmed requirement (do not deviate)

When adding or editing a product in Directus admin, the admin must define **price** and **availability** **per country** and **stock quantities** **per warehouse**, exclusively through dynamic relationships keyed by `country_id` and `warehouse_id`.

### Hardcoded fields are forbidden

The following column shapes **must never exist** in the schema:

```
❌ price_sa, price_eg, price_iq
❌ stock_sa, stock_eg, stock_iq
❌ available_sa, available_eg, available_iq
❌ active_sa, active_eg, active_iq
❌ any other field with a country code in its name
```

Adding a new country (e.g., UAE) must require **only** data inserts in `country`, `variant_country_price`, `variant_warehouse_stock`. Zero schema changes. Zero code changes. Zero deploys.

---

## 2. Product Add / Edit screen — tab structure

```
/admin/catalog/products/[id]
  ┌──────────────────────────────────────────────────────┐
  │ Tabs (left-to-right RTL/LTR aware):                   │
  ├──────────────────────────────────────────────────────┤
  │ 1. Basic Info                                         │
  │ 2. Translations         (per locale)                  │
  │ 3. Variants                                           │
  │ 4. Images & Videos                                    │
  │ 5. Certifications                                     │
  │ 6. Group Assignment                                   │
  │ 7. Country Pricing & Availability   ← THIS TAB        │
  │ 8. Warehouse Stock                  ← THIS TAB        │
  │ 9. Marketer Pricing                 (Phase 5)         │
  │ 10. SEO                                               │
  │ 11. AI Knowledge                    (Phase 3)         │
  │ 12. Audit Log                       (read-only)       │
  └──────────────────────────────────────────────────────┘
```

The two highlighted tabs are the focus of this document.

---

## 3. Tab 7 — Country Pricing & Availability

### 3.1 Purpose

Per (variant, country) pricing, availability, and selling-price guardrails. This is the data the storefront reads to decide whether a product is shown, at what price, in what currency, with what lead time.

### 3.2 Variant selector

If the product has multiple variants (e.g., 4m vs 5m heights), a variant selector at the top scopes the matrix below to one variant at a time.

```
Variant: [▼ TLA-440  4m height ▼]
```

### 3.3 Matrix layout

The matrix has **one row per active country** (sourced live from the `country` table where `country.active = true`):

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Country Pricing & Availability — Variant: TLA-440 (telescopic 4m)                                     │
├──────────┬────────┬──────────┬──────────┬──────────┬─────────┬─────────────┬───────┬───────┬─────────┤
│ Country  │ Active │ Currency │ Regular  │ Sale     │ Min     │ Max         │ Lead  │ Low-  │ Delivery │
│          │        │          │ Price    │ Price    │ Selling │ Selling     │ time  │ stock │ promise  │
│          │        │          │          │          │ Price   │ Price       │ days  │ thresh│ note     │
├──────────┼────────┼──────────┼──────────┼──────────┼─────────┼─────────────┼───────┼───────┼─────────┤
│ KSA      │ ✅ ON  │ SAR      │ 1,250.00 │ 1,150.00 │ 1,000.00│ 1,400.00    │ 2     │ 5     │ 1–2d Riy │
│ Egypt    │ ✅ ON  │ EGP      │ 8,500.00 │ —        │ 7,000.00│ 9,500.00    │ 4     │ 10    │ 2–4d Cai │
│ Iraq     │ ⛔ OFF │ IQD      │ —        │ —        │ —       │ —           │ —     │ —     │ —        │
│ + Add country row (only if country.active = true and not already in matrix)                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Cost row (visible only to roles with cost.read — RLS-enforced):
┌──────────┬─────────────────────┬──────────────────────────┐
│ Country  │ Actual Product Cost │ Marketer Base Cost       │
├──────────┼─────────────────────┼──────────────────────────┤
│ KSA      │ 720.00 SAR          │ 850.00 SAR               │
│ Egypt    │ 4,800 EGP           │ 5,500 EGP                │
└──────────┴─────────────────────┴──────────────────────────┘
```

### 3.4 Per-country fields

Every (variant, country) row provides:

| Field | Storage | Visible to | Required when active |
|---|---|---|---|
| `active` | `variant_country_price.active` | All catalog roles | yes (boolean) |
| `regular_price` | `variant_country_price.regular_price` | All catalog roles | yes |
| `sale_price` | `variant_country_price.sale_price` | All catalog roles | optional |
| `sale_starts_at`, `sale_ends_at` | `variant_country_price.sale_window` (tstzrange) | All catalog roles | required if sale_price set |
| `currency_code` | `variant_country_price.currency_code` (snapshot from `country.currency_code`) | All | auto-filled, locked |
| `actual_product_cost` | `variant_country_cost.actual_cost` (RLS) | **Super Admin + Finance only** | yes |
| `marketer_base_cost` | `variant_marketer_cost.marketer_cost` with `marketer_id`/`tier_id` NULL = default | Super Admin + Finance + Marketing Manager | optional Phase 1; required by Phase 5 |
| `min_selling_price` | `variant_country_price.min_selling_price` | All catalog roles | optional |
| `max_selling_price` | `variant_country_price.max_selling_price` | All catalog roles | optional |
| `suggested_selling_price` | `variant_country_price.suggested_selling_price` | All catalog roles | optional |
| `lead_time_days` | `variant_country_price.lead_time_days` | All catalog roles | yes (default 2) |
| `low_stock_threshold` | `variant_country_price.low_stock_threshold` | All catalog roles | yes (default 5) |
| `delivery_promise_note` | **`variant_country_price.delivery_promise_note` (NEW)** | All catalog roles | optional |
| `tax_mode` | `variant_country_price.tax_mode` | All catalog roles | inherits from country if null |

### 3.5 Where data lives (mapping)

The matrix UI reads/writes from **three** tables. Treating it as one matrix in UI is correct; the underlying separation is for RLS enforcement.

| Source table | Columns | RLS |
|---|---|---|
| `variant_country_price` | active, regular_price, sale_price, currency_code, lead_time_days, low_stock_threshold, min/max/suggested selling price, tax_mode, delivery_promise_note | none — all roles read |
| `variant_country_cost` | actual_cost | **RLS — `super_admin` + `finance_admin` ONLY (D-RBAC-001 ANSWERED 2026-05-07)** |
| `variant_marketer_cost` (where marketer_id IS NULL AND tier_id IS NULL = default base cost) | marketer_cost | **RLS — `super_admin` + `finance_admin` + `marketing_manager` + `marketer_manager`; `external_marketer` reads own rows only** |

The admin UI **stitches these together** for the matrix view. Save action writes to each underlying table per role's permissions.

> **🟢 Locked 2026-05-07 (D-RBAC-001):** The `actual_product_cost` row in the Country Pricing matrix is hidden entirely for any role that is not `super_admin` or `finance_admin`. Marketing managers see the `marketer_base_cost` row but not `actual_product_cost`. External marketers never see either when viewing in admin (and they don't access this admin screen anyway). RLS enforces this at DB layer; serializer strips at API layer; UI hides as final guardrail. See `03-rbac/04-cost-privacy.md`.

### 3.6 Schema delta — `delivery_promise_note`

New column to add to `variant_country_price`:

```
delivery_promise_note text NULL
```

Used as a per-(variant, country) override of country-level delivery copy. Example values:
- "1–2 days Riyadh; 2–3 days other KSA cities"
- "2–4 days Cairo; 3–5 days governorates"
- (NULL) — fall back to country-level shipping zone copy

This delta should be added in Phase 1 migration (no separate migration needed; include in `Migration 0005 — pricing and costs`).

### 3.7 Dynamic country generation rule

The matrix is **rendered from data**, not from a static list:

```
matrix_rows = SELECT c.* FROM country c
              WHERE c.active = true
              ORDER BY c.code

# For each country, fetch existing variant_country_price row (if any),
# variant_country_cost row (if user has cost.read),
# variant_marketer_cost row (if user has marketer_cost.read).
# Row appears even if no data — admin can fill in.
```

**Adding a 4th country (e.g., UAE):**
1. Admin opens System → Countries → "Add country" → enters `code='ae'`, `name_ar`, `name_en`, `currency='AED'`, payment methods, shipping, etc. → activate.
2. Admin navigates back to Product editor → Country Pricing & Availability tab.
3. **A new row for UAE appears automatically.** No code change. No deploy.
4. Admin enters UAE pricing.

This is the **acceptance test** for Phase 1: "Country dynamism test — adding a 4th country requires zero code changes."

### 3.8 Profit Guardrails interaction

> **🟢 Initial defaults set 2026-05-07 (D-PAY-002 + D-PAY-003) — configurable, NOT hardcoded:** Per-country business floors are **KSA 20% · Egypt 18% · Iraq 22%**; marketer floor is **5% uniform**. These are **default seed values** that admins can adjust from `/admin/finance/profit-guardrails` (Super Admin + Finance Admin only; lowering requires approval/override). Profit Guardrails always reads the **currently-active** floor for the relevant country at the moment of evaluation — never a literal value from code. See `05-payments/14-profit-floors-and-guardrails.md` §1b + §8.

When admin enters or changes any pricing field, on save:

1. Server fetches: `actual_cost` (from `variant_country_cost` — RLS-protected, finance only), `marketer_cost` (from `variant_marketer_cost`), `shipping_cost_assumption`, `payment_fee_assumption`, `platform_fee_percent`.
2. Computes `business_gross_profit` (uses `actual_product_cost`) and `marketer_profit` (uses `marketer_product_cost` — **never** `actual_product_cost`).
3. Compares against `country.business_min_margin` (KSA `0.2000` / EG `0.1800` / IQ `0.2200`) and 5% marketer floor (from `profit_floor_rule`).
4. **Phase 1 behavior:** soft warning banner shows computed margin + floor + delta; `profit_guardrail_log` row written; admin can save.
5. **Phase 5 behavior:** hard block; admin must open `override_request` with reason ≥30 chars and a category from the `profit_guardrail` enum; Super Admin OR Finance Admin approves; override expires after 24h.

The cost row in the Country Pricing matrix is hidden for non-finance roles per D-RBAC-001 — non-finance admins can edit prices/lead time but cannot see the actual_cost. Server-side guardrail still runs; it reports a margin breach without exposing the cost number to non-finance admins (the warning shows percentage delta only, not the underlying cost value).

### 3.9 Audit triggers

Every change to any cell in this tab writes one or more rows to `country_data_audit` and `audit_log`:

| Field changed | Audit entry includes |
|---|---|
| Any `variant_country_price.*` | entity=`variant_country_price`, variant_id, country_id, field, old/new values, actor, IP, UA |
| `actual_cost` | entity=`variant_country_cost`, **values redacted for non-finance reads** |
| `marketer_cost` | entity=`variant_marketer_cost`, **values redacted for non-cost-role reads** |
| `active` flag flip | entity=`variant_country_price`, field=`active`, old/new (true/false) |

Audit entries are **immutable** (DB trigger blocks UPDATE/DELETE). 7-year retention.

---

## 4. Tab 8 — Warehouse Stock

### 4.1 Purpose

Per (variant, warehouse) physical stock quantities. The storefront reads `v_variant_country_availability` (computed from this table) for stock badges and add-to-cart eligibility.

### 4.2 Variant selector

Same as Country Pricing tab — variant scoping at the top.

### 4.3 Matrix layout

The matrix has **one row per warehouse** that belongs to a country where this variant is active:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Warehouse Stock — Variant: TLA-440 (telescopic 4m)                                    │
├─────────┬──────────┬─────────┬─────────┬─────────┬─────────┬───────────┬────────────┤
│ Country │ Warehouse│ On hand │ Reserved│ Damaged │ Returned│ Inbound   │ Restock    │
│         │          │ qty     │ qty     │ qty     │ qty     │ qty       │ date       │
├─────────┼──────────┼─────────┼─────────┼─────────┼─────────┼───────────┼────────────┤
│ KSA     │ RUH-01   │ 30      │ 3       │ 0       │ 0       │ 50        │ 2026-05-15 │
│ KSA     │ JED-01   │ 20      │ 0       │ 1       │ 0       │ 0         │ —          │
│ Egypt   │ CAI-01   │ 22      │ 0       │ 0       │ 0       │ 0         │ —          │
│ + Add stock to a warehouse (dropdown of warehouses where variant is active in country)│
├─────────┼──────────┼─────────┼─────────┼─────────┼─────────┼───────────┼────────────┤
│ Per-warehouse settings:                                                                │
│   Low-stock threshold | Reorder point | Active in this warehouse                       │
└──────────────────────────────────────────────────────────────────────────────────────┘

Computed view (read-only, shown for admin reference):
┌─────────┬─────────────────────┬────────────────────┬───────────────────┐
│ Country │ Total available     │ Total on hand      │ Total reserved    │
│         │ (on_hand−reserved)  │ across warehouses  │ across warehouses │
├─────────┼─────────────────────┼────────────────────┼───────────────────┤
│ KSA     │ 47                  │ 50                 │ 3                 │
│ Egypt   │ 22                  │ 22                 │ 0                 │
└─────────┴─────────────────────┴────────────────────┴───────────────────┘
```

### 4.4 Per-warehouse fields

Every (variant, warehouse) row provides:

| Field | Storage | Notes |
|---|---|---|
| `qty_on_hand` | `variant_warehouse_stock.qty_on_hand` | Editable; physically present units |
| `qty_reserved` | `variant_warehouse_stock.qty_reserved` | **Read-only** — managed by reservation engine |
| `qty_damaged` | `variant_warehouse_stock.qty_damaged` | Editable |
| `qty_returned` | `variant_warehouse_stock.qty_returned` | Editable |
| `qty_inbound` | `variant_warehouse_stock.qty_inbound` | Editable; expected incoming |
| `restock_date` | `variant_warehouse_stock.restock_date` | Editable |
| `low_stock_threshold` | `variant_warehouse_stock.low_stock_threshold` | Per-warehouse override; falls back to country-level |
| `reorder_point` | `variant_warehouse_stock.reorder_point` | Drives reorder planning |
| `active` | `variant_warehouse_stock.active` | Whether this warehouse stocks this variant |
| `last_counted_at` | `variant_warehouse_stock.last_counted_at` | Read-only; updated on count |

### 4.5 "Available" vs "On hand" — naming clarification

Some teams use "available" to mean "what's saleable right now" (= `qty_on_hand − qty_reserved`). Our schema column name is `qty_on_hand` (precise: physically present). The **derived** "available" is computed in the view `v_variant_country_availability`.

The admin UI labels:
- "**On hand**" (column) → `qty_on_hand` (editable in matrix)
- "**Reserved**" (column) → `qty_reserved` (read-only)
- "**Available**" (computed read-only display below matrix) → `qty_on_hand − qty_reserved`

### 4.6 Adding stock to a new warehouse

Workflow:
1. Admin clicks "+ Add stock to a warehouse".
2. Dropdown shows only warehouses where:
   - `warehouse.active = true`
   - `warehouse.country_id` is in countries where this variant is active in `variant_country_price`
3. Admin selects warehouse, enters `qty_on_hand`, optional reorder fields.
4. Save → `variant_warehouse_stock` row inserted → audit logged.

### 4.7 Stock movements

Direct edits to `qty_on_hand`, `qty_damaged`, `qty_returned`, `qty_inbound` create a `stock_movement` row of type:
- `count_adjustment` for `qty_on_hand` changes via this UI
- `damage` for `qty_damaged` increases
- `return_to_stock` for `qty_on_hand` increases via returns
- `inbound` for `qty_inbound` updates

### 4.8 Audit triggers

Same as country pricing: every change writes to `country_data_audit` (with `warehouse_id`) and `audit_log`. Cost-bearing fields don't apply here (stock is not cost data), so no redaction needed.

---

## 5. Save behavior (both tabs)

When admin clicks "Save":

```
1. Validate required fields per tab.
2. For each cell that changed:
   a. Server-side permission check (cost.write / marketer_cost.write where applicable).
   b. Profit Guardrails dry-run on price changes (Phase 5+: hard block; Phase 1: soft warning).
   c. Write to underlying table (variant_country_price / variant_country_cost / variant_marketer_cost / variant_warehouse_stock).
   d. Trigger writes to country_data_audit + audit_log (immutable).
   e. If qty_on_hand changed → stock_movement row.
3. Recompute product_country_readiness.status (per row affected).
4. Invalidate caches:
   - Meilisearch index (variant + country)
   - Cloudflare cache for affected /{locale}/product/[slug] pages
   - Per-country availability view cache
5. Emit webhook events (if subscribers exist):
   - variant_country.price_changed
   - variant_country.cost_changed (redacted)
   - variant_warehouse.stock_changed
6. Return success / per-cell error report.
```

---

## 6. Storefront-side enforcement (verification)

Storefront filters product visibility using **only** the dynamic data:

```sql
-- Storefront product query (per locale + country)
SELECT p.*
FROM product p
JOIN product_variant pv ON pv.product_id = p.id
JOIN variant_country_price vcp ON vcp.variant_id = pv.id
WHERE p.status = 'active'
  AND vcp.country_id = :customer_country_id
  AND vcp.active = true
```

**Critical:** the storefront **never** references a country code in code. Always `:customer_country_id` resolved from URL locale.

---

## 7. Phase 1 acceptance test

Phase 1 acceptance criterion (`phase-1-acceptance.md`):

- [ ] **Dynamic Country Pricing matrix renders rows from `country` table live** — verified by adding a test country `xx` and confirming a new row appears in the matrix without code change.
- [ ] **Cost columns hidden from non-finance role** in the Country Pricing matrix.
- [ ] **Setting `variant_country_price.active = false`** for one (variant, country) pair removes that variant from that country's storefront within 1 cache cycle.
- [ ] **Warehouse Stock matrix shows only warehouses in countries where variant is active**.
- [ ] **Edit `qty_on_hand`** in admin → `stock_movement` row created with type `count_adjustment`.
- [ ] **Edit `regular_price`** → `country_data_audit` entry recorded, with old/new values, actor, IP/UA.
- [ ] **Profit Guardrails soft warning** displayed when `regular_price < min_selling_price` OR computed business margin < `country.business_min_margin`.

---

## 8. Phase later additions (out of Phase 1 scope but design-locked)

- Phase 5: hard-block Profit Guardrails on save instead of soft warning.
- Phase 5: Marketer Pricing tab (per-marketer cost overrides).
- Phase 9: Stock transfers between warehouses.
- Phase 9: Cycle-count workflow.
- Phase 10: Per-country dead-stock surfacing in this tab.

---

## 9. References

- Schema: `01-database/02-tables-by-module.md` — Modules 3 (Pricing & Costs) and 4 (Stock & Warehouses)
- RLS: `01-database/03-rls-policies.md`
- Triggers: `01-database/07-triggers.md`
- Cost privacy: `03-rbac/04-cost-privacy.md`
- Admin information architecture: `11-admin-ui/01-information-architecture.md`
- Public site filtering: `12-public-site/02-route-list.md`
- Phase 1 acceptance: `15-phases/phase-1-acceptance.md`
- Master Plan v4 §5 (Countries/Warehouses/Pricing/Stock)
- Decision: `15-phases/PHASE_0_DECISIONS_TODO_TRACKER.md` → **D-COUNTRY-014** (this requirement, Status 🟢 Answered)

---

## Status

**🟢 Confirmed and locked 2026-05-07.** Phase 1 implementation must comply with this document. Deviations require explicit override.
