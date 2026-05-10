# RBAC Matrix Files

**Status:** Active
**Owner:** Security lead
**Last updated:** 2026-05-09

---

## Files in this folder

### `role-permission-matrix.csv` (🟢 v1 created 2026-05-09 — D-RBAC-MATRIX-001 Answered)

**Status:** Phase 1 RBAC seed/migration design artifact. Required before Phase 1 sprint 2 (per D-PERF-004).

The canonical machine-readable role × permission matrix. v1 covers **24 roles × ~165 permission slugs** including all major slug groups (catalog / cost / pricing / stock / country / warehouse / order / customer / conversation / AI / auto-reply / messaging / marketer / coupon / landing-page / campaign / b2b / ops / maintenance / report / system / import / export / backup / restore / override / mobile_admin / performance / data_maintenance / alerts / db_health / decision / safety / certificate / review / trust_asset / warranty / batch_quality / readiness / country-access / shipping).

**Used by:**
- **Migration 0002** — `role_permission` seed data is generated from this CSV (canonical source of truth).
- **CI permission tests** — Phase 1 acceptance tests load the CSV and assert each role's effective permissions.
- **Admin UI Permissions Inspector** — Phase 1 read-only screen at `/admin/system/users/permissions-inspector` (Super Admin only) renders the live matrix from DB and diffs against the CSV; mismatches alert.

**Cell value conventions** (locked in `02-permissions.md`):

| Value | Meaning |
|---|---|
| `Y` | Full grant |
| `N` | Denied |
| `scoped` | Granted but scoped (country, warehouse, marketer); scope rule lives in `03-scopes.md` |
| `dual_approval` | Requires second approver before action takes effect |
| `read` | Read-only variant of action permission |
| `own` | Record-ownership filtered (e.g., own marketer_id, own warehouse_id) |
| `view_alerts` | Limited variant of `performance.*` (alerts read-only) |
| `partial` | Domain-specific subset (documented in linked notes) |

**Roles columns** (24): `super_admin`, `admin`, `finance_admin`, `country_manager`, `product_manager`, `inventory_manager`, `warehouse_manager`, `warehouse_staff`, `marketing_manager`, `marketer_manager`, `sales_manager`, `sales_agent`, `customer_support_agent`, `ai_supervisor`, `content_seo_editor`, `media_manager`, `b2b_sales_agent`, `maintenance_service_agent`, `shipping_coordinator`, `read_only_auditor`, `developer_api_admin`, `external_marketer`, `infra_lead`, `dba`.

**Notes on v1:**
- v1 covers the **most-referenced slugs** across all locked decisions. Some specialized override-approval slugs and a few low-traffic `import.*` / `export.*` slugs may need a v2 pass once seed data is finalized.
- `super_admin` always has `Y` (no need to enumerate every slug).
- For roles where the CSV cell shows `scoped`, the scope rule lives in `03-rbac/03-scopes.md` (country / warehouse / marketer scope).
- `country_scope.all` permission slug determines whether a role bypasses country scope; default grants are seeded for super_admin, finance_admin, read_only_auditor, developer_api_admin (per D-CSP-003).

**CI test plan:** Phase 1 sprint 2 wires CI test asserting cross-consistency between this CSV + DB `role_permission` rows post-migration 0002. Mismatches → CI fails.

### `data-ownership-matrix.csv`

**Status:** 🟢 v1 locked 2026-05-07 (D-OWN-001 🟢 Answered)

The canonical data-ownership reference. Every important data type / table has a designated owner role. Used by:

- **RBAC** — primary/secondary owner informs default permission grants in `02-permissions.md`
- **Alerts Center** — `alert.owner_role` auto-assigned from this matrix when an alert references an entity
- **SOPs** — each SOP cites the responsible owner from this matrix
- **Smart Notifications** — change-event notifications route to owner roles
- **Operational doctrine** — when "who fixes this?" comes up, this matrix is the answer

#### Columns

| Column | Meaning |
|---|---|
| `entity` | Schema table name or logical entity |
| `primary_owner_role` | The role that owns this data; if changes are silent, this role is responsible |
| `secondary_owner_role` | Backup owner for redundancy / coverage during PTO |
| `approver_for_changes` | Role(s) whose approval is required to change this data; `_dual` suffix means dual approval |
| `reviewer_for_changes` | Role(s) whose review is recommended (not required) |
| `read_scope` | Who can read this data: `all_admin`, `finance_only`, `finance_plus`, `marketing_plus`, `operations_plus`, `marketing_only`, `ai_admin`, etc. |
| `sensitive` | `no` / `yes` / `yes_critical` — drives RLS, redaction, audit emphasis |
| `notes` | Free-text context |

#### Cell value conventions

- `super_admin` always implicit — has full access regardless of matrix
- `_dual` suffix on approver = dual approval required (e.g., `compliance_officer+product_manager_dual`)
- `+` joins multiple roles when ALL are required (e.g., `security_lead+marketing_manager` = both, jointly)
- `,` (in spreadsheet view) separates alternative options
- `n/a_auto` = no human approver; system-generated entry
- `immutable` = data is never modified (e.g., `audit_log`)

#### Companion file

The full role × permission matrix CSV (per D-PERF-004) is `role-permission-matrix.csv` (TODO — separate file; tracked in `02-permissions.md` "Machine-readable matrix planning").

The two CSVs are complementary:
- `data-ownership-matrix.csv` answers: **"who owns this data?"**
- `role-permission-matrix.csv` answers: **"what can each role do?"**

CI test asserts cross-consistency: every entity in ownership matrix has at least one role with read permission to it; every role with `*.write` permission corresponds to either primary or secondary owner.

---

## TODO

- TODO: produce `role-permission-matrix.csv` (D-PERF-004; required before Phase 1 sprint 2).
- TODO: write CI test asserting cross-consistency between the two matrices post-migration 0002.
- TODO: document the change process for editing this CSV (Phase 0 close gate item).
