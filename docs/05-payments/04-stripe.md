# Stripe Integration

**Status:** Draft
**Owner:** Backend lead

---

## Mode

- Test mode in `dev` and `staging` environments.
- Live mode in `production` only after live keys received.

## Integration approach

**Both** patterns supported, behind `PaymentProvider` interface:

### A. Stripe Checkout (hosted)
- Customer redirected to Stripe-hosted checkout page.
- Lower PCI scope.
- Default for first launch.

### B. Stripe Payment Intents (embedded)
- In-page card collection via Stripe Elements.
- Better UX; higher PCI considerations (we use Elements, not raw card).
- Available for high-AOV optimization.

## Webhooks

Endpoint: `/api/v1/webhooks/payments/stripe`

Events handled:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.processing`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

## Signature verification

Mandatory. Reject with 401 if Stripe-Signature header invalid or replay window exceeded (5 min).

## Idempotency

`Idempotency-Key` header on every payment_intent or refund creation. Derived from `(order_id, action, version)`.

## 3DS / SCA

3D Secure enforced where issuer requires (Mada-issued cards via Stripe will redirect for 3DS).

## Multi-currency

Stripe supports SAR, EGP. IQD not supported via Stripe — use ZainCash/local for IQ.

## Refunds

- Full and partial supported.
- Approval workflow per `15-payments/11-refund-dispute.md`.
- Refund webhook updates `refund.status`.

## Disputes

- Inbound `charge.dispute.created` opens a `dispute` row.
- Operations team uploads evidence (delivery proof, conversation proof, photos) within Stripe deadline.
- Closed via `charge.dispute.closed` event.

## Test data

Stripe test card numbers documented in dev wiki (TODO).

## Configuration

Secrets stored in secrets manager:
- `STRIPE_SECRET_KEY` (live + test)
- `STRIPE_WEBHOOK_SECRET` (live + test)
- `STRIPE_PUBLISHABLE_KEY` (test only used in code; production publishable key fetched at runtime)

**Never committed to git. Never in `.env` file in repo. Never in backups.**

## Failover

If Stripe outage detected:
- Surface alternative providers (Moyasar/Tap for KSA cards).
- Smart Notification to operations.
- Webhooks queued for replay when Stripe recovers.

## TODO

- TODO: confirm Stripe approval for KSA merchant.
- TODO: 3DS handling for Mada specifically.
- TODO: PaymentLinks vs Checkout Sessions for WhatsApp order links.
- TODO: Currency precision (SAR has 2 decimals; verify Stripe minor units).
