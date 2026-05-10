# ADR-006 — Database engine: PostgreSQL 16+ with Row-Level Security

**Status:** Proposed
**Date:** 2026-05-07
**Owner:** DBA
**Supersedes:** none
**Superseded by:** none

---

## Context

Database requirements driven by Master Plan v4:

1. **Three-layer cost model with strict access control.** `actual_product_cost` must be invisible to non-finance roles even with admin access — requires database-level enforcement, not just application checks.
2. **Highly varied variant attributes.** Ladders have type-specific specs (height, max load, folded length, material, certification). Modeling rigidly with 30 nullable columns or EAV is painful.
3. **Native Arabic full-text search fallback** for cases where Meilisearch is unavailable or for in-place SQL queries.
4. **Full-text vectors for FAQ retrieval** (pgvector) — keep one DB if possible.
5. **Strong concurrency** for cart/checkout race conditions (stock reservation).
6. **JSON-aware reporting** — many of our analytics queries pivot on JSONB attributes.
7. **Long-term reliability** — transactional, ACID, mature.

## Options considered

| Option | Verdict | Reason |
|---|---|---|
| **PostgreSQL 16+** | ✅ Selected | RLS, JSONB, pg_trgm, pgvector, mature, strong concurrency |
| MySQL 8.0 | ❌ Rejected | RLS implementation weak (only via views); JSON support inferior |
| MariaDB 10.11 | ❌ Rejected | Same as MySQL; no proper RLS |
| MS SQL Server | ❌ Rejected | License cost, MENA hosting friction |
| MongoDB | ❌ Rejected | No transactions across documents the way Postgres does relations; reporting harder |
| Cockroach / Yugabyte | ❌ Rejected | Distributed-SQL overhead unnecessary at our scale |
| Supabase (managed Postgres) | 🔄 Considered | Good DX; uses Postgres so compatible. TODO: revisit if self-hosting cost is high |

## Decision

Use **PostgreSQL 16+** with the following extensions:
- `pg_trgm` — Arabic-aware text search fallback
- `pgvector` — FAQ embeddings store
- `pgcrypto` — UUID generation (`gen_random_uuid()` — locked source per D-DB-002 🟢 2026-05-07; `uuid-ossp` forbidden), hashing helpers
- `pg_stat_statements` — query performance observability

Hosting: TODO (managed vs self-hosted, ADR-018 dependent).

## Consequences

### Positive
- **RLS** is database-enforced, surviving even if a developer writes a bug bypassing application checks.
- One database for relational + vector + FTS — fewer ops, fewer points of failure.
- JSONB on variant attributes avoids schema explosion.
- Mature backup/PITR via `pgBackRest` or `Barman`.
- Strong observability (`pg_stat_statements`).

### Negative / risks
- Connection pooling care required at scale (use `pgBouncer` or built-in `pgcat`).
- Index discipline matters — bad indexes on hot paths (PLP filters) hurt fast.
- pgvector storage size grows with embedding dimensionality; budget storage.

### Mitigations
- Connection pool sized in Phase 1; load-tested before scaling.
- Index strategy documented in `01-database/04-indexes.md`.
- pgvector embeddings dimension capped at 1024; only FAQ corpus indexed.

## RLS-specific design notes

- Cost columns (`variant_country_cost.actual_cost`, `order_line.actual_cost_snapshot`, `business_gross_profit_snapshot`) sit in tables/columns with RLS policies.
- `current_setting('app.current_role')` set per request from authenticated session.
- Policies tested in CI: a query as `marketing_user` returns 0 rows on cost tables.

Detailed policies in `01-database/03-rls-policies.md`.

## Versioning

- Phase 1: PostgreSQL 16 latest stable minor.
- Upgrade policy: stay within `current - 1` major; upgrade major versions in maintenance window.

## References

- Master Plan v4 §2, §15 (Costs and Profit Guardrails)
- ADR-007 (pgvector)
- `01-database/03-rls-policies.md`
- `03-rbac/04-cost-privacy.md`
