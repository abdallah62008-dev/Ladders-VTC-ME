# Safety Incident Response

**Status:** Draft (Phase 1 documentation; full workflow Phase 6/9)
**Owner:** Compliance Officer + Customer Support Lead + Legal
**Source:** D-SAFE-001 🟢 Answered 2026-05-07

---

## What counts as a safety incident

| Incident type | Examples |
|---|---|
| `injury` | Customer or third party injured during use |
| `property_damage` | Ladder failure caused damage to property |
| `product_failure` | Mechanical failure (lock disengaged, rung snapped, base wobbled) |
| `misuse` | Customer used the ladder against documented warnings (still investigated; may surface a labelling/training gap) |
| `near_miss` | No actual injury or damage but an unsafe event occurred |
| `other` | Anything else flagged by customer / staff / regulator |

Any of the above filed by **customer / staff / partner / regulator / other** creates a `safety_incident_report` row.

---

## Triage SLA

| Severity | First response | Investigation closed |
|---|---|---|
| **Critical** (injury, regulator complaint) | 1 hour | 7 days |
| **High** (property damage, mechanical failure with photo) | 4 business hours | 14 days |
| **Medium** (near-miss) | 1 business day | 21 days |
| **Low** (single-customer suspected misuse) | 2 business days | 30 days |

Critical alerts: WhatsApp + email + dashboard banner to Compliance Officer + Legal + Super Admin within 1 minute of incident filing.

---

## Workflow

```
Reported (customer / staff / partner / regulator)
    ↓
Auto-creates safety_incident_report row + Critical-severity Alert
    ↓
Triaged by Compliance Officer + Customer Support
    ↓
Investigating (status='investigating')
  - Root cause analysis
  - Batch + serial check (if available)
  - Service ticket created in Module 16 (Phase 9 link)
  - Photos + customer statement collected
    ↓
Decision branch:
  ├── Resolved internally (refund / replacement / explanation)
  ├── Escalated to legal (regulator-relevant; potential liability)
  └── Recall / hold flag (batch-level concern → batch_quality.recall_flag)
    ↓
Closed (with resolution_notes; audit trail preserved 7y minimum)
```

---

## Required fields when filing

| Field | Required? |
|---|---|
| Reporter contact (name, phone, email — at least one) | ✅ |
| Country | ✅ |
| Incident type | ✅ |
| Severity | ✅ (initial estimate; Compliance Officer may revise) |
| Description (free text) | ✅ |
| Variant ID (if known) | optional |
| Order ID | optional |
| Serial number | optional |
| Batch ID | optional |
| Photos | strongly recommended |

---

## Cross-module integration

| Module | What happens |
|---|---|
| **Module 16 — Operations & Maintenance (Phase 9)** | Auto-creates `service_ticket` row linked via `safety_incident_report.linked_service_ticket_id`. Service team handles repair/replacement. |
| **Module 6 — Cart & Order** | If `order_id` provided, links to `customer_orders` row. Order can be flagged "incident_under_investigation" — automated emails / WhatsApp pause for that order until resolved. |
| **Module 16 — `product_batch`** | If batch traceable, increments `batch.incident_count`. If count exceeds threshold (e.g., 3 incidents in 30 days), auto-creates Critical alert for batch recall consideration. |
| **Module 25 — `safety_claim`** | If incident contradicts an approved claim (e.g., "max load 150 kg" claim, but ladder failed at 80 kg), Compliance Officer reviews claim revocation. |
| **Module 19 — `audit_log`** | Every status change is audit-logged. |
| **Module 23 — `alert`** | Critical alert auto-created on filing; assigned to Compliance Officer; SLA 1 hour. |

---

## Customer-facing communication

When a customer files an incident:

1. **Auto-acknowledgment** within 5 minutes via WhatsApp template `safety_incident_acknowledge_ar/_en` (Meta approval needed).
2. **Compliance Officer follows up** within SLA (above table).
3. **No automated marketing / promotional messages** are sent to that customer until the incident is closed (suppression rule on `customer_messaging`).
4. **Order remains visible** in customer's account but is annotated "Under safety review" until cleared.

---

## Recall procedure

If batch-level concerns surface (multiple incidents on same batch + root cause traceable to manufacturing or design):

1. Compliance Officer + Operations Director + Super Admin meet (dual approval required).
2. `product_batch.recall_flag = true` set; auto-creates Critical alert and pauses all sales of that batch.
3. Affected customers identified via `order_line.batch_id_snapshot` and contacted via WhatsApp + email.
4. Refund / replacement / repair offered.
5. Regulator notified per jurisdiction (KSA SASO; EG GOEIC; IQ COSQC).

Full recall runbook: `18-runbooks/batch-recall-procedure.md` (stub Phase 1; full content Phase 9).

---

## Audit retention

Safety incident records are retained for **10 years minimum** (longer than the standard 7-year retention) regardless of country, due to potential long-tail liability claims. Override `retention_policy.retention_duration_days = 3650` for `safety_incident_report` table.

---

## TODO

- TODO: lock auto-acknowledgment WhatsApp template wording (Compliance + Legal + Marketing).
- TODO: integrate with Module 16 service_ticket schema once Phase 9 design lands.
- TODO: confirm regulator-notification procedures per country with Legal.
- TODO: define "incident count threshold" for batch recall consideration (recommendation: 3 incidents in 30 days OR any single Critical incident).
