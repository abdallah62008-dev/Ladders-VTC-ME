-- Migration 0002 — System, RBAC, audit
-- Per /docs/01-database/05-migration-plan.md + D-RBAC-001 + D-OWN-001 + D-CSP-001/004.
--
-- Sprint 1 ships the foundation tables. Sprint 2+ wires the role_permission seed
-- from /docs/03-rbac/matrix/role-permission-matrix.csv.

-- Up Migration

-- ─────────────────────────────────────────────────────────────────────────
-- user — global identity (D-CSP-001: not country-scoped at the table level;
-- country scope lives in user_country_access reserved-from-day-1).
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "user" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- D-DB-002
  email           text UNIQUE NOT NULL,
  hashed_password text,
  name            text,
  role_id         uuid,    -- FK added below
  country_scope   jsonb DEFAULT '[]'::jsonb,  -- D-CSP-001: cache; canonical = user_country_access
  active          boolean NOT NULL DEFAULT true,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_email ON "user" (lower(email));
CREATE INDEX idx_user_active ON "user" (active);

-- ─────────────────────────────────────────────────────────────────────────
-- role
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE role (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE NOT NULL,         -- e.g., 'super_admin', 'country_manager'
  description text,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "user" ADD CONSTRAINT user_role_fk FOREIGN KEY (role_id) REFERENCES role (id);

-- ─────────────────────────────────────────────────────────────────────────
-- permission — slug catalogue
-- Source: /docs/03-rbac/matrix/role-permission-matrix.csv (24 roles × 165+ slugs)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE permission (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,         -- e.g., 'cost.read', 'country_scope.all'
  group_name  text NOT NULL,                -- e.g., 'cost', 'country_scope'
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_permission_group ON permission (group_name);

-- ─────────────────────────────────────────────────────────────────────────
-- role_permission — generated from role-permission-matrix.csv (sprint 2+ seed)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE role_permission (
  role_id       uuid NOT NULL REFERENCES role (id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permission (id) ON DELETE CASCADE,
  scope_modifier text,                       -- e.g., 'scoped', 'own', 'dual_approval'
  granted_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- audit_log — D-DB-010 Class 2 (never hard-deleted; 7-year retention minimum)
-- D-CSP-004: entity_country_id added for country-filtered audit views
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id            uuid REFERENCES "user" (id),  -- nullable for system/api
  actor_type          text NOT NULL,                 -- 'user' | 'system' | 'api' | 'ai'
  action              text NOT NULL,
  entity              text NOT NULL,                 -- table name
  entity_id           uuid,
  entity_country_id   uuid,                          -- D-CSP-004: country denormalization
  diff                jsonb,
  override_request_id uuid,                          -- nullable, FK added Phase 1 sprint 3
  import_job_id       uuid,                          -- nullable, FK added Phase 2
  ip                  inet,
  user_agent          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log (entity, entity_id);
CREATE INDEX idx_audit_country ON audit_log (entity_country_id, created_at DESC) WHERE entity_country_id IS NOT NULL;

-- D-DB-010 Class 2 enforcement: prevent DELETE on audit_log
-- (sensitive_cleanup_override path bypasses this in Phase 10+ via SECURITY DEFINER procedure)
CREATE OR REPLACE FUNCTION audit_log_no_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is Class 2 (D-DB-010); DELETE forbidden. Use sensitive_cleanup_override.';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_delete_trigger
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_no_delete();

-- ─────────────────────────────────────────────────────────────────────────
-- system_setting — global config
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE system_setting (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES "user" (id)
);

-- Down Migration
DROP TRIGGER IF EXISTS audit_log_no_delete_trigger ON audit_log;
DROP FUNCTION IF EXISTS audit_log_no_delete();
DROP TABLE IF EXISTS system_setting;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS role_permission;
DROP TABLE IF EXISTS permission;
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_role_fk;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS "user";
