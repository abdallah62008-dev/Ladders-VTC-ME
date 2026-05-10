# BNPL — Tabby and Tamara (KSA)

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Providers

- **Tabby** — split into 4 interest-free payments
- **Tamara** — pay later or split

## Display rules

KSA only. Display BNPL chips on PDP and at checkout when:
- Order value ≥ TODO threshold (typical 100 SAR for Tabby; check current)
- Customer is in KSA
- Provider returns `pre_approved` (Tabby has pre-checkout API)

Display format on PDP:
> "أو 4 دفعات × 312.50 ر.س مع تابي" / "or 4 × 312.50 SAR with Tabby"

## Flow

1. Customer selects Tabby/Tamara at checkout.
2. Redirect to provider checkout for KYC + approval.
3. Approved: webhook `payment_intent.succeeded` → order confirmed.
4. Rejected: customer returns to checkout, picks alternative.

## Webhooks

- `/api/v1/webhooks/payments/tabby`
- `/api/v1/webhooks/payments/tamara`

## Refund

Refunds adjust BNPL schedule via provider API.

## Profit Guardrails

BNPL fees (~5–6%) factored into payment_fee in Profit Guardrails. Cost imports must include BNPL fee assumptions.

## TODO

- TODO: confirm minimum order values for BNPL display.
- TODO: confirm provider fee schedule.
- TODO: confirm refund mechanics.
