# Roles

**Status:** Draft
**Owner:** Security lead
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §21

---

## Roles inventory (22 total)

| # | Role | Internal/External | Description | Country scope possible? |
|---|---|---|---|---|
| 1 | `super_admin` | Internal | Highest authority; full access incl. cost; can modify any setting | No (always global) |
| 2 | `admin` | Internal | Operational admin; cannot read actual cost | Yes |
| 3 | `finance_admin` | Internal | Sees actual cost, profit reports, payouts, refunds | No (always global) |
| 4 | `country_manager` | Internal | All entities scoped to assigned country; no actual cost | **Required** |
| 5 | `product_manager` | Internal | Catalog edits, translations, variants, media; no cost | Optional |
| 6 | `inventory_manager` | Internal | Stock, transfers, reorder | Yes |
| 7 | `warehouse_manager` | Internal | Single-warehouse stock + Mobile admin | Tied to warehouse |
| 8 | `marketing_manager` | Internal | Marketers, campaigns, coupons, marketer cost (read), pixels | Yes |
| 9 | `marketer_manager` | Internal | Marketer onboarding, tier mgmt, payouts approval | Yes |
| 10 | `sales_manager` | Internal | Sales pipeline, conversations, B2B | Yes |
| 11 | `sales_agent` | Internal | Conversations, draft/orders, customers | Yes |
| 12 | `customer_support_agent` | Internal | Conversations, customer profiles, returns, refund requests | Yes |
| 13 | `ai_supervisor` | Internal | AI prompts, templates, intents, playground, AI logs | Yes |
| 14 | `content_seo_editor` | Internal | Content, SEO, guides, FAQ, reviews moderation, group pages | Yes |
| 15 | `media_manager` | Internal | Media library, manifest, uploads | No |
| 16 | `b2b_sales_agent` | Internal | B2B accounts, quotes, RFQs | Yes |
| 17 | `maintenance_service_agent` | Internal | Service tickets, warranty claims, repairs | Yes |
| 18 | `warehouse_staff` | Internal | Picking, packing, dispatch | Tied to warehouse |
| 19 | `shipping_coordinator` | Internal | Courier coordination, delivery failures | Yes |
| 20 | `read_only_auditor` | Internal | Read access to logs (cost redacted) | No |
| 21 | `developer_api_admin` | Internal | API tokens, webhooks, integrations; **never** cost | No |
| 22 | `external_marketer` | External | Own dashboard only; sees own marketer_cost rows | Tied to marketer |

---

## Role assignment rules

- A user has exactly one **primary role**.
- `country_scope` is a JSONB column on `user` — array of country codes. Null = global. Roles requiring scope reject null. **🟢 D-CSP-001 locked 2026-05-09:** `user.country_scope` is now a **denormalized cache** kept in sync via trigger from the canonical `user_country_access` table (per `03-rbac/03-scopes.md` §C). The jsonb cache remains the read source for session vars + RLS; the table is the audit-friendly source of truth for grants/revocations.
- Multi-warehouse roles (`warehouse_manager`, `warehouse_staff`) tied via `user.warehouse_ids` jsonb.
- External marketers authenticate via separate auth path; never granted internal role. **External marketer country scope comes from `marketer.country_id`, NOT from `user_country_access`** (documented exception per D-CSP-001).

## Default `country_scope.all` permission grants (🟢 D-CSP-003 locked 2026-05-09)

These roles have the `country_scope.all` permission slug baked into the migration 0002 `role_permission` seed:

| Role | Has `country_scope.all` | Why |
|---|---|---|
| `super_admin` | ✅ | Highest authority; full access |
| `finance_admin` | ✅ | Cross-country financial visibility required |
| `read_only_auditor` | ✅ | Cost-redacted global audit view |
| `developer_api_admin` | ✅ | API token + integration system-level visibility |
| All other 18 roles | ❌ | Default to country-scoped via `user_country_access` |

Other roles can be granted `country_scope.all` ad-hoc via `role_permission` override (audit-logged High severity per `03-rbac/03-scopes.md` §J).

**Country Manager role enforcement:** A user assigned the `country_manager` role MUST have at least one active `user_country_access` row. Backend rejects role assignment if no scope exists.

## Mobile admin access

Roles with `mobile_admin.access` permission (per Master Plan v4 §1.3):
`country_manager`, `inventory_manager`, `warehouse_manager`, `marketing_manager`, `marketer_manager`, `sales_manager`, `sales_agent`, `customer_support_agent`, `ai_supervisor`, `maintenance_service_agent`.

## Cost access summary (🟢 D-RBAC-001 ANSWERED 2026-05-07)

| Role | Reads `actual_cost` | Reads `marketer_cost` |
|---|---|---|
| `super_admin` | ✅ | ✅ |
| `finance_admin` | ✅ | ✅ |
| `marketing_manager` | ❌ | ✅ |
| `marketer_manager` | ❌ | ✅ |
| `external_marketer` | ❌ | ✅ (own rows only) |
| `admin` · `country_manager` · `product_manager` · `inventory_manager` · `warehouse_manager` · `warehouse_staff` · `sales_manager` · `sales_agent` · `customer_support_agent` · `ai_supervisor` · `content_seo_editor` · `media_manager` · `b2b_sales_agent` · `maintenance_service_agent` · `shipping_coordinator` · `read_only_auditor` · `developer_api_admin` | ❌ | ❌ |

> **🟢 Locked 2026-05-07 (D-RBAC-001):** Only `super_admin` and `finance_admin` may read `actual_product_cost`. All 18+ other roles excluded. Defense in depth: RLS at DB layer · API serializer-strip · admin UI hide · `cost.export` scope required for cost-bearing exports · webhooks redact cost values for non-finance subscribers · audit log entries redacted for non-finance reads · Sentry/Grafana scrubs cost field names. See `04-cost-privacy.md` for full layer-by-layer specification.

## TODO

- TODO: confirm whether `internal_sales_agent` is a separate role or attribute on `sales_agent` (Master Plan v4 §16 Tiers).
- TODO: confirm `maintenance_service_agent` country scoping for warranty claims.
- TODO: define on-call rotation roles (or are they tags within existing roles?).
