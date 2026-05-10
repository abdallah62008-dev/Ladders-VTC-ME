# Reason Categories per Override Type

**Status:** Draft (stub)
**Owner:** Security lead + Finance

---

## Rule

Every override request must select a `reason_category` from a per-type enum. "Other" is allowed only with longer free-text justification (≥50 chars).

## Per-type enums (initial seeds)

### `profit_guardrail`
- `strategic_loss_leader` — loss leader to drive other purchases
- `dead_stock_clearance` — clearing slow-moving inventory
- `competitor_match` — competitive pricing response
- `error_correction` — fixing a price/cost mistake
- `seasonal_campaign` — short-window approved campaign
- `other` (50+ chars justification)

### `price_below_min`
- `strategic_loss_leader`
- `supplier_change` — supplier cost dropped, passing on
- `error_correction`
- `other`

### `campaign_loss`
- `strategic_loss_leader`
- `brand_awareness`
- `customer_acquisition`
- `market_entry`
- `other`

### `stock_override`
- `promised_to_customer` — already promised; over-allocated
- `fulfillment_bridge` — incoming stock soon, bridging gap
- `error_correction`
- `other`

### `warranty_exception`
- `goodwill_gesture`
- `batch_recall` — known defect batch
- `customer_loyalty` — VIP / repeat customer
- `safety_concern` — out of policy but safety dictates
- `other`

### `payout_exception`
- `early_payout_cashflow` — marketer cash flow request
- `dispute_resolution`
- `marketer_offboarding` — final payout
- `other`

### `country_activation`
- `soft_launch`
- `beta_program`
- `marketing_window` — limited-time promotional opening
- `other`

### `payment_refund_exception`
- `goodwill_gesture`
- `dispute_resolution`
- `regulatory_requirement`
- `damaged_in_delivery_compensation`
- `other`

## TODO

- TODO: confirm enums with Finance + Marketing + Maintenance leads.
- TODO: localize labels (Arabic + English shown in UI).
