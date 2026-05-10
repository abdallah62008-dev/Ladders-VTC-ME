# Profit Margin Floors and Guardrails

**Status:** 🟢 **Initial defaults confirmed — 2026-05-07** (configurable; **not hardcoded**)
**Owner:** Finance Director + Backend lead
**Source:** Tracker decisions D-PAY-002 + D-PAY-003 (🟢 Answered 2026-05-07); Master Plan v4 §15

> 🟢 **D-DB-003 locked 2026-05-07:** All cost / price / margin-input / profit monetary columns referenced in this document use `numeric(12,2)` (per `01-database/02-tables-by-module.md` Conventions). Margin floor *values* themselves use `numeric(5,4)` (e.g., `0.2000` for 20%) — the rate/percentage column type, distinct from money. CI grep test rejects forbidden monetary types (`float`/`double precision`/`real`/`money`/non-`(12,2)` numeric on monetary columns).

> ⚠️ **Initial default values, not constants.** Floors live as data in `profit_floor_rule` (with `country.business_min_margin` as a fast-lookup cache). Editable from `/admin/finance/profit-guardrails` (Finance → Profit Guardrails / Margin Settings) by Super Admin or Finance Admin. **Lowering** a floor requires approval workflow OR Manual Override with reason. Every change writes a new versioned row + an `audit_log` entry. Application code MUST NOT contain literal margin numbers — always read live from the active rule.

---

## 1. Initial default margin floors per launch country (2026-05-07)

These are **default starting values**, not constants. They live as data and can be edited from the admin at any time after Phase 1.

| Country | `business_min_margin` (default) | `marketer_min_margin` (default) |
|---|---|---|
| 🇸🇦 **KSA** (Saudi Arabia) | **20%** (`0.2000`) | **5%** (`0.0500`) |
| 🇪🇬 **Egypt** | **18%** (`0.1800`) | **5%** (`0.0500`) |
| 🇮🇶 **Iraq** | **22%** (`0.2200`) | **5%** (`0.0500`) |

Phase 1 migration `0012` seeds these defaults. From Phase 1 onward, admins with the right permission edit them via the UI — see §8.

---

## 1b. Configurability principle (🟢 locked rule — 2026-05-07)

| Rule | Status |
|---|---|
| Margin floors are **data, not code**. Stored in `profit_floor_rule`; cached on `country.business_min_margin` for fast guardrail evaluation. | 🟢 Locked |
| Application code MUST NOT contain literal margin values. **CI grep test** fails any commit that contains `0.2000` / `0.1800` / `0.2200` / `0.0500` (or the percentage forms) inside guardrail-evaluation code paths. Phase 1 acceptance includes this gate. | 🟢 Locked |
| Margin floors are **editable** from `/admin/finance/profit-guardrails` (Finance → Profit Guardrails / Margin Settings). | 🟢 Locked |
| **Edit permission:** Super Admin and Finance Admin **only**. No other role can edit (read access for `read_only_auditor` and `country_manager` for their scope). | 🟢 Locked |
| **Lowering** a floor (more permissive) requires either an approval workflow (`approval` table flow) OR a Manual Override (`override_request` with reason ≥30 chars + Super Admin or Finance Admin approval). | 🟢 Locked |
| **Raising** a floor (more restrictive) requires audit log only — no approval gate (it strengthens the guardrail; safe). | 🟢 Locked |
| Every margin change writes a row to `audit_log` AND a new versioned row to `profit_floor_rule` (the previous row's `effective_until` is set; new row inserted with `effective_from = now()`). The history is queryable. | 🟢 Locked |
| Profit Guardrails service **always** reads the currently-active row in `profit_floor_rule` (where `effective_from <= now() AND (effective_until IS NULL OR effective_until > now()) AND active = true`) for the relevant country at the moment of evaluation. No caching of margin values across requests beyond the country-row cache (which is invalidated on edit via trigger). | 🟢 Locked |
| **Order snapshots are immutable.** Changing a margin floor does NOT recalculate any past order. `order_line.business_gross_profit_snapshot`, `marketer_profit_snapshot`, and the implicit "floor at the time" stored in `profit_guardrail_log.business_floor_at_check` and `marketer_floor_at_check` are frozen forever. Reports always reflect the floor that was active when the order was placed. | 🟢 Locked |

### Rationale

- **Iraq highest (22%)** — higher logistics risk (delivery failure, COD non-collection), higher payment-fees absorption (limited card processors), longer lead times. Margin must absorb these.
- **KSA mid (20%)** — established logistics + payment infrastructure; ZATCA compliance overhead; villa/contractor segment supports premium positioning.
- **Egypt lowest (18%)** — price-sensitive market with high COD rate; tighter margin acceptable to compete on landed price.

The 5% marketer floor is uniform — protects marketer-attributed orders from breaking even when commission + platform fee + payment fees add up.

---

## 2. Where these values are stored (locked schema)

### `country.business_min_margin`
Already exists in `country` table per `01-database/02-tables-by-module.md` Module 1. Phase 1 migration 0012 seed:

```sql
-- Seeded values (Phase 1 migration 0012):
-- KSA  : business_min_margin = 0.2000
-- Egypt: business_min_margin = 0.1800
-- Iraq : business_min_margin = 0.2200
```

### Marketer min margin
Stored in a separate `profit_floor_rule` table (referenced in `01-database/02-tables-by-module.md` Module 3 as TBD; finalized here).

```
profit_floor_rule (
  id uuid PK,
  scope_type text NOT NULL,            -- 'country' | 'country_group' | 'product' | 'global'
  country_id uuid FK NULL,             -- when scope_type='country'
  group_id uuid FK NULL,               -- when scope_type='product_group'
  product_id uuid FK NULL,             -- when scope_type='product'
  floor_type text NOT NULL,            -- 'business_min_margin' | 'marketer_min_margin' | 'absolute_loss_block'
  value numeric(5,4) NOT NULL,         -- e.g., 0.2000 for 20%
  active boolean DEFAULT true,
  effective_from timestamptz,
  effective_until timestamptz NULL,
  created_by, created_at,
  PRIMARY KEY (id)
)
```

Phase 1 seed (migration 0012):
```sql
-- 6 rows: 3 countries × 2 floor types

INSERT INTO profit_floor_rule (scope_type, country_id, floor_type, value, active) VALUES
  ('country', <ksa_id>, 'business_min_margin', 0.2000, true),
  ('country', <ksa_id>, 'marketer_min_margin', 0.0500, true),
  ('country', <eg_id>, 'business_min_margin', 0.1800, true),
  ('country', <eg_id>, 'marketer_min_margin', 0.0500, true),
  ('country', <iq_id>, 'business_min_margin', 0.2200, true),
  ('country', <iq_id>, 'marketer_min_margin', 0.0500, true);
```

`country.business_min_margin` remains a denormalized cache for fast Profit Guardrails lookups; updated via trigger when `profit_floor_rule` rows for `scope_type='country', floor_type='business_min_margin'` change.

---

## 3. Profit Guardrails behavior (phase-by-phase)

### Phase 1 — Soft warnings only

When admin saves a price/cost/coupon change that would breach a floor:
- Banner displayed at top of editor: **"⚠️ Margin warning"** with computed margin and the floor number.
- Save proceeds.
- A row is written to `profit_guardrail_log` recording the breach (computed margin, floor, actor, action, entity).
- No override required at this stage; the warning informs but does not block.

### Phase 5 — Hard blocks

When the Override Module ships in Phase 5:
- Save is **blocked** until an `override_request` is created and approved by Super Admin OR Finance Admin.
- Reason ≥30 chars required (per `10-overrides/04-reason-categories.md` `profit_guardrail` enum).
- Reason category from: `strategic_loss_leader`, `dead_stock_clearance`, `competitor_match`, `error_correction`, `seasonal_campaign`, `other` (free-text justification).
- Override expires 24h after approval; new request required to repeat the action.
- Override usage feeds into monthly governance review (`10-overrides/07-monthly-governance-review.md`).

### Absolute loss block

In Phase 5, `business_gross_profit < 0` is a **hard block** even with override unless the override is signed by Super Admin (not Finance Admin alone). Documented in override policy `10-overrides/02-override-policy-defaults.md` for `profit_guardrail` type.

---

## 4. Profit calculation reminder

| Metric | Formula | Cost basis |
|---|---|---|
| `business_gross_profit` | `selling_price − actual_product_cost − shipping_cost − marketer_profit − discounts − payment_fees` | **`actual_product_cost`** (RLS-protected per D-RBAC-001) |
| `marketer_profit` | `selling_price − (selling_price × platform_fee_percent) − marketer_product_cost − shipping_cost − discount_share_to_marketer` | **`marketer_product_cost`** (NOT actual_product_cost) |

> **🟢 Locked rule (D-RBAC-001 + D-PAY):** Marketer profit calculations MUST use `marketer_product_cost` from `variant_marketer_cost`. They MUST NOT use `actual_product_cost`. The two cost bases are independently configurable per (variant, country) and visible to different roles. Confusing them is a data-leak risk.

`platform_fee_percent` defaults to **14%** (per D-PAY-001 recommendation; pending confirmation).

All financial values **snapshotted to `order_line` at order creation** so historical reporting remains stable when costs change later.

---

## 5. When floors are checked

The Profit Guardrails service runs **before** the following actions can be activated:

| Action | Phase 1 behavior | Phase 5 behavior |
|---|---|---|
| Coupon publish | Soft warning if breach | Hard block + override |
| Landing page custom price | Soft warning | Hard block + override |
| Marketer cost override (per (variant, country, marketer)) | Soft warning | Hard block + override |
| Bulk pricing change | Soft warning per affected row | Hard block on rows that breach |
| Campaign launch | Soft warning + show in campaign forecast | Hard block + override |
| Cart-time discount stacking that reaches floor | Soft warning to admin (alert) | Cart-time hard block + alternative offered |

Inputs always include the country's `business_min_margin` and `marketer_min_margin` (from `profit_floor_rule` joined to `country`).

Output: `{passes, blocking_reasons[], warnings[], computed_business_margin, computed_marketer_margin}`.

---

## 6. Override flow (when Phase 5 ships)

Per `10-overrides/01-override-types.md` `profit_guardrail` type:

```
1. Actor saves a coupon/landing/cost change that breaches floor.
2. Server detects breach via Profit Guardrails service.
3. UI blocks save and opens Override Modal:
   - Why blocked (which floor, by how much)
   - Computed business + marketer margins
   - Reason text (≥30 chars)
   - Reason category enum
   - Acknowledgement checkbox: "I understand this reduces business profit by $X"
4. Submit → status='pending' → Super Admin OR Finance Admin notified.
5. Approval → status='approved' → action becomes performable for 24h window.
6. Action performed → applied_at recorded → audit_log entry references override_request_id.
7. After 24h → status='expired' → repeat action requires new override.
```

---

## 7. Audit and reporting

Every guardrail event (whether warning, block, or override) writes a row to `profit_guardrail_log`:

```
profit_guardrail_log (
  id uuid PK,
  trigger_action text,                  -- 'coupon_save' | 'landing_save' | 'marketer_cost_save' | 'bulk_price' | 'campaign_launch'
  entity_type text, entity_id uuid,
  country_id uuid,
  variant_id uuid NULL,                 -- when variant-specific
  computed_business_margin numeric(5,4),
  computed_marketer_margin numeric(5,4),
  business_floor_at_check numeric(5,4),
  marketer_floor_at_check numeric(5,4),
  outcome text,                         -- 'passed' | 'soft_warning' | 'hard_block' | 'override_approved'
  override_request_id uuid FK NULL,
  actor_id uuid,
  created_at timestamptz
)
```

Surfaced in:
- **Finance Dashboard** — guardrail breaches per period
- **Override Usage Report** — frequency by actor / category / outcome
- **AI Daily Brief** — anomalies (e.g., spike in soft warnings)

---

## 8. Adjusting floors via admin (Phase 1 onward) — Finance → Profit Guardrails / Margin Settings

### 8.1 Admin location

```
/admin/finance/profit-guardrails
  ├── Margin Settings        (per-country business + marketer floors)
  ├── Floor History          (versioned audit trail)
  ├── Pending Approvals      (lower-floor change requests)
  └── Guardrail Log Viewer   (read-only event log per save)
```

Sidebar group: **Finance → Profit Guardrails / Margin Settings**.

### 8.2 Margin Settings screen

| Field | Description | Editable? |
|---|---|---|
| Country | Country flag/name | Locked (one row per active country) |
| `business_min_margin` (current) | Currently active value (e.g., `0.2000`) | Editable |
| `marketer_min_margin` (current) | Currently active value (e.g., `0.0500`) | Editable |
| Effective from | Timestamp when current value became active | Read-only |
| Last edited by | Last actor + role | Read-only |
| Pending changes | Yellow badge if change is in approval queue | Read-only |

Each row has actions: **Edit** · **History** · **Cancel pending change** (if any).

### 8.3 Edit flow

```
1. Super Admin OR Finance Admin clicks Edit on a country row.
2. Modal opens:
   - New business_min_margin (input with current value)
   - New marketer_min_margin (input with current value)
   - Reason (text, ≥30 chars; mandatory)
   - Effective from (datetime; defaults to now)
3. Submit:
   ├─ If new value(s) > current (raising floor → safer):
   │   → applies immediately
   │   → INSERT new row in profit_floor_rule (previous row gets effective_until = now())
   │   → audit_log entry recorded
   │   → country.business_min_margin cache updated via trigger
   │   → Profit Guardrails dry-run reports impact in success toast
   │
   └─ If new value(s) < current (lowering floor → riskier):
       → ENTERS approval workflow (status='pending_approval')
       → Visible in /admin/finance/profit-guardrails/Pending Approvals
       → Requires second Super Admin OR Finance Admin approval
       → Alternative: Manual Override with reason ≥30 chars + super_admin
       → On approval: same write path as raising
4. Profit Guardrails dry-run runs in BOTH cases:
   - Counts existing prices, coupons, campaigns that would breach the new floor
   - Surfaces warning if magnitude is high (e.g., >5pp drop)
5. Webhook event 'profit_floor.changed' emitted on activation.
```

### 8.4 Floor history (versioning)

`profit_floor_rule` rows are **immutable once superseded**. The history view shows:

```
Country: KSA — business_min_margin

| effective_from       | effective_until      | value   | changed_by        | reason                                       |
|---------------------|---------------------|---------|-------------------|----------------------------------------------|
| 2026-05-07 09:00 UTC | NULL (active)       | 0.2000  | <super_admin>     | "Initial Phase 1 launch default"             |
```

Future edits append new rows; the previous row gets `effective_until` set. Past values are queryable forever for reporting and disputes.

### 8.5 Order snapshot immutability (critical)

When a margin floor changes:
- **Past orders are NOT recalculated.** All `order_line.*_snapshot` columns and `profit_guardrail_log.*_floor_at_check` values are frozen at the time the order was placed.
- Finance reports "what was the floor when this order was placed" by reading the snapshot, not by re-evaluating.
- New orders + new guardrail evaluations use the now-active floor.

This guarantees that historical profit/margin reports remain stable across floor adjustments — a core financial-integrity property.

### 8.6 Permission summary for Margin Settings

| Role | Read floors | Edit (raise) | Edit (lower) |
|---|---|---|---|
| `super_admin` | ✅ | ✅ | ✅ (with approval workflow OR override) |
| `finance_admin` | ✅ | ✅ | ✅ (with approval workflow OR override) |
| `country_manager` (scoped) | ✅ scope | ❌ | ❌ |
| `read_only_auditor` | ✅ | ❌ | ❌ |
| All other roles | ❌ | ❌ | ❌ |

This makes the launch values (20% / 18% / 22% / 5%) **defaults**, not constants. They are **not hardcoded anywhere** in application code — see §1b.

---

## 9. Open guardrail-adjacent decisions (still 🔴)

Tracked separately:
- **D-PAY-001** — Default platform fee 14% confirmed across all tiers
- **D-PAY-004** — Platform fee base (selling price OR selling-price-minus-shipping)
- **D-PAY-005** — Payment fees in marketer profit calc (absorbed by business OR pass-through)
- **D-PAY-006** — Discount cost split (marketer share OR business eats 100%)
- **D-PAY-014** — Per-provider transaction fee schedule for accurate Profit Guardrails

These don't block Phase 1 floors but refine the formula in Phase 5+.

---

## 10. Phase 1 acceptance test

Phase 1 acceptance criteria (`15-phases/phase-1-acceptance.md`) updated with:

- [ ] `country.business_min_margin` is **0.2000** for KSA, **0.1800** for Egypt, **0.2200** for Iraq (verified via direct DB query).
- [ ] `profit_floor_rule` table seeded with 6 rows (3 countries × 2 floor types).
- [ ] Soft warning displayed when admin saves a price that produces business margin < country floor.
- [ ] Soft warning displayed when admin saves a marketer cost override producing marketer margin < 5%.
- [ ] `profit_guardrail_log` row written on every save (warning OR pass).
- [ ] Marketer profit calc verified to use `marketer_product_cost`, NOT `actual_product_cost`.

---

## 11. References

- Tracker decisions: **D-PAY-002** (🟢 Answered 2026-05-07) — `business_min_margin` per country
- Tracker decisions: **D-PAY-003** (🟢 Answered 2026-05-07) — `marketer_min_margin` per country
- Master Plan v4 §15 (Costs and Profit Guardrails)
- Schema: `01-database/02-tables-by-module.md` Modules 1 (`country`) and 3 (`profit_floor_rule`)
- Override policy: `10-overrides/01-override-types.md` (`profit_guardrail` type)
- Cost privacy (D-RBAC-001 locked): `03-rbac/04-cost-privacy.md`
- Product workflow: `11-admin-ui/06-product-add-edit-workflow.md` §3.8
- Phase 1 acceptance: `15-phases/phase-1-acceptance.md`

---

## Status

**🟢 Confirmed and locked 2026-05-07.** Phase 1 must seed these floors and run soft warnings. Phase 5 upgrades to hard blocks with override flow.
