# Payment Webhook Security

**Status:** Draft
**Owner:** Backend lead + Security lead

---

## Universal requirements

- **Signature verification** using provider's documented method.
- **Replay protection**: reject events older than 5 minutes (per provider's timestamp).
- **Idempotency**: dedupe on provider's event ID for 7 days.
- **Raw body logging** in `webhook_log` for audit/replay.
- **Failed signature** → 401 + Smart Notification + alert.
- **Timing-attack-safe comparison** for HMACs (`crypto.timingSafeEqual`).
- **Secrets in secrets manager** — never in env files committed to git.

## Per-provider verification

| Provider | Method |
|---|---|
| Stripe | `Stripe-Signature` header HMAC-SHA256 with timestamp |
| Moyasar | Signed with shared secret per provider docs |
| Tap | Signed with shared secret |
| PayTabs | Signed |
| Tabby | Signed |
| Tamara | Signed |
| Paymob | HMAC with secret |
| Fawry | Signed |
| ZainCash | Signed (per ZainCash docs) |
| FastPay | Per provider docs |

Each adapter implements `verifyWebhookSignature(headers, body, secret) → bool`.

## Replay UI

Admin can replay failed webhook deliveries:
1. Inspect `webhook_log` row
2. Click "Replay"
3. Re-deliver to handler with original payload
4. Outcome logged

## Outage handling

- Webhook handler 5xx → provider retries per their schedule.
- We never lose webhooks: raw body stored before processing.
- Reconciliation worker replays failed webhooks within 24h.

## TODO

- TODO: per-provider signature algorithm reference (link to docs).
- TODO: webhook secret rotation runbook (quarterly).
- TODO: replay UI design.
