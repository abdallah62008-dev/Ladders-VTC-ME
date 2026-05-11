-- Migration 0005 — Pricing + Costs + RLS + cost_read_log reservation
-- Per /docs/01-database/02-tables-by-module.md (Modules 5+13+15) +
--     /docs/01-database/05-migration-plan.md lines 116-121 +
--     /docs/03-rbac/04-cost-privacy.md (9-layer defense-in-depth) +
--     /docs/03-rbac/01-roles.md cost-access matrix.
--
-- Locked rules enforced:
--   D-DB-002: ALL UUID PKs default gen_random_uuid()
--   D-DB-003: ALL monetary columns numeric(12,2); rate columns numeric(5,4)
--   D-DB-010: variant_country_cost / variant_marketer_cost / cost_history /
--             cost_read_log are Class 2 (NEVER hard-deleted) — enforced via
--             BEFORE-DELETE triggers
--   D-RBAC-001: actual_cost / marketer_cost RLS-protected; only Super Admin +
--               Finance Admin can read cost (cost.read); marketing_manager +
--               marketer_manager + external_marketer (own rows) can read
--               marketer_cost (marketer_cost.read).
--   D-PAY-002/003: profit_floor_rule stores margin floors as DATA (numeric(5,4))
--                  not code literals. CI grep-check allow-list excludes seed +
--                  migration files.
--   D-COUNTRY-014: per-country pricing/cost tables FK to country.id; no
--                  hardcoded *_sa / *_eg / *_iq columns.
--
-- cost_read_log: Phase 1 SCHEMA RESERVATION ONLY per phase-1-acceptance.md
--                line 241 lock. Phase 2 implements mandatory instrumentation
--                of every cost-bearing endpoint. NO INSERTs from Phase 1 code
--                paths. The cost_read_log.read permission slug is reserved
--                (Super Admin + Security Lead only — Finance Admin EXCLUDED
--                for conflict-of-interest).
--
-- Tables (7):
--   variant_country_price        — Class 3, no RLS
--   variant_country_cost         — Class 2, RLS [cost.read / cost.write]
--   variant_marketer_cost        — Class 2, RLS [marketer_cost.read / marketer_cost.write]
--   pricing_rule                 — Class 3, no RLS, minimal Sprint 2A schema
--   cost_history                 — Class 2, RLS [cost.read / cost.write]
--   profit_floor_rule            — Class 3, no RLS, configurable D-PAY-002 storage
--   cost_read_log                — Class 2, no RLS (Phase 1 reservation only)

-- Up Migration

-- ─────────────────────────────────────────────────────────────────────────
-- App helper schema for RLS (D-RBAC-001 / D-CACHE-001)
-- ─────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS app;

-- Returns the currently-authenticated user_id from session var, or NULL.
-- Set by application via: SET LOCAL app.current_user_id = '<uuid>';
CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Returns true if the current user has the given permission slug via their
-- role's role_permission entries. Used inline in RLS policies.
--
-- D-CACHE-001 hard rule #1: this DB function is the FINAL enforcement layer.
-- The application-side Redis permission cache (Sprint 2B) is an optimization
-- on top of this; it MUST NOT replace this check.
CREATE OR REPLACE FUNCTION app.has_permission(p_slug text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "user" u
    JOIN role_permission rp ON rp.role_id = u.role_id
    JOIN permission p ON p.id = rp.permission_id
    WHERE u.id = app.current_user_id()
      AND p.slug = p_slug
      AND u.active = true
  );
$$;

COMMENT ON FUNCTION app.has_permission(text) IS
  'D-RBAC-001 enforcement helper. Used by RLS policies on cost-bearing tables. Returns true iff the user identified by app.current_user_id() session var holds the named permission slug via their role.';

-- ─────────────────────────────────────────────────────────────────────────
-- app_user database role — application connects as this; subject to RLS
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT EXECUTE ON FUNCTION app.current_user_id() TO app_user;
GRANT EXECUTE ON FUNCTION app.has_permission(text) TO app_user;

-- Existing tables from 0002/0003/0004 — broad GRANT for app_user.
-- (Per-table refinement deferred to Sprint 2B+; Class 2 triggers + RLS
-- handle the security-critical invariants.)
GRANT SELECT, INSERT, UPDATE ON
  "user", role, permission, role_permission, system_setting,
  country, locale, currency, tax_setting, country_launch_readiness,
  category, category_translation,
  product_group, product_group_translation,
  product, product_translation,
  product_variant,
  product_image, product_video, product_certification
TO app_user;

GRANT SELECT, INSERT ON audit_log TO app_user;  -- INSERT-only; Class 2 + no UPDATE for immutability

-- Future tables auto-grant (Sprint 2A onwards)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- variant_country_price — Class 3, no RLS
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE variant_country_price (
  variant_id              uuid NOT NULL REFERENCES product_variant (id) ON DELETE CASCADE,
  country_id              uuid NOT NULL REFERENCES country (id),
  regular_price           numeric(12, 2) NOT NULL,           -- D-DB-003
  sale_price              numeric(12, 2),                    -- D-DB-003
  sale_starts_at          timestamptz,
  sale_ends_at            timestamptz,
  currency_code           text NOT NULL,                     -- snapshot from country.currency_code
  active                  boolean NOT NULL DEFAULT true,
  lead_time_days          int NOT NULL DEFAULT 2,
  low_stock_threshold     int NOT NULL DEFAULT 5,
  min_selling_price       numeric(12, 2),                    -- D-DB-003
  max_selling_price       numeric(12, 2),                    -- D-DB-003
  suggested_selling_price numeric(12, 2),                    -- D-DB-003
  tax_mode                text CHECK (tax_mode IS NULL OR tax_mode IN ('inclusive', 'exclusive')),
  delivery_promise_note   text,
  updated_by              uuid REFERENCES "user" (id),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (variant_id, country_id)
);

CREATE INDEX idx_variant_country_price_country ON variant_country_price (country_id);
CREATE INDEX idx_variant_country_price_active ON variant_country_price (active);

GRANT SELECT, INSERT, UPDATE ON variant_country_price TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- variant_country_cost — Class 2 + RLS
-- D-RBAC-001: actual_cost readable only with cost.read (super_admin + finance_admin)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE variant_country_cost (
  variant_id             uuid NOT NULL REFERENCES product_variant (id) ON DELETE CASCADE,
  country_id             uuid NOT NULL REFERENCES country (id),
  actual_cost            numeric(12, 2) NOT NULL,            -- D-RBAC-001 RLS-protected; D-DB-003
  currency_code          text NOT NULL,
  valid_from             timestamptz NOT NULL DEFAULT now(),
  updated_by             uuid REFERENCES "user" (id),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  landed_cost_components jsonb DEFAULT '{}'::jsonb,          -- Phase 1 cross-cut: supplier_cost / intl_shipping / customs / etc.
  PRIMARY KEY (variant_id, country_id)
);

CREATE INDEX idx_variant_country_cost_country ON variant_country_cost (country_id);
CREATE INDEX idx_variant_country_cost_valid_from ON variant_country_cost (valid_from);

ALTER TABLE variant_country_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_country_cost FORCE ROW LEVEL SECURITY;

CREATE POLICY variant_country_cost_select ON variant_country_cost
  FOR SELECT
  USING (app.has_permission('cost.read'));

CREATE POLICY variant_country_cost_insert ON variant_country_cost
  FOR INSERT
  WITH CHECK (app.has_permission('cost.write'));

CREATE POLICY variant_country_cost_update ON variant_country_cost
  FOR UPDATE
  USING (app.has_permission('cost.write'))
  WITH CHECK (app.has_permission('cost.write'));

-- No DELETE policy — Class 2. Enforcement via BEFORE-DELETE trigger below.

CREATE OR REPLACE FUNCTION variant_country_cost_no_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'variant_country_cost is Class 2 (D-DB-010); DELETE forbidden. Use sensitive_cleanup_override.';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER variant_country_cost_no_delete_trigger
  BEFORE DELETE ON variant_country_cost
  FOR EACH ROW EXECUTE FUNCTION variant_country_cost_no_delete();

GRANT SELECT, INSERT, UPDATE ON variant_country_cost TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- variant_marketer_cost — Class 2 + RLS (different gate: marketer_cost.read)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE variant_marketer_cost (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id     uuid NOT NULL REFERENCES product_variant (id) ON DELETE CASCADE,
  country_id     uuid NOT NULL REFERENCES country (id),
  marketer_id    uuid,                                         -- FK → marketer (deferred — marketer table Phase 5)
  tier_id        uuid,                                         -- FK → marketer_tier (deferred)
  campaign_id    uuid,                                         -- FK → campaign (deferred)
  marketer_cost  numeric(12, 2) NOT NULL,                      -- D-RBAC-001 RLS-protected; D-DB-003
  currency_code  text NOT NULL,
  priority       int NOT NULL DEFAULT 100,                     -- specificity tie-break
  valid_from     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid REFERENCES "user" (id),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variant_marketer_cost_variant_country ON variant_marketer_cost (variant_id, country_id);
CREATE INDEX idx_variant_marketer_cost_marketer ON variant_marketer_cost (marketer_id) WHERE marketer_id IS NOT NULL;

ALTER TABLE variant_marketer_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_marketer_cost FORCE ROW LEVEL SECURITY;

-- Base policy gates on marketer_cost.read. The "external_marketer sees own rows
-- only" refinement (per /docs/03-rbac/01-roles.md cost-access table) is deferred
-- to Sprint 2B+ — requires the marketer table + app.current_marketer_id() helper.
CREATE POLICY variant_marketer_cost_select ON variant_marketer_cost
  FOR SELECT
  USING (app.has_permission('marketer_cost.read'));

CREATE POLICY variant_marketer_cost_insert ON variant_marketer_cost
  FOR INSERT
  WITH CHECK (app.has_permission('marketer_cost.write'));

CREATE POLICY variant_marketer_cost_update ON variant_marketer_cost
  FOR UPDATE
  USING (app.has_permission('marketer_cost.write'))
  WITH CHECK (app.has_permission('marketer_cost.write'));

CREATE OR REPLACE FUNCTION variant_marketer_cost_no_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'variant_marketer_cost is Class 2 (D-DB-010); DELETE forbidden.';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER variant_marketer_cost_no_delete_trigger
  BEFORE DELETE ON variant_marketer_cost
  FOR EACH ROW EXECUTE FUNCTION variant_marketer_cost_no_delete();

GRANT SELECT, INSERT, UPDATE ON variant_marketer_cost TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- pricing_rule — Phase 5 design TBD; minimal Sprint 2A reservation
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE pricing_rule (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id  uuid REFERENCES country (id),                  -- nullable for global default
  rule_type   text NOT NULL,                                  -- 'tier_discount' / 'volume_break' / etc.
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active      boolean NOT NULL DEFAULT false,                 -- D-READY-002: configured ≠ active
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_rule_country_active ON pricing_rule (country_id, active);

GRANT SELECT, INSERT, UPDATE ON pricing_rule TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- cost_history — Class 2 + RLS — append-only audit trail of cost changes
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE cost_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      uuid NOT NULL REFERENCES product_variant (id),
  country_id      uuid NOT NULL REFERENCES country (id),
  was_actual_cost numeric(12, 2) NOT NULL,                   -- D-RBAC-001 RLS-protected; D-DB-003
  changed_at      timestamptz NOT NULL DEFAULT now(),
  changed_by      uuid REFERENCES "user" (id),
  reason          text
);

CREATE INDEX idx_cost_history_variant_country ON cost_history (variant_id, country_id, changed_at DESC);
CREATE INDEX idx_cost_history_changed_by ON cost_history (changed_by, changed_at DESC);

ALTER TABLE cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_history FORCE ROW LEVEL SECURITY;

CREATE POLICY cost_history_select ON cost_history
  FOR SELECT
  USING (app.has_permission('cost.read'));

CREATE POLICY cost_history_insert ON cost_history
  FOR INSERT
  WITH CHECK (app.has_permission('cost.write'));

-- No UPDATE policy — append-only.
-- No DELETE policy — Class 2.

CREATE OR REPLACE FUNCTION cost_history_no_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'cost_history is Class 2 (D-DB-010); DELETE forbidden.';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER cost_history_no_delete_trigger
  BEFORE DELETE ON cost_history
  FOR EACH ROW EXECUTE FUNCTION cost_history_no_delete();

GRANT SELECT, INSERT ON cost_history TO app_user;  -- no UPDATE — append-only

-- ─────────────────────────────────────────────────────────────────────────
-- profit_floor_rule — D-PAY-002/003 storage. Margin floors live as DATA,
-- not code literals. CI grep allow-list excludes seed/migration files.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE profit_floor_rule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id      uuid REFERENCES country (id),               -- nullable for global default
  scope           text NOT NULL CHECK (scope IN ('business', 'marketer', 'campaign')),
  min_margin      numeric(5, 4) NOT NULL,                     -- e.g., 0.2000 (20%); rate-shape per D-DB-003
  effective_from  timestamptz NOT NULL DEFAULT now(),
  effective_until timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES "user" (id)
);

CREATE INDEX idx_profit_floor_rule_country_scope ON profit_floor_rule (country_id, scope, effective_from DESC);

GRANT SELECT, INSERT, UPDATE ON profit_floor_rule TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- cost_read_log — PHASE 1 SCHEMA RESERVATION ONLY
-- Per /docs/15-phases/phase-1-acceptance.md line 241 lock:
--   "Phase 1 reserves the schema + retention docs + permission slug.
--    Phase 2 implements mandatory instrumentation."
-- 7-year retention per Class 2.
-- The cost_read_log.read permission slug (already in role-permission-matrix.csv)
-- is granted ONLY to super_admin (Finance Admin EXCLUDED for conflict-of-interest).
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE cost_read_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES "user" (id),
  actor_role    text,
  read_at       timestamptz NOT NULL DEFAULT now(),
  entity_type   text NOT NULL,                                -- 'variant_country_cost' | 'variant_marketer_cost' | 'order_line.actual_cost_snapshot' | etc.
  entity_id     uuid,
  ip            inet,
  user_agent    text,
  context       text,                                          -- API endpoint / admin screen / report path
  redacted      boolean NOT NULL DEFAULT false                 -- true if value was returned redacted
);

CREATE INDEX idx_cost_read_log_actor ON cost_read_log (actor_user_id, read_at DESC);
CREATE INDEX idx_cost_read_log_entity ON cost_read_log (entity_type, entity_id);

CREATE OR REPLACE FUNCTION cost_read_log_no_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'cost_read_log is Class 2 (D-DB-010); 7-year retention; DELETE forbidden.';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER cost_read_log_no_delete_trigger
  BEFORE DELETE ON cost_read_log
  FOR EACH ROW EXECUTE FUNCTION cost_read_log_no_delete();

GRANT SELECT, INSERT ON cost_read_log TO app_user;  -- INSERT-only when Phase 2 wires instrumentation

COMMENT ON TABLE cost_read_log IS
  'Phase 1 schema reservation only. Phase 2 instruments every cost-bearing endpoint to INSERT a row on every actual_cost / marketer_cost read. Class 2 (7-year retention). cost_read_log.read permission slug grants Super Admin + Security Lead read access; Finance Admin EXCLUDED (conflict of interest).';

-- Down Migration
-- Sprint 2A pre-launch DEV-ONLY down section:
--   drops 0005 tables for clean local re-migration.
--   Class 2 D-DB-010 data-loss-prevention applies AFTER Phase 1 launch /
--   production deployment — at that point this down section MUST become
--   empty / forward-fix only.
--   Do NOT run `db:migrate down` against staging or production.
-- The drops below are intentional during pre-launch dev to support
-- `db:migrate down && db:migrate up` cycles against a throwaway dev DB.
DROP POLICY IF EXISTS cost_history_insert ON cost_history;
DROP POLICY IF EXISTS cost_history_select ON cost_history;
DROP POLICY IF EXISTS variant_marketer_cost_update ON variant_marketer_cost;
DROP POLICY IF EXISTS variant_marketer_cost_insert ON variant_marketer_cost;
DROP POLICY IF EXISTS variant_marketer_cost_select ON variant_marketer_cost;
DROP POLICY IF EXISTS variant_country_cost_update ON variant_country_cost;
DROP POLICY IF EXISTS variant_country_cost_insert ON variant_country_cost;
DROP POLICY IF EXISTS variant_country_cost_select ON variant_country_cost;
DROP TRIGGER IF EXISTS cost_read_log_no_delete_trigger ON cost_read_log;
DROP FUNCTION IF EXISTS cost_read_log_no_delete();
DROP TRIGGER IF EXISTS cost_history_no_delete_trigger ON cost_history;
DROP FUNCTION IF EXISTS cost_history_no_delete();
DROP TRIGGER IF EXISTS variant_marketer_cost_no_delete_trigger ON variant_marketer_cost;
DROP FUNCTION IF EXISTS variant_marketer_cost_no_delete();
DROP TRIGGER IF EXISTS variant_country_cost_no_delete_trigger ON variant_country_cost;
DROP FUNCTION IF EXISTS variant_country_cost_no_delete();
DROP TABLE IF EXISTS cost_read_log;
DROP TABLE IF EXISTS profit_floor_rule;
DROP TABLE IF EXISTS cost_history;
DROP TABLE IF EXISTS pricing_rule;
DROP TABLE IF EXISTS variant_marketer_cost;
DROP TABLE IF EXISTS variant_country_cost;
DROP TABLE IF EXISTS variant_country_price;
DROP FUNCTION IF EXISTS app.has_permission(text);
DROP FUNCTION IF EXISTS app.current_user_id();
-- Schema app + role app_user retained for sibling Sprint 2A migrations.
