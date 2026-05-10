# Dashboard List

**Status:** Draft
**Owner:** Analytics lead
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §22 + Project Pack v2 §12

---

## All 16 dashboards

| # | Dashboard | Audience | Refresh | Cost data | Notes |
|---|---|---|---|---|---|
| 1 | **Executive** | Owner / management | 5 min | Profit yes (cost-redacted for non-finance views) | High-level KPIs |
| 2 | **Command Center** | Daily ops | Real-time / 30 sec | No | Live operational triage |
| 3 | **Sales** | Sales / Marketing | Hourly | Margin only | Revenue, AOV, channels |
| 4 | **Finance** | Finance + Super Admin | Daily | **Yes** | Cost, profit, payouts, COD exposure |
| 5 | **Marketing** | Marketing Manager | Hourly | No | Campaign perf, CAC, ROAS, pixel health |
| 6 | **Marketer (admin view)** | Marketer Manager | Hourly | Marketer cost yes | Top performers, fraud flags |
| 7 | **Marketer (marketer view)** | External marketer | Hourly | **No actual_cost** | Own perf only |
| 8 | **Warehouse / Inventory** | Inventory Manager | 15 min | No | Stock health, transfers, dead stock |
| 9 | **Operations / Shipping** | Shipping Coordinator | 15 min | No | Courier perf, COD collection |
| 10 | **AI / Conversation** | AI Supervisor | Hourly | Token cost yes | Handoff rate, confidence, intents, cost |
| 11 | **Auto-Reply** | AI Supervisor | Hourly | No | Template usage, conversion lift |
| 12 | **Customer Messaging** | Marketing / Support | Hourly | No | WhatsApp perf, satisfaction, opt-outs |
| 13 | **SEO** | Content / SEO Editor | Daily | No | Organic traffic, indexing, audit |
| 14 | **Landing Page** | Marketing | Hourly | No | LP perf, A/B, conversion |
| 15 | **Maintenance / Warranty** | Maintenance Manager | Daily | No | Tickets, SLA, batch defects |
| 16 | **Customer Intelligence** | Marketing / Sales | Daily | No | LTV, segments, journey |

## Cross-cutting

- **Data Quality Center** — detects 16+ catalog/config issues (see `03-data-quality-issues.md`)
- **AI Daily Brief** — AI-generated daily report (see `04-ai-daily-brief.md`)
- **Smart Notification Center** — alert types (see `05-smart-notifications.md`)
- **Report Builder** — custom reports (see `06-report-builder.md`)

## Filters available on every dashboard

- Date range
- Country
- Locale
- Channel (web/whatsapp/admin/landing)
- Marketer (when applicable)
- Campaign
- Payment method
- Customer segment

Filters constrained by viewer's country/marketer scope.

## Output formats

- On-screen widgets (Recharts or similar)
- CSV / Excel export
- PDF export
- Scheduled email / WhatsApp delivery

Export with cost columns requires `report.export.cost_columns` scope.

## TODO

- TODO: per-dashboard wireframe (low-fi) — see `wireframes/`.
- TODO: metric formulas locked in `02-metric-definitions.md`.
- TODO: dashboard refresh rate per metric (some need real-time, others daily).
- TODO: who sees which dashboard — confirm role mapping.
