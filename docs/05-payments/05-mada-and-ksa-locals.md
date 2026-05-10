# Mada and KSA Local Providers

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Providers covered

- **Moyasar** — Mada + cards
- **Tap** — cards + Mada
- **PayTabs** — cards + Mada
- **HyperPay** — cards + Mada (evaluate vs Tap/PayTabs to avoid redundancy)

## Why multiple

Mada is mandatory for KSA. Multiple providers gives:
- Failover if one is down
- Negotiating leverage on fees
- Different UX (Moyasar's checkout vs Tap's vs PayTabs)

## Common pattern

All implement `PaymentProvider` interface. Adapter normalizes their event names to internal canonical events.

## Webhooks

- `/api/v1/webhooks/payments/moyasar`
- `/api/v1/webhooks/payments/tap`
- `/api/v1/webhooks/payments/paytabs`

Each verifies signature per provider docs.

## TODO

- TODO: full integration spec per provider (after sandbox approval).
- TODO: pick primary KSA card provider (Moyasar default) + secondary fallback.
- TODO: confirm Mada-specific routing.
