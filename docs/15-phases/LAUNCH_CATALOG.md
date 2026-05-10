# Launch Catalog — 10 SKUs across KSA, Egypt, Iraq

**Status:** 🟢 **Confirmed and locked — 2026-05-07**
**Owner:** Product + Ops
**Source:** Business decision 2026-05-07; resolves tracker decisions D-LAUNCH-009 and D-COUNTRY-001

> ⚠️ This is a **locked launch catalog**. Phase 1 photography, copywriting, schema seed, and warehouse stocking plan all depend on this list. Adding/removing a SKU from the launch catalog requires explicit owner approval.

---

## 1. Confirmed launch SKUs (10)

The following ten SKUs are the launch catalog. **All ten are sold in all three launch countries** (Saudi Arabia, Egypt, Iraq). Per-country pricing, stock, and operational fields differ — see §3.

| # | SKU | Product name | Type | Notes |
|---|---|---|---|---|
| 1 | `VTC-TEL-OS-3.2M` | Telescopic One Side 3.2m | Telescopic — single-extension | Compact home use |
| 2 | `VTC-TEL-OS-3.8M` | Telescopic One Side 3.8m | Telescopic — single-extension | Apartment / mid-reach |
| 3 | `VTC-TEL-OS-4.4M` | Telescopic One Side 4.4m | Telescopic — single-extension | **Hero SKU** — villa exterior |
| 4 | `VTC-TEL-OS-5.1M` | Telescopic One Side 5.1m | Telescopic — single-extension | Tall-reach |
| 5 | `VTC-TEL-DS-3.8M` | Telescopic Double Sides 3.8m (1.9 + 1.9m) | Telescopic — double-side / A-frame | Self-supporting |
| 6 | `VTC-TEL-DS-4.4M` | Telescopic Double Sides 4.4m (2.2 + 2.2m) | Telescopic — double-side / A-frame | Self-supporting tall |
| 7 | `VTC-MP-3.6M` | Multipurpose 3.6m | Multi-purpose / 4-position | Versatile contractor / home |
| 8 | `VTC-MP-4.7M` | Multipurpose 4.7m | Multi-purpose / 4-position | Larger multi-purpose |
| 9 | `VTC-HOME-4STEP` | Home Step Ladder 4 Steps | Step / household | Light home use |
| 10 | `VTC-HOME-5STEP` | Home Step Ladder 5 Steps | Step / household | Light home use |

### Hero SKU for Phase 1

**`VTC-TEL-OS-4.4M`** is the single SKU that ships fully implemented in Phase 1 MVP (per Phase 1 execution plan). It hits the most common villa-exterior use case in KSA and is the strongest representative of the catalog for early customer testing.

The other 9 SKUs have catalog rows seeded in Phase 1 but full content (translations, lifestyle photography, AI knowledge) lands during Phases 2–6.

---

## 2. Country availability — locked at all-three

| SKU | KSA | Egypt | Iraq |
|---|---|---|---|
| VTC-TEL-OS-3.2M | ✅ | ✅ | ✅ |
| VTC-TEL-OS-3.8M | ✅ | ✅ | ✅ |
| VTC-TEL-OS-4.4M | ✅ | ✅ | ✅ |
| VTC-TEL-OS-5.1M | ✅ | ✅ | ✅ |
| VTC-TEL-DS-3.8M | ✅ | ✅ | ✅ |
| VTC-TEL-DS-4.4M | ✅ | ✅ | ✅ |
| VTC-MP-3.6M | ✅ | ✅ | ✅ |
| VTC-MP-4.7M | ✅ | ✅ | ✅ |
| VTC-HOME-4STEP | ✅ | ✅ | ✅ |
| VTC-HOME-5STEP | ✅ | ✅ | ✅ |

This means: **30 rows** in `variant_country_price` at launch (10 SKUs × 3 countries).
Warehouse stock rows scale with the number of warehouses per country (see §6).

---

## 3. Per-country dimensions — what differs between countries

Even though the same 10 SKUs ship in all three countries, the following remain **strictly per-country** and live in the dynamic schema (`variant_country_price`, `variant_country_cost`, `variant_marketer_cost`, `variant_warehouse_stock`, `country` settings) — never hardcoded:

| Dimension | Where stored | TODO entry |
|---|---|---|
| Selling price | `variant_country_price.regular_price`, `sale_price` | Per-country pricing decisions (D-PAY-001 floors, D-COUNTRY-009 strategy) |
| Currency | `country.currency_code` (snapshot to `variant_country_price.currency_code`) | Locked: SAR / EGP / IQD |
| Actual product cost | `variant_country_cost.actual_cost` (RLS) | D-RBAC-001 (cost.read role list) |
| Marketer base cost | `variant_marketer_cost.marketer_cost` (RLS, `marketer_id`/`tier_id` NULL = default) | Phase 5 |
| Available stock (computed) | `v_variant_country_availability.qty_available_total` | Computed from warehouses |
| Warehouse stock (per warehouse) | `variant_warehouse_stock.qty_on_hand`, `qty_reserved`, etc. | D-COUNTRY-002 (KSA warehouses) — open |
| Shipping cost | `shipping_zone` rows per country | Per-country logistics (D-OPS-003) |
| Payment methods | `country.payment_methods` jsonb | D-COUNTRY-011 (KSA), Egypt + Iraq Phase 7/8 |
| WhatsApp number | `country.whatsapp_number` | D-COUNTRY-010 (KSA) — open; EG + IQ Phase 7/8 |
| Delivery promise | `country.business_hours` + `variant_country_price.delivery_promise_note` | Per-country copy |
| Tax / invoice rules | `country.vat_rate`, `vat_mode`, `tax_setting`, ZATCA partner (KSA) | D-PAY-008 (ZATCA partner) |
| Active / inactive flag | `variant_country_price.active` | All locked `true` per §2 |

The matrix UI in admin Product Add/Edit (per `11-admin-ui/06-product-add-edit-workflow.md`) renders one row per country and lets the admin fill these in.

---

## 4. Phasing of catalog rollout

| Phase | Catalog state |
|---|---|
| Phase 1 (KSA only) | All 10 SKUs entered as draft; 1 SKU (**VTC-TEL-OS-4.4M**) live in storefront with full ar-sa + en-sa content + warehouse stock + KSA pricing |
| Phase 2 | Other 9 SKUs progressively brought live in KSA storefront as content + warehouse stock complete |
| Phase 3–6 | KSA catalog complete; landing pages, group sales pages, AI knowledge populated |
| Phase 7 | Stripe + KSA payments + ZATCA invoicing |
| Phase 8 (EG + IQ launch) | All 10 SKUs activated in `variant_country_price` for Egypt + Iraq; per-country pricing, costs, warehouse stock, copy populated. Country Launch Readiness checklist gates activation. |
| Phase 9+ | Operations + warranty workflows fully active across all three countries |

**Important:** because the same 10 SKUs ship in all three countries, the schema rows already exist after Phase 1's product seed — Phase 8 is **data activation**, not catalog rebuild. This is exactly why the dynamic-country schema (D-COUNTRY-014) was locked.

---

## 5. Photography & content implications

### Photography (D-LAUNCH-011, D-SEO-004)

Each of the 10 SKUs needs the standard shot list per `13-brand/photography-brief.md`:
- Hero shot (extended)
- Folded form
- Detail shots (anti-slip foot, top hook, lock mechanism, weld detail)
- In-use shot (back-view person)
- Storage shot (folded in garage / car trunk — proves "fits in car" for telescopic)
- Dimensional drawing
- Video clip (unfolding/closing, 5–8s, muted)

**Total** = 10 SKUs × ~7 shot types ≈ **70 product shots + 10 video clips**, plus per-country lifestyle scenes (Saudi villa, Egyptian apartment, Iraqi context) shared across SKUs.

### Copywriting (D-SEO-005)

Each SKU needs full product copy in **6 locales** (`ar-sa, ar-eg, ar-iq, en-sa, en-eg, en-iq`):
- Product name (locale-specific phrasing)
- Slug
- Description
- Features markdown
- Use cases
- Meta title + meta description

**Total** = 10 SKUs × 6 locales = **60 sets of product copy**. Master Plan v4 §18 requires native Arabic copy per country tone (formal Gulf KSA / friendly EG / direct IQ) — no machine translation. Single English variant per country acceptable.

Phase 1 only requires `ar-sa + en-sa` for SKU #3 (VTC-TEL-OS-4.4M). The remaining ~58 copy sets land in Phases 2 and 8.

### AI knowledge (Phase 3)

Each SKU needs:
- Product Q&A entries (10–15 per SKU)
- Use-case tags
- Reach calculator inputs
- Fits-in-car dimensions
- Comparison-table-ready spec normalization

**Total** = 10 SKUs × ~12 Q&A entries = **~120 Q&A entries**, plus the FAQ corpus (30+ entries) per locale.

---

## 6. Warehouse stocking implications

Each SKU at each country needs at least one warehouse with `qty_on_hand > 0`, `warehouse.active = true`, and a `variant_warehouse_stock.active = true` row for storefront purchase. Architecture remains dynamic — every warehouse links to `country_id` + `city`; stock lives in `variant_warehouse_stock(variant_id, warehouse_id)` with no hardcoded country/warehouse columns.

### 🟢 Confirmed warehouse plan (locked 2026-05-07)

| Country | Warehouse | Code | City | Phase activated | Status |
|---|---|---|---|---|---|
| 🇸🇦 KSA | **Riyadh Main Warehouse** | `RUH-01` | Riyadh | **Phase 1 (active)** | 🟢 Confirmed |
| 🇸🇦 KSA | Jeddah Secondary Warehouse | `JED-01` | Jeddah | Later (Phase 2 candidate) | 🟢 Planned |
| 🇪🇬 Egypt | Cairo Main Warehouse | `CAI-01` | Cairo | Phase 8 (Egypt launch) | 🟢 Planned |
| 🇮🇶 Iraq | Baghdad Main Warehouse | `BGD-01` | Baghdad | Phase 8 (Iraq launch) | 🟢 Planned |

Tracker reference: **D-COUNTRY-002** marked 🟢 Answered 2026-05-07.

### Phase 1 seed (Migration 0012)

- 1 row in `warehouse` table: `(code='RUH-01', name='Riyadh Main Warehouse', country_id=<KSA>, city='Riyadh', type='main', active=true, priority=10)`.
- For hero SKU `VTC-TEL-OS-4.4M`: 1 row in `variant_warehouse_stock` with `qty_on_hand` set per Inventory's seeding plan, `qty_reserved=0`, `active=true`.
- For other 9 SKUs: rows in `variant_warehouse_stock` may be seeded with `qty_on_hand=0` and `active=true` to make them stockable as soon as physical units arrive (Phase 2 brings them live in storefront).

### Phase 1 minimum to reach storefront

Hero SKU (`VTC-TEL-OS-4.4M`) needs:
- `variant_country_price` row for KSA with `active = true`, real prices, `lead_time_days`.
- `variant_warehouse_stock` row at RUH-01 with `qty_on_hand > 0` and `active = true`.
- Then `v_variant_country_availability` returns `qty_available_total > 0` and the storefront shows "In stock — 1–2 days delivery" (based on `country.business_hours` + `lead_time_days`).

### Future warehouse activation (Phase 8 data work)

EG and IQ warehouses do **not** have separate tracker decisions. They are activated as **data work** during Phase 8 when each country launches:

- Cairo (`CAI-01`) added Phase 8 sprint 1 → KSA team operates it; Egypt sales rep handles fulfillment-related WhatsApp confirmations.
- Baghdad (`BGD-01`) added Phase 8 sprint 2 → similar pattern with Iraq sales rep.

Country Launch Readiness checklist (per `01-database/02-tables-by-module.md` Module 1) will block flipping `country.active = true` for EG/IQ until each has at least one active warehouse with stock.

### Multi-warehouse considerations (deferred)

- **Stock Source Priority engine** (per `01-database/02-tables-by-module.md` §5.5) goes live in Phase 9. Phase 1 has only one KSA warehouse so priority is moot; the engine becomes meaningful when JED-01 comes online and multi-warehouse fulfillment kicks in.
- **Inter-warehouse transfers** (`stock_transfer` table) ship in Phase 9 alongside packing checklist + pre-dispatch photo proof.

### Open warehouse-adjacent decisions (still 🔴)

- D-COUNTRY-006 — Stock Source Priority — country-default vs city-overrides Day 1
- D-COUNTRY-007 — Stock reservation TTL default (recommendation: 30 minutes)
- D-OPS-003 — Logistics partners per country (KSA: SMSA + Aramex confirmed for Phase 2; EG + IQ Phase 8)

---

## 7. SKU naming convention

The `VTC-` prefix is the brand prefix. The pattern is:

```
VTC-<TYPE>-[<SUBTYPE>-]<DIMENSION>

TYPE:
  TEL  = Telescopic
  MP   = Multipurpose
  HOME = Home / household

SUBTYPE (telescopic only):
  OS   = One Side (single-extension)
  DS   = Double Sides (A-frame)

DIMENSION:
  Telescopic / Multipurpose: max reach in metres (3.2M, 3.8M, 4.4M, 4.7M, 5.1M)
  Home: step count (4STEP, 5STEP)
```

Future SKUs added under this catalog should follow this convention. Variants of the same product family (e.g., color variations) attach as `product_variant` rows under a parent `product`, not as new SKUs at the product level.

---

## 8. Schema seed plan (Phase 1)

Migration `0012 — seed data` (per `01-database/05-migration-plan.md`) will seed:

```
-- countries (already seeded in Phase 0 step):
INSERT INTO country (code, ...) VALUES
  ('sa', ...),   -- active
  ('eg', ...),   -- draft
  ('iq', ...),   -- draft

-- 10 products + 10 variants per the SKU list above
INSERT INTO product (sku, brand, status, ...) VALUES
  ('VTC-TEL-OS-3.2M', 'VTC', 'active', ...),
  ...

-- 30 variant_country_price rows (10 SKUs × 3 countries):
-- Phase 1 seeds with placeholder prices; real prices land per Finance review.
INSERT INTO variant_country_price (variant_id, country_id, regular_price, ...) VALUES
  -- 10 KSA rows (active=true)
  -- 10 Egypt rows (active=true; placeholder prices until Phase 8)
  -- 10 Iraq rows (active=true; placeholder prices until Phase 8)
  ...

-- 10 variant_country_cost rows for KSA (Finance fills) ...
-- + EG/IQ cost rows when Finance has them, by Phase 8.

-- variant_warehouse_stock rows for KSA warehouse(s) — minimum 1 row per SKU per Phase 1 KSA warehouse.
```

The placeholder rule: rows for EG and IQ exist from Phase 1 (so adding a country is purely "make active and fill data"), but `active` may be `false` until per-country pricing/cost/stock is finalized. Phase 8 flips `active=true` only after Country Launch Readiness checklist passes.

---

## 9. References

- Tracker decisions D-LAUNCH-009 and D-COUNTRY-001 (both 🟢 Answered 2026-05-07)
- Tracker decision D-COUNTRY-014 (🟢 dynamic matrix architecture)
- Workflow doc: `11-admin-ui/06-product-add-edit-workflow.md`
- Schema: `01-database/02-tables-by-module.md` Modules 2–4
- Migration plan: `01-database/05-migration-plan.md` (Migration 0012 seed)
- Photography brief: `13-brand/photography-brief.md`
- Copywriter brief: `13-brand/copywriter-brief.md`
- Phase 1 execution plan: `15-phases/phase-1-execution-plan.md`

---

## Status

**🟢 Confirmed and locked 2026-05-07.** The 10-SKU launch catalog above is the basis for all Phase 1 photography, copywriting, schema seed, and warehouse planning, and for Phase 8 multi-country activation.
