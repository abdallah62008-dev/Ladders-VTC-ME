# Monitoring, Incidents, and Alerts System

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001); Phase 1 read-only skeleton; full categories Phase 6/10
**Owner:** Infra Lead + Operations Director
**Source:** Master Plan v4 §22; D-CSP-001 + D-OPS-010 + D-SAFE-001 (extension alert categories)

> Section H of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## H.1 Admin section

```
System / Intelligence
  ├── Alerts Center
  ├── Performance Incidents
  ├── Data Quality Alerts
  ├── Landing Page Alerts
  ├── Database Alerts
  ├── Cleanup Alerts
  ├── Webhook Alerts
  ├── Job Queue Alerts
  ├── AI Cost Alerts
  ├── Payment Alerts
  ├── Notification Rules
  └── Alert History
```

## H.2 Alert categories

### H.2.1 Performance Alerts

- Landing page Lighthouse below threshold
- LCP above threshold (per page class budget)
- INP above threshold
- CLS regression (>0.05)
- Page weight too high (per A.3 budget)
- Image too heavy (>200 KB single asset)
- Script weight too high (per A.6 governance)
- Cache hit ratio low (<85% target)

### H.2.2 Landing Page Alerts

- Page score below threshold (per `03-landing-pages.md` D.2)
- Pre-publish check failed
- Product out of stock
- Product low stock
- Coupon expired
- Price missing
- WhatsApp CTA broken
- Direct buy CTA broken
- Pixel not firing
- Conversion drop (vs. 7-day baseline)
- Page speed regression (vs. last week)

### H.2.3 Database Alerts

- Slow query above threshold (p95 > 1s)
- Index missing (suggested by `pg_stat_statements` analysis)
- Table bloat high (>30%)
- Partition approaching limit
- Materialized view stale (refresh skipped)
- DB storage high (>80%)
- Failed cleanup job

### H.2.4 Data Cleanup Alerts

- Cleanup job failed
- Sensitive cleanup waiting approval
- Cleanup saved large space (informational)
- Expired files above threshold
- Orphan media detected (>1000 rows)
- Expired reservations not released

### H.2.5 Payment Alerts

- Payment webhook failed
- Refund stuck (in-flight > 48h)
- Dispute opened
- Provider outage
- Payment success rate dropped (vs. baseline)

### H.2.6 WhatsApp / Messaging Alerts

- Template rejected by Meta
- Message delivery rate low
- Opt-out spike
- WhatsApp webhook failure
- Confirmation no-reply rate high

### H.2.7 AI Alerts

- AI cost spike (above daily budget)
- Fallback rate high
- Hallucination audit flag
- Low confidence spike
- Handoff queue high
- Tool errors

### H.2.8 Business Alerts

- Campaign losing money
- Product margin below floor
- High cancellation rate
- Marketer fraud pattern
- Low stock
- Dead stock
- Delivery failure spike

### H.2.9 Country Access Control Alerts (added 2026-05-09 — D-CSP-001)

- More than 5 `denied_cross_country_access_attempt` events for same user in 24h (High)
- `country_scope.all` granted to a new user (High; notify Security Lead)
- Cross-country export > 10,000 rows (Medium)

### H.2.10 Safety & Compliance Alerts (added 2026-05-07 — D-SAFE-001)

- Incident report filed, severity > Low (Critical)
- Unapproved safety claim found in published content (High)
- Certificate expired and still referenced in published content (High)
- Claim approval pending > 7 days (Medium)

## H.3 Alert severity

Five levels:

- **Info** — informational only; no action required
- **Low** — track; weekly digest
- **Medium** — review within business hours; daily digest
- **High** — review within 4 business hours; immediate notification to owner
- **Critical** — immediate multi-channel notification; SLA enforced; escalation if not acknowledged

## H.4 Alert fields

Each alert row stores:

| Field | Description |
|---|---|
| `alert_id` | UUID |
| `category` | One of H.2.1–H.2.10 |
| `severity` | info / low / medium / high / critical |
| `title` | One-line summary |
| `description` | Details + context |
| `affected_entity_type` | landing_page / product / order / etc. |
| `affected_entity_id` | UUID |
| `country_id` | Country scope (if applicable) |
| `owner_role` | Role responsible |
| `owner_user_id` | Specific assignee (nullable) |
| `status` | triggered / assigned / acknowledged / investigating / resolved / closed |
| `triggered_at` | timestamptz |
| `acknowledged_at` | timestamptz nullable |
| `resolved_at` | timestamptz nullable |
| `resolution_notes` | Free text |
| `related_dashboard_url` | Quick link |
| `related_runbook_url` | Quick link |

## H.5 Alert workflow

```
Triggered
    ↓
Assigned (auto by category → owner_role; manual reassignment allowed)
    ↓
Acknowledged
    ↓
Investigating
    ↓
Resolved (with resolution_notes)
    ↓
Closed
```

Critical alerts may require:
- WhatsApp / internal notification
- Email notification
- Dashboard red banner
- Escalation if not acknowledged within SLA (default 15 min for Critical)

## H.6 Performance Incident System

If an important page becomes slow, system opens an incident automatically:

> **Incident PERF-2026-0042**
> Landing page `/ar-sa/lp/4-4m-villa` dropped to Lighthouse 68.
> Likely reason: Hero image 2.8 MB.
> Owner: Media Manager.
> Priority: High.
> Suggested action: Replace / compress hero image to ≤200 KB.

Incidents track: trigger time, owner, root cause hypothesis, suggested fix, resolution time, regression date.

## H.7 Page Performance History

Tracked per page in `landing_page_performance_history`:

- Current score
- Previous score
- Best score
- Worst score
- Regression date (when score dropped >5 points)
- Reason (auto-detected if possible: heavy image, new script, cache miss spike)
- Owner
- Last optimized date

## H.8 Revenue Impact of Slowness

Estimated business impact per regression:

```
page_speed_before:  Lighthouse 92, LCP 1.8s
conversion_before:  4.2%
page_speed_after:   Lighthouse 68, LCP 4.1s
conversion_after:   2.3%
estimated_lost_revenue: $4,200 over 14 days at average AOV
affected_campaign:  ramadan-villa-2026
suggested_fix:      Replace hero image; lazy-load comparison block
```

Surfaced in **Marketing Dashboard** + auto-generated incident.

## H.9 Slow Query Business Impact

Slow query report shows:

| Field | Example |
|---|---|
| Affected feature | "Landing page conversion tracking" |
| Affected page | `/ar-sa/lp/4-4m-villa` |
| Business risk | "Page load slowed by 800ms; conversion drop" |
| Owner | DBA + Marketing Manager |
| Suggested optimization | "Add index on `landing_page_event(landing_page_id, created_at desc)`" |
