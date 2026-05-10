# CSV Schemas (per entity)

**Status:** Draft
**Owner:** Backend lead

Each entity has a canonical CSV schema. Headers UTF-8. First row = column names. Empty cells = NULL.

---

## Products

```
sku, brand, status, group_slug, primary_image_url
```

## Product translations

```
product_sku, locale, name, slug, description, features_md, meta_title, meta_desc
```

## Product variants

```
product_sku, variant_sku, height_cm, max_load_kg, folded_cm, weight_kg,
step_count, material, ladder_type, attributes_json
```

## Country pricing

```
variant_sku, country_code, regular_price, sale_price, sale_starts_at, sale_ends_at,
currency_code, active, lead_time_days, low_stock_threshold,
min_selling_price, max_selling_price, suggested_selling_price, tax_mode
```

## Warehouse stock

```
variant_sku, warehouse_code, qty_on_hand, qty_damaged, qty_inbound,
restock_date, low_stock_threshold, reorder_point
```

(qty_reserved excluded — managed by reservation engine, not bulk import.)

## Actual costs (Finance only)

```
variant_sku, country_code, actual_cost, currency_code, valid_from
```

## Marketer costs

```
variant_sku, country_code, marketer_code_or_tier_or_campaign,
marketer_cost, currency_code, priority, valid_from
```

(One of marketer_code / tier_id / campaign_id must be set.)

## Coupons

```
code, type, discount_type, value, currency,
starts_at, ends_at, usage_limit_total, usage_limit_per_customer,
allowed_countries, allowed_variant_skus, allowed_categories, allowed_groups,
excluded_variant_skus, min_order_value, max_discount_amount, stackable,
marketer_code, campaign_name, customer_segment, conditions_extra_json, active
```

## Marketers

```
code, name, phone, email, country_scope, tier_name, status,
permissions_json, default_landing_slug, custom_subdomain,
payout_method, payout_account_json
```

(`payout_account_json` encrypted at rest; only the marketer themselves + finance can read.)

## Landing pages

JSON preferred (not CSV) due to block structure.

```
{ "slug", "locale", "country_code", "title", "meta_title", "meta_desc",
  "status", "goal", "blocks": [...], "starts_at", "ends_at",
  "marketer_ref_locked", "custom_price_overrides": [...] }
```

## Translations

```
namespace, key, locale, value
```

E.g., `namespace='ui', key='button.add_to_cart', locale='ar-sa', value='أضف إلى السلة'`.

## Customers

```
phone, email, first_name, last_name, type, default_country_code, default_locale,
addresses_json, marketing_consent
```

PII fields auto-redacted in non-admin exports.

## Orders (export only)

```
order_number, country_code, status, channel,
customer_phone (PII-masked), customer_name (PII-masked),
total, currency, items_json, payment_method, marketer_code, coupon_codes,
created_at, confirmed_at, delivered_at
```

Cost columns absent unless `report.export.cost_columns` scope.

## TODO

- TODO: validate every column type/constraint against `02-tables-by-module.md`.
- TODO: example files per entity in `csv-samples/` subfolder.
- TODO: header localization — should headers be Arabic-friendly?
