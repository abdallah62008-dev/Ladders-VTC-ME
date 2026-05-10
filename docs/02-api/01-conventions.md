# API Conventions

**Status:** Draft
**Owner:** Backend lead
**Last updated:** 2026-05-07

---

## Versioning

- All public endpoints under `/api/v1/`.
- Version bumps for breaking changes only.
- 90-day deprecation policy for retired endpoints.
- Headers: `X-API-Version: 1`.

## Authentication

| Caller | Method |
|---|---|
| Storefront customer (logged in) | JWT in `Authorization: Bearer <token>` |
| Guest storefront | Session cookie (httpOnly, sameSite=lax) |
| Admin (Directus) | Directus session token |
| External marketer dashboard | OAuth2 PKCE (TODO) or scoped API token |
| Third-party API consumer | API token (`X-API-Token`) with scopes |
| Webhooks (inbound from us) | HMAC-SHA256 signature in `X-Signature` header |

## Authorization

- Token scopes enforced at API layer + RLS at DB layer.
- Cost scope (`cost.read`, `cost.export`) excluded from default tokens; explicit grant required.
- Country scope: tokens may include `country_scope: ["sa"]` to restrict reads.

## Country Context — `X-Country-Context` header (🟢 D-CSP-001 locked 2026-05-09)

Frontend sends `X-Country-Context: <country_code>` (or `all`) on every request. Backend validates per endpoint class.

### Endpoint classes

| Class | Behavior | Header missing | Header value not in user's allowed countries | Header = `all` and user lacks `country_scope.all` |
|---|---|---|---|---|
| `scoped` | Filtered by country | **400 Bad Request** | **403 Forbidden** + audit log `denied_cross_country_access_attempt` | **403** + audit |
| `aware` | Global with country overlay | Use user's default country (or first allowed) | **403** + audit | **403** + audit |
| `global` | Country-independent | Header ignored | Header ignored | Header ignored |

### Examples

```
GET /api/v1/admin/orders        → scoped (orders are country-scoped)
GET /api/v1/admin/products      → aware (product master + country overlay)
GET /api/v1/admin/users         → global (user identity is platform-wide)
GET /api/v1/admin/reports/sales-by-country  → cross-country (requires report.cross_country.read)
```

### Hard rules

- **Backend MUST NOT rely on UI hiding alone.** Every country-scoped endpoint independently validates the header against `user_country_access` (or `country_scope.all` permission).
- **Defense in depth:** API check + RLS at DB layer (per `01-database/03-rls-policies.md` country-scope policy template).
- **Audit log entry** mandatory on every 403 from country-scope mismatch. Record `actor_id`, `attempted_country_id`, `endpoint`, `http_method`, `request_id`.
- **All Countries (`X-Country-Context: all`)** requires `country_scope.all` permission. Cross-country reports/exports additionally require `report.cross_country.read` / `export.cross_country`.

Full spec in `03-rbac/03-scopes.md`.

## Request/response format

- JSON only (`Content-Type: application/json`).
- Snake_case in JSON keys (matches DB columns).
- ISO-8601 dates with timezone (`2026-05-07T10:30:00+03:00`).
- Currency: amount as decimal string (`"1250.00"`) + `currency_code: "SAR"`.

## Pagination

Cursor-based for stable iteration:
```
GET /api/v1/orders?limit=50&cursor=eyJpZCI6Li4ufQ==
→
{
  "data": [...],
  "next_cursor": "eyJpZCI6Li4ufQ==",
  "has_more": true
}
```

## Filtering and sorting

```
GET /api/v1/products?country=sa&category=telescopic&sort=price_asc&limit=20
```

## Errors

Consistent envelope:
```json
{
  "error": {
    "code": "PROFIT_GUARDRAIL_BREACH",
    "message_en": "Coupon would breach the 18% business margin floor.",
    "message_ar": "هذا الكوبون سيخفض هامش الأرباح تحت 18%.",
    "details": {
      "computed_margin": 0.12,
      "floor": 0.18,
      "variants_affected": ["..."]
    },
    "request_id": "..."
  }
}
```

HTTP status:
- `400` validation
- `401` unauthenticated
- `403` forbidden (scope/role)
- `404` not found
- `409` conflict (e.g., concurrent stock write)
- `422` business rule (e.g., guardrail breach)
- `429` rate limit
- `500` server
- `503` upstream provider down (payment/whatsapp)

## Idempotency

`Idempotency-Key` header **required** on:
- `POST /api/v1/checkout`
- `POST /api/v1/payments/*`
- `POST /api/v1/webhooks/*`

Stored 24h in Redis; duplicate keys return cached response.

## Rate limiting

Token-bucket on Redis:
- Anonymous: 60 req/min
- Authenticated customer: 300 req/min
- Admin token: 1000 req/min
- Webhook receiver: 10000 req/min (with signature validation)

Returns `429` with `Retry-After` header.

## Cost privacy

- Default API responses **never** include cost columns.
- `cost.read` scope explicitly required.
- Cost-redaction tested in CI for every endpoint serializer.
- Webhook events `product.cost_changed` redact value for subscribers without `cost.read`.

## CORS

Strict allow-list:
- Storefront origins per locale
- Admin origin
- Marketer dashboard origins (incl. VIP custom subdomains in Phase 5)

No `*` wildcards.

## Logging

Every request logged with:
- `request_id` (UUID, returned in response header)
- `actor_id`, `actor_type`, `actor_role`
- `route`, `method`, `status`, `latency_ms`
- `country_id`, `locale` (when available)
- IP (hashed for retention), user agent
- Cost values **never** in logs.

## Observability

- Sentry for errors with context.
- OpenTelemetry traces from API → DB → external providers.
- Grafana dashboards for p50/p95/p99 latency per route.

## Documentation

- OpenAPI 3.1 spec in `02-openapi.yaml`.
- Rendered via Stoplight or Redocly (TODO ADR-028).

## TODO

- TODO: confirm storefront auth approach (custom JWT vs Auth.js — ADR-020).
- TODO: pick API doc tool (ADR-028).
- TODO: rate limit thresholds reviewed against expected load.
- TODO: error code catalog (canonical list of `error.code` values).
