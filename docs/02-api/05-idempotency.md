# Idempotency

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Required on

- `POST /api/v1/checkout`
- `POST /api/v1/payments/*`
- `POST /api/v1/orders` (admin-created)
- All inbound webhook handlers
- `POST /api/v1/refunds`
- `POST /api/v1/payouts/approve`

## Mechanism

Client supplies `Idempotency-Key: <uuid>` header (UUID v4 recommended).

Server stores `(idempotency_key, route, status_code, response_body)` in Redis with 24h TTL.

If a duplicate key arrives within 24h:
- Same route + same body hash → return cached response (200/201).
- Same route + different body → 409 Conflict.

## Webhook idempotency

For inbound webhooks:
- Use provider's event ID as the idempotency key.
- Reject duplicate event IDs within 7-day window.

## TODO

- TODO: confirm 24h TTL is enough for retried client calls (some couriers retry after 48h).
- TODO: distinguish "saw key, in flight" from "saw key, completed" — implement 202 + Retry-After during in-flight.
