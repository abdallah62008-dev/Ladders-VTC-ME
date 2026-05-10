# Phase 1 Acceptance Criteria — Must Have

**Status:** Draft (signed off when Phase 0 closes)
**Owner:** PM + CTO + QA
**Source:** Master Plan v4 §29; Phase 0 §22; Phase 0 Architecture Review 2026-05-09 (scope reduction per D-PHASE1-001)

> **🟢 Reduced scope locked 2026-05-09 (D-PHASE1-001 Answered).** This document contains only **Must Have** items required for Phase 1 sign-off. **Should Have** items moved to [`phase-1-should-have.md`](./phase-1-should-have.md). **Schema reservations + documentation-only items** moved to [`phase-1-schema-reservation-tracker.md`](./phase-1-schema-reservation-tracker.md). Items deferred to later phases are noted at the end.
>
> **No architectural decision was changed.** All locked decisions (D-DB-001/002/003/010, D-INFRA-004, D-COUNTRY-014, D-RBAC-001, D-PAY-002/003, D-BKP-001/002, D-INFRA-001, D-PERF-001, D-OPS-010, D-CSP-001/002/003/004, D-DEC-001, D-SAFE-001, D-TRUST-001, D-READY-001, D-OWN-001) remain in force. Acceptance items have been re-categorized only.
>
> **Approximate count:** ~117 Must Have items, down from 241 (51% reduction).

---

## Functional acceptance

### Locale + RTL/LTR
- [ ] All 6 locales reachable (`ar-sa`, `ar-eg`, `ar-iq`, `en-sa`, `en-eg`, `en-iq`); placeholder copy OK for non-KSA.
- [ ] `ar-sa` and `en-sa` fully functional on homepage / PLP / PDP.
- [ ] Visual regression suite green in **both directions** (RTL + LTR).
- [ ] Hreflang tags present on every page; passes Screaming Frog audit.
- [ ] Self-referential canonicals.

### Catalog admin
- [ ] Content team can add a new product end-to-end without engineering help.
- [ ] One full product live (translations, variants, images, video, certifications) in `ar-sa` + `en-sa`.

### Country / warehouse dynamism (🟢 D-COUNTRY-014 locked)
- [ ] **No hardcoded country strings** anywhere in app code (verified by grep). Forbidden field shapes: `price_sa`, `price_eg`, `price_iq`, `stock_sa`, `stock_eg`, `stock_iq`, or any `<word>_<country_code>` field.
- [ ] Adding a 4th country (e.g., UAE) requires **only data inserts** (no code changes, no migrations, no deploys).
- [ ] **Country Pricing & Availability matrix renders rows from `country` table live** — verified by adding a test country `xx`, marking active, and confirming a new row appears in the Product editor matrix without code change.
- [ ] Setting `country.active = false` makes its products disappear from storefront within 1 cache cycle.
- [ ] System → Countries admin: add, edit, activate, deactivate working.
- [ ] Operations → Warehouses admin: add, edit, view stock working.

### Warehouse Management core (🟢 D-COUNTRY-015 locked)
- [ ] Warehouse list shows `RUH-01` (Riyadh Main Warehouse) with full details — name, country, city, type, priority, contact, phone, notes, active status.
- [ ] Admin with `warehouse.create` can add a new warehouse for a draft country (e.g., `xx`); appears immediately, **no code change, no migration**.
- [ ] Admin with `warehouse.update` can edit non-readonly fields; each change writes an `audit_log` row with old/new diff.
- [ ] **`code` and `country_id` are read-only** in the edit form; server-side rejects tampering attempts.
- [ ] **Stock-safety check (Deactivate):** with hero SKU `qty_on_hand > 0` at RUH-01, attempting deactivate is blocked with a "Stock Safety Failure" modal. Server-side enforcement.
- [ ] All 8 warehouse permission slugs wired to roles per matrix in `03-rbac/02-permissions.md`.
- [ ] **Product → Country Pricing & Availability tab** functional with all per-country fields per spec.
- [ ] **Product → Warehouse Stock tab** functional with per-warehouse fields per spec.
- [ ] Editing `qty_on_hand` in admin creates a `stock_movement` row with type `count_adjustment`.
- [ ] Editing any pricing/stock field writes a `country_data_audit` row with old/new values, actor, IP/UA. Audit row is immutable.
- [ ] Cost columns hidden from non-finance roles in the Country Pricing matrix (server-side strip + UI hide).

### Profit floors (🟢 D-PAY-002 + D-PAY-003 locked)
- [ ] **Profit floor seeds:** `country.business_min_margin` = `0.2000` (KSA), `0.1800` (EG), `0.2200` (IQ); `profit_floor_rule` table seeded with 6 rows.
- [ ] **No-hardcoding test:** CI grep test fails any commit containing literal margin values inside guardrail-evaluation code paths.
- [ ] **Margin Settings admin functional** at `/admin/finance/profit-guardrails`; visible to Super Admin + Finance Admin only.
- [ ] **Edit floor — raise:** new `profit_floor_rule` row inserted; cache updated via trigger; `audit_log` row written; webhook emitted.
- [ ] **Edit floor — lower:** approval workflow OR Manual Override path tested.
- [ ] **Profit Guardrails reads live floor** at evaluation time (not in-memory constant).
- [ ] **Profit Guardrails uses correct cost basis:** business margin from `actual_product_cost`; marketer margin from `marketer_product_cost`. Verified by unit test.
- [ ] Profit Guardrails **soft warning** displayed on save when violated (computed margin + floor + delta).
- [ ] **`profit_guardrail_log`** row written on every save event.
- [ ] **Cost-redacted warning copy** for non-finance admin (delta only; no actual cost value).

### RLS / cost privacy (🟢 D-RBAC-001 locked)
- [ ] **RLS test matrix in CI** — for every non-finance role, a Postgres session returns **0 rows** on `SELECT actual_cost FROM variant_country_cost`.
- [ ] **Positive test:** `super_admin` and `finance_admin` sessions return all rows.
- [ ] **`marketer_cost.read` test:** `marketing_manager` + `marketer_manager` see all `variant_marketer_cost`; `external_marketer` sees own rows only; others get 0 rows.
- [ ] API serializers strip cost fields for any token without `cost.read` scope. Tested per endpoint.
- [ ] Admin UI Product editor → Country Pricing matrix → cost row hidden for non-finance roles (verified by Playwright per role).
- [ ] Cost-bearing exports require `cost.export` scope; non-permitted callers get 403.
- [ ] Webhook event `variant_country.cost_changed` payload redacts numeric value when subscriber lacks `cost.read`.
- [ ] CI grep test: no string `actual_cost` in non-finance code paths.

### Audit log
- [ ] Editing a price/cost/qty field writes a row to `country_data_audit` with correct old/new values.
- [ ] Audit row not deletable via UI or API.

### Schema naming convention (🟢 D-DB-001 locked)
- [ ] **Main orders table is `customer_orders`** (plural) — verified via `SELECT to_regclass('customer_orders') IS NOT NULL` + `SELECT to_regclass('order')` IS NULL.
- [ ] **No bare `order` table** — CI grep test rejects `CREATE TABLE order` patterns.
- [ ] **No quoted `"order"` references** in app code, queries, or migrations (CI grep).

### UUID generation strategy (🟢 D-DB-002 locked)
- [ ] **`pgcrypto` extension enabled** in migration 0001; **`uuid-ossp` NOT enabled.**
- [ ] **All UUID PK columns default to `gen_random_uuid()`** (verified via `information_schema.columns`).
- [ ] **CI grep test rejects `uuid_generate_v4`** + `uuid-ossp` references.

### Monetary precision (🟢 D-DB-003 locked)
- [ ] **All monetary columns declared `numeric(12,2)`** (verified via `information_schema.columns`).
- [ ] **No `float` / `double precision` / `real` / `money` on monetary columns** — CI grep + schema dump check.
- [ ] **Margin / rate columns use `numeric(5,4)`** (distinct from money).

### Deletion policy (🟢 D-DB-010 locked)
- [ ] **Class 1 — Soft-delete** columns added on financial/legal tables (`customer_orders`, `customer`, `b2b_account`, `invoice`, `refund`, `payment_transaction`, `warranty_claim`, `service_ticket`, `product_batch`, `stock_movement`, `marketer_payout`, `approval`, `override_request`).
- [ ] **Class 2 — Never hard delete** — `audit_log`, `country_data_audit`, `cost_history`, `variant_country_cost`, `variant_marketer_cost`, `order_profit_snapshot`, `payment_log`, `safety_incident_report` have NO `deleted_at`.
- [ ] **CI grep test rejects DELETE on Class 2 tables** (except `sensitive_cleanup_override` path).
- [ ] **Sensitive cleanup override** requires pre-cleanup auto-backup (mandatory).

### Schema migrations (🟢 D-INFRA-004 locked)
- [ ] All Phase 1 migrations (0001–0013 per `01-database/05-migration-plan.md`) authored as `node-pg-migrate` files in `/migrations/sql/`.
- [ ] Every migration file includes a rollback (down) section, OR explicit `-- DOWN INTENTIONALLY EMPTY` comment.
- [ ] CI runs `pnpm db:migrate up` on a fresh test database before unit + integration tests.
- [ ] CI runs the RLS test suite after migrations; cost-privacy tests pass per D-RBAC-001.
- [ ] CI fails any migration that adds literal margin values, hardcoded country strings, or misses audit triggers on cost-bearing columns.
- [ ] PR template (per `99-templates/pr-template.md`) blocks merge until reviewer confirms migration review checklist.

### Backup (🟢 D-BKP-002 locked)
- [ ] Daily Postgres backup runs automatically and lands in **Cloudflare R2** primary bucket.
- [ ] Weekly archive replicated to **Backblaze B2** offsite bucket via scheduled BullMQ worker.
- [ ] Checksum (SHA-256) recorded per backup; verification restore-test passes at least once during Phase 1.
- [ ] Backup payloads encrypted at rest with AES-256; key sourced from 1Password vault.

### Secrets management (🟢 D-BKP-001 locked)
- [ ] All 7 1Password vaults exist with documented access policies.
- [ ] Hardware-key (YubiKey) MFA mandatory on Super Admin + Finance Admin + Security Lead 1Password accounts.
- [ ] Application reads secrets at runtime via `op` CLI; **no plaintext secrets in code, env files, or container images**.
- [ ] No `.env` file in repo (only `.env.example` with placeholders); `.gitignore` blocks all env-file patterns.

### Country Access Control core (🟢 D-CSP-001/002/003/004 locked)
- [ ] **`user_country_access` table reserved** as Phase 1 skeleton with full column spec.
- [ ] **`country_scope.all` permission slug** exists in `role_permission` seed; default grants for super_admin, finance_admin, read_only_auditor, developer_api_admin verified.
- [ ] **CI grep test active** rejecting any new admin route file without `country_scope_mode: 'scoped' | 'aware' | 'global'` declaration.
- [ ] **`X-Country-Context` header convention documented** in `02-api/01-conventions.md`; integration test: country-scoped endpoint without header → 400; with disallowed country → 403 + audit log.
- [ ] **Country-scope RLS policy applied** to every country-scoped table per `01-database/03-rls-policies.md` template.
- [ ] **CI test asserts** every country-scoped table has a matching country-scope RLS policy.
- [ ] **Country Context Switcher widget** scaffolded in admin top-bar (read-only — uses cached jsonb).

### Permission cache layer (🟢 D-CACHE-001 locked 2026-05-09)
- [ ] **Session-level Redis cache implemented** per `03-rbac/03-scopes.md` §H.0 architecture spec.
- [ ] **Cache key structure** uses `permcache:user:{user_id}:session:{session_id}` pattern.
- [ ] **Cache TTL** ≤ session length (recommend ≤60 minutes).
- [ ] **All 7 invalidation triggers wired** (role change / permission change / user_country_access change / country_scope.all change / user deactivation / session logout / time-limited grant expiry).
- [ ] **Pub/sub invalidation events** flush affected cache keys within 60s across all app instances.
- [ ] **Cache miss fallback** queries DB and re-caches result.
- [ ] **Cache MUST NOT contain secrets** — verified by integration test inspecting cache value structure.
- [ ] **Cache MUST NOT contain cost values** — verified by integration test (cache only stores permission slugs + scope flags).
- [ ] **Sensitive action re-check** (cost reads / override approvals / `restore.production` / `country_scope.all` grants / `sensitive_cleanup_override` execution) bypasses cache and queries DB directly. Verified by code-path inspection.
- [ ] **Denied access attempts audit-logged** regardless of cache state — verified by integration test forcing a cache hit on a denied permission.
- [ ] **RLS still enforces** at DB layer regardless of cache hit/miss — verified by deliberately corrupting cache (admin flush) and confirming RLS still rejects unauthorized access.

### WhatsApp
- [ ] PDP "Order Now" button generates correctly templated message linking to KSA WhatsApp number.

### Inventory authority (🟢 D-COUNTRY-013 locked 2026-05-09)
- [ ] **Admin Dashboard is the Phase 1 inventory source of truth.** All warehouse stock, product-country availability, stock adjustments, and stock reservations managed via Operations / Warehouses + Stock admin surface (per `11-admin-ui/01-information-architecture.md`).
- [ ] **No external ERP integration in Phase 1.** Verified by CI grep test rejecting ERP-provider hardcoding (e.g., `'odoo'`, `'netsuite'`, `'sap'`, `'oracle'`, `'dynamics'`) in any stock-decision code path. Allow-list: documentation, future-phase planning notes.
- [ ] **`stock_movement` rows written on every stock change** with type (`count_adjustment` / `inbound` / `outbound` / `damaged` / `returned` / `transfer_in` / `transfer_out`); verified by integration test editing `qty_on_hand` and asserting movement row.
- [ ] **`country_data_audit` rows written on stock adjustments** with old/new values, actor, IP/UA. Audit row immutable.
- [ ] **Manual stock adjustment requires reason** (≥10 chars baseline) — admin UI form rejects empty-reason submission; backend rejects API call without reason.
- [ ] **Stock reservation handled inside platform** — `stock_reservation` rows write on cart confirmation (Phase 2 ship); Phase 1 reserves the schema. No ERP dependency in reservation flow.
- [ ] **Inventory updates respect Country Access Control** — operators with country-scoped access can only adjust stock for warehouses in their assigned countries; verified via Playwright test logging in as `inventory_manager` scoped to KSA and asserting Egypt warehouses are inaccessible.
- [ ] **n8n / WhatsApp workflows read platform inventory** (when ship later phases) — documented in `06-whatsapp/` + future automation docs. Phase 1 documentation note exists.

### Privacy ownership (🟢 D-LAUNCH-013 locked 2026-05-09)
- [ ] **Internal DPO designation recorded** with named individual + email + start date. Either Legal Lead OR Operations Director (interim with privacy training).
- [ ] **DPO involved in customer schema sign-off** for migration 0007 (customer module) before any production data is collected.
- [ ] **DPO documented as approver** in the consent management workflow (per `17-compliance/consent-records.md`) and in customer data export workflow (per `09-import-export/01-supported-entities.md` `customer.export`).
- [ ] **PDPL compliance documents reviewed** by DPO: `17-compliance/ksa-pdpl.md`, `17-compliance/egyptian-pdpl.md`, `17-compliance/iraqi-data-laws.md`, `17-compliance/consent-records.md`.

### Build Now, Activate When Ready (🟢 D-READY-002 locked 2026-05-09)
- [ ] **Foundation modules display status badge + readiness indicator** in admin list views: `country` (launch_status), `product` (per-country readiness), `warehouse` (active/inactive/archived), `variant_country_price` (active flag), `variant_warehouse_stock` (active flag). Verified by Playwright test that badges render with correct color coding.
- [ ] **Activation buttons disabled when readiness fails.** Tooltip on hover shows the specific unmet requirement(s). Verified by integration test creating an entity with incomplete readiness and asserting the activation button is disabled + reason text matches the failing check.
- [ ] **Backend rejects customer-facing queries returning `status != 'active'` rows** for foundation modules (country / product / variant_country_price / variant_warehouse_stock). Verified by integration test attempting to surface inactive entity to storefront and asserting empty result + audit log entry.
- [ ] **No automatic activation after data entry** — activation is always an explicit operator action via permission slug (`country.activate`, `warehouse.create/update`, `landing_page.publish`, etc.). Verified by integration test that creates a complete entity and confirms it remains in `pending_*` / `ready` until manual activation.
- [ ] **Activation actions audit-logged** with actor, prior status, new status, reason, override_request_id (if applicable). Verified by integration test that activates an entity and asserts audit_log row.

---

## Performance

- [ ] Lighthouse mobile ≥ 90 on PDP.
- [ ] LCP < 2s on 4G (real device test).
- [ ] CLS < 0.05.
- [ ] INP < 200ms.

### Performance budget enforcement (🟢 D-PERF-001 locked)
- [ ] **Performance budgets enforced via CI** — every PR running a Lighthouse + page-weight check; CI fails any page exceeding its class budget.
- [ ] **Class budgets configured in CI:** PDP ≤1.8 MB / Lighthouse mobile ≥90 (Phase 1 active gate). Other class budgets defined for later phases.
- [ ] **Override path documented** — exceeding budget requires `performance_budget_override`.
- [ ] **Real-User Monitoring (RUM)** captures p75 Lighthouse + LCP/INP/CLS per country per route.

### Image variant pipeline (🟢 D-PERF-001 §B.2)
- [ ] **6 required image variants** documented and configured: Hero Desktop 1920×1080, Hero Mobile 768×1024, Product Card 600×600, Thumbnail 200×200, OpenGraph 1200×630, WhatsApp preview 800×800.
- [ ] **AVIF + WebP + JPG fallback ladder** generated for every uploaded asset; verified for hero SKU `VTC-TEL-OS-4.4M`.
- [ ] **Sharp / squoosh-cli build-time pipeline** wired in CI; Cloudflare Image Resizing handles runtime variants.

---

## Security

- [ ] Pen-test on cost-leakage paths conducted; zero leaks found.
- [ ] No secrets in git, in backups, in logs.
- [ ] HTTPS everywhere; HSTS headers.

---

## Operational

- [ ] CI pipeline running: lint + type check + unit tests + RLS tests + visual regression + Lighthouse.
- [ ] Staging deployment automated.
- [ ] Production deployment manual (Phase 1 not yet public).
- [ ] Sentry capturing errors.
- [ ] Grafana dashboards initial set live.

### Engineering tooling (🟢 D-INFRA-006/007/008/009/010 locked 2026-05-09)
- [ ] **pnpm** is the standard package manager; `pnpm-lock.yaml` committed; CI uses `pnpm install --frozen-lockfile`; no `package-lock.json` or `yarn.lock` in repo (CI grep test enforces).
- [ ] **ESLint + Prettier** wired into CI; `pnpm lint` and `pnpm format:check` fail the build on errors; configuration covers TypeScript + React + Next.js + Tailwind + accessibility + import rules.
- [ ] **Vitest** runs unit + integration tests; **Playwright** runs E2E + browser tests; both layers run in CI; CI fails if any test fails.
- [ ] **Playwright snapshots** committed to repo; CI fails on unexpected visual changes; Chromatic/Percy NOT introduced.
- [ ] **Lighthouse CI thresholds enforced** on Phase 1 representative pages:
  - Customer-facing: homepage / PLP / PDP — mobile ≥ 90 / desktop ≥ 95
  - Admin: dashboard / products / country pricing/stock / warehouses — mobile ≥ 85 / desktop ≥ 90
  - CWV: LCP < 2.0s; INP < 200ms; CLS < 0.05
- [ ] **Threshold violation override path** exists via `performance_budget_override` (reason ≥30 chars + 14d expiry + audit log + mandatory remediation plan).

---

## Documentation

- [ ] All Phase 0 documentation reviewed and stamped "approved" where applicable.
- [ ] Runbooks drafted for backup/restore, incident response.
- [ ] Onboarding docs sufficient for a new engineer to clone, install, run dev server.

---

## Stakeholder sign-off

- [ ] CTO sign-off
- [ ] Finance Director sign-off (cost privacy)
- [ ] Ops Director sign-off (warehouse / WhatsApp)
- [ ] Security lead sign-off (RLS, audit, backups)
- [ ] PM sign-off (delivery, schedule)

---

## Phase 2 prerequisites

If Phase 1 acceptance passes, Phase 2 can begin. Otherwise, address gaps before proceeding.

### Items locked as Phase 2 mandatory (deferred from Phase 1)

> Per Phase 0 Cleanup Step 2 (2026-05-09), the following items are **locked as Phase 2 mandatory deliverables**, not Phase 1.

- **`cost_read_log` instrumentation** (locked 2026-05-09): Phase 1 reserves the schema + retention docs + permission slug. Phase 2 implements mandatory instrumentation of every cost-bearing API endpoint. Phase 1 cost privacy is sufficient via existing RLS + API serialization + UI hiding + export restrictions + audit on writes.

---

## What was moved out of this file (per D-PHASE1-001 scope reduction)

| Destination | Content type |
|---|---|
| [`phase-1-should-have.md`](./phase-1-should-have.md) | Useful but non-critical Phase 1 items (heavy-asset CI lint rules, alert sub-categories tests, hard-delete edge cases, IQD precision tests, etc.) |
| [`phase-1-schema-reservation-tracker.md`](./phase-1-schema-reservation-tracker.md) | Pure schema reservations + docs-only items (Module 24/25/26/27 schemas, cross-cutting columns, cost_read_log, country denormalization snapshot columns, etc.) |
| Phase 2/3/4/6/9/10 files | Functional items that depend on Phase 6+ features (AI chat lazy-load Phase 3; landing builder Phase 6; cleanup execution Phase 10; etc.) |

**Total reduction:** 241 items → ~117 Must Have items (51% reduction). No content was deleted; all preserved across the three files. Each Must Have item ties to a locked architectural decision and verifies the decision actually landed; further reduction would weaken the acceptance gate.
