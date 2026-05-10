# WhatsApp Outage

**Status:** Draft (stub)
**Owner:** Ops lead

## Detection

- Cloud API 5xx > 5 min
- Inbound webhook silence anomaly
- Outbound delivery rate drop

## Response

1. Notification to Ops lead.
2. Storefront banner: "WhatsApp temporarily unavailable; please email or call."
3. Sales reps switch to phone calls for COD confirmations.
4. Outbound queued for retry.

## Recovery

1. API recovered.
2. Process queued outbound.
3. Verify webhook delivery resumed.
4. Reconcile any orders stuck.

## TODO

- TODO: status page integration.
- TODO: alternate channel (SMS) for transactional during outage.
