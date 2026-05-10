# Country Access Control & Scopes (RBAC extension)

**Status:** 🟢 **Architecture locked 2026-05-09** (D-CSP-001 + D-CSP-002 + D-CSP-003 + D-CSP-004 🟢 Answered); schema reservations Phase 1; functional UI builds Phase 2 → Phase 10
**Owner:** Security Lead
**Source:** Country Access Control Evaluation 2026-05-09; D-RBAC-001 (cost privacy); D-COUNTRY-014 (dynamic country); ADR-027 (migrations)

> ⚠️ **Country Access Control is an extension of the existing RBAC system, not a new module.** The canonical spec lives here; supporting tables/columns are reserved across modules per the page-classification rule. Do not replace the existing `user.country_scope` jsonb — it remains as a denormalized cache.

---

## Table of contents

- [A. Architecture overview](#a-architecture-overview)
- [B. Layered access model](#b-layered-access-model)
- [C. Canonical data model — `user_country_access`](#c-canonical-data-model--user_country_access)
- [D. "All Countries" — modeled as a permission slug](#d-all-countries--modeled-as-a-permission-slug)
- [E. Country denormalization rule](#e-country-denormalization-rule)
- [F. Page classification rule (`country_scope_mode`)](#f-page-classification-rule-country_scope_mode)
- [G. API convention — `X-Country-Context` header](#g-api-convention--x-country-context-header)
- [H. RLS strategy](#h-rls-strategy)
- [I. Admin UX — Country Context Switcher](#i-admin-ux--country-context-switcher)
- [J. Audit + alert events](#j-audit--alert-events)
- [K. Phase placement](#k-phase-placement)
- [L. Existing scopes preserved](#l-existing-scopes-preserved)

---

## A. Architecture overview

Country Access Control answers **WHERE** a user can perform an action. It composes with:

- **Role permissions** — WHAT the user can do (existing — `role_permission` table)
- **Field permissions** — WHICH FIELDS the user can read/write (existing — D-RBAC-001 cost privacy)
- **Country scope** — WHERE the user can do it (this document)
- **Country context filter** — WHICH country is currently selected in the top-bar widget (this document)

```
can_access_record =
    role_permission_allowed
  AND country_scope_allowed                  ← Country Access Control
  AND field_permission_allowed (if sensitive)
  AND country_in_active_session_context      ← top-bar selector
```

The four layers are **AND-composed**. Country scope does NOT override role permissions; role permissions do NOT override country scope. Both must be true.

---

## B. Layered access model

| Layer | What it answers | Where |
|---|---|---|
| Role permissions | WHAT the user can do | `role_permission` table; slug catalogue in `02-permissions.md` |
| Country access | WHERE the user can do it | `user_country_access` (canonical) + `user.country_scope` jsonb (cache) + `country_scope.all` slug |
| Field permissions | WHICH FIELDS | `cost.read`, `marketer_cost.read`, `cost.export` (D-RBAC-001) |
| Country context (session) | WHICH country is selected | top-bar selector; `X-Country-Context` header; session var `app.current_user_country_scope` |

---

## C. Canonical data model — `user_country_access`

> Schema reservation Phase 1. Functional UI for grants/revocations Phase 6 (admin "User Country Access" screen).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → `user.id` | |
| country_id | uuid FK → `country.id` | |
| access_level | text | `'read' \| 'write' \| 'manage'` |
| assigned_by_user_id | uuid FK → `user.id` | who granted |
| assigned_at | timestamptz | |
| revoked_at | timestamptz NULL | Class 1 soft-delete column per D-DB-010 |
| revoked_by_user_id | uuid FK NULL | |
| revoke_reason | text NULL | required when revoked_at set |
| active | bool | denormalized: `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())` |
| expires_at | timestamptz NULL | optional time-limited grant |
| notes | text | |
| created_at, updated_at | timestamptz | |
| audit_log_id_last_change | uuid FK → `audit_log.id` | every change references audit row |

**Indexes:**
- `(user_id, active)` — fast "what countries can user X access"
- `(country_id, active)` — fast "who has access to country Y"
- `(user_id, country_id) WHERE revoked_at IS NULL` UNIQUE — exactly one active row per (user, country) pair

**Class 1 soft-delete** per D-DB-010: `revoked_at` is the soft-delete column; rows preserved forever for audit.

### Cache-sync pattern

`user.country_scope` jsonb is a **denormalized read cache** updated by trigger on every `user_country_access` insert/update/revoke:

```sql
-- Pseudocode trigger
CREATE TRIGGER user_country_access_sync_cache
AFTER INSERT OR UPDATE OR DELETE ON user_country_access
FOR EACH ROW EXECUTE FUNCTION sync_user_country_scope_cache();

-- Function rebuilds user.country_scope from currently-active user_country_access rows
-- Format: jsonb array of country codes, e.g., '["sa","eg"]'::jsonb
```

The session variable `app.current_user_country_scope` reads from the cache at request time (cheap; no query), so RLS policies stay simple. The canonical table is the source of truth; the cache is read-only for the application layer.

**Cache invalidation:** revoking access invalidates the cache within 60 seconds (Redis TTL bound; integration test asserts).

### External marketer special case

`external_marketer` users do **NOT** use `user_country_access`. Their country scope comes from `marketer.country_id` (existing convention). Documented as an explicit exception. Internal users use `user_country_access` exclusively.

### Country Manager role enforcement

A user assigned the `country_manager` role MUST have at least one active `user_country_access` row. Constraint enforced at user-creation/role-assignment time; backend rejects role assignment if no scope exists.

---

## D. "All Countries" — modeled as a permission slug

**Decision: `country_scope.all` permission slug** (D-CSP-003 🟢 Answered).

| Approach | Verdict |
|---|---|
| `user_country_access` row per country for all-access users | ❌ Rejected — rigid; new countries require backfill rows for every all-access user |
| `all_countries_access boolean` on user table | ❌ Rejected — conflates RBAC concerns into user table; harder to grant via standard role_permission flow |
| **Permission slug `country_scope.all`** | ✅ **Selected** — composes cleanly with existing RBAC; granted/revoked via `role_permission`; audit-logged like any permission change |
| Role-only flag (e.g., super_admin always has it) | 🟡 Partial — used as default grant for some roles, but slug is the underlying mechanism |

**Default grants** (baked into role_permission seed in migration 0002):
- `super_admin` — has `country_scope.all`
- `finance_admin` — has `country_scope.all`
- `read_only_auditor` — has `country_scope.all` (for cost-redacted global view)
- `developer_api_admin` — has `country_scope.all`

All other roles: NO `country_scope.all` by default. Granted ad-hoc via `role_permission` override (e.g., a CFO who isn't Super Admin but needs all-country financial visibility).

**When user has `country_scope.all`:**
- API/UI applies no country filter beyond the active country selector
- Audit log records `cross_country_action` events when multi-country queries/exports are run
- Top-bar selector shows all active countries + "All Countries" option

**When user does NOT have `country_scope.all`:**
- API rejects requests for countries not in `user_country_access`
- Top-bar selector shows only allowed countries; no "All Countries" option
- Cross-country reports/exports return 403

---

## E. Country denormalization rule

**Every leaf-level country-scoped table includes `country_id` (or `country_id_snapshot` for immutable historical records) directly** — even when it could be inferred via JOIN. (D-CSP-004 🟢 Answered; consistent with D-COUNTRY-014.)

### Why direct column over JOIN inference

| Tradeoff | Direct column | JOIN inference |
|---|---|---|
| RLS policy complexity | Simple `country_id::text = ANY(...)` | Complex JOIN inside policy — Postgres RLS struggles with non-LEAKPROOF JOINs |
| Index efficiency | Composite `(country_id, ...)` index lights up | Forces planner to JOIN through unrelated tables |
| Read performance | One row → one column check | One row → potentially N joins |
| Storage cost | 16 bytes uuid per row | Saved |
| Drift risk | Mitigated by CHECK constraint or trigger asserting parent country match | None |

Drift mitigation: every country-scoped table with a denormalized `country_id` gets a CHECK constraint or insert/update trigger asserting the local `country_id` matches the parent's `country_id`.

### Tables that need `country_id` added Phase 1 (per D-CSP-004)

| Table | Column to add | Type | Notes |
|---|---|---|---|
| `audit_log` | `entity_country_id` | uuid NULL | NULL for global entities; non-NULL for country-scoped |
| `order_line` | `country_id_snapshot` | uuid | snapshot at order creation; immutable |
| `order_event` | `country_id_snapshot` | uuid | |
| `cart_line` | `country_id` | uuid | drift-checked against parent cart |
| `cart_event` | `country_id` | uuid | |
| `payment_transaction` | `country_id_snapshot` | uuid | |
| `refund` | `country_id_snapshot` | uuid | |
| `recommendation_warning_log` | `country_id` | uuid | |

Tables that ALREADY have `country_id` directly: `country`, `customer_orders`, `customer_orders.country_id`, `customer.country_id`, `warehouse.country_id`, `variant_country_price.country_id`, `variant_country_cost.country_id`, `shipping_provider.country_id`, `shipping_method.country_id`, `shipping_rate_card.country_id`, `shipping_zone.country_id`, `shipping_rule.country_id`, `landing_page.country_id`, `coupon.country_id`, `campaign.country_id`, `marketer.country_id`, `alert.country_id`, `conversation.country_id`, `customer_review.country_id`.

---

## F. Page classification rule (`country_scope_mode`)

**Every admin route declares one of three modes** (D-CSP-002 🟢 Answered, 🛑 Phase 1 blocker):

| Mode | Definition |
|---|---|
| `scoped` | Page is filtered by selected country; data displayed is restricted to active country |
| `aware` | Page is global master data, but shows country-specific columns / context for selected country |
| `global` | Page is not affected by the country selector |

**CI grep test enforces declaration** on every admin route file. New admin route file without `country_scope_mode` declaration fails CI.

### Country-scoped pages (mode = `scoped`)

| Page | Module | Filter |
|---|---|---|
| Dashboard Metrics | 18 | per-country KPIs |
| Orders | 6 | `customer_orders.country_id` |
| Customers | 5 | `customer.country_id` |
| Warehouses | 4 | `warehouse.country_id` |
| Warehouse Stock | 4 | inferred via warehouse |
| Country Pricing & Availability | 3 | `variant_country_price.country_id` |
| Shipping Providers | 16-ext | `shipping_provider.country_id` |
| Shipping Methods | 16-ext | `shipping_method.country_id` |
| Shipping Rate Cards | 16-ext | `shipping_rate_card.country_id` |
| Shipping Rules | 16-ext | `shipping_rule.country_id` |
| Payment Methods | 7 | per-country activation |
| WhatsApp Numbers | 9/10 | `country.whatsapp_number` |
| WhatsApp Templates | 10 | per-country approved |
| Auto Replies | 9 | `country.auto_reply_profile_id` |
| Landing Pages | 13 | `landing_page.country_id` |
| Coupons | 12 | `coupon.country_id` |
| Campaigns | 12 | `campaign.country_id` |
| Marketers | 11 | `marketer.country_id` |
| Reports | 18 | rows have `country_id` filter |
| Alerts | 23 | `alert.country_id` |
| Customer Messaging | 10 | per-country broadcast |
| Conversations | 8 | `conversation.country_id` |
| Warranty / Service Tickets | 16 | linked to order → country |
| Override Requests | 20 | (when tied to country-specific entity) |
| Approvals | 19 | (when tied to country-specific entity) |

### Country-aware pages (mode = `aware`)

| Page | Master data scope | Country-aware overlay |
|---|---|---|
| Products | global `product` row | KSA active / price / stock / landing readiness / shipping readiness / AI readiness |
| Categories | global `category` row | per-country activation badge |
| Product Specifications | global | certificate jurisdictions per country |
| Product Media | global library | per-country usage rollup |
| Product Videos | global | same |
| Product SEO Templates | global | per-country slug + meta variant |
| AI Knowledge Base | global | per-country tone + locale |
| Decision Engine | global rules | per-country rate-card + stock inputs |
| Safety & Compliance content | global `safety_guideline` + `safety_claim` | `safety_claim.jurisdictions[]` filters per-country |

### Global-only pages (mode = `global`)

| Page | Why global |
|---|---|
| Users | global identity |
| Roles | global definition |
| Permissions | global slugs |
| Global Security Settings | system-level |
| Backups | system-level |
| Restore Jobs | system-level |
| API Global Settings | system-level |
| Webhook Endpoints | system-level |
| System Health | system-level |
| Audit Log (global view) | global; optional country filter |
| Integration Settings | system-level |
| Secrets documentation references | references 1Password |
| Deployment settings | system-level |
| Global feature flags (unless country-scoped) | system-level |
| Country Compliance Profiles | meta-level (managing country profiles) |
| Performance Budgets | global thresholds |
| Promotion Checklist | system-level |
| Data Maintenance / Cleanup | system-level |

---

## G. API convention — `X-Country-Context` header

Frontend sends `X-Country-Context: <country_code>` on every request. Backend validates per endpoint class.

### Endpoint behavior matrix

| Endpoint class | Header missing | Header value not in user's allowed countries | Header = `all` and user lacks `country_scope.all` |
|---|---|---|---|
| `scoped` | 400 (Bad Request) | 403 + audit log entry `denied_cross_country_access_attempt` | 403 + audit |
| `aware` | Use user's default country (or first allowed) | 403 + audit | 403 + audit |
| `global` | Header ignored | Header ignored | Header ignored |

**Backend MUST NOT rely on UI hiding alone.** Every country-scoped endpoint independently validates the header against `user_country_access` (or `country_scope.all` permission). Defense in depth with RLS at DB layer.

Full spec in `02-api/01-conventions.md` (extended this turn).

---

## H.0 Permission cache layer (🟢 D-CACHE-001 locked 2026-05-09)

### Architecture

**Session-level Redis-backed permission cache.** On login (or session creation), the application computes the user's effective permissions and caches them in Redis under a session-scoped key. Subsequent requests within the session read from cache; cache miss falls back to DB query.

```
Login event
    ↓
Compute effective permissions:
  - role permissions (from role_permission)
  - ad-hoc permission grants (from user_permission overrides if any)
  - country access (from user.country_scope cache jsonb,
                   itself synced from user_country_access via trigger)
  - country_scope.all flag (presence/absence of permission slug)
  - field permissions (cost.read / marketer_cost.read / cost.export)
    ↓
Serialize to compact form (bitmap, jsonb, or compressed)
    ↓
Cache in Redis:
  key:    permcache:user:{user_id}:session:{session_id}
  value:  serialized permission set + cached_at + ttl
  ttl:    session length (or shorter; recommend ≤60 minutes)
    ↓
Set HTTP session cookie / token references this session_id
```

### Hard rules (locked 2026-05-09)

1. **Cache MUST NOT replace database RLS.** RLS remains the final enforcement layer at the DB. The cache is an application-layer optimization for permission checks, not a substitute for database-level access control.
2. **Cache TTL = session length or shorter.** Recommendation: 60 minutes max. Re-validation on session refresh.
3. **Cache MUST be invalidated on:**
   - Role change (admin reassigns user's role)
   - Permission change (`role_permission` row added/removed)
   - `user_country_access` grant / revoke / modification
   - `country_scope.all` permission grant / revoke
   - User deactivation
   - Session logout (cache key deleted explicitly)
   - Time-limited grant expiry (`user_country_access.expires_at < now()`)
4. **Cache MUST NEVER cache secrets** (API tokens, payment credentials, webhook signing keys, 1Password references). Permission cache contains only permission slugs + scope flags + role labels — no credential values.
5. **Cache MUST NOT expose cost fields without `cost.read` / `cost.export`.** The cache stores whether the user *has* the slug, not the actual cost values. Cost values come from DB queries that go through RLS.
6. **Backend MUST re-check sensitive actions server-side.** For high-stakes operations (cost reads, override approvals, restore.production, country_scope.all grants, sensitive_cleanup_override execution), the application performs an explicit fresh DB-backed permission check + RLS check, not just the cache. Cache may be stale; sensitive actions cannot tolerate staleness.
7. **Denied access attempts MUST still be audit logged** regardless of cache state. The cache hit/miss does not affect audit instrumentation.
8. **Cache invalidation events fire as Redis pub/sub messages.** Subscribers in each app instance flush the affected user's cache key within 60 seconds (Phase 1 acceptance test bound).

### Invalidation event matrix

| Trigger | Cache key affected | Method |
|---|---|---|
| `role_permission` table change | All sessions of users with the affected role | Pub/sub broadcast `permcache:invalidate:role:{role_id}` → all instances flush |
| `user.role_id` change for a specific user | All sessions of that user | Pub/sub `permcache:invalidate:user:{user_id}` |
| `user_country_access` insert/update/revoke | All sessions of the affected user | Trigger on the table → emit pub/sub |
| `country_scope.all` slug grant/revoke | All sessions of the affected user | Pub/sub |
| User deactivation (`user.active = false`) | All sessions of that user; new sessions blocked | Trigger on `user.active` change |
| Session logout | The specific session cache key only | Application code on logout |
| Manual flush by Super Admin | Any user, any session | Admin endpoint `/admin/system/users/:id/flush-permcache` |

### Phase 1 deliverables

- [x] Architecture spec (this section)
- Phase 1 sprint 1: implement Redis cache key structure + serialization
- Phase 1 sprint 1: wire pub/sub invalidation event handlers
- Phase 1 sprint 1: cache-fallback fast path on cache miss
- Phase 1 sprint 2: integration tests for all 7 invalidation triggers
- Phase 1 sprint 4: cache invalidation timing test (revoke access; verify next request from user fails within 60 seconds)

### Reference architecture: defense-in-depth layers

```
Request arrives
    ↓
1. Authentication middleware (JWT / session token)
    ↓
2. Permission cache lookup (Redis)              ← Layer added by D-CACHE-001
   ↓ cache hit: fast path
   ↓ cache miss: fall back to DB query → cache result
    ↓
3. Application-layer permission check (slug + scope)
    ↓
4. Sensitive-action re-check (DB query, no cache) ← Required for high-stakes ops
    ↓
5. RLS at DB layer (final enforcement, never bypassed)
    ↓
6. Field-level permission check (cost / marketer_cost / cost.export)
    ↓
Response (with audit_log entry on denial)
```

The cache (Layer 2) optimizes Layer 3. Layer 5 (RLS) remains authoritative regardless of cache state.

---

## H. RLS strategy

### Session variable contract

On every authenticated request:

```sql
SET LOCAL app.current_user_id = '<uuid>';
SET LOCAL app.current_user_role = '<role>';
SET LOCAL app.current_user_country_scope = 'sa,eg';   -- comma-separated; from cache
SET LOCAL app.current_user_has_country_scope_all = 'true';  -- when user has slug
SET LOCAL app.current_user_warehouse_scope = '<uuid>,<uuid>';
SET LOCAL app.current_marketer_id = '<uuid>';         -- only for external_marketer
```

### Country-scope RLS policy template

For every country-scoped table (per D-CSP-004 list):

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY country_scope_access ON <table>
  FOR SELECT
  USING (
    -- All-countries permission shortcut
    current_setting('app.current_user_has_country_scope_all', true) = 'true'
    OR
    -- Specific country in user's scope
    country_id::text = ANY(
      string_to_array(current_setting('app.current_user_country_scope', true), ',')
    )
  );

-- Per-action policies (write/delete) follow same pattern
CREATE POLICY country_scope_write ON <table>
  FOR INSERT, UPDATE, DELETE
  USING (
    current_setting('app.current_user_has_country_scope_all', true) = 'true'
    OR
    country_id::text = ANY(
      string_to_array(current_setting('app.current_user_country_scope', true), ',')
    )
  );
```

For tables using `country_id_snapshot` (immutable history), the same policy applies on the snapshot column.

CI test asserts every country-scoped table has a matching country-scope policy. See `01-database/03-rls-policies.md` (extended this turn) for the full template.

---

## I. Admin UX — Country Context Switcher

### Top-bar widget

```
┌──────────────────────────────────────────────────────┐
│  [Logo]   Country Context: [Saudi Arabia ▼]   [User] │
└──────────────────────────────────────────────────────┘
                       ▼ (when clicked)
                       ┌────────────────┐
                       │ Saudi Arabia ✓ │
                       │ Egypt          │  (only if user has access)
                       │ Iraq           │  (only if user has access)
                       │ ─────────────  │
                       │ All Countries  │  (only if country_scope.all)
                       └────────────────┘
```

### Behavior matrix

| User country access | Top-bar appearance | Default selection |
|---|---|---|
| 1 country only (no `country_scope.all`) | Fixed label showing the country (no dropdown) | The single country |
| 2+ specific countries (no `country_scope.all`) | Dropdown with allowed countries only | Last-selected (cookie); first allowed if no cookie |
| `country_scope.all` | Dropdown with all active countries + "All Countries" | "All Countries" (user may pin) |

### Per-page badges

| Page mode | Badge |
|---|---|
| `scoped` | "You are editing Saudi Arabia data only." (large yellow strip at top) |
| `aware` | "Showing Saudi Arabia context for global product VTC-TEL-OS-4.4M" |
| `global` | (no badge — country selector visually grayed out / disabled tooltip) |
| `all` selected | "Viewing data across ALL countries — handle with care" (red/orange strip) |

### Cart/draft persistence on country switch

On unsaved changes when switching country: confirmation modal "Discard unsaved <old country> changes and switch to <new country>?" On confirm: navigate to equivalent page for new country (or list view if no equivalent). On cancel: stay; selector reverts.

Full state machine in `11-admin-ui/05-states.md` (extended this turn).

---

## J. Audit + alert events

### Audit log events

| Event | Severity | Notes |
|---|---|---|
| `user_country_access.granted` | Medium | actor, target user, country, access_level, expires_at |
| `user_country_access.revoked` | Medium | actor, target user, country, reason |
| `user_country_access.modified` | Medium | access_level change |
| `country_scope.all.granted` | **High** | granting all-countries access to a user |
| `country_scope.all.revoked` | High | |
| `cross_country_export` | High | every cross-country export with reason |
| `cross_country_report_run` | Medium | every cross-country report execution |
| `denied_cross_country_access_attempt` | **High** | attempted country not in user's scope; record endpoint + attempted country_id |
| `country_scoped_sensitive_data_edit` | High | edits to per-country pricing, cost, payment config |

### New alert sub-category under existing `business`

| Alert | Severity |
|---|---|
| User accumulates >5 `denied_cross_country_access_attempt` events in 24h | High |
| `country_scope.all` granted to a new user | High (notify Security Lead) |
| Cross-country export > 10,000 rows | Medium |

Integrates with the 8-category alert system from D-PERF-001.

---

## K. Phase placement

| Phase | Work |
|---|---|
| **Phase 1** | Schema reservations: `user_country_access` table; `country_scope.all` slug; `audit_log.entity_country_id`; `country_id_snapshot` columns on order_line / order_event / cart_line / cart_event / payment_transaction / refund / recommendation_warning_log; cache-sync trigger; RLS policy template applied; `X-Country-Context` header convention live; admin top-bar selector scaffold (read-only — uses cached jsonb); CI grep tests for `country_scope_mode` declaration on every admin route. |
| Phase 2 | Checkout + order list functional country filter |
| Phase 4 | WhatsApp + Customer Messaging country-scoped (broadcasts, conversation list, templates) |
| Phase 5 | Marketer scope (`marketer.country_id` enforced; payouts country-filtered) |
| Phase 6 | Landing page + Decision Engine respect country selector; cross-country reports gated by `report.cross_country.read`; `user_country_access` admin grants/revocations UI |
| Phase 7 | Payment + COD reconciliation country-filtered |
| Phase 8 | EG + IQ activation: extend `user_country_access` rows; selector starts showing all 3 active countries for users who have access |
| Phase 9 | Operations / warranty / service tickets country-scoped |
| Phase 10 | Cross-country drift detection alert; country-scope analytics dashboard ("which roles have access to which countries"); time-limited grant-expiry automation worker |

---

## L. Existing scopes preserved

This document does not replace prior scope decisions. The following remain in effect unchanged:

### Country scope (existing)

`user.country_scope` jsonb is preserved as the **denormalized cache** (kept in sync with `user_country_access` via trigger). Existing roles classified for country-scope-possibility per `01-roles.md` remain authoritative.

### Warehouse scope (existing)

`user.warehouse_ids` jsonb (per `warehouse_manager`, `warehouse_staff`). Independent of country scope; AND-composes with country scope.

### Marketer scope (existing)

`external_marketer.marketer_id` ties session strictly to one marketer. **Country scope for external marketers comes from `marketer.country_id` — NOT from `user_country_access`.** Documented as the explicit exception.

### Cost privacy (existing — D-RBAC-001)

`cost.read` / `marketer_cost.read` / `cost.export` field permissions remain in force regardless of country scope. A country-scoped user with `cost.read` sees costs only for their allowed countries; a country-scoped user without `cost.read` sees no costs anywhere.

### Combining scopes

Country + warehouse + cost + role permissions all AND-compose. Filters layer on top of each other; no scope overrides another.

---

## TODO

- TODO: confirm `country_scope.all` default-grant set (currently: super_admin, finance_admin, read_only_auditor, developer_api_admin) with Security Lead.
- TODO: lock `user_country_access.access_level` semantics (currently `'read' | 'write' | 'manage'`); confirm whether `manage` implies all `*.update` permissions for that country or is purely a label.
- TODO: confirm Country Manager role enforcement at user-creation time (recommendation: block role assignment when no `user_country_access` rows exist).
- TODO: confirm time-limited grant expiry job cadence (recommendation: hourly background job marks `active=false` when `expires_at < now()`).
- TODO: confirm cache TTL for `user.country_scope` jsonb (recommendation: 60 seconds).
- TODO: write the cache-sync trigger function (lands Phase 1 sprint 2).
- TODO: confirm whether `audit_log.entity_country_id` is mandatory (NOT NULL) for country-scoped entity types — recommendation: enforce via insert trigger that derives from entity FK.

---

## References

- `03-rbac/01-roles.md` (per-role default country access)
- `03-rbac/02-permissions.md` (6 new slugs added 2026-05-09)
- `01-database/02-tables-by-module.md` (Module 19 user_country_access spec; cross-cutting `country_id` columns)
- `01-database/03-rls-policies.md` (country-scope RLS policy template)
- `02-api/01-conventions.md` (`X-Country-Context` header)
- `11-admin-ui/01-information-architecture.md` (top-bar widget; page classification)
- `11-admin-ui/05-states.md` (country context badge states)
- `27-readiness-engine/01-unified-readiness.md` (country-access readiness checks)
- `04-ai/05-guardrails.md` (cross-country mixing rules)
- `06-whatsapp/03-numbers.md` (per-country WhatsApp number isolation)
- `07-reporting/06-report-builder.md` (cross-country permission gate)
- D-RBAC-001 (cost privacy — preserved)
- D-COUNTRY-014 (dynamic country / no hardcoded fields — preserved)
- D-DB-010 (4-class deletion policy — `user_country_access` is Class 1)
