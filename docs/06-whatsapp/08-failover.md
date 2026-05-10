# Failover and Outage Handling

**Status:** Draft (stub)
**Owner:** Ops lead + Infra lead

---

## Failure modes

| Mode | Detection | Response |
|---|---|---|
| Meta Cloud API down (outbound) | 5xx from API; queue backing up | BullMQ retries; smart notification fires after 5 min; status page banner |
| Inbound webhook delivery failing (Meta side) | Drop in inbound rate vs baseline | Alert; nothing app-side to do; Meta retries |
| Our webhook handler 5xx | Sentry alerts | Fix forward; Meta retries |
| Number suspended by Meta | Cloud API returns suspension error | Switch to backup number for that country (TODO procure); user-facing fallback |
| Rate limit hit | 429 from Cloud API | Throttle outbound; queue wait |

## Customer-facing fallback

If WhatsApp is degraded:
- Storefront shows banner: "WhatsApp temporarily unavailable; please email or call."
- Sales reps available via phone.

## Reconciliation

Once API recovers:
- Queued outbound messages dispatched.
- Webhook events Meta retried during outage processed.
- Smart Notification on resolution.

## Runbook

See `18-runbooks/whatsapp-outage.md`.

## TODO

- TODO: backup number procurement.
- TODO: status page integration.
- TODO: define rate limit thresholds for throttling.
