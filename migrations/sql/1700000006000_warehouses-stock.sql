-- Migration 0006 — Warehouses + Stock
-- Per /docs/01-database/02-tables-by-module.md (Module 4) +
--     /docs/01-database/05-migration-plan.md lines 122-127.
--
-- Locked rules enforced:
--   D-DB-002: ALL UUID PKs default gen_random_uuid()
--   D-COUNTRY-013: Admin Dashboard is Phase 1 inventory authority. NO ERP
--                  provider hardcoding (CI grep rejects 'odoo'/'netsuite'/etc.).
--                  Stock changes audit-logged via stock_movement +
--                  country_data_audit (Sprint 2B+).
--   D-COUNTRY-014: warehouse.country_id FK to country.id. No hardcoded
--                  country fields.
--   D-DB-010: stock_movement is Class 2 (immutable audit-style inventory
--             movement ledger; no `deleted_at` column; never hard-deleted).
--             BEFORE-DELETE trigger blocks DELETE at the DB layer. Aligned
--             with audit_log + cost_history sibling Class 2 tables. See
--             D-DB-010 alignment dated 2026-05-10 in
--             /docs/01-database/02-tables-by-module.md §"Deletion policy".
--   D-OPS-010: no hardcoded couriers / cities / fees. warehouse.shipping_coverage
--              is jsonb data, not code constants.
--   D-READY-002: warehouses Class 1 archive lifecycle (active / inactive /
--                archived) — configured ≠ active.
--
-- Tables (8):
--   warehouse                  — Class 1 archive lifecycle; country-scoped
--   variant_warehouse_stock    — Class 3; composite PK (variant + warehouse)
--   stock_movement             — Class 2 no-delete trigger (per Sprint 2A rule)
--   stock_reservation          — Class 3
--   stock_transfer             — Class 3
--   damaged_stock              — Class 3 (Phase 9 detail TBD; minimal Sprint 2A)
--   returned_stock             — Class 3 (Phase 9 detail TBD; minimal Sprint 2A)
--   inbound_stock              — Class 3 (Phase 9 detail TBD; minimal Sprint 2A)

-- Up

-- ─────────────────────────────────────────────────────────────────────────
-- warehouse — country-scoped; archive lifecycle (Class 1)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE warehouse (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text UNIQUE NOT NULL,                   -- locked after creation
  name                text NOT NULL,
  country_id          uuid NOT NULL REFERENCES country (id),  -- locked after creation; drift-check Sprint 2B
  city                text,                                    -- free text — D-OPS-010 (no hardcoded city list)
  district            text,
  address_line        text,
  type                text NOT NULL DEFAULT 'main'
                        CHECK (type IN ('main', 'satellite', 'virtual', '3pl')),
  manager_user_id     uuid REFERENCES "user" (id),
  priority            int NOT NULL DEFAULT 100,                -- Stock Source Priority engine input
  shipping_coverage   jsonb DEFAULT '[]'::jsonb,               -- D-OPS-010 data, not code
  contact_person      text,
  phone               text,                                     -- E.164
  notes               text,
  archived_at         timestamptz,                              -- Class 1 archive marker
  archived_by         uuid REFERENCES "user" (id),
  archive_reason      text CHECK (archive_reason IS NULL OR length(archive_reason) >= 30),
  active              boolean NOT NULL DEFAULT true,            -- D-READY-002: configured ≠ active
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouse_country ON warehouse (country_id);
CREATE INDEX idx_warehouse_active ON warehouse (active) WHERE archived_at IS NULL;
CREATE INDEX idx_warehouse_archived ON warehouse (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_warehouse_priority ON warehouse (country_id, priority DESC);

GRANT SELECT, INSERT, UPDATE ON warehouse TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- variant_warehouse_stock — composite PK; Class 3
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE variant_warehouse_stock (
  variant_id          uuid NOT NULL REFERENCES product_variant (id) ON DELETE CASCADE,
  warehouse_id        uuid NOT NULL REFERENCES warehouse (id) ON DELETE CASCADE,
  qty_on_hand         int NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
  qty_reserved        int NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  qty_damaged         int NOT NULL DEFAULT 0 CHECK (qty_damaged >= 0),
  qty_returned        int NOT NULL DEFAULT 0 CHECK (qty_returned >= 0),
  qty_inbound         int NOT NULL DEFAULT 0 CHECK (qty_inbound >= 0),
  low_stock_threshold int NOT NULL DEFAULT 5,
  reorder_point       int NOT NULL DEFAULT 10,
  restock_date        date,
  last_counted_at     timestamptz,
  active              boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (variant_id, warehouse_id)
);

CREATE INDEX idx_variant_warehouse_stock_warehouse ON variant_warehouse_stock (warehouse_id);
CREATE INDEX idx_variant_warehouse_stock_low ON variant_warehouse_stock (warehouse_id) WHERE qty_on_hand <= low_stock_threshold;

GRANT SELECT, INSERT, UPDATE, DELETE ON variant_warehouse_stock TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- stock_movement — append-only audit trail of stock changes
-- D-COUNTRY-013: Admin Dashboard is the inventory authority — every stock
-- mutation writes a stock_movement row with a reason + actor.
-- Class 2 hard-delete trigger per Sprint 2A explicit rule.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE stock_movement (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      uuid NOT NULL REFERENCES product_variant (id),
  warehouse_id    uuid NOT NULL REFERENCES warehouse (id),
  type            text NOT NULL CHECK (type IN (
                    'inbound', 'outbound', 'transfer_in', 'transfer_out',
                    'damage', 'return_to_stock', 'count_adjustment'
                  )),
  qty             int NOT NULL,                               -- signed (positive in / negative out)
  reference_type  text CHECK (reference_type IS NULL OR reference_type IN (
                    'order', 'return', 'transfer', 'manual', 'import'
                  )),
  reference_id    uuid,
  reason          text,                                        -- required for type='count_adjustment' (enforced at app layer)
  performed_by    uuid REFERENCES "user" (id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movement_variant_warehouse ON stock_movement (variant_id, warehouse_id, created_at DESC);
CREATE INDEX idx_stock_movement_warehouse ON stock_movement (warehouse_id, created_at DESC);
CREATE INDEX idx_stock_movement_type ON stock_movement (type, created_at DESC);
CREATE INDEX idx_stock_movement_reference ON stock_movement (reference_type, reference_id) WHERE reference_id IS NOT NULL;

CREATE OR REPLACE FUNCTION stock_movement_no_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'stock_movement is Class 2 (D-DB-010 / Sprint 2A); DELETE forbidden. Use sensitive_cleanup_override.';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movement_no_delete_trigger
  BEFORE DELETE ON stock_movement
  FOR EACH ROW EXECUTE FUNCTION stock_movement_no_delete();

GRANT SELECT, INSERT ON stock_movement TO app_user;  -- INSERT-only (append-only audit)

COMMENT ON TABLE stock_movement IS
  'Append-only stock change audit trail. Class 2 (DELETE blocked at trigger). Every stock mutation in the platform writes one row here per D-COUNTRY-013 inventory-authority lock.';

-- ─────────────────────────────────────────────────────────────────────────
-- stock_reservation — Class 3 (hard-delete after expiry + logging)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE stock_reservation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      uuid NOT NULL REFERENCES product_variant (id),
  warehouse_id    uuid NOT NULL REFERENCES warehouse (id),
  qty             int NOT NULL CHECK (qty > 0),
  cart_id         uuid,                                        -- FK → cart (deferred — cart in 0008)
  draft_order_id  uuid,                                        -- FK → draft_order (deferred)
  order_id        uuid,                                        -- FK → customer_orders (deferred — 0005 / 0008)
  expires_at      timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'consumed', 'expired', 'released')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_reservation_variant_warehouse ON stock_reservation (variant_id, warehouse_id);
CREATE INDEX idx_stock_reservation_expires ON stock_reservation (expires_at) WHERE status = 'active';
CREATE INDEX idx_stock_reservation_status ON stock_reservation (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON stock_reservation TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- stock_transfer — Class 3 (transfers between warehouses)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE stock_transfer (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_warehouse_id uuid NOT NULL REFERENCES warehouse (id),
  dest_warehouse_id   uuid NOT NULL REFERENCES warehouse (id),
  variant_id          uuid NOT NULL REFERENCES product_variant (id),
  qty                 int NOT NULL CHECK (qty > 0),
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'in_transit', 'received', 'cancelled')),
  requested_by        uuid REFERENCES "user" (id),
  approved_by         uuid REFERENCES "user" (id),
  dispatched_at       timestamptz,
  received_at         timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (source_warehouse_id <> dest_warehouse_id)
);

CREATE INDEX idx_stock_transfer_source ON stock_transfer (source_warehouse_id, status);
CREATE INDEX idx_stock_transfer_dest ON stock_transfer (dest_warehouse_id, status);
CREATE INDEX idx_stock_transfer_status ON stock_transfer (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON stock_transfer TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- damaged_stock — Phase 9 detail TBD; minimal Sprint 2A schema
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE damaged_stock (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id    uuid NOT NULL REFERENCES product_variant (id),
  warehouse_id  uuid NOT NULL REFERENCES warehouse (id),
  qty           int NOT NULL CHECK (qty > 0),
  reason        text NOT NULL,                                 -- 'shipping_damage' / 'manufacturing_defect' / etc.
  reported_by   uuid REFERENCES "user" (id),
  reported_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz,
  resolution    text                                           -- 'written_off' / 'returned_to_supplier' / 'repaired' / etc.
);

CREATE INDEX idx_damaged_stock_variant_warehouse ON damaged_stock (variant_id, warehouse_id);

GRANT SELECT, INSERT, UPDATE ON damaged_stock TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- returned_stock — Phase 9 detail TBD; minimal Sprint 2A schema
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE returned_stock (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      uuid NOT NULL REFERENCES product_variant (id),
  warehouse_id    uuid NOT NULL REFERENCES warehouse (id),
  qty             int NOT NULL CHECK (qty > 0),
  return_reason   text NOT NULL,
  condition       text CHECK (condition IS NULL OR condition IN (
                    'sellable', 'damaged', 'opened', 'destroyed'
                  )),
  source_order_id uuid,                                        -- FK → customer_orders (deferred — Phase 2)
  received_at     timestamptz NOT NULL DEFAULT now(),
  processed_by    uuid REFERENCES "user" (id),
  resolution      text,                                         -- 'restocked' / 'damaged_pile' / 'discarded'
  resolved_at     timestamptz
);

CREATE INDEX idx_returned_stock_variant_warehouse ON returned_stock (variant_id, warehouse_id);

GRANT SELECT, INSERT, UPDATE ON returned_stock TO app_user;

-- ─────────────────────────────────────────────────────────────────────────
-- inbound_stock — Phase 9 detail TBD; minimal Sprint 2A schema
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE inbound_stock (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      uuid NOT NULL REFERENCES product_variant (id),
  warehouse_id    uuid NOT NULL REFERENCES warehouse (id),
  qty             int NOT NULL CHECK (qty > 0),
  expected_at     timestamptz NOT NULL,
  source          text,                                         -- 'supplier' / 'transfer' / 'return'
  reference_id    uuid,                                          -- supplier PO / transfer / etc.
  status          text NOT NULL DEFAULT 'expected'
                    CHECK (status IN ('expected', 'arrived', 'received', 'cancelled')),
  arrived_at      timestamptz,
  received_at     timestamptz,
  received_by     uuid REFERENCES "user" (id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbound_stock_variant_warehouse ON inbound_stock (variant_id, warehouse_id, status);
CREATE INDEX idx_inbound_stock_expected ON inbound_stock (expected_at) WHERE status IN ('expected', 'arrived');

GRANT SELECT, INSERT, UPDATE ON inbound_stock TO app_user;

---- Down ----
-- Sprint 2A pre-launch DEV-ONLY down section:
--   drops 0006 tables for clean local re-migration.
--   Class 2 D-DB-010 data-loss-prevention applies AFTER Phase 1 launch /
--   production deployment — at that point this down section MUST become
--   empty / forward-fix only.
--   Do NOT run `db:migrate down` against staging or production.
-- The drops below are intentional during pre-launch dev to support
-- `db:migrate down && db:migrate up` cycles against a throwaway dev DB.
DROP TABLE IF EXISTS inbound_stock;
DROP TABLE IF EXISTS returned_stock;
DROP TABLE IF EXISTS damaged_stock;
DROP TABLE IF EXISTS stock_transfer;
DROP TABLE IF EXISTS stock_reservation;
DROP TRIGGER IF EXISTS stock_movement_no_delete_trigger ON stock_movement;
DROP FUNCTION IF EXISTS stock_movement_no_delete();
DROP TABLE IF EXISTS stock_movement;
DROP TABLE IF EXISTS variant_warehouse_stock;
DROP TABLE IF EXISTS warehouse;
