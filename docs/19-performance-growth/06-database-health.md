# Database Health & Report Optimization

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (part of D-PERF-001); deliverables Phase 10
**Owner:** DBA
**Source:** Master Plan v4 §22

> Section G of the Performance, Cleanup, Landing Page Growth & Alerts System. See [`00-index.md`](./00-index.md) for the full module overview.

---

## G.1 Database Health Dashboard

Single-pane view (admin: DBA + Infra lead + Super Admin):

- Slow queries (top 20 by p95 from `pg_stat_statements`)
- Index health (missing index recommendations from query plans)
- Table bloat (per `pg_class`)
- Partition health (when partitioning ships)
- VACUUM / ANALYZE status (last run per table)
- Materialized view refresh status (last refresh, lag)
- Largest tables (storage used, row count)
- Query errors (Sentry-reported DB errors)
- DB storage usage (% capacity)

## G.2 Partitioning Strategy

Candidate tables for time-based partitioning (Phase 10+ if volumes warrant):

- `message_log` (per month)
- `ai_tool_call` (per month)
- `webhook_log` (per month)
- `pixel_event_log` (per month)
- `audit_log` (per quarter — kept longer)
- `order_event` (per quarter)
- `customer_journey_event` (per month)
- `event` (per month)

Threshold: partition when row count > 50M or table size > 50 GB.

## G.3 Summary Tables for Fast Dashboards

Materialized summary tables refreshed by background jobs (BullMQ scheduled):

| Table | Cadence |
|---|---|
| `daily_sales_summary` | Hourly |
| `daily_country_summary` | Hourly |
| `daily_product_summary` | Daily |
| `daily_marketer_summary` | Hourly |
| `daily_campaign_summary` | Hourly |
| `daily_ai_summary` | Hourly |
| `daily_warehouse_summary` | Hourly |
| `daily_landing_page_summary` | Hourly |

These power Phase 10 dashboards without hitting raw tables.

## G.4 Materialized Views

Use materialized views for expensive reporting queries; refresh via scheduled BullMQ job. Examples already documented in `01-database/06-views.md`:

- `mv_override_usage_summary` (daily)
- `mv_marketer_quality_rolling` (weekly)
- `mv_data_quality_summary` (hourly)

Phase 10 adds:

- `mv_landing_page_performance` (hourly) — per-page conversion + score history
- `mv_script_weight_impact` (daily) — script-by-page LCP delta
- `mv_cleanup_history` (weekly) — what was cleaned + space saved trends
