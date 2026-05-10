# Data Maintenance & Cleanup System

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001); execution Phase 10
**Owner:** DBA + Infra Lead
**Source:** D-DB-010 (deletion policy); Master Plan v4 §22

> Section F of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## F.1 Admin section

```
System
  ├── Data Maintenance
  ├── Cleanup Jobs
  ├── Retention Policies
  ├── Cleanup Preview
  ├── Cleanup History
  ├── Database Health
  ├── Media Cleanup
  ├── Slow Queries
  ├── Index Health
  └── Partition Health
```

## F.2 Retention rules (locked defaults)

> 🟢 **D-DB-010 locked 2026-05-07** — Retention rules below operate within the four-class deletion policy in `01-database/02-tables-by-module.md` Conventions. Quick recap of how retention interacts with classes:
>
> | Class | Behavior at retention end |
> |---|---|
> | **Class 1** (soft-delete only) | Retention does NOT trigger hard delete. After retention, rows may be archived to cold storage but the row itself is preserved (financial / legal record). |
> | **Class 2** (never hard delete) | Retention does NOT trigger hard delete. Rows may be moved to archive table per §F.7 but never `DELETE FROM`. |
> | **Class 3** (hard delete after retention) | Retention triggers `DELETE FROM` via scheduled cleanup job. Most rows in this table belong to this class. |
> | **Class 4** (PII anonymization) | On customer deletion request OR after consent inactivity period (`24 months` per D-LAUNCH-014), customer PII fields anonymized; `customer_orders` rows retained for financial reporting per Class 1. |


| Data Type | Suggested Retention |
|---|---:|
| Orders | 7 years |
| Invoices | According to law (varies per country) |
| Audit Logs | 7 years |
| Payment Logs | 7 years |
| Message Logs | 2–3 years |
| AI Tool Logs | 12–24 months |
| Webhook Logs | 90–180 days |
| Pixel Raw Logs | 90–180 days |
| Abandoned Carts | 90–180 days |
| Import Preview Files | 30–90 days |
| Temporary Uploads | 7–30 days |
| Expired Payment Links | 90 days |
| Expired Stock Reservations | 30–90 days |
| Sessions / Reset Tokens | Short security-based retention (24 h–30 d) |

Editable from `/admin/system/retention-policies` by Super Admin + Finance Admin (Finance Admin needed for legal-record retention validation).

## F.3 Cleanup jobs (scheduled)

Documented jobs (BullMQ scheduled, default daily):

- Expired carts (older than retention)
- Expired draft orders
- Expired stock reservations (release back to `qty_on_hand`)
- Expired payment links
- Old webhook logs
- Old AI tool logs
- Old pixel raw logs (if not aggregated to summary)
- Temporary uploads
- Import preview files
- Orphan media (no `media_usage` rows pointing to it for 90+ days)
- Duplicate media variants (same `pHash` + same `usage`)
- Expired sessions / reset tokens
- Old failed jobs (BullMQ failed queue retention)
- Old notification logs

Each job declares: name, retention rule reference, risk level, requires-approval flag, requires-backup flag, owner role.

## F.4 Safe Cleanup Workflow

All cleanup follows this sequence:

```
Preview (count + sample)
    ↓
Risk Classification (low / medium / high)
    ↓
Backup if risky (pre-risky-change auto-backup)
    ↓
Approval if sensitive (dual approval for high-risk)
    ↓
Execute (per-row transaction)
    ↓
Audit Log entry (what was cleaned, by whom, why)
    ↓
Cleanup Report (records affected, space saved, errors)
```

## F.5 Data Lifecycle States

Documented states:

- `active` — current, queryable
- `stale` — old but still queryable; flagged for review
- `archived` — moved to archive table or cold storage; queryable on demand
- `scheduled_for_cleanup` — passed retention; awaiting cleanup window
- `deleted` — hard-deleted (rare, only for non-compliance-bound data)
- `anonymized` — PII scrubbed; row kept for analytics

## F.6 Cleanup Preview Report

Before executing any cleanup, admin sees:

| Field | Example |
|---|---|
| Records affected | "12,438 webhook_log rows older than 180 days" |
| Estimated space saved | "320 MB" |
| Risk level | Low / Medium / High |
| Backup required | Yes / No |
| Approval required | Yes (Super Admin) / No |
| Affected tables | `webhook_log`, `webhook_delivery` |
| Sample records | 10 random rows |
| Rollback option | Yes (from backup) / No (forward-only) |

## F.7 Database Archiving Layer

Large append-only logs may move to archive tables OR cold storage:

| Source | Archive table |
|---|---|
| `message_log` | `message_logs_archive` |
| `webhook_log` | `webhook_logs_archive` |
| `ai_tool_call` | `ai_tool_logs_archive` |
| `pixel_event_log` | `pixel_event_logs_archive` |
| `audit_log` | `audit_logs_archive` (only where legally allowed; financial / cost-related entries stay in main table for 7y minimum) |

Archive tables can live on:
- Same DB (cheap; queryable)
- Cold storage (B2, queryable on demand via load job)
- Read-only replica DB (Phase 10+)

**Hard rule:** never delete business-critical records (orders, invoices, payment logs, audit logs for cost/compliance) without explicit policy approval and legal sign-off.
