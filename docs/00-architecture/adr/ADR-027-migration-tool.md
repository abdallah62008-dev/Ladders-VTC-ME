# ADR-027 — Schema migration tool: node-pg-migrate

**Status:** ✅ **Accepted — 2026-05-07**
**Date:** 2026-05-07
**Owner:** DBA
**Supersedes:** none
**Tracker decision:** D-INFRA-004 (🟢 Answered 2026-05-07)

---

## Context

Phase 1 ships ~13 migrations covering catalog, customer, cost (with RLS), country, warehouse, audit triggers, views, and seed data. The migration tool choice gates **every** schema change from Phase 1 onward and shapes how RLS policies, audit triggers, indexes, and views are reviewed and deployed.

> **Companion naming-convention lock (D-DB-001 🟢 Answered 2026-05-07):** Main orders table is `customer_orders` (plural), not the bare `order` keyword and not quoted `"order"`. Migration 0008 authors must use the new name. CI grep test rejects the old patterns.

Special considerations:
- **RLS policies** must ship as migrations (not hidden in ORM internals).
- **Audit triggers** must be explicit Postgres function + trigger DDL.
- **Materialized views** with refresh schedules need explicit DDL.
- **Cost privacy** (D-RBAC-001) is enforced at DB layer — wrong tool could obscure cost-column policies.
- **Dynamic country/warehouse architecture** (D-COUNTRY-014, D-COUNTRY-002) requires precise control over JSONB columns and FK relationships.

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **node-pg-migrate** | Pure SQL-first; raw Postgres DDL exposed; easy review of RLS / triggers / views; mature; lightweight; works well with TypeScript | Manual rollback writing; less hand-holding than ORM | ✅ **Selected for Phase 1** |
| Prisma migrate | Great DX; auto-generated migrations from schema; type-safe client | Hides advanced Postgres features (RLS, triggers, views, partial indexes); ORM lock-in; harder to review raw SQL; problematic for cost-privacy review | ❌ Rejected |
| Atlas (declarative) | Modern; great diff engine; multi-DB support | Newer; team less familiar; declarative model harder for triggers + RLS migration sequences | ❌ Rejected for Phase 1 (revisit if database grows complex) |
| Drizzle Kit | Type-safe SQL; modern | Smaller ecosystem; less battle-tested for complex Postgres | ❌ Rejected |
| Knex migrations | Mature; flexible | More verbose; less SQL-first than node-pg-migrate | ❌ Rejected — node-pg-migrate is better SQL-first |
| Custom hand-rolled migrations | Maximum control | Reinventing the wheel; no existing ecosystem | ❌ Rejected |

## Decision

Use **`node-pg-migrate`** as the Phase 1 schema migration tool.

### Why node-pg-migrate (Phase 1 rationale)

- **Works well with PostgreSQL** — purpose-built for Postgres; supports advanced features cleanly (RLS, triggers, views, partial indexes, generated columns, pgvector indexes).
- **Keeps migrations explicit and reviewable** — every change is raw SQL DDL or a thin JS wrapper that emits SQL; PRs show exactly what runs against the database.
- **Avoids hiding schema changes behind an ORM** — auditable in code review; cost-privacy reviewer can verify RLS + audit trigger DDL directly.
- **Suitable for our stack** — RLS policies, audit triggers, views, materialized views all expressible directly.
- **Good fit because cost privacy + audit are critical** — D-RBAC-001 RLS policies, D-COUNTRY-014 dynamic schema, D-COUNTRY-015 warehouse audit triggers, D-PAY-002/003 `profit_floor_rule` versioning all benefit from explicit SQL review.

## Migration workflow (locked)

### File structure

```
/migrations
  /sql                     ← node-pg-migrate generated files
    1700000001000_initial-extensions.sql
    1700000002000_system-rbac-audit.sql
    1700000003000_geo-locale.sql
    1700000004000_catalog.sql
    1700000005000_pricing-and-costs.sql
    ... (one file per logical migration unit per migration plan)
```

Filenames use timestamp + slug per node-pg-migrate convention. Up + Down sections in same file (or paired `.up.sql` + `.down.sql` files).

### Branching + review process

1. Engineer creates a new migration via:
   ```
   pnpm db:migrate create <slug>     # generates timestamped file
   ```
2. Edits the up + down SQL.
3. Tests locally against fresh DB:
   ```
   pnpm db:migrate up                # apply
   pnpm db:migrate down              # rollback
   ```
4. Opens PR. PR template (per `99-templates/pr-template.md`) requires:
   - Migration file diff visible
   - Reversible: yes/no (with reason if no)
   - RLS policies updated (if cost-bearing tables touched)
   - Audit triggers attached (if sensitive tables added)
   - Pre-risky-change backup considered (per `08-backups/02-pre-risky-change-triggers.md`)
5. **DBA + backend lead** approval required for any migration touching:
   - Cost-bearing tables (RLS)
   - Audit triggers
   - Country / warehouse / pricing dynamism
   - Indexes on hot tables
6. Senior review required for production-affecting migrations.

### Production migration rule (locked — do not violate)

**Phase 0:** No migration runs anywhere. ADR-027 documents the tool; no DB is touched.

**Phase 1+:** No migration runs against any database without **explicit approval** from project owner / CTO. Rules:
- Staging deploys: automated after CI passes.
- Production deploys: **manual + dual-approval** (Super Admin + DBA or CTO).
- Pre-risky-change auto-backup triggered before any production migration that touches cost-bearing tables, RLS policies, or warehouse stock data.
- Maintenance window declared if the migration locks tables.
- Migration runs in transaction where possible; long-running ALTERs split into multiple migrations.
- Post-migration smoke tests (RLS test, basic queries, audit trigger spot-check).
- Forward-only after Phase 1 launch — no destructive reverts in production. Forward-fix preferred.

### Rollback (down) policy

- **Every migration includes a rollback (down) section where safe.** "Where safe" excludes:
  - Data migrations (one-way data transformations)
  - Drops of critical audit columns (would lose history)
  - Migrations that have already produced order/cost snapshots in production
- Rollback is for **dev/staging** only; production uses forward-fix.
- If a rollback would lose data, the migration's down section MUST contain a clear comment: `-- DOWN INTENTIONALLY EMPTY: data loss prevention. Forward-fix required.`

### Dynamic-architecture-compatibility

All migrations must respect the locked rules from prior decisions:

- **D-COUNTRY-014** — No hardcoded country fields. Every per-country relationship via `(country_id, ...)` keys.
- **D-COUNTRY-002** — Warehouse rows linked via `country_id`; stock keyed `(variant_id, warehouse_id)`.
- **D-COUNTRY-015** — Warehouse lifecycle columns (`archived_at`, `archived_by`, `archive_reason`).
- **D-RBAC-001** — RLS policies on `variant_country_cost`, `order_line.actual_cost_snapshot`, `business_gross_profit_snapshot`.
- **D-PAY-002 / D-PAY-003** — `profit_floor_rule` table with versioned rows; `country.business_min_margin` cache updated via trigger; never literal margin values in code.

Any migration that violates these rules must fail code review.

### CI integration

- `pnpm db:migrate up` runs in CI test database before unit/integration tests.
- RLS test suite runs after migrations to verify cost privacy + per-role policies.
- CI fails if migration:
  - Has no down section (without explicit `-- DOWN INTENTIONALLY EMPTY` comment)
  - Adds literal margin values in guardrail-evaluation paths (D-PAY grep test)
  - Adds hardcoded country strings (D-COUNTRY-014 grep test)
  - Misses audit trigger when adding cost-bearing columns
  - Uses bare `order` table name OR quoted `"order"` (D-DB-001 grep test) — main orders table must be `customer_orders` (plural)
  - **Uses `uuid_generate_v4()` OR enables `uuid-ossp` extension OR mixes UUID generators** (D-DB-002 grep test) — UUID PKs must default to `gen_random_uuid()` from pgcrypto only

## Consequences

### Positive
- Explicit SQL keeps schema reviewable.
- RLS, triggers, views all live in version-controlled migration files.
- No ORM lock-in.
- Lightweight; one dependency.
- Mature tool; battle-tested.
- Good fit for cost-privacy review process.

### Negative / risks
- Manual rollback writing — engineers must think about reversibility.
- Less type safety than ORM-generated migrations.
- Refactoring schema requires more discipline (rename columns is a 2-step operation: add new + backfill + drop old).

### Mitigations
- PR template enforces rollback decision discipline.
- Pre-risky-change auto-backup catches "rollback would have lost data" cases.
- Strict CI tests verify schema invariants.
- Senior review for any cost-bearing or RLS-touching migration.

## Phase 0 deliverables

- [x] ADR-027 written (this doc).
- [ ] `node-pg-migrate` listed in Phase 1 package allow-list (D-INFRA-006 dependency — when pnpm + dependencies are confirmed).
- [ ] Migration directory structure documented in `01-database/05-migration-plan.md`.
- [ ] PR template updated to require migration review fields.
- [ ] **No migration runs in any environment during Phase 0.**

## Phase 1 deliverables

- All 13 migrations in the migration plan executed against staging via CI.
- Production deployment workflow documented and rehearsed on staging.
- RLS test suite passes on every migration in CI.
- Forward-only policy active in production after first deployment.

## References

- Master Plan v4 §6 (Database modules), §15 (Cost privacy enforcement)
- Pre-coding question (none — internal tooling decision)
- D-INFRA-004 (Tracker decision, 🟢 Answered 2026-05-07)
- ADR-006 (PostgreSQL 16+ with RLS)
- ADR-022 (1Password for migration credentials)
- ADR-024 (GitHub Actions CI/CD)
- `01-database/05-migration-plan.md` (migration sequence and content)
- `01-database/03-rls-policies.md` (RLS policies that ship as migrations)
- `01-database/07-triggers.md` (audit triggers that ship as migrations)
- `08-backups/02-pre-risky-change-triggers.md` (auto-backup before risky migrations)
- `99-templates/pr-template.md` (PR review checklist)
