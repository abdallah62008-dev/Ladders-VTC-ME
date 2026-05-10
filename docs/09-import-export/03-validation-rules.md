# Validation Rules

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Universal rules

- File ≤ 50 MB.
- Encoding UTF-8.
- Maximum 50,000 rows per import (TODO confirm).
- Header row required.
- Required columns present.
- Foreign key references exist (e.g., `country_code` exists in `country`).

## Per-entity rules

### Country pricing
- `regular_price > 0`
- `sale_price < regular_price` if both set
- `sale_starts_at < sale_ends_at` if both set
- `country_code` exists AND `country.active = true`
- `variant_sku` exists
- `currency_code` matches `country.currency_code`
- `min_selling_price ≤ regular_price ≤ max_selling_price` if min/max set
- **Profit Guardrails dry-run** per row

### Warehouse stock
- `qty_on_hand ≥ 0`
- `qty_damaged ≥ 0`
- `warehouse_code` exists AND `warehouse.country_id` matches the variant's active country list
- `restock_date` is a valid future date if set

### Actual costs
- `actual_cost > 0`
- `valid_from` not in past beyond reasonable threshold (e.g., 1 year)
- Caller has `cost.write` scope
- Profit Guardrails dry-run

### Coupons
- `code` unique within active coupons
- `starts_at < ends_at`
- `usage_limit_total ≥ 1` if set
- `discount_type` ∈ {percent, fixed, free_shipping}
- `value > 0`
- Profit Guardrails dry-run if `value` % > some threshold

### Marketers
- `phone` E.164 valid
- `email` valid format
- `tier_name` exists in `marketer_tier`
- `country_scope` codes all exist

### Customers
- `phone` E.164 valid + unique
- `marketing_consent` only `true` with explicit privacy note in import options
- Address validation per country format

## Error codes

| Code | Meaning |
|---|---|
| `MISSING_REQUIRED_FIELD` | Required column blank |
| `INVALID_TYPE` | Wrong type (e.g., text in number column) |
| `INVALID_FORMAT` | Format mismatch (phone, email) |
| `FK_NOT_FOUND` | Referenced entity doesn't exist |
| `BUSINESS_RULE` | Violates business rule (e.g., sale_price > regular_price) |
| `PROFIT_GUARDRAIL_BREACH` | Pricing breaches floor |
| `DUPLICATE` | Unique constraint violated |
| `OUT_OF_RANGE` | Value outside allowed range |

## TODO

- TODO: complete rule catalog per entity.
- TODO: example error report file format (CSV).
