# Views and Materialized Views

**Status:** Draft
**Owner:** DBA

---

## Standard views

### `v_variant_country_availability`
Storefront-authoritative country-level availability.
```sql
CREATE VIEW v_variant_country_availability AS
SELECT vws.variant_id, w.country_id,
       SUM(vws.qty_on_hand)                         AS qty_on_hand_total,
       SUM(vws.qty_reserved)                        AS qty_reserved_total,
       SUM(vws.qty_on_hand - vws.qty_reserved)      AS qty_available_total,
       SUM(vws.qty_inbound)                         AS qty_inbound_total,
       COUNT(*) FILTER (WHERE w.active)             AS active_warehouse_count
FROM variant_warehouse_stock vws
JOIN warehouse w ON w.id = vws.warehouse_id
WHERE w.active = true
GROUP BY vws.variant_id, w.country_id;
```

### `v_order_line_public`

Cost-redacted view of `order_line` for non-finance roles. See `03-rls-policies.md`.

> 🟢 D-DB-001 Answered 2026-05-07: view name `v_order_line_public` preserved (no SQL collision). Underlying parent table is `customer_orders`; the child `order_line.order_id` FK references `customer_orders.id`.

### `v_product_card`
Denormalized product card for storefront PLP/PDP queries.
```sql
CREATE VIEW v_product_card AS
SELECT p.id, p.sku, pt.locale, pt.name, pt.slug, pt.meta_desc,
       pi.url AS primary_image_url,
       pv.id AS default_variant_id,
       vcp.country_id, vcp.regular_price, vcp.sale_price, vcp.currency_code,
       vcp.lead_time_days, vcp.low_stock_threshold,
       vca.qty_available_total
FROM product p
JOIN product_translation pt ON pt.product_id = p.id
JOIN product_variant pv ON pv.product_id = p.id
JOIN variant_country_price vcp ON vcp.variant_id = pv.id
LEFT JOIN product_image pi ON pi.id = p.primary_image_id
LEFT JOIN v_variant_country_availability vca
  ON vca.variant_id = pv.id AND vca.country_id = vcp.country_id
WHERE p.status = 'active' AND vcp.active = true;
```

---

## Materialized views

Refreshed on schedule via BullMQ.

### `mv_override_usage_summary`
Daily refresh.
```sql
CREATE MATERIALIZED VIEW mv_override_usage_summary AS
SELECT
  override_type,
  date_trunc('day', requested_at) AS period_day,
  COUNT(*) FILTER (WHERE status = 'pending')        AS count_pending,
  COUNT(*) FILTER (WHERE status = 'approved')       AS count_approved,
  COUNT(*) FILTER (WHERE status = 'rejected')       AS count_rejected,
  COUNT(*) FILTER (WHERE status = 'auto_approved')  AS count_auto,
  COUNT(*) FILTER (WHERE status = 'expired')        AS count_expired,
  COALESCE(SUM(expected_business_impact), 0)        AS total_business_impact
FROM override_request
GROUP BY override_type, date_trunc('day', requested_at);
```

### `mv_marketer_quality_rolling`
Weekly refresh; supports tier auto-promotion logic.
TODO: schema after Phase 5 design.

### `mv_data_quality_summary`
Hourly refresh; powers Data Quality Center dashboard.
TODO: schema after Phase 10 design.

---

## Index recommendations on views

- `v_product_card` is unindexed (queries underlying tables); **never SELECT * without country/locale filter**.
- Materialized views indexed on `period_day` and primary join columns.

---

## TODO

- TODO: full view DDL after Phase 1 schema review.
- TODO: refresh schedule for each materialized view.
- TODO: decide whether `v_product_card` should be materialized for high-traffic homepage queries.
