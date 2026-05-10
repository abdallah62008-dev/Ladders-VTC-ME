# Rate Limiting

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Strategy

Token-bucket on Redis, per `(actor_type, actor_id, route_class)`.

## Default limits

| Actor type | Limit |
|---|---|
| Anonymous (storefront) | 60 req/min |
| Authenticated customer | 300 req/min |
| Admin user | 1000 req/min |
| External marketer | 200 req/min |
| Third-party API token | 500 req/min (configurable per token) |
| Webhook receiver (signature-validated) | 10000 req/min |

## Route-class adjustments

- `/api/v1/ai/chat` — additional limit: 30 req/min per conversation (prevents floods).
- `/api/v1/checkout` — 10 req/min per customer.
- `/api/v1/coupons/validate` — 30 req/min per cart.
- `/api/v1/pixels/track` — burst-tolerant 600 req/min.

## Response

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1715000000

{ "error": { "code": "RATE_LIMIT", "message_en": "...", "message_ar": "..." } }
```

## Bypass

- Super admin tokens may have elevated quotas (audit-logged).
- Pre-launch load testing exempted by IP allow-list.

## TODO

- TODO: confirm thresholds against expected MENA traffic profile.
- TODO: define DDoS escalation: combining Cloudflare WAF + app-level limits.
- TODO: per-IP limits in addition to per-actor.
