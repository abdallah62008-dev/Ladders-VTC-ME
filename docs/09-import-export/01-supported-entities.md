# Import / Export — Supported Entities

**Status:** Draft
**Owner:** Backend lead
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §1.1

---

## Entity matrix

| Entity | Import | Export | Formats | Permission |
|---|---|---|---|---|
| Products | ✅ | ✅ | XLSX, CSV | `import.run.products`, `export.run` |
| Product Variants | ✅ | ✅ | XLSX, CSV | `import.run.variants` |
| Country Pricing | ✅ | ✅ | XLSX, CSV | `import.run.country_pricing` (+ Profit Guardrails) |
| Warehouse Stock | ✅ | ✅ | XLSX, CSV | `import.run.warehouse_stock` |
| Actual Costs | ✅ | ✅ | XLSX, CSV | **`import.run.actual_costs` (Finance only)** |
| Marketer Costs | ✅ | ✅ | XLSX, CSV | `import.run.marketer_costs` |
| Coupons | ✅ | ✅ | XLSX, CSV | `import.run.coupons` |
| Marketers | ✅ | ✅ | XLSX, CSV | `import.run.marketers` |
| Landing Pages | ✅ | ✅ | JSON, XLSX | `import.run.landing_pages` |
| Translations | ✅ | ✅ | XLSX, CSV | `import.run.translations` |
| Customers | ✅ | ✅ | XLSX, CSV | `import.run.customers` (+ privacy approval) |
| Orders | ❌ create | ✅ | XLSX, CSV, PDF | `export.run` (export only) |
| Reports | ❌ | ✅ | CSV, XLSX, PDF | `report.export` |

## Why orders are export-only

Bulk-creating orders from a CSV would bypass:
- Inventory reservation
- Payment confirmation
- Profit Guardrails
- Audit trail integrity

Order corrections are made via admin UI on existing orders, never bulk-imported.

## Why customers requires privacy approval

PII risk on bulk customer imports. Requires:
- Reason for import (e.g., legacy migration)
- Privacy officer or legal sign-off
- Opt-in capture for marketing consent (default `false`)

## Cost imports

`actual_costs` and `marketer_costs` imports:
- Finance role only
- Pre-import auto-backup triggered
- Profit Guardrails dry-run on every row
- Approval required for batches > N rows (TODO threshold)
- Audit log per row

## Schema

See `01-database/02-tables-by-module.md` Module 21 (Import / Export Module).

## TODO

- TODO: per-entity max row count.
- TODO: file size limit (typical 50 MB).
- TODO: scheduled imports (e.g., nightly catalog sync from supplier feed).
