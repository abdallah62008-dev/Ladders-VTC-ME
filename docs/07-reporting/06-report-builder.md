# Report Builder

**Status:** Draft (stub)
**Owner:** Analytics lead

---

## Purpose

Admin builds custom reports without engineering.

## Inputs

- Date range
- Country (multi)
- Product / group
- Warehouse
- Marketer
- Campaign
- Payment method
- Channel
- Customer segment
- Metric set (revenue, profit (cost-gated), orders, conversion, etc.)
- Group-by dimensions

## Outputs

- Table view
- Chart view (line, bar, pie)
- CSV / Excel / PDF
- Schedulable email / WhatsApp delivery

## Permissions

- Profit-bearing reports require `report.profit` scope.
- Cost-column exports require `report.export.cost_columns`.
- Country-scoped users only see their countries.

## Country scope rules (🟢 D-CSP-001 locked 2026-05-09)

Per `03-rbac/03-scopes.md` §G + `02-api/01-conventions.md` `X-Country-Context` header.

### Single-country reports

| Requirement | Notes |
|---|---|
| User must have `user_country_access` for the report's country (or `country_scope.all`) | RLS enforces at DB layer regardless |
| Country selected in top-bar = report country | Report scope filtered by active country selector |
| 403 if user lacks access to the requested country | Audit log `denied_cross_country_access_attempt` |

### Cross-country reports

| Requirement | Notes |
|---|---|
| `report.cross_country.read` permission required | High-value permission; default to Super Admin + Finance Admin |
| Access to ALL included countries (or `country_scope.all`) | Report engine evaluates country set BEFORE running query and 403s if user lacks any |
| Audit log `cross_country_report_run` entry created | Records actor, country set, report definition, run time |
| Currency conversion via `currency_exchange_rate` (Phase 8+ design) | Single currency display required for cross-country comparison |

### Cross-country exports

| Requirement | Notes |
|---|---|
| `export.cross_country` permission required | Even higher-value than `report.cross_country.read` |
| Cost columns require `cost.export` (existing — D-RBAC-001) | Independent from country scope |
| Audit log `cross_country_export` entry created with mandatory `export_reason` | High severity |
| Dual approval if record count > 10,000 | Same threshold as bulk pricing per D-IMP-005 |

### Mandatory export audit fields

Every export writes a row to `export_request` with:

- `exporting_user_id`
- `requested_at`
- `country_filter` (CSV of country codes; `all` if all-countries)
- `cross_country` boolean
- `column_set` jsonb (which columns were included)
- `cost_columns_included` boolean
- `record_count`
- `export_reason` text (mandatory if `cross_country = true` OR `cost_columns_included = true`)
- `audit_log_id` mandatory

## Schema

```
report_definition (
  id, name, owner_user_id, filters: jsonb, dimensions: jsonb,
  metrics: jsonb, output_format, is_template, created_at
)

scheduled_report (
  id, report_definition_id, schedule: cron-string,
  recipients: jsonb, channels: jsonb, active
)

report_export (
  id, report_definition_id, format, file_url, expires_at,
  requested_by, generated_at
)
```

## TODO

- TODO: UI design.
- TODO: query builder safety (prevent expensive ad-hoc queries).
- TODO: caching for repeat reports.
