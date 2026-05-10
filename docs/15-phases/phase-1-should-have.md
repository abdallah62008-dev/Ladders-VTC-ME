# Phase 1 Should Have

**Status:** Active companion to `phase-1-acceptance.md`
**Owner:** PM + CTO + QA
**Source:** Phase 0 Architecture Review 2026-05-09 (D-PHASE1-001 scope reduction)

> Items in this file are **useful for Phase 1 but not strictly required** for sign-off. They land Phase 1 if engineering capacity allows, otherwise they roll into Phase 1.5 / Phase 2.
>
> **No item here is functionally deferred** — they are part of the Phase 1 plan but ranked second priority after [`phase-1-acceptance.md`](./phase-1-acceptance.md) Must Have items. Re-prioritize freely.

---

## Warehouse Management — extended testing (🟢 D-COUNTRY-015)

- [ ] After clearing/transferring stock, deactivate succeeds with reason captured; `warehouse.deactivate` audit entry recorded.
- [ ] Reactivate from `inactive` works (Inventory Manager role).
- [ ] Archive succeeds when stock empty + no pending transfers + no unfulfilled orders; `archived_at`, `archived_by`, `archive_reason` populated; `warehouse.archive` audit entry recorded.
- [ ] Unarchive blocked for non-Super-Admin role; Super Admin can unarchive with reason ≥30 chars.
- [ ] Hard-delete attempt on RUH-01 blocked because `audit_log` history exists.
- [ ] Hard-delete on a freshly-created empty test warehouse, by Super Admin, with reason ≥30 chars → succeeds; pre-delete snapshot stored in `audit_log.diff`.
- [ ] Non-Super-Admin role attempting hard-delete → 403 forbidden.
- [ ] Webhook events fire correctly: `warehouse.created`, `warehouse.updated`, `warehouse.deactivated`, `warehouse.reactivated`, `warehouse.archived`, `warehouse.deleted`.
- [ ] **Stock-safety check (Archive):** same blocking behavior as deactivate.

---

## Profit floors — extended (🟢 D-PAY-002 + D-PAY-003)

- [ ] **Floor history view:** Floor History screen lists every superseded row with `effective_from`, `effective_until`, `value`, `changed_by`, `reason`. Past rows queryable forever.
- [ ] **Past-order immutability:** create an order at floor=20%; raise floor to 22%; verify `order_line.business_gross_profit_snapshot` and `profit_guardrail_log.business_floor_at_check` for that order are unchanged. New orders use 22%.

---

## RLS / cost privacy — extended (🟢 D-RBAC-001)

- [ ] Audit log entries for cost-column reads recorded with actor + timestamp; `country_data_audit` rows for cost changes use `old_value_redacted=true` for non-finance reads.
- [ ] Sentry `beforeSend` hook redacts field names matching `/cost/i`, `/margin/i`, `/profit/i` and corresponding numeric values.

---

## Schema migrations — extended (🟢 D-INFRA-004)

- [ ] Production migration workflow rehearsed on staging at least once; manual + dual-approval (Super Admin + DBA or CTO) gate verified.
- [ ] Pre-risky-change auto-backup fires before any production migration touching cost-bearing tables, RLS policies, or warehouse stock.
- [ ] Forward-only policy active in production after first deploy; no destructive `DOWN` runs against production.

---

## Backup — extended (🟢 D-BKP-002)

- [ ] `.env` and secrets explicitly excluded from backup payloads (CI grep test green using Trufflehog + custom patterns).
- [ ] R2 + B2 access keys live only in 1Password `vtc-prod-backup-keys`; never in code or CI env vars.

---

## Secrets management — extended (🟢 D-BKP-001)

- [ ] Single bootstrap secret in CI: `OP_SERVICE_ACCOUNT_TOKEN` in GitHub Actions Secrets; all other credentials fetched at runtime.
- [ ] Trufflehog scan on every commit + nightly; failure blocks merge.
- [ ] CI test: introduce a deliberate secret-shaped string in a feature branch → verify Trufflehog rejects.

---

## UUID strategy — extended (🟢 D-DB-002)

- [ ] **No mixed UUID generators** — verified by full-schema grep of generated migration files showing only `gen_random_uuid()` references and no per-table custom generators.
- [ ] **PR template includes UUID-strategy review checkbox** — reviewer confirms any new UUID PK column uses `gen_random_uuid()` default.

---

## Schema naming — extended (🟢 D-DB-001)

- [ ] **Child tables retain `order_*` prefix** — `order_line`, `order_event`, `order_address`, `order_profit_snapshot`, `order_source_attribution`, `order_risk_score` exist with these exact names.
- [ ] **FK references** — every `order_id` column references `customer_orders(id)`; verified by `pg_constraint` query.
- [ ] **Webhook event names preserved as `order.*`** — events fire with payload `data.order_id` referencing `customer_orders.id`. Verified by integration test.

---

## Monetary precision — extended (🟢 D-DB-003)

- [ ] **Per-country numeric precision variation forbidden** — KSA / EG / IQ schema rows for the same column have identical `numeric(12,2)` types.
- [ ] **IQD precision test:** insert `numeric(12,2)` value `175000.00`; presentation layer renders as `175,000` (no decimals shown). Verify both DB value and rendered HTML match expected.
- [ ] **Order snapshot immutability:** create an order at price `1499.50`; update `variant_country_price.regular_price` to `1599.50`; verify `order_line.unit_selling_price` for that order remains `1499.50`.
- [ ] **Payment adapter minor-unit conversion test:** unit test for each adapter (Stripe, Moyasar, Tap, Paymob, ZainCash) verifies round-trip for boundary values `[0.00, 0.01, 0.99, 1.00, 99.99, 9999999999.99]`.
- [ ] **No floating-point in adapter code** — CI grep on `05-payments/` source files rejects `parseFloat`, `Number()` on monetary strings.
- [ ] **CI grep test rejects forbidden monetary types** — feature branch with `float` / `double precision` / `real` / `money` / `numeric(8,2)` on monetary column fails CI.

---

## Deletion policy — extended (🟢 D-DB-010)

- [ ] **Class 4 — PII anonymization workflow** documented in `17-compliance/ksa-pdpl.md` + `17-compliance/consent-records.md` (Phase 1 documents; Phase 4 ships UI).
- [ ] **Reporting consistency** — `gross_revenue`, `gross_profit_business`, `gross_profit_marketer`, `aov` formulas updated to NOT filter `deleted_at IS NULL` by default.
- [ ] **Cancelled / refunded orders** — handled by `customer_orders.status` filter, NEVER by deletion.
- [ ] **Dashboards make deletion/archive status visible** — admin list views show "Deleted"/"Archived" badge.

---

## Country Access Control — extended (🟢 D-CSP-001/002/003/004)

- [ ] **5 other new permission slugs added:** `country_access.read`, `country_access.write`, `country_access.audit.read`, `report.cross_country.read`, `export.cross_country`.
- [ ] **Drift-mitigation triggers** asserting parent country match on insert/update for cart_line / cart_event / order_line / order_event / payment_transaction / refund / recommendation_warning_log. Verified by integration test.
- [ ] **Indexes verified:** `(user_id, active)`, `(country_id, active)`, `(user_id, country_id) WHERE revoked_at IS NULL` UNIQUE.
- [ ] **Cache-sync trigger reserved** (function written; activation Phase 1 sprint 2).
- [ ] **Single-country user** sees fixed label in top-bar (no dropdown).
- [ ] **Multi-country user** sees dropdown with allowed countries only.
- [ ] **All-countries user** (`country_scope.all`) sees full dropdown + "All Countries" option.
- [ ] **Per-page badges** render correctly: yellow strip for `scoped`, subtitle for `aware`, grayed-out tooltip for `global`, red/orange strip when "All Countries" selected.
- [ ] **Playwright tests** cover all three user-access tiers + per-page badge states.
- [ ] **Audit log writes** for all 9 country-access event types.
- [ ] **Session variables** `app.current_user_country_scope` + `app.current_user_has_country_scope_all` set on every authenticated request from the cache.
- [ ] **Cache invalidation test:** revoking country access takes effect within 60s on next request from that user.
- [ ] **Country Manager role enforcement** — assignment without active `user_country_access` row → backend rejects.
- [ ] **Alert: >5 `denied_cross_country_access_attempt`** events for same user in 24h → High severity.
- [ ] **Alert: `country_scope.all` granted to a new user** → High severity.
- [ ] **Alert: cross-country export > 10,000 rows** → Medium severity.

---

## Shipping & Logistics — admin section structure (🟢 D-OPS-010 / D-OPS-003)

- [ ] **No hardcoded couriers / cities / fees / SLAs in code** — CI grep test rejects courier names; allow-list permits seed migrations + admin courier-management UI.
- [ ] **No hardcoded city lists** — must be `shipping_zone.city_list` data; CI grep test rejects.
- [ ] **No hardcoded shipping fees** — must be `shipping_rate_card` data; CI grep test rejects literal currency-tagged values.
- [ ] **API credentials never displayed in dashboard** — `shipping_provider.api_configured` boolean only. Verified by Playwright test.
- [ ] **KSA J&T provider seeded** as draft row in migration 0012.
- [ ] **KSA J&T methods seeded** in migration 0012: `standard`, `cod_delivery`, `return`, `manual`.
- [ ] **KSA J&T rate cards seeded** for major launch cities.
- [ ] **Operations / Shipping admin section structure** wired in Phase 1 with read-only stubs for all 8 sub-pages.
- [ ] **All 16 new shipping permission slugs defined** in migration 0002 + `role_permission` CSV.
- [ ] **Audit log rule active** — every shipping_provider/method/rate/rule create/update/deactivate writes an `audit_log` row.
- [ ] **Country Launch Readiness extended** with 7 new shipping readiness checks.

---

## Heavy-asset rules on landing pages (🟢 D-PERF-001 §B.3)

> Phase 1 documents the rules; Phase 6 lights up enforcement on the landing builder.

- [ ] **No heavy autoplay video on landing pages** — CI grep test rejects any page route with `<video autoplay>` without proper attributes.
- [ ] **Poster image required** for any `<video>` element (SVG or AVIF poster).
- [ ] **`<video preload="none">` default** — full source loads only on user click.
- [ ] **Compression rules enforced** — MP4 H.265 + WebM dual codec; 8s max for product demo clips; 2 MB ceiling per clip.

---

## Image pipeline — extended (🟢 D-PERF-001 §B.2)

- [ ] **Versioned filenames on R2** with 1-year `Cache-Control` for versioned URLs.
- [ ] **Per-asset alt_translations populated** for `ar-sa` + `en-sa` for all hero SKU images; CI grep test fails if missing for active locale.

---

## Performance budget enforcement — extended (🟢 D-PERF-001)

- [ ] **Lighthouse budget check in CI** — Lighthouse mobile score gate fails build if PDP < 90; per-route budgets configurable.
- [ ] **Production runtime alert** fires if RUM p75 score drops below class threshold for 30+ minutes.

---

## Basic cache policy (🟢 D-PERF-001 §A.1 + §E)

- [ ] **CDN cache policy documented** — page-class cache profiles table mirrored in code-level config.
- [ ] **Country-aware cache keys verified** — adding a 4th country `xx` produces distinct cache entries; no cross-country leakage.
- [ ] **Never-cache list enforced** — Cart, Checkout, Account/Orders, Admin, Webhook receivers, Payment pages return `Cache-Control: no-store, private`.
- [ ] **PDP ISR with 15-min revalidate** + tag invalidation on price/stock change wired and tested.
- [ ] **Smart cache invalidation rule** — never purge whole site; only affected pages invalidated.
- [ ] **Static landing snapshot policy documented** — Phase 6 will generate snapshots; Phase 1 documents the rule + reserves R2 bucket placeholder.

---

## Alerts Center skeleton (🟢 D-PERF-001 §H)

- [ ] **Alerts Center read-only admin page** at `/admin/system/intelligence/alerts` showing Performance + Database + Backup category rows.
- [ ] **Alert insertion path** for Phase 1 categories wired:
  - Performance: RUM p75 score drop → severity `high`
  - Database: pg_stat_statements slow query > 1s → severity `medium`
  - Backup: failed backup job → severity `critical`
- [ ] **Critical SLA notification** — failed backup alert fires WhatsApp + email to Super Admin + Infra Lead + Security Lead within 60 seconds.

---

## Cleanup framework documentation (🟢 D-PERF-001 §F)

> Phase 1 documents only; Phase 10 ships execution.

- [ ] **`retention_policy` seeded** with 13 rows per §F.2.
- [ ] **Retention policy view** at `/admin/system/retention-policies` is functional Phase 1 (read-only); admin sees the 13 seeded rows + last-changed audit info.
- [ ] **Admin route** `/admin/system/data-maintenance` shows "ships Phase 10" notice with read-only retention policy view.

---

## Items moved out of Phase 1 entirely

These items are deferred to later phases (no longer Phase 1 acceptance):

| Item | Target phase |
|---|---|
| AI chat lazy-load lint check | Phase 3 (when chat ships) |
| Heavy widgets lazy-loaded (Compare / Finder / Reach Calculator / Fit-My-Car) | Phase 6 (when widgets ship) |
| Script weight inventory Phase 6 functional review | Phase 6 |
| Static landing snapshot generation | Phase 6 |
| Alert sub-categories beyond Performance/Database/Backup | Phase 6/10 |
| Cleanup job execution + scheduled cron runs | Phase 10 |
| Cross-country export > 10K rows alert (functional broadcast volumes) | Phase 4+ |
| Decision Engine functional UI tests | Phase 6 |
| Trust Layer surface rendering tests | Phase 4–6 |
| Safety Compliance Pre-Publish gate tests | Phase 6 |
| Readiness Engine unified dashboard tests | Phase 10 |
| Time-limited grant expiry test | Phase 6 (admin UI) / Phase 10 (worker) |
| WhatsApp shipment status template tests | Phase 4 |
| Cost-bearing endpoint cost_read_log instrumentation | Phase 1 sprint 4 OR Phase 2 (lock decision per cleanup) |
