# Metric Definitions

**Status:** Draft
**Owner:** Analytics lead

Every metric must have a single source of truth. Below are formulas + edge cases + source tables.

> 🟢 **D-DB-003 locked 2026-05-07:** All monetary metrics are computed in `numeric(12,2)` precision (the DB column type) regardless of country. Display rounding (e.g., IQD whole-units) is applied **at the presentation layer** via `country.price_rounding_pattern` + `currency.decimals` — never inside SQL aggregates. Reports therefore always reconcile across countries to the cent/halala/piaster, with rounding applied only on the rendered cell. Per-country totals shown in their native currency; cross-country comparison reports must convert via `currency_exchange_rate` (Phase 8+ design).
>
> 🟢 **D-CSP-001 locked 2026-05-09:** All metrics respect country scope. **Single-country reports** are filtered by the user's active country and the user's `user_country_access` rows. **Cross-country reports** require `report.cross_country.read` permission AND access to ALL included countries (or `country_scope.all`). User without access to a country sees zero rows for that country regardless of whether the report definition includes it. RLS enforces at DB layer; report engine evaluates the country set BEFORE running the query and 403s if user lacks any. See `07-reporting/06-report-builder.md` for cross-country permission gate.

---

## Revenue & profit

### `gross_revenue`
```
SUM(order_line.unit_selling_price × order_line.qty)
WHERE customer_orders.status IN ('confirmed', 'paid', 'shipped', 'delivered')
  -- Note: deleted_at filter omitted by default per D-DB-010
  -- Soft-deleted customer_orders REMAIN in historical revenue reports unless explicitly filtered
```
Excludes cancelled, refunded by `status`. (Per D-DB-001 🟢 2026-05-07: orders table is `customer_orders` plural, NOT `order`.) **Per D-DB-010 🟢 2026-05-07: revenue reports do NOT filter `deleted_at IS NULL` by default — soft-deleted orders remain in historical totals because (a) financial records were real and (b) deletion is reserved for compliance/erasure cases that should not retroactively rewrite revenue history. Reports that need a "current state" view explicitly add `AND deleted_at IS NULL`. Cancelled / refunded orders are excluded by `status`, not by deletion.**

### `gross_profit_business` [cost-bearing]
```
SUM(order_line.business_gross_profit_snapshot)
WHERE same as above
```
RLS-restricted; redacted for non-finance roles.

### `gross_profit_marketer`
```
SUM(order_line.marketer_profit_snapshot)
WHERE customer_orders.marketer_id IS NOT NULL
```

### `aov` (average order value)
```
gross_revenue / count(customer_orders)
```

### `cac` (customer acquisition cost)
```
campaign_spend / new_customers_attributed_to_campaign
```
"New customer" = first order in our system.

### `roas`
```
revenue_attributed_to_campaign / campaign_spend
```

## Conversion

### `cvr_funnel`
```
purchase / pageview (with attribution funnel)
```

### `add_to_cart_rate`
```
add_to_cart_events / view_content_events
```

### `checkout_completion_rate`
```
purchase / initiate_checkout
```

### `ai_handoff_rate`
```
handoffs / total_ai_conversations
```

### `ai_order_completion_rate`
```
draft_orders_created_via_ai / ai_conversations_with_recommendation
```

## Inventory

### `qty_available_total` (per variant per country)
```
view v_variant_country_availability
```

### `low_stock` (variant per country)
```
qty_available_total <= variant_country_price.low_stock_threshold
  AND variant_country_price.active = true
```

### `dead_stock`
TODO: define velocity threshold (e.g., 0 sales in 90 days + qty > 10).

### `stock_value` [cost-bearing]
```
SUM(qty_on_hand × actual_cost)
```
Finance-only.

## Operations

### `delivery_failure_rate`
```
delivery_failures / shipped_orders
```

### `cod_collection_rate`
```
cod_collected / cod_dispatched
```

## AI & messaging

### `ai_avg_confidence`
```
AVG(message.confidence)
WHERE message.sender = 'ai'
```

### `ai_token_cost_per_conversation`
```
SUM(ai_response.cost_usd) / conversation_count
```

### `csat`
```
AVG(satisfaction_response.rating)
WHERE created_at IN period
```

### `review_rate`
```
reviews_collected / orders_with_satisfaction_high_rating
```

## Marketer

### `marketer_quality_score`
Composite per `marketer_quality_log` formula (see `03-rbac` and Master Plan v4 §12).

### `marketer_cancellation_rate`
```
cancelled_attributed / total_attributed_orders
```

## Edge cases

- **Multi-marketer attribution** — only the winning marketer (per attribution conflict resolver) gets revenue/profit credit.
- **Partial refunds** — proportionally reduce gross_revenue and gross_profit.
- **Returns within window** — exclude from "delivered" until return window passes.
- **COD-not-paid** — don't count in revenue until reconciled.

## TODO

- TODO: full formula catalog with SQL snippets.
- TODO: define attribution-period boundaries (last-touch within 30 days vs first-touch).
- TODO: confirm whether VAT-inclusive or exclusive in revenue figures.
