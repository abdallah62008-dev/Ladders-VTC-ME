# Permissions, Safety Rules, and Cross-references

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001)
**Owner:** Security Lead + CTO
**Source:** Master Plan v4 §22

> Sections J + K + L of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

# J. Permissions

New permission slugs added (per `03-rbac/02-permissions.md`):

## Performance

- `performance.read`
- `performance.manage_cache`
- `performance.manage_feature_flags`
- `performance.view_alerts`
- `performance.resolve_alerts`

## Landing Pages

- `landing_page.read`
- `landing_page.create`
- `landing_page.update`
- `landing_page.publish`
- `landing_page.archive`
- `landing_page.ab_test`
- `landing_page.override_quality_gate` (super_admin or marketing_manager + dual approval)

## Data Maintenance

- `data_maintenance.read`
- `data_maintenance.preview`
- `data_maintenance.run_safe`
- `data_maintenance.run_sensitive`
- `data_maintenance.approve`
- `data_maintenance.schedule`
- `data_maintenance.restore_related`

## Alerts

- `alerts.read`
- `alerts.acknowledge`
- `alerts.resolve`
- `alerts.configure`
- `alerts.escalate`

## Database Health

- `db_health.read`
- `db_health.manage_indexes_recommendations`
- `db_health.view_slow_queries`
- `db_health.run_maintenance_safe`

### Role assignments (initial)

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

# K. Safety Rules (locked)

These are **hard rules**. Override requires explicit Manual Override per `10-overrides/01-override-types.md` with reason ≥30 chars + audit log + dual approval where indicated.

1. **No destructive cleanup without preview.** Cleanup actions must show a preview report (per `05-data-maintenance.md` F.6) before execution.
2. **Backup required before risky cleanup.** Pre-risky-change auto-backup (per `08-backups/02-pre-risky-change-triggers.md`) fires before any cleanup classified as high-risk.
3. **Sensitive cleanup requires approval.** PII deletion, audit log archiving, payment log archiving, customer-export-related cleanup all require approval (Super Admin + Finance Admin).
4. **PII deletion / anonymization must follow compliance rules** (per `17-compliance/ksa-pdpl.md`, `17-compliance/egyptian-pdpl.md`, `17-compliance/iraqi-data-laws.md`, `17-compliance/consent-records.md`).
5. **Orders, payments, audit logs, invoices must NOT be deleted** without explicit policy approval. Default retention is 7 years (per `05-data-maintenance.md` F.2). Per D-DB-010 these are Class 1 (soft-delete only) or Class 2 (never delete) — retention end does NOT trigger hard delete; archive only.
6. **Cleanup actions must be audit logged** with: actor, scope, records affected, space saved, approval reference if applicable.
7. **Landing pages cannot publish if critical quality gate fails** (per `03-landing-pages.md` D.1).
8. **Landing pages cannot publish if profit guardrail fails without override** (per `03-landing-pages.md` D.7).
9. **Landing pages cannot publish if product has no active country price** (per `03-landing-pages.md` D.1 critical check).
10. **Landing pages cannot publish if stock is unavailable** unless configured as waitlist / preorder mode (per `03-landing-pages.md` D.8).
11. **Custom scripts / pixels require script-weight review** (per `01-performance-engineering.md` A.6) before activation.
12. **AI-generated landing copy requires human approval** (per `03-landing-pages.md` D.5).
13. **Page performance regression creates an alert** (per `07-alerts.md` H.2.1).
14. **Critical alerts require acknowledgement within SLA** (15 min default; per `07-alerts.md` H.5).
15. **No production migration during cleanup runs** — cleanup jobs and migrations cannot run concurrently (lock conflict prevention).
16. **Feature flag changes are audit logged** with rollback capability.
17. **Static landing snapshots retain old versions for 30 days** for rollback safety.
18. **Materialized view refresh failures alert** owner role (per `07-alerts.md` H.2.3).

---

# L. Cross-references

This module updates or coordinates with:

- **Admin information architecture:** `11-admin-ui/01-information-architecture.md` — adds **Growth & Performance** sidebar group + **System / Intelligence → Alerts Center** branch.
- **Database docs:** `01-database/02-tables-by-module.md` — Phase 10 reserves `feature_flag`, `script_inventory`, `landing_page_performance_history`, `cleanup_job`, `cleanup_job_run`, `retention_policy`, `alert`, `alert_subscription`, `notification_rule`, `media_quality_issue`.
- **Reporting / Data Quality docs:** `07-reporting/03-data-quality-issues.md` — extended with landing-page-quality issue types per `03-landing-pages.md` D.1 + D.6.
- **SEO / Media / Performance:** `09-seo-media-performance/...` (legacy) and `12-public-site/05-seo-page-types.md` — landing page strategy + performance budgets cross-reference.
- **RBAC / permissions:** `03-rbac/02-permissions.md` — new permission slugs added (per §J above).
- **Phase roadmap:** `15-phases/PROJECT_TIMELINE_AND_PHASE_REQUIREMENTS.md` — Phase 1 (performance budgets + initial alerts), Phase 6 (landing page builder + adaptive features), Phase 10 (cleanup automation + scanners).
- **Decisions Tracker:** `15-phases/PHASE_0_DECISIONS_TODO_TRACKER.md` — D-PERF-001 (🟢 Answered 2026-05-07) + D-DOC-001 (split applied 2026-05-09).
- **Override module:** `10-overrides/01-override-types.md` — `performance_budget_override`, `landing_quality_gate_override`, `landing_profit_guardrail_override`, `landing_inventory_guardrail_override`, `sensitive_cleanup_override` types.
- **Backup / cleanup safety:** `08-backups/02-pre-risky-change-triggers.md` — cleanup high-risk triggers reference here.
