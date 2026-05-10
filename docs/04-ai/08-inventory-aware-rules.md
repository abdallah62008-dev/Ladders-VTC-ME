# Inventory-Aware AI Rules

**Status:** Draft
**Owner:** AI lead

---

## Principle

AI **never** promises a product the customer cannot buy in their country/warehouse. Inventory awareness sits between recommendation and reply.

---

## Mandatory tool calls

Before any product mention or recommendation:
1. `check_stock_availability(variant_id, country)` — get `qty_available_total`, `qty_inbound`, `lead_time_days`.

## Behavior matrix

| `qty_available_total` vs `low_stock_threshold` | AI behavior |
|---|---|
| `qty_available > threshold` | Recommend normally |
| `0 < qty_available ≤ threshold` | Add disclaimer: "limited stock" |
| `qty_available = 0` AND `qty_inbound > 0` AND `lead_time_days` set | Inform: "currently out, restocking in {lead_time_days} days. Want to be notified?" |
| `qty_available = 0` AND no inbound | Call `suggest_alternative` and recommend the substitute, explaining briefly |
| Variant not active in country | Same as no-stock — call `suggest_alternative` |

## Promise constraints

AI **may not** say:
- "Yes, in stock" without checking
- "Will arrive in X days" without `lead_time_days` from tool
- "Always available" (false universal claim)
- "Last few units" without tool data

## Proactive substitution

When `suggest_alternative` returns:
- AI presents up to 3 substitutes with one-line reasons
- Mentions the original SKU was unavailable
- Asks customer if substitute interests them

Example (ar-sa):
> "السلم اللي طلبته (TLA-440) للأسف غير متوفر حالياً.
> أنصحك بالبدائل التالية:
> ⭐ TLA-400 (4م، يصل لـ5م، يطوى 95سم) — متوفر، 1,180 ر.س
> ⭐ TLA-500 (5م، يصل لـ6م، يطوى 105سم) — متوفر، 1,580 ر.س
> أيهم أنسب؟"

## Country gates

If customer is browsing `ar-eg` and asks about a SKU not active in EG:
- AI responds: "هذا المنتج غير متوفر في مصر حالياً. هذه بدائل متاحة للتوصيل في القاهرة..."
- Calls `suggest_alternative(country='eg', criteria from original SKU)`.

## Lead-time honesty

Tool returns `lead_time_days` per `(variant, country)`. AI uses this verbatim — never rounds up or down. If lead time is 3–5 days, AI says "خلال 3–5 أيام".

## Out-of-stock notify-me

When AI can't fulfill, it offers:
- "Want me to notify you when back in stock?" → captures phone (already known on WhatsApp) and writes to `back_in_stock_subscription`.
- "Want to chat with sales for a custom solution?" → handoff.

## TODO

- TODO: implement `back_in_stock_subscription` table (migrated reserved-from-day-1 in Phase 1).
- TODO: define how AI surfaces "estimated 3–5 days" when warehouse-level lead times differ across warehouses serving the customer's country.
- TODO: determine whether to offer pre-orders (deposit + future fulfillment) for restocking SKUs.
