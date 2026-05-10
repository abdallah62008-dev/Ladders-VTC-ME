# Webhook Events

**Status:** Draft
**Owner:** Backend lead
**Last updated:** 2026-05-07

This document lists every webhook event the platform emits and receives.

---

## Outbound events (we emit)

All outbound webhooks are signed with HMAC-SHA256 using a per-endpoint secret. Signature in `X-Signature` header. Subscribers must verify or reject.

### Order

> 🟢 D-DB-001 Answered 2026-05-07: webhook event names preserved as `order.*` (external API contract; entity-action dot syntax never runs as SQL, no reserved-word collision). The entity backing these events is the `customer_orders` table — see `01-database/02-tables-by-module.md` Module 6.

- `order.created`
- `order.confirmed`
- `order.cancelled`
- `order.delivered`
- `order.refunded`

### Payment
- `payment.created`
- `payment.succeeded`
- `payment.failed`
- `payment.refunded`
- `payment.disputed`

### WhatsApp & AI
- `whatsapp.order_created`
- `whatsapp.confirmation_received`
- `ai.handoff_requested`
- `ai.recommendation_shown`
- `auto_reply.used`
- `message.sent`
- `message.replied`

### Reviews & service
- `review.collected`
- `service_ticket.created`

### B2B
- `b2b.quote_submitted`

### Marketers
- `marketer.order_attributed`
- `marketer.payout_requested`
- `marketer.payout_approved`

### Catalog
- `product.stock_changed`
- `product.price_changed`
- `product.cost_changed`        ← payload value redacted for subscribers without `cost.read`

### Coupons & landings
- `coupon.used`
- `pixel.event_failed`
- `landing_page.converted`

### v4 additions
- `country.created`
- `country.updated`
- `country.activated`
- `country.deactivated`
- `warehouse.created`
- `warehouse.updated`
- `variant_country.activated`
- `variant_country.deactivated`
- `variant_country.price_changed`
- `variant_country.cost_changed`     ← redacted (no value to non-`cost.read`)
- `variant_warehouse.stock_changed`
- `variant_country.low_stock`

### v4 modules
- `import.completed`
- `import.failed`
- `export.completed`
- `backup.completed`
- `backup.failed`
- `restore.requested`
- `restore.completed`
- `override.requested`
- `override.approved`
- `override.rejected`
- `override.expired`
- `override.applied`

---

## Outbound payload format

```json
{
  "event": "order.confirmed",
  "id": "evt_01HW...",
  "timestamp": "2026-05-07T10:30:00+03:00",
  "version": "1",
  "country": "sa",
  "data": {
    "order_id": "...",
    "order_number": "SA-2026-001247",
    "...": "..."
  }
}
```

Headers:
- `X-Signature: sha256=<hex hmac of body>`
- `X-Event-Id: evt_01HW...`
- `X-Event-Type: order.confirmed`

Retry policy: 5 attempts, exponential backoff (1m, 5m, 15m, 1h, 6h). After all retries fail, mark `webhook_delivery_log.status = 'failed'` and Smart Notification fires.

---

## Inbound webhooks (we receive)

| Source | Endpoint | Verification |
|---|---|---|
| WhatsApp Cloud API | `/api/v1/webhooks/whatsapp` | Meta signature + verify token |
| Stripe | `/api/v1/webhooks/payments/stripe` | Stripe signature header |
| Moyasar | `/api/v1/webhooks/payments/moyasar` | Provider signature |
| Tap | `/api/v1/webhooks/payments/tap` | Provider signature |
| PayTabs | `/api/v1/webhooks/payments/paytabs` | Provider signature |
| Tabby | `/api/v1/webhooks/payments/tabby` | Provider signature |
| Tamara | `/api/v1/webhooks/payments/tamara` | Provider signature |
| Paymob | `/api/v1/webhooks/payments/paymob` | Provider signature |
| Fawry | `/api/v1/webhooks/payments/fawry` | Provider signature |
| ZainCash | `/api/v1/webhooks/payments/zaincash` | Provider signature |
| Aramex | `/api/v1/webhooks/courier/aramex` | Provider signature |
| SMSA | `/api/v1/webhooks/courier/smsa` | Provider signature |
| Bosta | `/api/v1/webhooks/courier/bosta` | Provider signature |

### Common requirements
- Signature verified before any processing.
- Idempotency-Key (or provider-specific event id) deduped 24h.
- Request body stored raw in `webhook_log` for audit/replay.
- Failed signature → 401 + alert.
- Replay window: 5 minutes. Older webhooks rejected.

---

## TODO

- TODO: catalog of provider-specific event names mapped to internal events.
- TODO: replay UI for failed webhook deliveries.
- TODO: per-subscriber rate limit on outbound webhook delivery.
- TODO: confirm webhook secret rotation policy (quarterly).
