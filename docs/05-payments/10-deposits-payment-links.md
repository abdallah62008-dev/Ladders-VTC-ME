# Deposits and Payment Links

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Deposits

Use cases:
- High-risk COD (require 30% upfront online).
- B2B staged payments (e.g., 30% confirm, 70% on delivery).
- Custom orders.

Schema:
```
deposit (
  id, order_id, amount, currency, payment_transaction_id,
  status: pending | paid | refunded,
  collected_at
)
```

## Payment Links

Use cases:
- WhatsApp orders → AI/sales agent generates link → customer pays.
- Modified orders → new total link.
- B2B → invoice link.
- Balance collection on partial-paid orders.

Schema:
```
payment_link (
  id, order_id, amount, currency, link_url, expires_at,
  provider, provider_link_id, status: active | paid | expired | cancelled,
  created_by, created_at
)
```

Link generation:
- Stripe PaymentLink for Stripe-supported markets.
- Native payment link from Moyasar/Paymob/Tap for KSA/EG.
- Custom hosted link page for ZainCash (provider doesn't have native PaymentLinks).

## Security

- Links expire (default 24h).
- One-time use (can be configured for B2B repeat).
- Generated only by authenticated sales agents OR AI tool `generate_payment_link`.

## TODO

- TODO: confirm default expiry.
- TODO: link UX (mobile-first, locale-aware).
- TODO: per-provider link generation specifics.
