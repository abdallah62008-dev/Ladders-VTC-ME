-- Migration 0001 — Extensions and roles
-- Per /docs/01-database/05-migration-plan.md + ADR-027 + D-INFRA-004 + D-DB-002.
--
-- D-DB-002 locked 2026-05-07: pgcrypto is the sole source of UUID generation.
-- gen_random_uuid() is the canonical PK default expression.
-- uuid-ossp is FORBIDDEN — never enabled.

-- Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- D-DB-002: UUID generation source (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pg_trgm;           -- Arabic-aware text search fallback
CREATE EXTENSION IF NOT EXISTS vector;            -- pgvector for FAQ embeddings (Phase 3+)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements; -- query performance observability

-- D-DB-002: uuid-ossp deliberately NOT enabled. Any future requirement to add it
-- requires re-opening D-DB-002 and updating the locked rule in 05-migration-plan.md.

-- Application roles will be defined in migration 0002 with explicit GRANTs.

---- Down ----
-- DOWN INTENTIONALLY EMPTY: extensions are cluster-wide and may be in use by other
-- databases; dropping pgcrypto would lose UUID generation for all schemas.
-- Forward-fix required.
