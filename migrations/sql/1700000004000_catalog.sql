-- Migration 0004 — Catalog
-- Per /docs/01-database/02-tables-by-module.md (Modules 1+2) +
--     /docs/01-database/05-migration-plan.md lines 109-114.
--
-- Locked rules enforced:
--   D-DB-001: no bare `order` table (none here; order tables ship in 0005)
--   D-DB-002: ALL UUID PKs default gen_random_uuid()
--   D-DB-003: rate columns use numeric(5,4); monetary numeric(12,2) (none in 0004)
--   D-COUNTRY-014: catalog tables are GLOBAL — per-country data lives in 0005/0006
--                  via FK chains, NEVER as price_sa/stock_eg-style columns
--
-- Tables (10):
--   category, category_translation
--   product_group, product_group_translation
--   product, product_translation
--   product_variant
--   product_image, product_video, product_certification
--
-- Note on media_asset references: per 02-tables-by-module.md, image_id /
-- hero_image_id / primary_image_id columns FK to media_asset. The
-- media_asset table is NOT in Sprint 2A scope. Columns are reserved as
-- nullable uuid with a deferred FK constraint to be added when media_asset
-- ships in a later sprint.

-- Up Migration

-- ─────────────────────────────────────────────────────────────────────────
-- category — global catalog category tree (parent/child)
-- Class 3 (hard-delete allowed; cascade implications documented per table)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE category (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- D-DB-002
  slug        text UNIQUE NOT NULL,
  parent_id   uuid REFERENCES category (id),               -- self-FK; nullable for root
  sort        int NOT NULL DEFAULT 0,
  image_id    uuid,                                         -- FK → media_asset (deferred)
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_category_parent ON category (parent_id);
CREATE INDEX idx_category_active ON category (active);
CREATE INDEX idx_category_sort ON category (sort);

-- ─────────────────────────────────────────────────────────────────────────
-- category_translation — per-locale name/slug/SEO
-- Composite PK: (category_id, locale)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE category_translation (
  category_id uuid NOT NULL REFERENCES category (id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES locale (code),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  meta_title  text,
  meta_desc   text,
  PRIMARY KEY (category_id, locale)
);

-- Slug must be unique within a single locale (per docs).
CREATE UNIQUE INDEX uq_category_translation_locale_slug
  ON category_translation (locale, slug);

-- ─────────────────────────────────────────────────────────────────────────
-- product_group — marketing groupings (e.g., "Telescopic Ladders")
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_group (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  sort          int NOT NULL DEFAULT 0,
  hero_image_id uuid,                                        -- FK → media_asset (deferred)
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_group_active ON product_group (active);

-- ─────────────────────────────────────────────────────────────────────────
-- product_group_translation
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_group_translation (
  group_id   uuid NOT NULL REFERENCES product_group (id) ON DELETE CASCADE,
  locale     text NOT NULL REFERENCES locale (code),
  name       text NOT NULL,
  slug       text NOT NULL,
  intro_md   text,
  meta_title text,
  meta_desc  text,
  faq        jsonb DEFAULT '[]'::jsonb,                      -- array of {q, a}
  PRIMARY KEY (group_id, locale)
);

CREATE UNIQUE INDEX uq_product_group_translation_locale_slug
  ON product_group_translation (locale, slug);

-- ─────────────────────────────────────────────────────────────────────────
-- product — global master record; per-country pricing/stock lives elsewhere
-- D-COUNTRY-014: NO country fields here
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku              text UNIQUE NOT NULL,
  brand            text,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'active', 'archived')),
  group_id         uuid REFERENCES product_group (id),
  primary_image_id uuid,                                     -- FK → media_asset (deferred)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_status ON product (status);
CREATE INDEX idx_product_group ON product (group_id);

-- ─────────────────────────────────────────────────────────────────────────
-- product_translation
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_translation (
  product_id   uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  locale       text NOT NULL REFERENCES locale (code),
  name         text NOT NULL,
  slug         text NOT NULL,
  description  text,
  features_md  text,
  meta_title   text,
  meta_desc    text,
  use_cases    jsonb DEFAULT '[]'::jsonb,                    -- array of strings
  PRIMARY KEY (product_id, locale)
);

CREATE UNIQUE INDEX uq_product_translation_locale_slug
  ON product_translation (locale, slug);

-- ─────────────────────────────────────────────────────────────────────────
-- product_variant — physical SKU + dimensions; product variants are GLOBAL
-- (per-country pricing/cost/stock live in 0005/0006 via FK chain)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_variant (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  sku                 text UNIQUE NOT NULL,
  height_cm           int,
  max_load_kg         int,
  folded_cm           int,
  weight_kg           numeric(6, 2),                         -- D-DB-003 (rate-shape; product weight, not money)
  step_count          int,
  material            text CHECK (material IN ('aluminum', 'fiberglass', 'steel')),
  ladder_type         text CHECK (ladder_type IN ('telescopic', 'folding', 'extension', 'step', 'multi_purpose')),
  attributes          jsonb DEFAULT '{}'::jsonb,             -- extension point
  suitability_scores  jsonb DEFAULT '{}'::jsonb,             -- Phase 1 cross-cut (Module 24)
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variant_product ON product_variant (product_id);
CREATE INDEX idx_product_variant_material ON product_variant (material);
CREATE INDEX idx_product_variant_ladder_type ON product_variant (ladder_type);

-- ─────────────────────────────────────────────────────────────────────────
-- product_image — multi-image per product (or per variant)
-- Schema not fully spec'd in 02-tables-by-module.md; minimal viable shape.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_image (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  variant_id  uuid REFERENCES product_variant (id) ON DELETE CASCADE,
  url         text NOT NULL,                                 -- canonical URL
  alt_text    text,
  width       int,
  height      int,
  sort        int NOT NULL DEFAULT 0,
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_image_product ON product_image (product_id);
CREATE INDEX idx_product_image_variant ON product_image (variant_id);

-- ─────────────────────────────────────────────────────────────────────────
-- product_video — multi-video per product
-- Schema not fully spec'd in 02-tables-by-module.md; minimal viable shape.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_video (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  variant_id    uuid REFERENCES product_variant (id) ON DELETE CASCADE,
  url           text NOT NULL,                               -- canonical URL (YouTube / R2 / etc.)
  provider      text CHECK (provider IS NULL OR provider IN ('youtube', 'r2', 'b2', 'self')),
  duration_sec  int,
  poster_url    text,
  sort          int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_video_product ON product_video (product_id);

-- ─────────────────────────────────────────────────────────────────────────
-- product_certification — safety/compliance certificates
-- Schema not fully spec'd; minimal viable for D-SAFE-001 traceability.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_certification (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  variant_id      uuid REFERENCES product_variant (id) ON DELETE CASCADE,
  cert_type       text NOT NULL,                             -- 'EN-131', 'ANSI-A14', 'ISO-9001', etc.
  issuing_body    text,
  certificate_no  text,
  document_url    text,                                      -- evidence asset
  issued_at       date,
  expires_at      date,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_certification_product ON product_certification (product_id);
CREATE INDEX idx_product_certification_active ON product_certification (active);

-- Down Migration
-- Drop in reverse dependency order. Catalog tables are Class 3 (hard-delete OK in dev).
DROP TABLE IF EXISTS product_certification;
DROP TABLE IF EXISTS product_video;
DROP TABLE IF EXISTS product_image;
DROP TABLE IF EXISTS product_variant;
DROP TABLE IF EXISTS product_translation;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS product_group_translation;
DROP TABLE IF EXISTS product_group;
DROP TABLE IF EXISTS category_translation;
DROP TABLE IF EXISTS category;
