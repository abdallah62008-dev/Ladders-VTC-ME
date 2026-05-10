# Permissions Matrix

**Status:** Draft
**Owner:** Security lead
**Last updated:** 2026-05-07

---

## Permission slug naming convention

`<resource>.<action>[.<modifier>]`

Examples:
- `catalog.read`
- `cost.read` (reads actual_cost)
- `cost.export` (exports cost-bearing CSV)
- `import.run.products` (per-entity import)
- `override.approve.profit_guardrail` (per-override-type approval)

---

## Permission catalog (~70+ slugs)

### Catalog
- `catalog.read`
- `catalog.write`
- `catalog.publish`

### Cost
- `cost.read` (RLS-enforced)
- `cost.write`
- `cost.export`
- `marketer_cost.read`
- `marketer_cost.write`

### Pricing
- `pricing.read`
- `pricing.write`
- `pricing.bulk_apply` (requires guardrail approval)

### Stock
- `stock.read`
- `stock.write`
- `stock.transfer`
- `stock.count_adjustment`

### Country & warehouse
- `country.read`
- `country.write`
- `country.activate` (override-gated)
- ~~`warehouse.write`~~ — **deprecated 2026-05-07; replaced by the 8 fine-grained slugs below per `11-admin-ui/07-warehouse-management.md`**
- `warehouse.read`
- `warehouse.create`
- `warehouse.update`
- `warehouse.deactivate` (with stock-safety check)
- `warehouse.archive` (with stock-safety check)
- `warehouse.reactivate` (covers both unarchive and reactivate-from-inactive; unarchive is super_admin only)
- `warehouse.delete_empty` (super_admin only; requires zero linked records other than audit log)
- `warehouse.transfer_stock` (initiate stock_transfer between warehouses)

### Order
- `order.read`
- `order.write`
- `order.refund`
- `order.cancel`

### Customer
- `customer.read`
- `customer.write`
- `customer.export` (privacy-gated)

### Conversation & AI
- `conversation.read`
- `conversation.handle`
- `conversation.escalate`
- `ai.prompt.read`
- `ai.prompt.write` (sensitive prompts approval-gated)
- `ai.tools.read`
- `ai.cost.read`
- `ai.playground.use`

### Auto-Reply
- `auto_reply.read`
- `auto_reply.write`
- `auto_reply.approve`

### Customer Messaging
- `messaging.template.read`
- `messaging.template.write`
- `messaging.broadcast.send` (approval-gated)
- `messaging.consent.manage`

### Marketer
- `marketer.read`
- `marketer.write`
- `marketer.terminate`
- `marketer.payout.approve`

### Coupon & landing
- `coupon.read`
- `coupon.write`
- `coupon.activate` (guardrail-gated)
- `landing.read`
- `landing.write`
- `landing.publish`
- `campaign.read`
- `campaign.write`
- `campaign.activate` (guardrail-gated)

### B2B
- `b2b.read`
- `b2b.write`
- `b2b.quote.approve`

### Operations & maintenance
- `ops.read`
- `ops.write`
- `maintenance.ticket.read`
- `maintenance.ticket.write`
- `warranty.replacement.approve` (override-gated for high value)

### Reports
- `report.read`
- `report.profit` (cost-bearing)
- `report.sales`
- `report.marketer`
- `report.ai`
- `report.export`
- `report.export.cost_columns` (cost-bearing)

### System
- `system.users` (manage users)
- `system.roles`
- `system.audit.read`
- `system.api_keys`
- `system.webhooks`
- `system.settings`

### v4 — Import / Export
- `import.run.products`
- `import.run.variants`
- `import.run.country_pricing`
- `import.run.warehouse_stock`
- `import.run.actual_costs` (cost-gated)
- `import.run.marketer_costs`
- `import.run.coupons`
- `import.run.marketers`
- `import.run.landing_pages`
- `import.run.translations`
- `import.run.customers` (privacy-gated)
- `export.run.<entity>` (one per entity)
- `export.cost_columns`

### v4 — Backup / Restore
- `backup.read`
- `backup.create`
- `backup.schedule`
- `restore.staging`
- `restore.production` (super_admin + dual approval)

### v4 — Override
- `override.request`
- `override.approve.profit_guardrail`
- `override.approve.price_below_min`
- `override.approve.campaign_loss`
- `override.approve.stock_override`
- `override.approve.warranty_exception`
- `override.approve.payout_exception`
- `override.approve.country_activation`
- `override.approve.payment_refund_exception`
- `override.policy.write` (super_admin only)

### v4 — Mobile admin
- `mobile_admin.access`

### Performance, Cleanup, Landing & Alerts (locked 2026-05-07 — see `19-performance-growth/09-permissions-and-safety-rules.md` §J)

#### Performance
- `performance.read`
- `performance.manage_cache`
- `performance.manage_feature_flags`
- `performance.view_alerts`
- `performance.resolve_alerts`

#### Landing Pages (replaces / complements legacy `landing.*` slugs above)
- `landing_page.read`
- `landing_page.create`
- `landing_page.update`
- `landing_page.publish`
- `landing_page.archive`
- `landing_page.ab_test`
- `landing_page.override_quality_gate` (super_admin or marketing_manager + dual approval; reason ≥30 chars; audit logged)

#### Data Maintenance
- `data_maintenance.read`
- `data_maintenance.preview`
- `data_maintenance.run_safe`
- `data_maintenance.run_sensitive` (PII / audit / payment-log archiving — Super Admin + Finance Admin approval)
- `data_maintenance.approve`
- `data_maintenance.schedule`
- `data_maintenance.restore_related`

#### Alerts
- `alerts.read`
- `alerts.acknowledge`
- `alerts.resolve`
- `alerts.configure`
- `alerts.escalate`

#### Database Health
- `db_health.read`
- `db_health.manage_indexes_recommendations`
- `db_health.view_slow_queries`
- `db_health.run_maintenance_safe`

### Strategic Enhancements (locked 2026-05-07 — see `24-decision-engine/`, `25-safety-compliance/`, `26-trust-layer/`, `27-readiness-engine/`)

#### Decision & Recommendation Engine (D-DEC-001)
- `decision.read` — Read recommendation rules + warning logs
- `decision.rule.write` — Edit `recommendation_rule` (Product Manager + AI Supervisor)
- `decision.override` — Override engine recommendation in admin (Super Admin only; reason ≥30 chars)

#### Safety & Compliance (D-SAFE-001)
- `safety.read` — Read safety guidelines + claims (all admin roles)
- `safety.claim.write` — Submit a new safety claim
- `safety.claim.approve` — Approve a submitted claim (Compliance Officer + Product Manager **dual approval**)
- `safety.claim.revoke` — Revoke an approved claim (Compliance Officer + Super Admin)
- `safety.incident.read` — Read incident reports (Compliance + Operations + Customer Support + Legal)
- `safety.incident.write` — File an incident report (Customer Support + Operations)
- `safety.incident.escalate` — Escalate to legal (Compliance + Legal)
- `compliance.profile.write` — Edit `country.compliance_profile` (Legal + Country Manager **dual approval**)
- `certificate.read` — Read product certifications (all admin roles)
- `certificate.upload` — Upload supporting certificate documents (Compliance + Product Manager)
- `certificate.approve` — Mark a cert as currently active (Compliance Officer; sole approver for renewals; dual for new types)
- `certificate.revoke` — Revoke a cert (Compliance + Super Admin)

#### Trust Layer (D-TRUST-001)
- `review.read` — Read customer reviews (Customer Support + Marketing + Super Admin)
- `review.approve` — Approve a review (Customer Support)
- `review.reject` — Reject a review (Customer Support)
- `review.flag` — Flag a review for moderation (any admin)
- `trust_asset.read` — Read trust asset library (all admin roles)
- `trust_asset.write` — Edit trust asset configuration (Marketing Manager + Super Admin)

#### Warranty Registration (planned — Phase 4 collect; Phase 9 full)
- `warranty.register.read` — Read warranty registrations
- `warranty.register.write` — Create / edit warranty registrations

#### Batch Quality Tracking (planned — Phase 9)
- `batch_quality.read` — Read batch quality data (Operations + Compliance)
- `batch_quality.recall_flag` — Flag a batch for recall (Super Admin + Operations Director **dual approval**; auto-creates Critical alert)

#### Readiness Engine (D-READY-001)
- `readiness.read` — Read readiness checks (all admin roles, scoped)
- `readiness.run_check` — Trigger a readiness check run (Operations Director + DBA + Infra Lead)
- `readiness.acknowledge` — Acknowledge a warning (owner role of the failing check)
- `readiness.override_block` — Override a readiness block (Super Admin + Operations Director **dual approval**; reason ≥30 chars)

#### Cost-Read Audit Logging (strengthens D-RBAC-001)
- `cost_read_log.read` — Read cost-read audit log (Super Admin + Security Lead only; never granted to Finance Admin to avoid conflict-of-interest)

### Country Access Control (locked 2026-05-09 — see `03-rbac/03-scopes.md`; D-CSP-001/002/003/004 🟢 Answered)

#### Country scope
- `country_scope.all` — User has access to all countries (replaces ambiguous NULL or "Super Admin special case"). **Default grants:** super_admin, finance_admin, read_only_auditor, developer_api_admin. Other roles get this only via explicit ad-hoc grant (audit-logged High severity).
- `country_access.read` — Read `user_country_access` rows (Security Lead, Super Admin)
- `country_access.write` — Grant / revoke country access (Super Admin only — sensitive)
- `country_access.audit.read` — Read audit log of country access grants/revokes (Security Lead, Super Admin)

#### Cross-country reporting / export
- `report.cross_country.read` — Read cross-country comparison reports (requires user to also have access to ALL included countries OR `country_scope.all`)
- `export.cross_country` — Export data spanning multiple countries (high-stakes; defaults to Super Admin + Finance Admin)

**Note: per-action country variant slugs are NOT used.** Country scope is a generic AND condition layered on existing slugs (e.g., `orders.read`). The system does NOT use slug variants like `orders.read.ksa` — country scope lives in `user_country_access` + the active country selector.

### Shipping & Logistics (locked 2026-05-09 — see `20-shipping-logistics/01-overview.md`; D-OPS-010 🟢 Answered)

#### Shipping Providers
- `shipping_provider.read` — Read provider list + status (does NOT include API credentials)
- `shipping_provider.create` — Add new provider per country
- `shipping_provider.update` — Edit non-credential fields (name, contact info, capability flags)
- `shipping_provider.deactivate` — Deactivate (with reason; provider hidden from checkout but historical references preserved)
- `shipping_provider.archive` — Archive (Class 1 soft-delete per D-DB-010)
- `shipping_provider.reactivate` — Reactivate from inactive (unarchive = super_admin only)

#### Shipping Methods
- `shipping_method.read` — Read methods
- `shipping_method.create` — Add method per (country × provider)
- `shipping_method.update` — Edit method fields including delivery promise + customer-visible name
- `shipping_method.deactivate` — Deactivate method

#### Shipping Rate Cards
- `shipping_rate.read` — Read rate cards
- `shipping_rate.create` — Add rate card per (country × provider × method × city/zone)
- `shipping_rate.update` — Edit fees + weight bands + size limits + active_from/until
- `shipping_rate.deactivate` — Deactivate rate card

#### Shipping Rules
- `shipping_rule.read` — Read rule engine entries
- `shipping_rule.update` — Edit / activate / deactivate rule

**API credentials are NEVER granted via dashboard permissions.** Even Super Admin sees only `api_configured = true/false` and the 1Password reference path; secret values live in 1Password (per D-BKP-001).

#### Suggested role × permission matrix

| Permission group | super_admin | operations_director | finance_admin | shipping_coordinator | admin | external_marketer |
|---|---|---|---|---|---|---|
| `shipping_provider.*` (read/create/update/deactivate/archive/reactivate) | ✅ | ✅ (excl. credential view — none allowed) | read | read + limited update | read | ❌ |
| `shipping_method.*` | ✅ | ✅ | read | read + limited update | read | ❌ |
| `shipping_rate.*` | ✅ | ✅ | read + approve_pricing_changes | read | read | ❌ |
| `shipping_rule.*` | ✅ | ✅ | read | read | read | ❌ |

---

## Role × permission matrix (summary)

For full machine-readable matrix, see `matrix/role-permission-matrix.csv` (TODO: create — see "Machine-readable matrix planning" section below).

### 🟢 Machine-readable matrix planning (locked 2026-05-07 — Phase 1 blocker)

**Status:** Required deliverable before Phase 1 sprint 2 starts (RLS + role seeding migration 0002).
**Owner:** Security lead.
**Scope:** Full machine-readable role × permission matrix at `03-rbac/matrix/role-permission-matrix.csv` covering all roles × all permissions, used by:

1. **Migration 0002** — `role_permission` seed data is generated from this CSV (canonical source of truth).
2. **CI permission tests** — Phase 1 acceptance tests (`phase-1-acceptance.md` RLS section) load the CSV and assert each role's effective permissions.
3. **Admin UI Permissions Inspector** — Phase 1 read-only screen at `/admin/system/users/permissions-inspector` (Super Admin only) renders the live matrix from DB and diffs against the CSV; mismatches alert.

#### CSV format (locked)

```csv
permission_slug,super_admin,finance_admin,country_manager,product_manager,inventory_manager,warehouse_manager,warehouse_staff,marketing_manager,marketer_manager,sales_manager,sales_agent,customer_support_agent,ai_supervisor,content_seo_editor,media_manager,b2b_sales_agent,maintenance_service_agent,shipping_coordinator,external_marketer,read_only_auditor,developer_api_admin,infra_lead,dba
catalog.read,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,scoped,Y,N,N,N
cost.read,Y,Y,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N
... (one row per permission slug)
```

Allowed values per cell:
- `Y` — full grant
- `N` — denied
- `scoped` — granted but scoped (e.g., `country_scope`, `marketer_id` filter); scope rule lives in `03-rbac/03-scoping.md`
- `dual_approval` — requires second approver before action takes effect
- `read` — read-only variant of action permission
- `own` — record-ownership filtered (e.g., own marketer_id, own warehouse_id)
- `view_alerts` — limited variant of `performance.*` (alerts read-only)
- `partial` — domain-specific subset (documented in linked notes column)

#### Counts (current scope as of 2026-05-07)

| Domain | Role count | Permission slug count | Cells |
|---|---:|---:|---:|
| Original v4 RBAC | 22 | ~70 | ~1,540 |
| Warehouse v4 (locked 2026-05-07) | (subset of 22) | 8 | (already in matrix) |
| **Performance/Cleanup/Landing/Alerts/DB Health (D-PERF-001)** | (subset of 22 + 2 new: infra_lead, dba) | **~25 added** | **~575 added** |
| **Total target Phase 1 launch** | **24** | **~95** | **~2,280** |

#### New permissions from D-PERF-001 included in v1 of CSV

(Per §J of `19-performance-growth/09-permissions-and-safety-rules.md`)

| Group | Slugs |
|---|---|
| Performance (5) | `performance.read`, `performance.manage_cache`, `performance.manage_feature_flags`, `performance.view_alerts`, `performance.resolve_alerts` |
| Landing Pages (7) | `landing_page.read`, `landing_page.create`, `landing_page.update`, `landing_page.publish`, `landing_page.archive`, `landing_page.ab_test`, `landing_page.override_quality_gate` |
| Data Maintenance (7) | `data_maintenance.read`, `data_maintenance.preview`, `data_maintenance.run_safe`, `data_maintenance.run_sensitive`, `data_maintenance.approve`, `data_maintenance.schedule`, `data_maintenance.restore_related` |
| Alerts (5) | `alerts.read`, `alerts.acknowledge`, `alerts.resolve`, `alerts.configure`, `alerts.escalate` |
| Database Health (4) | `db_health.read`, `db_health.manage_indexes_recommendations`, `db_health.view_slow_queries`, `db_health.run_maintenance_safe` |

Plus **2 new role rows** for `infra_lead` and `dba` (previously implicit; now explicit columns in the matrix).

#### Plus 5 new override-type approval slugs (from `10-overrides/01-override-types.md` 2026-05-07 update)

- `override.approve.performance_budget` (Super Admin + Frontend Lead — dual)
- `override.approve.landing_quality_gate` (Super Admin OR Marketing Manager; dual when Critical-fail count >1)
- `override.approve.landing_profit_guardrail` (Super Admin OR Finance Admin)
- `override.approve.landing_inventory_guardrail` (Super Admin + Marketing Manager — dual)
- `override.approve.sensitive_cleanup` (Super Admin + Finance Admin — dual)

#### Required deliverables before Phase 1 starts

- [ ] Generate v1 CSV at `03-rbac/matrix/role-permission-matrix.csv` covering all 24 roles × ~95 permissions.
- [ ] Add CSV-driven `role_permission` seed generator script reference to `01-database/05-migration-plan.md` (migration 0012 seed step).
- [ ] Add CI test that asserts CSV ↔ DB consistency post-migration.
- [ ] Add CSV review checklist to `99-templates/pr-template.md` for any permission addition (any new permission slug requires a CSV row + role assignment review).
- [ ] Document scope-rule references for every `scoped` cell in `03-rbac/03-scoping.md`.

**Until the CSV exists, role assignments documented in this Markdown file are the working draft.** Markdown wins over CSV during Phase 0; CSV wins from Phase 1 sprint 2 onwards.

| Permission group | super_admin | finance_admin | country_manager | product_manager | marketing_manager | external_marketer |
|---|---|---|---|---|---|---|
| `catalog.*` | ✅ | read | read | ✅ | read | own products only |
| `cost.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `marketer_cost.read` | ✅ | ✅ | ❌ | ❌ | ✅ | own only |
| `pricing.write` | ✅ | ✅ | scoped | ❌ | ❌ | ❌ |
| `stock.write` | ✅ | read | scoped read | ❌ | ❌ | ❌ |
| `coupon.activate` | ✅ | ✅ | scoped | ❌ | ✅ (guardrail-gated) | ❌ |
| `marketer.payout.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `restore.production` | ✅ | second-approver | ❌ | ❌ | ❌ | ❌ |
| `override.approve.profit_guardrail` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `mobile_admin.access` | ✅ | optional | ✅ | ❌ | ✅ | ❌ |

(Other roles omitted from this summary — full matrix in CSV.)

### Warehouse permissions (locked 2026-05-07 — see `11-admin-ui/07-warehouse-management.md`)

| Warehouse permission | super_admin | finance_admin | country_manager (scoped) | inventory_manager | warehouse_manager (scoped) | warehouse_staff (scoped) | marketing_manager | read_only_auditor |
|---|---|---|---|---|---|---|---|---|
| `warehouse.read` | ✅ | ✅ | ✅ scope | ✅ | ✅ own | ✅ own | ✅ | ✅ |
| `warehouse.create` | ✅ | — | — | ✅ | — | — | — | — |
| `warehouse.update` | ✅ | — | — | ✅ | ✅ own (limited fields) | — | — | — |
| `warehouse.deactivate` | ✅ | — | — | ✅ | — | — | — | — |
| `warehouse.archive` | ✅ | — | — | ✅ | — | — | — | — |
| `warehouse.reactivate` (from inactive) | ✅ | — | — | ✅ | — | — | — | — |
| `warehouse.reactivate` (unarchive) | ✅ | — | — | — | — | — | — | — |
| `warehouse.delete_empty` | ✅ | — | — | — | — | — | — | — |
| `warehouse.transfer_stock` | ✅ | — | — | ✅ | — | — | — | — |

`warehouse_manager` "limited update" excludes: `code`, `country_id`, `type`, `priority`, `manager_user_id`, `active`. Allowed: `name`, `address_line`, `district`, `contact_person`, `phone`, `notes`, `shipping_coverage` for own warehouse(s).

**Hard-delete is super_admin only** (`warehouse.delete_empty`). Reason ≥30 chars + audit entry mandatory.

### Performance / Landing / Cleanup / Alerts / DB Health (locked 2026-05-07 — see `19-performance-growth/09-permissions-and-safety-rules.md` §J)

| Permission group | super_admin | infra_lead | dba | marketing_manager | content_seo_editor | finance_admin | read_only_auditor |
|---|---|---|---|---|---|---|---|
| `performance.*` | ✅ | ✅ | partial | view_alerts | view_alerts | — | view_alerts |
| `landing_page.*` (read/create/update/archive/ab_test) | ✅ | — | — | ✅ | ✅ | — | read |
| `landing_page.publish` | ✅ | — | — | ✅ | ✅ | — | — |
| `landing_page.override_quality_gate` | ✅ | — | — | ✅ (with dual approval) | — | — | — |
| `data_maintenance.*` (read/preview) | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| `data_maintenance.run_safe` | ✅ | ✅ | ✅ | — | — | — | — |
| `data_maintenance.run_sensitive` | ✅ | — | ✅ (with approval) | — | — | ✅ (with approval) | — |
| `data_maintenance.approve` | ✅ | — | — | — | — | ✅ | — |
| `alerts.*` (read/acknowledge/resolve) | ✅ | ✅ | ✅ | ✅ scope | ✅ scope | ✅ scope | read |
| `alerts.configure` | ✅ | ✅ | — | — | — | — | — |
| `alerts.escalate` | ✅ | ✅ | ✅ | — | — | — | — |
| `db_health.*` | ✅ | ✅ | ✅ | — | — | — | read |

`super_admin` always has all. Country-scoped roles (e.g., `country_manager`) get `alerts.read` for their country only.

---

## Effective permissions

Computed at session start:
1. Role's permissions
2. Filtered by `country_scope` for country-scoped resources
3. RLS enforces at DB layer regardless

---

## TODO

- TODO: produce full `matrix/role-permission-matrix.csv` covering all 24 roles × ~95 permissions per "Machine-readable matrix planning" section above. **🛑 Phase 1 blocker — needed before sprint 2 (RLS + role seeding migration 0002).**
- TODO: lock initial seed of `role_permission` rows for migration 0002 (generated from CSV).
- TODO: confirm whether `developer_api_admin` ever needs `cost.read` (recommendation: never).
- TODO: pen-test plan for cost-leakage paths.
- TODO: lock scope rules for every `scoped` cell in the CSV — file at `03-rbac/03-scoping.md`.
- TODO: confirm whether `infra_lead` and `dba` are explicit roles or job-title labels mapped to existing roles (recommendation: explicit roles to enable distinct permission grants).
