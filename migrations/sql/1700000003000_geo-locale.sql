-- Migration 0003 — Geo and locale
-- Per /docs/01-database/05-migration-plan.md + D-COUNTRY-014 + D-PAY-002/003 + D-SAFE-001 + D-CSP-001.
--
-- D-COUNTRY-014: NO hardcoded country fields. All per-country data via country_id FK.
-- D-PAY-002/003: business_min_margin + marketer floor are configurable data, not code constants.
-- D-DB-003: monetary numeric(5,4) for rate columns; numeric(12,2) reserved for money.

-- Up

-- ─────────────────────────────────────────────────────────────────────────
-- country — root of the dynamic country/warehouse/pricing/stock architecture
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE country (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- D-DB-002
  code                   text UNIQUE NOT NULL,                         -- ISO-2 lowercase: 'sa', 'eg', 'iq'
  name_ar                text NOT NULL,
  name_en                text NOT NULL,
  currency_code          text NOT NULL,                                -- ISO-4217: 'SAR', 'EGP', 'IQD'
  default_locale         text NOT NULL,                                -- references locale.code
  vat_rate               numeric(5,4),                                 -- D-DB-003: rate column (NOT money)
  vat_mode               text CHECK (vat_mode IN ('inclusive','exclusive')),
  phone_code             text,
  whatsapp_number        text,                                         -- E.164
  business_hours         jsonb,
  business_min_margin    numeric(5,4),                                 -- D-PAY-002: cache of profit_floor_rule
  payment_methods        jsonb DEFAULT '[]'::jsonb,
  shipping_methods       jsonb DEFAULT '[]'::jsonb,
  pixel_settings         jsonb DEFAULT '{}'::jsonb,
  price_rounding_pattern jsonb,
  compliance_profile     jsonb DEFAULT '{}'::jsonb,                    -- D-SAFE-001
  launch_status          text NOT NULL DEFAULT 'draft',                -- D-READY-002: draft|setup_incomplete|ready_for_review|active|inactive|archived
  active                 boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_country_active ON country (active);
CREATE INDEX idx_country_code ON country (code);

-- ─────────────────────────────────────────────────────────────────────────
-- locale
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE locale (
  code          text PRIMARY KEY,                  -- 'ar-sa', 'en-sa', etc.
  country_code  text NOT NULL REFERENCES country (code),
  language_code text NOT NULL CHECK (language_code IN ('ar','en')),
  direction     text NOT NULL CHECK (direction IN ('rtl','ltr')),
  name_native   text NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- currency
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE currency (
  code            text PRIMARY KEY,                -- ISO-4217
  symbol          text NOT NULL,
  symbol_position text NOT NULL CHECK (symbol_position IN ('before','after')),
  decimals        int NOT NULL DEFAULT 2           -- IQD uses 0; D-DB-003 storage still numeric(12,2)
);

-- ─────────────────────────────────────────────────────────────────────────
-- tax_setting
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE tax_setting (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id      uuid NOT NULL REFERENCES country (id),
  name            text NOT NULL,
  rate            numeric(5,4) NOT NULL,           -- D-DB-003: rate column
  applies_to      jsonb,
  effective_from  timestamptz NOT NULL,
  effective_until timestamptz
);

CREATE INDEX idx_tax_country ON tax_setting (country_id, effective_from DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- country_launch_readiness — D-READY-001 + D-READY-002 enforcement
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE country_launch_readiness (
  country_id        uuid PRIMARY KEY REFERENCES country (id),
  currency_ok       boolean NOT NULL DEFAULT false,
  tax_ok            boolean NOT NULL DEFAULT false,
  locale_ok         boolean NOT NULL DEFAULT false,
  whatsapp_ok       boolean NOT NULL DEFAULT false,
  payments_ok       boolean NOT NULL DEFAULT false,
  shipping_ok       boolean NOT NULL DEFAULT false,
  warehouse_ok      boolean NOT NULL DEFAULT false,
  pricing_ok        boolean NOT NULL DEFAULT false,
  stock_ok          boolean NOT NULL DEFAULT false,
  autoreply_ok      boolean NOT NULL DEFAULT false,
  seo_ok            boolean NOT NULL DEFAULT false,
  landing_pages_ok  boolean NOT NULL DEFAULT false,
  staff_ok          boolean NOT NULL DEFAULT false,
  business_hours_ok boolean NOT NULL DEFAULT false,
  overall_status    text NOT NULL DEFAULT 'draft',
  last_checked_at   timestamptz NOT NULL DEFAULT now()
);

---- Down ----
DROP TABLE IF EXISTS country_launch_readiness;
DROP TABLE IF EXISTS tax_setting;
DROP TABLE IF EXISTS currency;
DROP TABLE IF EXISTS locale;
DROP TABLE IF EXISTS country;
