# AI Tool Catalog

**Status:** Draft
**Owner:** AI lead

This is the **complete tool catalog** the LLM agent can call. Tools are the **only** path from LLM to facts. The LLM cannot fabricate any product/price/stock/policy data.

---

## Tool definitions

### `search_products`
Returns top-N matching variants with full specs + per-country price + availability.

```
Inputs:
  query: string (Arabic or English)
  country: 'sa' | 'eg' | 'iq'
  locale: locale code
  filters?: { height_range, max_load_min, material, ladder_type, group, max_folded_cm }
  limit?: int (default 5, max 10)

Output:
  results: [
    {
      sku, variant_id, name, slug, height_cm, max_load_kg, folded_cm,
      regular_price, sale_price, currency,
      qty_available, lead_time_days, in_stock_status: 'in' | 'low' | 'out',
      certifications: [],
      hero_image_url
    }
  ]

Side effects: none (read-only)
RLS: cost columns excluded from output
Allowed states: any except confirmed/draft_order_created/closed
```

### `get_product`
Full product detail by sku or variant_id, scoped to country.

### `compare_products`
Side-by-side spec diff for 2–4 SKUs.

### `recommend`
Same scoring engine as the website Ladder Finder.

```
Inputs:
  use_case: 'home_apartment' | 'villa' | 'workshop' | 'construction' | 'warehouse' | 'outdoor'
  target_height_cm?: int
  storage_constraint?: 'fits_in_car' | 'garage' | 'no_constraint'
  budget_band?: 'low' | 'mid' | 'high'
  country: country code

Output:
  primary: { sku, reason }
  alternatives: [{ sku, reason }, ...]   (up to 2)
```

### `check_stock_availability`
Returns availability across warehouses for a variant in a country.
Used **before** any recommendation by inventory-aware AI.

### `suggest_alternative`
When primary recommendation is unavailable, returns 1–3 substitutes meeting same criteria.

### `get_shipping`
Per-country, per-city shipping fee + ETA.

### `get_policy`
Returns canonical policy text (warranty, returns, shipping, COD process) per topic + locale.

### `get_faq`
pgvector retrieval over `faq_policy` corpus. Returns top-K matching FAQ entries with answers.

### `lookup_customer`
Returns prior orders + addresses if customer recognized by phone. Used to pre-fill capture fields.

### `apply_coupon`
Validates coupon against Coupon Engine + Profit Guardrails (soft-check).

### `create_draft_order`
Persists a `draft_order` row with status `awaiting_confirmation`.

```
Inputs:
  customer_info: { name, phone, country, locale }
  address: { city, district, street, building, apartment, landmark, postal_code? }
  items: [{ variant_id, qty }]
  payment_pref: 'cod' | 'card' | 'bnpl' | 'wallet' | 'bank_transfer'
  channel: 'web' | 'whatsapp'
  conversation_id: uuid

Output:
  draft_order_id, summary_text (formatted in customer's locale), totals
```

### `confirm_order`
Transitions a `draft_order` → `order` with status `confirmed`.

### `escalate_to_human`
Routes conversation to `handoff_request` queue.

```
Inputs:
  conversation_id
  reason: enum
  urgency: 'low' | 'normal' | 'high' | 'critical'
  summary: string

Output:
  handoff_id, queue_position, estimated_response_time
```

### `create_service_ticket`
Customer reports fault → AI creates ticket. Used during/after delivery.

### `generate_payment_link`
Returns a payment link URL for a draft order. Provider chosen by Payment Routing Engine.

---

## Tool execution rules

- All tools idempotent except `create_draft_order`, `confirm_order`, `escalate_to_human`, `create_service_ticket`, `generate_payment_link`.
- Idempotent ones use `Idempotency-Key` derived from `(conversation_id, tool, args_hash)`.
- Tools log to `ai_tool_call` with input, output, duration, success/failure.
- Cost columns never appear in tool outputs.
- All tools country-scoped: AI cannot accidentally recommend a SKU from a country the customer is not browsing.

## Failure modes

| Tool failure | AI behavior |
|---|---|
| Network/transient | Retry once; if still failing, fallback to "I'm having trouble accessing that data, let me connect you with a colleague." → handoff |
| Tool returns empty | Inform customer politely; suggest alternatives or escalate |
| Tool returns guardrail-blocked result (e.g., coupon breaches floor) | Inform customer that coupon cannot be applied; do not say why in business terms |

## TODO

- TODO: finalize input/output JSON schemas for each tool.
- TODO: confirm token budget per tool call (some are large).
- TODO: implement tool-level rate limit (don't loop calls).
- TODO: tool versioning strategy.
