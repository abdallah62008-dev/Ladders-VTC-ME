# Warehouse Management Workflow

**Status:** 🟢 **Confirmed and locked — 2026-05-07**
**Owner:** Inventory Manager + Backend lead + Security lead
**Source:** Business requirement confirmed 2026-05-07; resolves tracker decision D-COUNTRY-015

> ⚠️ Locked architectural and UI requirement. Phase 1 must implement the warehouse CRUD + lifecycle exactly as specified. Hard-delete bypass without empty-state verification is **forbidden**.

---

## 1. Confirmed requirement (do not deviate)

The admin must be able to **add, edit, deactivate, archive, reactivate, and (rarely) hard-delete** warehouses for any country — through a single UI in the `Countries & Warehouses` section. Architecture remains dynamic: every warehouse is keyed by `(country_id, city)` and stock is keyed by `(variant_id, warehouse_id)`. **Hardcoded country/warehouse fields are forbidden.**

---

## 2. Admin section structure (locked)

```
Countries & Warehouses
  ├── Countries                  /admin/system/countries
  ├── Warehouses                 /admin/operations/warehouses
  ├── Warehouse Stock            /admin/operations/warehouse-stock
  ├── Stock Transfers            /admin/operations/stock-transfers     (Phase 9)
  ├── Stock Reservations         /admin/operations/stock-reservations  (Phase 2 — read-only view)
  └── Warehouse Health           /admin/operations/warehouse-health    (Phase 9)
```

Phase 1 ships **Countries**, **Warehouses**, **Warehouse Stock** (read + edit) functionally. Stock Transfers, Stock Reservations dashboard, and Warehouse Health surfaces ship Phase 2/9 per `PROJECT_TIMELINE_AND_PHASE_REQUIREMENTS.md`.

---

## 3. Warehouse lifecycle (state machine)

```
        create
          ↓
       ┌──────┐                                      ┌──────────────┐
       │active│ ──── deactivate (with safety) ────► │  inactive    │
       │      │ ◄──── reactivate ──────────────────  │              │
       └──────┘                                      └──────────────┘
          │                                                  │
          │                                                  │
          │       archive (with safety)                      │
          └──────────────────────────────────────────────────┘
                              │
                              ▼
                       ┌────────────┐
                       │  archived  │  ← rarely unarchived; needs Super Admin
                       └────────────┘
                              │
                  hard-delete only if empty
                  (Super Admin + Audit Log)
                              ▼
                          (deleted)
```

**State semantics:**

| State | `active` | `archived_at` | Meaning |
|---|---|---|---|
| Active | `true` | NULL | Operational; can be selected as stock source |
| Inactive | `false` | NULL | Temporarily off (renovation, audit, etc.) — reactivatable |
| Archived | `false` | NOT NULL | Historic; preserved for audit + reporting; not in any UI dropdown except admin warehouse list with "Archived" filter |
| (Deleted) | row removed | n/a | Hard-delete — only if empty + Super Admin approval; row gone but **all linked stock_movement / audit_log / order rows remain** because warehouse_id was snapshotted |

---

## 4. Add Warehouse workflow

### 4.1 Required fields

| Field | Storage | Required | Notes |
|---|---|---|---|
| `country_id` | `warehouse.country_id` (FK) | ✅ | Dropdown of `country` rows where `active=true` OR `launch_status='draft'` (drafts can have warehouses set up before activation). |
| `city` | `warehouse.city` | ✅ | Free text (not enum — allows new cities without code change). |
| `code` | `warehouse.code` UNIQUE | ✅ | E.g., `RUH-01`, `JED-01`, `CAI-01`. Validation: uppercase + digits + dash; max 16 chars. |
| `name` | `warehouse.name` | ✅ | Display name, e.g., "Riyadh Main Warehouse". |
| `address_line` | `warehouse.address_line` | ✅ | Full street address. |
| `district` | `warehouse.district` | optional | Neighborhood/region within city. |
| `contact_person` | `warehouse.contact_person` (NEW field) | optional | Site manager name. |
| `phone` | `warehouse.phone` (NEW field) | optional | E.164 format. |
| `manager_user_id` | `warehouse.manager_user_id` (FK → user) | optional | Internal user assigned. |
| `type` | `warehouse.type` | ✅ | Enum: `'main' \| 'satellite' \| 'virtual' \| '3pl'`. |
| `priority` | `warehouse.priority` | ✅ | Integer; lower = higher priority for Stock Source Priority engine. Default 100. |
| `shipping_coverage` | `warehouse.shipping_coverage` (jsonb) | optional | Array of city/region patterns this warehouse can ship to. Default empty = falls back to country-level shipping. |
| `notes` | `warehouse.notes` (NEW field) | optional | Free-text admin notes. |
| `active` | `warehouse.active` | ✅ | Default `true`. |

### 4.2 Validation

- `code` must be unique globally (not per-country) — enforces unambiguous shipment labels.
- `country_id` must reference an existing country row (not necessarily active — drafts allowed).
- A new warehouse starts with **zero** rows in `variant_warehouse_stock` — admin must seed stock manually OR via import (Phase 2+).

### 4.3 Save behavior

1. INSERT into `warehouse`.
2. Audit entry written: `audit_log(action='warehouse.create', entity='warehouse', entity_id=<new_id>, actor_id, ip, ua, diff={created fields})`.
3. Webhook event: `warehouse.created`.
4. Toast: "Warehouse '<name>' created in <country>. Add stock to make products available."

---

## 5. Edit Warehouse workflow

### 5.1 Editable fields

| Field | Editable? | Notes |
|---|---|---|
| `name` | ✅ | |
| `city` | ✅ | Update with care — affects shipping zone routing. |
| `district` | ✅ | |
| `address_line` | ✅ | |
| `contact_person` | ✅ | |
| `phone` | ✅ | |
| `manager_user_id` | ✅ | |
| `type` | ✅ | |
| `priority` | ✅ | Stock Source Priority engine reads this. |
| `shipping_coverage` | ✅ | |
| `notes` | ✅ | |
| `active` | ✅ via lifecycle transition (see §6) | Not a direct edit — goes through deactivate/reactivate. |
| **`country_id`** | ❌ | **Locked.** A warehouse cannot be moved between countries — would orphan its stock_movement and order_address rows. To "move," archive the old and create a new one in the new country. |
| **`code`** | ❌ | **Locked.** Stock movements + orders snapshot the code historically. To "rename," archive + create new. |

### 5.2 Save behavior

1. UPDATE `warehouse` (only changed fields written).
2. Audit entry per changed field: `audit_log(action='warehouse.update', entity='warehouse', entity_id, field, old_value, new_value, actor_id, ip, ua)`.
3. Webhook event: `warehouse.updated` with diff.

---

## 6. Deactivate / Reactivate workflow

### 6.1 Deactivate stock-safety check

Before flipping `active = false`, the system checks:

| Condition | Block? |
|---|---|
| Any `variant_warehouse_stock` row at this warehouse with `qty_on_hand - qty_reserved > 0` | **YES** — blocked |
| Any `variant_warehouse_stock` row with `qty_reserved > 0` | **YES** — blocked |
| Any `stock_transfer` row with this warehouse as source or dest AND status IN ('pending', 'approved', 'in_transit') | **YES** — blocked |
| Any `order` row with status IN ('pending', 'confirmed', 'paid', 'shipped') AND any `order_line` whose stock was sourced from this warehouse (per `stock_movement.warehouse_id`) | **YES** — blocked |
| Any `qty_inbound > 0` (incoming shipment expected) | warning, but allowed with confirmation |
| Any `qty_damaged > 0` or `qty_returned > 0` only | allowed — these are not blockers |

If blocked, admin sees a **Stock Safety Failure** modal listing the offending records with quick links to:
- Stock transfer screen (clear pending transfers)
- Stock reservation screen (release reservations or wait for TTL)
- Stock movement screen (write off / transfer out)
- Order list (fulfill or cancel pending orders)

### 6.2 Deactivate save behavior

1. Verify safety check passes (server-side, not just UI).
2. UPDATE `warehouse SET active = false`.
3. Audit entry: `audit_log(action='warehouse.deactivate', ..., reason=<text from admin>)`.
4. Webhook event: `warehouse.deactivated`.
5. Storefront effect: `v_variant_country_availability` recomputes within 1 cache cycle; products in this country may show "out of stock" if no other active warehouse holds inventory.

### 6.3 Reactivate save behavior

1. UPDATE `warehouse SET active = true`.
2. Audit entry: `audit_log(action='warehouse.reactivate', ..., reason=<text>)`.
3. Webhook event: `warehouse.reactivated`.
4. Storefront effect: stock at this warehouse becomes counted in country availability.

---

## 7. Archive workflow

### 7.1 When to archive vs deactivate

- **Deactivate** = temporary (renovation, seasonal close, audit). Reactivatable.
- **Archive** = permanent retirement (warehouse closed, lease ended, region exited). Re-activation requires Super Admin and is rare.

### 7.2 Archive stock-safety check

Same as deactivate (§6.1) — must clear all stock + transfers + unfulfilled orders **before** archiving. No exceptions.

### 7.3 Archive save behavior

1. UPDATE `warehouse SET active = false, archived_at = now(), archived_by = <actor>, archive_reason = <text>`.
2. Audit entry: `audit_log(action='warehouse.archive', ...)`.
3. Webhook event: `warehouse.archived`.
4. UI: warehouse moves out of default list; visible only with "Show archived" filter.

### 7.4 Unarchive (rare)

- Super Admin only.
- UPDATE `warehouse SET archived_at = NULL, archived_by = NULL, archive_reason = NULL`. `active` stays `false` (admin must explicitly reactivate after).
- Audit entry mandatory with reason ≥30 chars.

---

## 8. Hard-delete workflow

### 8.1 Eligibility

Hard delete is allowed **only if** the warehouse has **zero** linked records:

- Zero `variant_warehouse_stock` rows (any status).
- Zero `stock_movement` rows (any type, any time).
- Zero `stock_reservation` rows (any status).
- Zero `stock_transfer` rows (source or dest).
- Zero `order` rows whose stock was ever sourced from this warehouse.
- Zero `audit_log` entries referencing this warehouse… ❌ this would block all hard deletes since create entry exists.
  - **Exception**: audit_log entries about this warehouse are kept; they reference `entity_id` which becomes orphaned but remains queryable. Audit log row count is **not** a blocker.

### 8.2 Permissions

- **Super Admin only** (`warehouse.delete_empty` permission).
- Reason ≥30 chars mandatory.
- Audit entry preserves the warehouse row's last known state (snapshot to `audit_log.diff`).

### 8.3 Save behavior

1. Verify all safety checks pass (server-side).
2. INSERT pre-delete snapshot row into `audit_log(action='warehouse.delete', diff=<full row state>)`.
3. DELETE FROM `warehouse WHERE id = <id>`.
4. Webhook event: `warehouse.deleted`.

In practice, hard-delete is rare — typo'd test warehouses, or duplicates created in error during admin onboarding.

---

## 9. Permissions (RBAC) — locked

8 permission slugs added; full mapping in `03-rbac/02-permissions.md`.

| Permission | Description |
|---|---|
| `warehouse.read` | View warehouse list + detail |
| `warehouse.create` | Add new warehouse |
| `warehouse.update` | Edit non-locked fields |
| `warehouse.deactivate` | Mark `active = false` (after safety check) |
| `warehouse.archive` | Mark archived (after safety check) |
| `warehouse.reactivate` | Reactivate from inactive OR unarchive |
| `warehouse.delete_empty` | Hard-delete when zero linked records |
| `warehouse.transfer_stock` | Initiate stock transfer between warehouses |

### Role assignments

| Role | read | create | update | deactivate | archive | reactivate | delete_empty | transfer_stock |
|---|---|---|---|---|---|---|---|---|
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `finance_admin` | ✅ | — | — | — | — | — | — | — |
| `country_manager` (scoped) | ✅ scope | — | — | — | — | — | — | — |
| `inventory_manager` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| `warehouse_manager` (scoped) | ✅ own | — | ✅ own (limited) | — | — | — | — | — |
| `warehouse_staff` (scoped) | ✅ own | — | — | — | — | — | — | — |
| `marketing_manager` | ✅ read-only | — | — | — | — | — | — | — |
| `read_only_auditor` | ✅ read-only | — | — | — | — | — | — | — |
| All other roles | — | — | — | — | — | — | — | — |

**Hard-delete is super_admin only.** Deactivate + archive require Inventory Manager OR Super Admin. Reactivate-from-archived is Super Admin only (unarchive is sensitive). Reactivate-from-inactive can be Inventory Manager.

`warehouse_manager` "limited update" excludes: `code`, `country_id`, `type`, `priority`, `manager_user_id`, `active`. They can edit `name`, `address_line`, `district`, `contact_person`, `phone`, `notes`, `shipping_coverage` for their own warehouse.

---

## 10. Audit log

Every warehouse-affecting action writes a row to `audit_log`. Mandatory fields:

```
audit_log:
  actor_id, actor_role
  action: 'warehouse.create' | 'warehouse.update' | 'warehouse.deactivate'
        | 'warehouse.archive' | 'warehouse.reactivate' | 'warehouse.unarchive'
        | 'warehouse.delete'
  entity: 'warehouse'
  entity_id: <uuid>
  diff: jsonb                  -- before/after for updates; full row for create/delete
  reason: text                 -- required for deactivate / archive / unarchive / delete
  ip, user_agent
  created_at
```

Audit entries are **immutable** (Postgres trigger blocks UPDATE/DELETE on audit_log). 7-year retention.

---

## 11. Dynamic country support (locked)

When a new country is added through `System → Countries`:

1. Country row inserted in `country` table, status `'draft'` initially.
2. Admin (with `warehouse.create` permission) can immediately add warehouses for the new country — country dropdown in Add Warehouse refreshes from live data.
3. **No code changes. No schema migrations. No deploys.** This is the same dynamism rule from D-COUNTRY-014.

Warehouses can be created in `draft` countries so they're ready when the country flips to `active` via the Country Launch Readiness checklist.

---

## 12. Phase 1 plan (locked)

### 12.1 Migration 0006 — warehouses (already in `01-database/05-migration-plan.md`)

Schema delta required:

```
warehouse (existing) — add columns:
  contact_person text NULL
  phone text NULL
  notes text NULL
  archived_at timestamptz NULL
  archived_by uuid FK NULL → user
  archive_reason text NULL
```

These additions go into Migration 0006 alongside the existing warehouse table definition.

### 12.2 Migration 0012 — seed data

```
INSERT INTO warehouse (
  code, name, country_id, city, address_line, type, priority, active
) VALUES (
  'RUH-01',
  'Riyadh Main Warehouse',
  (SELECT id FROM country WHERE code = 'sa'),
  'Riyadh',
  'TBD — Inventory Manager to fill before Phase 1 launch',
  'main',
  10,
  true
);
```

`address_line` and `phone` and `contact_person` to be filled by Inventory Manager during Phase 1.

### 12.3 Future planned warehouses (NOT seeded in Phase 1)

These are documented in `15-phases/LAUNCH_CATALOG.md` §6 but **not migrated** until their respective phases:

| Code | Name | Country | Phase |
|---|---|---|---|
| `JED-01` | Jeddah Secondary Warehouse | KSA | Phase 2 (KSA expansion) |
| `CAI-01` | Cairo Main Warehouse | Egypt | Phase 8 (Egypt launch) |
| `BGD-01` | Baghdad Main Warehouse | Iraq | Phase 8 (Iraq launch) |

When each phase begins, the warehouse is added via the admin (or seed migration) — same dynamic flow.

---

## 13. Phase 1 acceptance tests

Added to `15-phases/phase-1-acceptance.md`:

- [ ] Warehouse list shows RUH-01 with full details.
- [ ] Admin with `warehouse.create` can add a test warehouse for a new country `xx` (from D-COUNTRY-014 dynamism test) — appears immediately, **no code change**.
- [ ] Admin with `warehouse.update` can edit name/address/notes/priority on RUH-01; audit log records each change.
- [ ] Admin attempts to deactivate RUH-01 while hero SKU has `qty_on_hand > 0` → Stock Safety Failure modal shown; deactivation blocked.
- [ ] Admin transfers/zeros stock, then deactivates RUH-01 → succeeds; audit log records `warehouse.deactivate` with reason.
- [ ] Reactivate RUH-01 → succeeds; audit log records `warehouse.reactivate`.
- [ ] Hard-delete attempt on RUH-01 (not empty due to audit history) → blocked; correct error message shown.
- [ ] Hard-delete on a freshly-created empty test warehouse, by Super Admin only, with reason ≥30 chars → succeeds; audit log preserves snapshot.
- [ ] Non-Super-Admin role attempting hard-delete → 403 forbidden.
- [ ] `country_id` and `code` fields cannot be edited (read-only in form, server-side rejected if tampered).

---

## 14. Storefront-side enforcement

The storefront product query already filters by warehouse availability via `v_variant_country_availability`, which only counts rows where `warehouse.active = true`. Effects:

- Deactivating RUH-01 makes its stock invisible to storefront immediately (next cache cycle).
- Archiving same effect; archived warehouses never come back unless explicitly unarchived.
- A new warehouse added with stock makes products available immediately.

No storefront code changes needed for this workflow — the dynamic schema does the work.

---

## 15. Open warehouse-adjacent decisions (still 🔴)

These remain Open and are tracked separately:

- **D-COUNTRY-006** — Stock Source Priority engine — country-default vs city-overrides Day 1
- **D-COUNTRY-007** — Stock reservation TTL default (recommendation: 30 minutes)
- **D-OPS-003** — Logistics partners per country (KSA: SMSA + Aramex confirmed for Phase 2; EG + IQ Phase 8)
- **D-OPS-004** — Pre-dispatch photo mandatory from Day 1 OR Phase 9
- **D-OPS-005** — Serial number assignment timing (intake vs pack time)

---

## 16. References

- Tracker decision: **D-COUNTRY-015** (this requirement, 🟢 Answered 2026-05-07)
- Related tracker decisions: D-COUNTRY-002 (warehouse plan, 🟢 Answered), D-COUNTRY-014 (dynamic schema, 🟢 Answered)
- Schema: `01-database/02-tables-by-module.md` — Module 4 (Stock & Warehouses)
- Migration plan: `01-database/05-migration-plan.md` — Migration 0006 + Migration 0012
- Audit triggers: `01-database/07-triggers.md`
- Permissions: `03-rbac/02-permissions.md`
- Cost privacy: `03-rbac/04-cost-privacy.md` (warehouse data is not cost data; no RLS needed here)
- Workflow companion: `06-product-add-edit-workflow.md` (Warehouse Stock tab inside product editor)
- Launch catalog: `15-phases/LAUNCH_CATALOG.md` §6
- Master Plan v4 §5 (Countries/Warehouses/Pricing/Stock)

---

## Status

**🟢 Confirmed and locked 2026-05-07.** Phase 1 admin must implement Add/Edit/Deactivate/Reactivate/Archive (and gate hard-delete behind Super Admin + safety check). Audit log mandatory for every action. Stock-safety check enforced server-side, not just UI.
