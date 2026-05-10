# Environment Promotion Checklist

**Status:** 🟢 **Locked 2026-05-07** — required CI gate from Phase 1 onwards
**Owner:** DevOps + DBA + CTO
**Source:** Strategic Enhancements Evaluation (2026-05-08); ADR-024 (CI/CD); ADR-027 (migrations)

> ⚠️ **No promotion from staging → production proceeds without all critical items below ✅.** CI workflow blocks the deploy if any item is missing. High-severity items require explicit override with documented reason.

---

## Critical items (must all be ✅ — CI hard-blocks deploy)

- [ ] All Phase 1+ tests passing in CI (lint + type check + unit + integration + RLS + visual regression).
- [ ] No secrets exposed in any committed file (Trufflehog scan green; manual sweep of recent diffs).
- [ ] Backup completed within last 24 hours; checksum verified; restore-test passed within last 30 days.
- [ ] Lighthouse mobile score on PDP ≥ 90; landing page ≥ 95 (per `19-performance-growth/...` §A.3 budgets).
- [ ] Performance budget per page class respected (no override active).
- [ ] SEO `noindex` removed only in production; staging retains `noindex` + `robots disallow`.
- [ ] Canonical URLs reference `ladders.vtc-me.com` (not staging or dev).
- [ ] Payment provider sandbox/live verified — production environment uses live keys; staging uses sandbox.
- [ ] WhatsApp sandbox/live verified — production uses live token; staging uses test number; no production WhatsApp tokens leaked into staging.
- [ ] Database migration plan reviewed and approved (DBA + backend lead per ADR-027).
- [ ] Migration tested on staging via restored backup (forward + rollback if rollback exists).
- [ ] Pre-risky-change auto-backup ran for any migration touching cost-bearing tables, RLS policies, or warehouse stock (per ADR-027).
- [ ] RLS test suite green (cost-privacy + country-scoping checks per `01-database/03-rls-policies.md`).
- [ ] CI grep tests green: D-PAY (no literal margin values), D-COUNTRY-014 (no hardcoded country strings), D-DB-001 (no bare `order` table), D-DB-002 (no `uuid_generate_v4` / `uuid-ossp`), D-DB-003 (no forbidden monetary types).
- [ ] Dual-approval for production DB migration recorded (Super Admin + DBA OR CTO).
- [ ] Rollback plan documented in PR description; named owner who executes rollback if needed.

---

## High-severity items (override allowed with reason ≥30 chars)

- [ ] No new permission slug introduced without corresponding `role_permission` CSV row (per D-PERF-004).
- [ ] No new monetary column introduced without `numeric(12,2)` precision (per D-DB-003).
- [ ] No new UUID PK introduced without `gen_random_uuid()` default (per D-DB-002).
- [ ] No new safety claim referenced in customer-facing content without approved `safety_claim` row (per D-SAFE-001).
- [ ] No new certificate referenced without uploaded document + `approval_status='approved'`.
- [ ] No new feature flag introduced without owner_user_id + audit_log_id_last_change.
- [ ] CHANGELOG.md updated with summary of changes in this deploy.
- [ ] All new TODOs introduced in the diff have an owner + target phase.
- [ ] Smoke test against production immediately post-deploy (5 min) — homepage loads, PDP loads, WhatsApp button works, login works for one admin role.

---

## Medium / informational items (do not block; surface in deploy report)

- [ ] Storefront pages preserve `<head>` metadata in correct locales.
- [ ] AI tool calls observed in staging match expected pattern (no spike in fallback rate).
- [ ] Cleanup jobs not running concurrently with migration.
- [ ] On-call rotation populated for next 7 days.
- [ ] Runbooks present for any new alert category introduced.

---

## Workflow

```
PR opened → CI runs (every commit)
    ↓
PR approved + merged to main → CI runs full suite + builds artifacts
    ↓
Auto-deploy to staging → smoke tests run on staging
    ↓
Manual promotion request → Promotion Checklist evaluated
    ↓
All Critical items ✅ → CTO / Super Admin approves
    ↓
Production deploy initiated (manual workflow_dispatch in GitHub Actions)
    ↓
Pre-deploy hook: pre-risky-change backup if migration present
    ↓
Deploy → smoke tests → post-deploy verification
    ↓
Status updated in deploy log; notifications sent (Smart Notification — Super Admin + DBA + Infra Lead)
```

---

## Deploy log format

Every promotion writes a row to `deploy_log` (Phase 1 schema reservation):

| Field | Description |
|---|---|
| `id` | uuid PK |
| `promoted_from_env` | `staging` |
| `promoted_to_env` | `production` |
| `git_sha` | commit promoted |
| `migrations_applied` | jsonb array of migration filenames |
| `pre_deploy_backup_job_id` | uuid FK (if migration touched cost/RLS/stock) |
| `checklist_status_jsonb` | full checklist with each item's value |
| `override_used` | bool |
| `override_request_id` | FK if any item was overridden |
| `promoted_by_user_id` | FK |
| `approved_by_user_ids` | uuid[] (dual approval) |
| `started_at`, `finished_at` | timestamptz |
| `outcome` | `success` / `failed` / `rolled_back` |
| `rollback_executed_by_user_id` | FK NULL |
| `notes` | text |

(Phase 1 reservation; full UI Phase 10.)

---

## Override behavior

A High-severity item can be skipped with `change_request_override` semantics — uses existing `override_request` row with `override_type='environment_promotion'` (new override type added Phase 6 if frequently used; until then, document override directly in deploy log notes + audit_log).

Critical items **cannot** be overridden via the standard flow — they are hard blocks. Bypassing requires CTO + DBA dual approval recorded in audit_log with reason ≥100 chars.

---

## Phase placement

| Phase | Work |
|---|---|
| **Phase 1** | This document active; CI gate enforced; deploy_log table reserved as schema |
| Phase 6 | Promotion checklist UI in admin (one-click promotion with checklist visualization) |
| Phase 10 | Promotion History dashboard + drift detection (production drifted from staging signature) |

---

## TODO

- TODO: lock CI workflow YAML embedding this checklist (Phase 1 sprint 1).
- TODO: design override mechanism for High-severity items (recommendation: inline in promotion form, not via separate override request).
- TODO: confirm CTO + DBA dual-approval recipient channels (recommendation: WhatsApp + email).
