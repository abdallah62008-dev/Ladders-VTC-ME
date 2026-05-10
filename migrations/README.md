# Migrations

Per ADR-027 + D-INFRA-004 (locked 2026-05-07): **node-pg-migrate** is the schema migration tool.

## Locked rules

- Migrations live in `/migrations/sql/` as raw SQL with timestamp prefixes (node-pg-migrate convention).
- Every migration has a rollback (down) section where safe, OR an explicit `-- DOWN INTENTIONALLY EMPTY: data loss prevention. Forward-fix required.` comment.
- **No migration runs against production without manual approval** per ADR-027.
- Pre-risky-change auto-backup fires before any production migration touching cost-bearing tables, RLS policies, or warehouse stock.
- Forward-only after Phase 1 launch.

## Locked schema rules enforced

- **D-DB-001**: main orders table is `customer_orders` (plural). NO bare `order` or quoted `"order"`.
- **D-DB-002**: ALL UUID PKs default to `gen_random_uuid()` from `pgcrypto`. NO `uuid_generate_v4()` or `uuid-ossp`.
- **D-DB-003**: ALL monetary columns are `numeric(12,2)`. NO `float`/`double precision`/`real`/`money`.
- **D-DB-010**: 4-class deletion policy (canonical: `/docs/01-database/02-tables-by-module.md` §"Deletion policy"):
  - Class 1 (soft-delete): `customer_orders`, `customer`, `b2b_account`, `invoice`, `refund`, `payment_transaction`, `warranty_claim`, `service_ticket`, `product_batch`, `marketer_payout`, `approval`, `override_request`
  - Class 2 (never delete): `audit_log`, `country_data_audit`, `cost_history`, `variant_country_cost`, `variant_marketer_cost`, `order_profit_snapshot`, `payment_log`, `safety_incident_report`, `stock_movement` (immutable inventory ledger; aligned 2026-05-10), `cost_read_log` (Phase 1 schema reservation; Phase 2 instrumentation; 7-year retention)
  - Class 3 (hard delete after retention): `cart`, `cart_line`, `cart_event`, sessions, etc.
  - Class 4 (PII anonymization): customer right-to-erasure
- **D-COUNTRY-014**: NO hardcoded country fields (`price_sa`, `stock_eg`, etc.). All per-country data via `country_id` FK.

## How to run (after database provisioning)

```bash
# Local dev only:
cp .env.example .env.local       # set DATABASE_URL
pnpm install
pnpm db:migrate up                # apply pending migrations
pnpm db:migrate down              # rollback last (dev only)
pnpm db:migrate create my-migration   # create new timestamped file
```

**IMPORTANT:** Sprint 1 produces the migration files only. The user runs them
against a development database under their control. Claude never connects to
or modifies any database.

## Phase 1 migration plan

Per `/docs/01-database/05-migration-plan.md`. Sprint 1 ships:

| File                                   | Migration                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `1700000001000_initial-extensions.sql` | 0001 — Extensions (pgcrypto, pg_trgm, vector, pg_stat_statements)                                                                     |
| `1700000002000_system-rbac-audit.sql`  | 0002 — user, role, permission, role_permission, audit_log, system_setting                                                             |
| `1700000003000_geo-locale.sql`         | 0003 — country (with launch_status, business_min_margin, compliance_profile), locale, currency, tax_setting, country_launch_readiness |

Sprint 2+ ships the remaining migrations (0004–0013) per the plan.
