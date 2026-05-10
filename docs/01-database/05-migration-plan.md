# Migration Plan

**Status:** 🟢 **Tool locked 2026-05-07** (D-INFRA-004 Answered)
**Owner:** DBA
**Last updated:** 2026-05-07
**Source:** ADR-027 (✅ Accepted 2026-05-07)

This file lists the **order** of database migrations for Phase 1, and documents which tables are reserved-from-day-1 even if the corresponding feature ships in a later phase. Reservation avoids painful future migrations.

> ⚠️ **Phase 0 produces this plan as documentation only. No migration runs anywhere during Phase 0.**
>
> ⚠️ **Phase 1+:** No migration runs against any database without explicit approval (per ADR-027).

---

## Migration tool

**🟢 Confirmed 2026-05-07: `node-pg-migrate`** (per ADR-027). Reasons:

- Works well with PostgreSQL 16+ (ADR-006).
- Keeps migrations explicit and reviewable — pure SQL DDL or thin JS wrappers emitting SQL.
- Avoids hiding schema changes behind an ORM — RLS policies, audit triggers, views all visible in PR diffs.
- Suitable for the project's RLS, indexes, triggers, views, and advanced Postgres features.
- Good fit because cost privacy (D-RBAC-001), audit triggers (D-COUNTRY-014/015), and dynamic country/warehouse architecture all require explicit SQL review.

### Locked rules (per ADR-027)

| Rule | Status |
|---|---|
| Migration files version-controlled in `/migrations/sql/` | 🟢 Locked |
| Every migration includes rollback (down) section **where safe** — data-migration / production-already-snapshotted exclusions documented inline with `-- DOWN INTENTIONALLY EMPTY: data loss prevention. Forward-fix required.` | 🟢 Locked |
| RLS policies, audit triggers, indexes, views all ship as migrations (not hidden in ORM internals) | 🟢 Locked |
| Schema must remain compatible with **dynamic `country_id` and `warehouse_id`** relationships (D-COUNTRY-014, D-COUNTRY-002) — no hardcoded country fields | 🟢 Locked |
| **No table named `order`** (singular bare keyword) and **no quoted `"order"` references** anywhere in migrations, queries, or app code (D-DB-001 🟢 Answered 2026-05-07). Main orders table is `customer_orders` (plural). CI grep test rejects either pattern. | 🟢 Locked |
| **UUID generation: `gen_random_uuid()` from pgcrypto only** for ALL UUID PKs (D-DB-002 🟢 Answered 2026-05-07). `uuid_generate_v4()` and `uuid-ossp` extension are forbidden; mixing UUID generators is forbidden; CI grep test rejects either pattern. | 🟢 Locked |
| **Monetary columns: `numeric(12,2)` only** for all money fields (D-DB-003 🟢 Answered 2026-05-07). `float`, `double precision`, `real`, `money` (Postgres type), and any non-`(12,2)` numeric precision on monetary columns are forbidden; per-country numeric variation is forbidden; minor-unit storage at DB layer is forbidden (payment adapter handles minor-unit conversion per `05-payments/02-provider-abstraction.md`). CI grep test rejects forbidden patterns. | 🟢 Locked |
| **No migration runs in Phase 0** | 🟢 Locked |
| In Phase 1+, no migration runs against any database without explicit approval | 🟢 Locked |
| Staging deploys: automated after CI passes | 🟢 Locked |
| Production deploys: manual + dual-approval (Super Admin + DBA or CTO) | 🟢 Locked |
| Pre-risky-change auto-backup triggered before any production migration touching cost-bearing tables, RLS policies, warehouse stock, or schema-affecting operations | 🟢 Locked |
| Forward-only after Phase 1 launch (no destructive reverts in production) | 🟢 Locked |
| RLS test suite runs after every migration in CI | 🟢 Locked |
| CI fails if migration: misses `-- DOWN INTENTIONALLY EMPTY` comment when down section is empty; adds literal margin values (D-PAY); adds hardcoded country strings (D-COUNTRY-014); misses audit trigger when adding cost-bearing columns; uses bare `order` table name OR quoted `"order"` (D-DB-001); uses `uuid_generate_v4()` OR enables `uuid-ossp` extension OR mixes UUID generators (D-DB-002); **declares any monetary column as `float`/`double precision`/`real`/`money` (Postgres type)/non-`(12,2)` numeric** (D-DB-003) | 🟢 Locked |

### Workflow commands (CLI shape)

```
pnpm db:migrate create <slug>     # generate timestamped migration file
pnpm db:migrate up                # apply pending migrations (dev/staging)
pnpm db:migrate down              # rollback last migration (dev/staging only)
pnpm db:migrate up --to=<ts>      # apply up to specific timestamp
```

Production migration runs are not pnpm scripts — they are explicit GitHub Actions workflow runs gated by manual approval.

### PR review checklist (mandatory for every migration)

Per `99-templates/pr-template.md`:
- Migration file diff visible
- Reversible: yes / no (with reason if no)
- RLS policies updated if cost-bearing tables touched
- Audit triggers attached if sensitive tables added
- Pre-risky-change backup considered
- DBA + backend lead approval for cost / audit / dynamism / hot-index changes
- Senior review for production-affecting migrations

---

## Phase 1 — initial migration set (Foundation MVP)

### Migration 0001 — extensions and roles

> 🟢 **D-DB-002 locked 2026-05-07:** `pgcrypto` is the sole source of UUID generation across the entire schema. `gen_random_uuid()` is the canonical PK default expression. `uuid-ossp` MUST NOT be enabled. `uuid_generate_v4()` MUST NOT appear in any migration file or app code.

```
CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- 🟢 D-DB-002: UUID generation source (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;            -- pgvector
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 🟢 D-DB-002: uuid-ossp deliberately NOT enabled. Any future requirement to add it
-- requires re-opening D-DB-002 and updating the locked rule in 05-migration-plan.md.

-- Application roles (placeholder — actual GRANTs in 0002)
```

**UUID PK column convention (locked across all subsequent migrations 0002–0013):**

```sql
-- Standard PK column definition for every UUID-keyed table:
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

CI grep test rejects any migration file containing the patterns:
- `uuid_generate_v4` (the uuid-ossp function)
- `CREATE EXTENSION ... uuid-ossp` (the forbidden extension)
- Custom per-table UUID generators (must use `gen_random_uuid()` only)

### Migration 0002 — system, RBAC, audit
- `user`, `role`, `permission`, `role_permission`
- `audit_log` (with `override_request_id`, `import_job_id` nullable from day 1)
- `system_setting`, `notification`, `export`

### Migration 0003 — geo and locale
- `country`, `locale`, `currency`, `tax_setting`
- `country_launch_readiness`

### Migration 0004 — catalog
- `category`, `category_translation`
- `product_group`, `product_group_translation`
- `product`, `product_translation`
- `product_variant`
- `product_image`, `product_video`, `product_certification`

### Migration 0005 — pricing and costs (with RLS)
- `variant_country_price`
- `variant_country_cost` **+ RLS policies**
- `variant_marketer_cost` **+ RLS policies**
- `pricing_rule`, `cost_history`, `profit_floor_rule`

### Migration 0006 — warehouses and stock
- `warehouse`
- `variant_warehouse_stock`
- `stock_movement`, `stock_reservation`, `stock_transfer`
- `damaged_stock`, `returned_stock`, `inbound_stock`

### Migration 0007 — customer
- `customer`, `customer_address`, `customer_consent`, `customer_opt_out`
- `customer_segment`, `customer_segment_membership`, `customer_score`
- `customer_journey_event`, `customer_intelligence`
- `b2b_account`

### Migration 0008 — cart and customer_orders (full schema, even if checkout not built yet)

> 🟢 **D-DB-001 Answered 2026-05-07:** main orders table is `customer_orders` (plural) — NOT `order` and NOT quoted `"order"`. Child tables retain `order_*` prefix. CI grep test rejects `CREATE TABLE order` and `CREATE TABLE "order"` patterns.

- `cart`, `cart_line`, `cart_event`
- `draft_order`
- **`customer_orders`** (renamed from `order`), `order_line` **+ RLS on cost columns**
- `order_address`, `order_event`, `order_profit_snapshot`
- `order_source_attribution`, `order_risk_score`
- All FK references use `order_id uuid REFERENCES customer_orders(id)` — column name preserved across `order_line`, `cart.converted_to_order_id`, `marketer_order_attribution.order_id`, `payment_transaction.order_id`, `deposit.order_id`, `invoice.order_id`, `delivery_failure.order_id`, audit-log entity references, etc.

### Migration 0009 — country data audit and views
- `country_data_audit`
- View `v_variant_country_availability`
- View `v_order_line_public` (cost-redacted)

### Migration 0010 — system primitives reserved-from-day-1
- `approval`
- `override_request`, `override_policy` (UI ships Phase 5)
- `import_export_job`, `import_template`, `import_validation_rule`, `export_request` (UI ships Phase 2+)
- `backup_job`, `backup_schedule`, `restore_job`, `backup_verification` (UI ships Phase 1; daily backup runs from Phase 1)
- `media_asset`, `media_variant`, `media_usage`

### Migration 0011 — triggers and functions
- `country_data_audit` trigger on `variant_country_price`, `variant_country_cost`, `variant_marketer_cost`, `variant_warehouse_stock`
- `audit_log` trigger on cost-bearing tables
- `set_updated_at` generic trigger
- `product_country_readiness` recompute function

### Migration 0012 — seed data
- Seed countries: KSA (active), Egypt (draft), Iraq (draft), AE (placeholder).
- Seed currencies and locales.
- Seed roles + permissions.
- Seed override_policy defaults.
- Seed at least one warehouse for KSA.

### Migration 0013 — search indexes
- All composite indexes from `04-indexes.md` Phase-1 hot paths.
- pgvector index on `faq_policy.embedding`.

---

## Reserved-from-day-1 (skeleton tables, populated later)

These tables are migrated in Phase 1 as empty schemas to avoid future migrations:

| Table | UI ships in |
|---|---|
| All conversation/AI/auto-reply/messaging tables | Phase 3 |
| Customer messaging tables | Phase 4 |
| Marketer/coupon/landing tables | Phase 5–6 |
| Payment provider tables | Phase 7 |
| B2B tables | Phase 8 |
| Operations/maintenance tables | Phase 9 |
| Reports/intelligence tables | Phase 10 |

Document each addition's migration in subsequent phase migration files.

---

## Migration order during Phase 2+

Each phase delivers its tables via numbered migrations continuing from Phase 1. Example for Phase 3:
- Migration 0030 — conversation, message, conversation_state_log
- Migration 0031 — ai_response, ai_tool_call, ai_prompt
- Migration 0032 — auto_reply tables
- ...

---

## Production migration checklist

For every production migration:
1. Pre-risky-change backup auto-triggered.
2. Migration tested on staging via restored backup.
3. Migration plan reviewed by 2 engineers (DBA + backend lead).
4. Maintenance window declared if migration locks tables.
5. Migration runs in transaction where possible; long-running ALTERs split.
6. Post-migration smoke tests run (RLS test, basic queries).
7. Rollback plan documented but rarely used (forward-fix preferred).

---

## TODO

- TODO: pick migration tool (ADR-027).
- TODO: lock migration numbering convention (4-digit padded).
- TODO: confirm whether to use one large migration per phase or many small ones (recommendation: many small, transactional).
- TODO: write CI step that validates RLS policies after every migration.
- TODO: write CI grep step rejecting `CREATE TABLE order` and `CREATE TABLE "order"` patterns (D-DB-001 enforcement).
- TODO: write CI grep step rejecting `uuid_generate_v4` and `uuid-ossp` patterns in any migration file or app code (D-DB-002 enforcement).
- TODO: write CI grep step rejecting `float`, `double precision`, `real`, `money` (Postgres type), or `numeric(` followed by non-`12,2` arguments on monetary columns in any migration file (D-DB-003 enforcement). Allow-list: `numeric(5,4)` for margin/rate/percentage columns (`business_min_margin`, `vat_rate`, `platform_fee_percent_snapshot`); `numeric(*,*)` on non-monetary fields (e.g., `pricing_rule.threshold` if non-money).
