# Payment Provider Outage

**Status:** Draft (stub)
**Owner:** Backend lead + Ops

## Detection

- Provider returning 5xx for > 1 minute.
- Webhook delivery dropped to zero.
- Health check failing.

## Response

1. Mark provider unhealthy in `payment_provider.active = false` (temporary).
2. Payment Routing Engine excludes provider automatically.
3. Surface alternative providers in checkout.
4. Customer-facing banner: "Some payment methods temporarily unavailable."
5. Notification to Finance + Ops.
6. Track via webhook backlog.

## Recovery

1. Provider health restored.
2. Re-enable in routing.
3. Process backlog.
4. Reconcile any orders stuck in pending state.

## TODO

- TODO: per-provider health check spec.
- TODO: customer banner copy.
