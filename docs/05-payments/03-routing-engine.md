# Payment Routing Engine

**Status:** Draft
**Owner:** Backend lead

---

## Purpose

Decide which payment options to surface at checkout based on context.

## Inputs

- `country`
- `currency`
- `order_value`
- `customer.risk_score`
- `customer.order_history` (first-time vs returning vs flagged)
- `product_type` (some B2B products force bank transfer)
- `provider_availability` (degraded mode if a gateway is down)
- `b2b_account_id` (B2B may have negotiated terms)

## Output

Sorted list of payment methods to surface:
```json
{
  "methods": [
    { "code": "mada", "label_ar": "مدى", "label_en": "Mada", "fee_indicator": null },
    { "code": "apple_pay", "label_ar": "Apple Pay", "label_en": "Apple Pay" },
    { "code": "tabby", "label_ar": "تابي - تقسيط", "label_en": "Tabby - 4 payments" },
    { "code": "cod", "label_ar": "الدفع عند الاستلام (+25 ر.س)", "label_en": "COD (+25 SAR)", "fee_indicator": "25.00" }
  ],
  "recommended": "mada"
}
```

## Decision tree (illustrative)

```
if country = sa:
  default: [mada, apple_pay]
  if order_value >= TODO_threshold: add [tabby, tamara]
  if customer.risk_score < threshold: add cod with +25 SAR fee
  if customer.is_b2b: prefer bank_transfer

if country = eg:
  default: [paymob_card, vodafone_cash, fawry, cod]
  if order_value > 5000 EGP and risk_score high: cod requires deposit
  if customer.is_b2b: prefer bank_transfer

if country = iq:
  default: [cod, zaincash, fastpay, bank_transfer]
  if customer.risk_score high: cod requires deposit
```

## High-risk COD

If customer has 2+ COD cancellations OR risk score above threshold:
- Surface cod with required deposit (e.g., 30% upfront via online payment)
- Display: "للأسف، نطلب دفعة مقدمة 30% للتأكيد"

## Provider degradation

If a provider's webhook hasn't fired in N minutes / health endpoint failing:
- Provider hidden from routing
- Smart Notification fires
- Fallback automatic

## B2B routing

Negotiated terms from `b2b_account.credit_terms` override defaults:
- `prepay`: standard methods
- `net_30`: bank_transfer + invoicing only
- `net_60`: bank_transfer only

## TODO

- TODO: lock thresholds (BNPL minimum, COD deposit threshold, fee amounts per country).
- TODO: define risk scoring (covered in `customer_score`).
- TODO: provider health check spec.
