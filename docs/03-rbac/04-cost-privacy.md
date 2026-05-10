# Cost Privacy

**Status:** 🟢 **Locked — D-RBAC-001 ANSWERED 2026-05-07**
**Owner:** Security lead + DBA
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §15; Tracker decision D-RBAC-001 (🟢 Answered)

---

## 🟢 Locked decision (D-RBAC-001 — Answered 2026-05-07)

**Only `super_admin` and `finance_admin` may read `actual_product_cost`.**

| ✅ Has `cost.read` | ❌ Does NOT have `cost.read` |
|---|---|
| `super_admin` | `admin` · `country_manager` · `product_manager` · `inventory_manager` · `warehouse_manager` · `warehouse_staff` · `marketing_manager` · `marketer_manager` · `sales_manager` · `sales_agent` · `customer_support_agent` · `ai_supervisor` · `content_seo_editor` · `media_manager` · `b2b_sales_agent` · `maintenance_service_agent` · `shipping_coordinator` · `read_only_auditor` · `developer_api_admin` · `external_marketer` |
| `finance_admin` | (18+ excluded roles total) |

**Marketer cost is governed by a separate permission `marketer_cost.read`** — Marketing Manager + Marketer Manager + the marketer themselves (own rows only) may read. **External marketers never see actual product cost** under any condition.

This decision shapes RLS policies (`01-database/03-rls-policies.md`), API serializers, admin UI visibility, export filters, webhook payloads, audit log entries, and Sentry/Grafana log scrubbing. Changing it requires a new ADR + override.

---

## Why this matters

`actual_product_cost` is the most sensitive data in the system. Its leakage to a marketer, contractor, or external party would:
- Reveal margin structure to competitors
- Enable marketers to negotiate against business
- Damage supplier relationships if surfaced
- Constitute a financial breach

Therefore: defense-in-depth from database to UI — see "Defense layers" table below.

---

## Permission cache rules (🟢 D-CACHE-001 locked 2026-05-09)

The session-level Redis permission cache (per `03-rbac/03-scopes.md` §H.0) interacts with cost privacy as follows:

1. **Cache stores permission slugs only** — whether the user *has* `cost.read` / `marketer_cost.read` / `cost.export`, not the actual cost values.
2. **Cost values come from DB queries that go through RLS** — the cache never holds cost numerics.
3. **Sensitive actions bypass cache** — every cost-bearing endpoint (whether for `actual_product_cost`, `marketer_product_cost`, profit snapshots, or cost exports) performs an explicit fresh DB-backed permission check + RLS check, not just the cache lookup. Cache may be stale; sensitive actions cannot tolerate staleness.
4. **Cache invalidation on permission change** — `cost.read` / `cost.export` slug grants/revokes flush the affected user's cache key within 60 seconds (Phase 1 acceptance test bound).
5. **Audit logging unchanged** — cache hit/miss does not affect audit instrumentation. Denied cost-read attempts still write `audit_log` entries.

**`cost_read_log` table** (Phase 1 schema reservation; Phase 2 mandatory instrumentation per Phase 0 Cleanup Step 2 lock 2026-05-09): records every cost-bearing endpoint hit with actor, role, entity, ip, user_agent, context, redacted_flag, read_at. 7-year retention per Class 2 deletion policy (D-DB-010 — never hard delete). Read access restricted to Super Admin + Security Lead via `cost_read_log.read` permission slug; Finance Admin excluded to avoid conflict-of-interest.

---

## Defense layers

| Layer | Mechanism | Failure mode |
|---|---|---|
| 1. Database | RLS policies on `variant_country_cost`, `order_line.actual_cost_snapshot`, `business_gross_profit_snapshot` | Even SQL injection cannot return rows |
| 2. Application | API serializers strip cost fields unless caller has `cost.read` | Bug-resistant via centralized serializer |
| 3. API tokens | Cost scopes excluded by default; explicit grant required | Reduces blast radius of token leak |
| 4. Admin UI | Cost columns hidden in non-finance roles | UX guardrail |
| 5. Exports | `cost.export` scope required; CSV/XLSX exports auto-redact | Prevents bulk exfiltration |
| 6. Webhooks | `product.cost_changed` and `variant_country.cost_changed` events emit without value to subscribers without `cost.read` | Subscribers see "an update happened" only |
| 7. Audit log | Cost-related entries store `old_value_redacted: true` for non-finance reads | Even auditors see redacted values |
| 8. Logs / observability | Sentry / Grafana scrubbers redact field names matching `*cost*`, `*margin*` | Logs are not a leak vector |
| 9. Backups | Backup payloads encrypted at rest; restored data still gated by RLS | Backup access doesn't bypass policy |

---

## Specific protections

### Forbidden patterns (never written into the codebase)

- `SELECT actual_cost ...` outside finance-scoped code paths
- Logging request bodies that contain cost values
- Including cost in webhook payloads sent to non-finance subscribers
- Returning cost in error messages
- Caching cost in non-segmented Redis keys
- Storing cost in any analytics pixel or third-party event
- Embedding cost in client-side JS or HTML

### Database-level enforcement

See `01-database/03-rls-policies.md`. Every cost-bearing column has an RLS policy.

### Application-level enforcement

API responses pass through a **central serializer** that:
1. Inspects current session role.
2. If role lacks `cost.read`, deletes cost fields from response object.
3. Logs an audit entry if a cost field would have been stripped (signals a poorly-scoped query).

### Webhook redaction

Outbound webhook dispatcher consults subscriber's scope:
```
if event = "product.cost_changed" and subscriber lacks cost.read:
    payload.data.value = null
    payload.data.value_redacted = true
```

### Logging redaction

Sentry beforeSend hook + Grafana log pipeline both run a redactor:
- Field names matching `/cost/i`, `/margin/i`, `/profit/i` → redacted to `***`
- Numeric values in `cost`-suffixed columns → redacted to `***`

---

## Penetration test plan

**Run before public launch and quarterly thereafter.**

Test cases:
1. Authenticate as `marketing_user`, attempt all paths that might return `actual_cost`. Verify 0 leaks.
2. Authenticate as `external_marketer`, attempt to access another marketer's `marketer_cost`. Verify rejection.
3. Trigger a webhook to a `developer_api_admin`-owned subscriber; verify cost values redacted.
4. Bulk-export `variant_country_price` as a non-cost role; verify cost columns absent.
5. Inspect `audit_log` entries created by non-finance roles; verify cost values redacted.
6. Inspect Sentry events created by deliberately-cost-leaking code path; verify scrubber removes values.
7. Inspect a backup file; verify cost fields are encrypted (never plaintext).
8. Attempt SQL injection on a cost-bearing query as `marketing_user`; verify RLS still returns 0.

---

## CI tests (every commit)

- RLS unit tests (see `01-database/03-rls-policies.md`).
- Serializer unit tests: `cost` fields not in default response.
- Webhook redactor unit tests.
- Static analysis grep for forbidden patterns (`SELECT actual_cost`, etc.).

---

## TODO

- TODO: contract a security firm for penetration test before public launch (Q1 of Phase 7 timeline).
- TODO: implement Sentry beforeSend redactor (Phase 1 task).
- TODO: ensure Cloudflare logs do not contain cost values (review log forwarding rules).
