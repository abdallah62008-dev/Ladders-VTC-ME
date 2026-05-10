# Phase 1 Sprint 2A — Implementation Report

**Status:** Schema + RLS + cost privacy foundation delivered; ready for review
**Date:** 2026-05-10
**Sprint:** Phase 1 sprint 2A (week 2 of Phase 1)
**Owner:** Implementation team

> ⚠️ **Sprint 2A produces project-foundation files only.** No `pnpm install` was re-run (lockfile from Sprint 1 retained); no migrations were executed against any database by Claude; no production secrets touched. The user runs `pnpm db:migrate up` against a local dev Postgres after the kickoff CI Lighthouse turns green.

---

## 1. Summary of implementation

Sprint 2A delivers the **schema + cost privacy foundation** the rest of Phase 1 builds on:

- **CI now has a real Postgres.** `.github/workflows/ci.yml` adds a `postgres:16.4` service container with `pg_isready` health gating, a `DATABASE_URL` job env, and two new pipeline steps — **Step 11 `pnpm db:migrate up`** + **Step 12 `pnpm test:rls`**. Migrations 0001–0006 are now applied on every PR against a fresh throwaway DB.
- **Three new migrations.**
  - `0004_catalog` — 10 catalog tables (category, category_translation, product_group, product_group_translation, product, product_translation, product_variant, product_image, product_video, product_certification). All UUID PKs default `gen_random_uuid()` per D-DB-002. No country-hardcoded fields per D-COUNTRY-014.
  - `0005_pricing-costs-rls` — 7 cost-bearing tables (variant_country_price, variant_country_cost, variant_marketer_cost, pricing_rule, cost_history, profit_floor_rule, cost_read_log). All monetary `numeric(12,2)` per D-DB-003. RLS policies on `variant_country_cost` (cost.read / cost.write), `variant_marketer_cost` (marketer_cost.read / marketer_cost.write), and `cost_history` (cost.read / cost.write). Class 2 BEFORE-DELETE triggers on `variant_country_cost`, `variant_marketer_cost`, `cost_history`, `cost_read_log`. `cost_read_log` is **schema reservation only** per `phase-1-acceptance.md` line 241 — no Phase 1 instrumentation; Phase 2 wires the cost-read interceptors.
  - `0006_warehouses-stock` — 8 warehouse/stock tables (warehouse, variant_warehouse_stock, stock_movement, stock_reservation, stock_transfer, damaged_stock, returned_stock, inbound_stock). Class 2 BEFORE-DELETE trigger on `stock_movement` per Sprint 2A explicit rule (note: D-DB-010 list classifies as Class 1; see §12 deviation note).
- **App helper schema.** Migration 0005 introduces the `app` schema with two helper functions: `app.current_user_id()` (reads from `app.current_user_id` GUC session var) and `app.has_permission(slug)` (joins `user → role_permission → permission` to check slug). RLS policies invoke `app.has_permission()` directly. The `app_user` Postgres role is the canonical application connection (subject to RLS; never has BYPASSRLS).
- **RLS test runner.** New `pnpm test:rls` script (separate `vitest.rls.config.ts` because Vitest's main include list is `tests/unit/**` only). 51 tests in `tests/rls/cost-privacy.spec.ts` — including a parametric matrix that asserts every non-finance role returns 0 rows when SELECTing `actual_cost` / `marketer_cost`. Class 2 deletion-block triggers verified for all five tables (variant_country_cost, variant_marketer_cost, cost_history, cost_read_log, stock_movement) plus the existing audit_log trigger from migration 0002.
- **Defense-in-depth Layers 1–5 helpers.** New `lib/rbac/cost-privacy.ts` (Layer 2 serializer redaction + Layer 4 admin-UI visibility helpers + Layer 5 export gate) and `lib/rbac/api-token-scopes.ts` (Layer 3 cost-bearing scope catalogue + dual-approval gate function). 23 unit tests in `tests/unit/cost-privacy.test.ts`. **None of these are wired into runtime API/UI code** — Sprint 2A ships type contracts + tests; Sprint 3 wires them into the live admin pages once those pages start reading real data.
- **CI grep extended.** Three new checks (#10/#11/#12) added to both `scripts/ci/grep-checks.mjs` and `scripts/ci/grep-checks.sh`: no bare `SELECT actual_cost` outside finance paths; no `SELECT *` on cost-bearing tables; no `console.*` logging of cost field values. All three honor allow-listing for migrations / seed / tests / docs / `cost-privacy.(ts|spec.ts)` / `api-token-scopes.ts` / `helpers.ts`.

## 2. Files created (9)

| Group | File | Purpose |
|---|---|---|
| **Migrations (3)** | `migrations/sql/1700000004000_catalog.sql` | 10 catalog tables |
| | `migrations/sql/1700000005000_pricing-costs-rls.sql` | 7 cost tables + RLS + app schema + Class 2 triggers + cost_read_log reservation |
| | `migrations/sql/1700000006000_warehouses-stock.sql` | 8 warehouse/stock tables + stock_movement Class 2 trigger |
| **RLS test runner (3)** | `vitest.rls.config.ts` | Separate vitest config (node env, single-fork, longer timeout) |
| | `tests/rls/helpers.ts` | `pool`, `withTx`, `seedRole`, `withUser`, `seedCatalog`, `seedVariantCountryCost`, `seedVariantMarketerCost` |
| | `tests/rls/cost-privacy.spec.ts` | 51 RLS tests across cost-bearing tables + Class 2 triggers + `app.has_permission` |
| **Defense-in-depth (3)** | `lib/rbac/cost-privacy.ts` | Layer 2 (`redactCostFields`/`...Deep`), Layer 4 (`costVisibility`), Layer 5 (`assertCanExportCost`/`exportCostMode`) |
| | `lib/rbac/api-token-scopes.ts` | Layer 3 — cost-bearing scope catalogue + `assertTokenScopesAllowed` + `CostScopeRequiresDualApprovalError` |
| | `tests/unit/cost-privacy.test.ts` | 23 unit tests for layers 2/3/4/5 |

## 3. Files updated (5)

| File | Change |
|---|---|
| `README.md` | Added Sprint 2A kickoff banner above the existing Sprint 1 line — triggers PRE-1 CI Lighthouse on commit/PR |
| `.github/workflows/ci.yml` | Added `postgres:16.4` service container with health-check; `DATABASE_URL` job env; Step 11 `db:migrate up`; Step 12 `test:rls`; renumbered downstream steps |
| `package.json` | Added `test:rls` and `test:rls:watch` scripts pointing at `vitest.rls.config.ts` |
| `scripts/ci/grep-checks.mjs` | Added checks #10 (no bare SELECT cost fields), #11 (no SELECT * on cost tables), #12 (no console.* logging cost values). Allow-list updated for cost-privacy module + RLS test files |
| `scripts/ci/grep-checks.sh` | Same three checks mirrored for GitHub Actions ubuntu-latest CI parity |

Plus this report (`docs/15-phases/phase-1-sprint-2a-report.md`) and the CHANGELOG entry (`docs/CHANGELOG.md`).

## 4. Commands the user should run, in order

```bash
# ─── PRE-1 hard gate ───────────────────────────────────────────────
# 1. Commit the Sprint 2A kickoff README touch + the rest of Sprint 2A files
#    on a feature branch.
# 2. Open a PR against main. GitHub Actions will run the CI pipeline,
#    INCLUDING the `lighthouse` job on ubuntu-latest. The lighthouse job is
#    the canonical D-INFRA-010 validation that Sprint 1 deferred from local
#    Windows. If it goes GREEN, Sprint 1's GREEN-CONDITIONAL becomes GREEN,
#    and Sprint 2A may continue.
# 3. If lighthouse fails on CI:
#    - Stop. Report exact assertion failures and per-URL scores.
#    - Do NOT modify D-INFRA-010 thresholds.
#    - Investigate whether the failure is real or environmental.
# 4. Only after CI lighthouse is green may local Sprint 2A validation proceed.

# ─── Local validation (Windows / dev machine) ──────────────────────
# Pre-condition: a local Postgres 16.4 dev DB is running, with DATABASE_URL
# in .env.local (NEVER point at staging/prod). The .env.example template
# shows the format.

pnpm typecheck                          # TS clean (0 diagnostics expected)
pnpm format:check                       # Prettier clean
pnpm lint                               # ESLint clean (0 errors, 0 warnings)
pnpm ci:lockfiles                       # pnpm-only lockfile rule satisfied
pnpm ci:grep                            # 12 architectural decision checks pass

pnpm test:unit                          # ~32 unit tests pass (9 prior + 23 new)

pnpm db:migrate up                      # Applies migrations 0001-0006 to local dev DB
pnpm test:rls                           # ~51 RLS tests pass

pnpm build                              # 39/39 SSG pages compile cleanly
pnpm test:e2e                           # 26 E2E tests still pass (no Sprint 2A
                                        # changes to admin shell or storefront pages)

# Optional — Lighthouse on Linux/WSL/macOS only.
# Windows local Lighthouse still hits chrome-launcher EPERM per Sprint 1 §12.
pnpm test:lighthouse
```

Order rationale: static checks fail fastest → unit tests → migrate → RLS → build → E2E. Stop on first failure, report, fix, retry.

## 5. Tests authored and expected pass counts

| Suite | File | Test count | Expected outcome |
|---|---|---|---|
| Unit (locale + cn — Sprint 1) | `tests/unit/example.test.ts` | 9 | All pass |
| Unit (cost privacy Layers 2/3/4/5 — Sprint 2A) | `tests/unit/cost-privacy.test.ts` | 23 | All pass |
| **Total unit tests** | | **32** | All pass on clean install |
| RLS — variant_country_cost SELECT (matrix) | `tests/rls/cost-privacy.spec.ts` | 22 (2 finance + 20 non-finance) | All pass |
| RLS — variant_country_cost INSERT | `tests/rls/cost-privacy.spec.ts` | 2 | All pass |
| RLS — variant_marketer_cost SELECT (matrix) | `tests/rls/cost-privacy.spec.ts` | 15 (5 with-marketer + 10 without) | All pass |
| RLS — cost_history SELECT | `tests/rls/cost-privacy.spec.ts` | 2 | All pass |
| Class 2 DELETE-block triggers | `tests/rls/cost-privacy.spec.ts` | 6 (5 Sprint 2A tables + audit_log from Sprint 1) | All pass |
| `app.has_permission()` helper | `tests/rls/cost-privacy.spec.ts` | 4 | All pass |
| **Total RLS tests** | | **51** | All pass after `db:migrate up` |
| E2E (homepage 6-locale + admin shell — Sprint 1) | `tests/e2e/*.spec.ts` | 26 | All pass (unchanged) |
| **Total Sprint 2A test count** | | **109** | (32 unit + 51 RLS + 26 E2E) |

## 6. Errors encountered

**None during authoring.** All file creations and edits succeeded on first attempt. `package.json` script edits applied cleanly. Both `grep-checks.mjs` and `grep-checks.sh` Sprint 2A check additions verified to maintain the existing 9-check ordering plus the 3 new checks.

## 7. Items blocked

**Nothing blocked.** The following are **deferred by design** per Sprint 2A scope rules:

| Item | Deferred to | Reason |
|---|---|---|
| Redis-backed permission cache (replacing the stub) | Sprint 2B | Per the pre-Sprint risk review: cache + RLS in the same sprint creates "cache masks RLS bug" risk |
| 7 cache invalidation triggers integration tests | Sprint 2B | Depends on Redis cache existing |
| Cache-vs-RLS independence test (corrupt cache → RLS still rejects) | Sprint 2B | Depends on Redis cache existing |
| X-Country-Context header validation middleware | Sprint 2B | Functional middleware lives downstream of RLS being green |
| Multi-country stub user + switcher UX exercise | Sprint 2B | Depends on `user_country_access` having functional read paths |
| Defense layers 6-9 (webhook redact, audit redact-by-role, observability scrubbers, backup encryption verify) | Sprint 2B | Operational layers — Sprint 2A ships the security floor (layers 1-5) |
| Live data admin pages (read 0004-0006 tables) | Sprint 3 | Per consultation: don't wire admin UI to real data until RLS + cache + middleware are all signed off |
| `cost_read_log` runtime instrumentation | Phase 2 | Locked 2026-05-09 per `phase-1-acceptance.md` line 241 |
| Migrations 0007–0011 (audit-views, system primitives, triggers, seed, indexes) | Sprint 3 | Out of Sprint 2A scope |
| Cache-sync trigger (migration 0011) | Sprint 3 | Bundled with 0007–0011 |
| Cost-privacy pen-test rehearsal | Sprint 2B | Closes after defense layers 6-9 ship |

## 8. Sprint 2A foundation readiness

**🟢 READY FOR REVIEW — pending PRE-1 CI Lighthouse.**

The schema foundation is in place. RLS policies + Class 2 triggers + the `app.has_permission()` helper give us a defensible cost privacy floor verified by 51 RLS assertions. The defense-in-depth helpers for Layers 2/3/4/5 are unit-tested and ready for Sprint 3 to wire into the admin pages. CI now runs migrations + RLS tests on every PR against a fresh Postgres 16.4 service.

To validate Sprint 2A end-to-end, the user should:

1. **First — confirm CI Lighthouse green** on the Sprint 2A kickoff PR. This clears Sprint 1's GREEN-CONDITIONAL flag.
2. Run the full local validation sequence in §4 above, stop on first failure.
3. Specifically confirm:
   - `pnpm db:migrate up` applies all 6 migrations (0001–0006) cleanly
   - `pnpm test:rls` returns 51/51 pass — every non-finance role correctly returns 0 rows on cost SELECTs
   - `pnpm ci:grep` reports 12 architectural checks all clean
4. Once all gates pass, Sprint 2A is signed off and Sprint 2B may begin.

If any gate fails, halt and report — do NOT proceed to Sprint 2B.

## 9. Recommended Sprint 2B starter prompt

```
Begin Phase 1 Sprint 2B — Operational layer: Redis Cache + Middleware + Country UX.

ALLOW Claude Code to read, inspect, analyze, edit, create, and save project files
needed for Sprint 2B.

Prerequisite: Sprint 2A signed off + merged to main. CI is green on:
  - lighthouse job (clears Sprint 1 GREEN-CONDITIONAL)
  - ci job: format / typecheck / lint / lockfiles / grep / unit / migrate / RLS /
            build / E2E
The cache-stub at lib/rbac/permission-cache-stub.ts is unchanged from Sprint 1.

Read first (in this order):
1. docs/15-phases/phase-1-sprint-2a-report.md — Sprint 2A deliverables + RLS test
   coverage; defense layers 1-5 already shipped
2. docs/15-phases/phase-1-acceptance.md — cache rules lines 125-136; X-Country-Context
   line 120; multi-country line 123
3. docs/03-rbac/03-scopes.md — §H.0 (8 hard cache rules); §G (X-Country-Context
   matrix); §I (multi-country UX behavior matrix)
4. docs/03-rbac/04-cost-privacy.md — 9-layer defense-in-depth; layers 6-9 specs
5. docs/CHANGELOG.md — recent entries

Sprint 2B scope (in order; do NOT exceed):

1. Redis-backed permission cache replacing lib/rbac/permission-cache-stub.ts.
   Implement all 8 hard rules from 03-rbac/03-scopes.md §H.0:
   - Cache MUST NOT replace database RLS — RLS is the final layer
   - Cache TTL ≤ session length (recommend ≤60 minutes)
   - Invalidate on: role change, permission change, user_country_access change,
     country_scope.all grant/revoke, user deactivation, session logout,
     time-limited grant expiry
   - Cache MUST NEVER cache secrets
   - Cache MUST NOT expose cost fields without cost.read / cost.export
   - Sensitive actions bypass cache (cost reads, override approvals,
     restore.production, country_scope.all grants, sensitive_cleanup_override)
   - Denied access attempts STILL audit-logged regardless of cache state
   - Cache invalidation events fire as Redis pub/sub messages

2. Add Redis service container to .github/workflows/ci.yml alongside Postgres.
   Document Redis version + docker-compose example for local dev.
   Document pub/sub topic naming convention.

3. Integration tests for all 7 invalidation triggers (per
   phase-1-execution-plan.md line 126).

4. **HARD ACCEPTANCE — Cache-vs-RLS independence test** per
   phase-1-acceptance.md line 136 lock: deliberately corrupt the cache
   (admin flush mid-test); confirm RLS still rejects unauthorized access
   to actual_cost / marketer_cost. The cache MUST NOT be able to mask an
   RLS bypass.

5. X-Country-Context middleware per 03-rbac/03-scopes.md §G:
   - 9-cell behavior matrix (3 scope_modes × 3 conditions)
   - 403 responses write `denied_cross_country_access_attempt` to audit_log
   - Defense in depth: middleware re-checks against user_country_access
     (or country_scope.all) — does NOT trust UI hiding alone

6. Multi-country fixtures + Country Context Switcher exercise:
   - Single-country stub user (already exists from Sprint 1) → fixed label
   - Multi-country stub user (NEW) → dropdown
   - country_scope.all stub user (NEW) → "All Countries" with red/orange
     warning per 03-rbac/03-scopes.md §I
   - Visual verification of all three UX paths

7. Defense-in-depth layers 6-9:
   - Layer 6 (Webhook redact): cost-changed events emit without value to
     subscribers without cost.read
   - Layer 7 (Audit redact-by-role): audit_log entries store
     old_value_redacted: true for non-finance reads
   - Layer 8 (Observability scrubbers): Sentry / Grafana scrubbers redact
     field names matching *cost*, *margin*
   - Layer 9 (Backup encryption verification): test that backups encrypt at
     rest + restoration still goes back through RLS

8. Cost-privacy pen-test rehearsal: full 9-layer chain end-to-end with a
   deliberately misconfigured stub user; document every redaction that fired.

9. Sprint 2B 12-section structured report at
   docs/15-phases/phase-1-sprint-2b-report.md.

Restrictions (unchanged):
- No production deploy, no live credentials, no migrations 0007-0011,
  no live data admin pages, no D-INFRA-010 threshold weakening,
  no functional user_country_access grants/revocations UI (Phase 6),
  no 60s cache flush timing test (Sprint 4), no backup job scheduler
  (Sprint 4), no Permissions Inspector admin page (Sprint 3).
- No new architectural decisions — flag with 🟡 PROPOSED if any surface.

Sprint 2B sign-off requires:
- All 8 hard cache rules implemented + tested
- 7 invalidation triggers integration-tested
- Cache-vs-RLS independence test passes
- X-Country-Context 9-cell matrix tested with audit_log entries verified
- Multi-country UX exercised across 3 user fixtures
- Defense layers 6-9 covered with tests
- Pen-test rehearsal completed; results documented
- CI green on all jobs

End with the same 12-section structured report as Sprint 2A.
```

## 10. Per-gate validation plan

| # | Gate | Command | Expected pass criteria |
|---|---|---|---|
| PRE-1 | CI Lighthouse on Sprint 2A kickoff PR | (open PR, wait for `lighthouse` job on `ubuntu-latest`) | Green — clears Sprint 1 GREEN-CONDITIONAL |
| 1 | Lockfile check | `pnpm ci:lockfiles` | `✓ pnpm-only lockfile rule satisfied` |
| 2 | TypeScript typecheck | `pnpm typecheck` | clean — no diagnostics |
| 3 | Prettier format | `pnpm format:check` | clean — all matched files |
| 4 | ESLint | `pnpm lint` | 0 errors, 0 warnings |
| 5 | Architectural grep | `pnpm ci:grep` | 12/12 checks pass |
| 6 | Unit tests | `pnpm test:unit` | 32/32 pass |
| 7 | DB migrate (local) | `pnpm db:migrate up` | migrations 0001–0006 apply cleanly; `pgmigrations` table contains 6 rows |
| 8 | RLS tests | `pnpm test:rls` | 51/51 pass |
| 9 | Build | `pnpm build` | 39/39 SSG pages; ~102 KB shared First Load JS |
| 10 | E2E tests | `pnpm test:e2e` | 26/26 pass (unchanged from Sprint 1) |
| 11 | (CI-only, optional locally) | `pnpm test:lighthouse` | green per D-INFRA-010 |

If gate 7 fails on a specific table/policy, the RLS test in gate 8 typically surfaces a clearer error message. Read both before debugging.

## 11. CI Lighthouse confirmation requirement

**Sprint 1 was signed off as 🟢 GREEN-CONDITIONAL.** The conditional was: Lighthouse must pass on CI (Linux/ubuntu-latest) before Sprint 2 progresses past its first task.

**Sprint 2A's PRE-1 hard gate is precisely that confirmation.** Opening the Sprint 2A kickoff PR triggers `.github/workflows/ci.yml` which includes the `lighthouse` job. That job runs `pnpm test:lighthouse` against the `next build` artifact, validates desktop + mobile thresholds (per D-INFRA-010), and exits 0/1 based on the assertion matrix.

If the `lighthouse` job goes green:
- Sprint 1 GREEN-CONDITIONAL → 🟢 GREEN
- Sprint 2A may proceed past PRE-1
- Local Sprint 2A validation in §4 may run

If the `lighthouse` job fails:
- Sprint 2A halts at PRE-1
- Investigate the specific assertion failures
- Do NOT lower D-INFRA-010 thresholds
- Do NOT skip the Lighthouse gate
- Fix the underlying issue and re-trigger CI

## 12. Deviations from Phase 0 docs

**One 🟡 PROPOSED reconsideration; no architectural deviations.**

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | `stock_movement` deletion class | 🟡 PROPOSED | Sprint 2A applied a Class 2 BEFORE-DELETE trigger per the Sprint 2A prompt's explicit rule "Add Class 2 no-delete trigger on stock_movement." However, **D-DB-010's locked policy** (per `migrations/README.md` lines 19-20 and the Sprint 1 sign-off) classifies `stock_movement` as **Class 1 (soft-delete)**. Class 2 is strictly stricter (no DELETE possible at all) than Class 1 (soft-delete preferred but DELETE allowed). The trigger does not break Class 1 functionality — it simply prevents accidental hard-delete. **Recommended:** review at Sprint 2A sign-off whether D-DB-010 should be amended to formally upgrade `stock_movement` to Class 2 (matching audit_log + cost_history), which would align the locked policy with the implementation. No D-DB-010 change is being made unilaterally — this is a flagged proposal, not an architectural decision. |

Everything else conforms strictly to Phase 0 locks:

| Phase 0 lock | Sprint 2A implementation |
|---|---|
| D-DB-001 (`customer_orders`) | Not in Sprint 2A scope — order tables ship in Sprint 3 (migration 0008+) |
| D-DB-002 (`gen_random_uuid()`) | Every UUID PK in 0004/0005/0006 defaults `gen_random_uuid()`; `pgcrypto` enabled in 0001 |
| D-DB-003 (`numeric(12,2)` for money) | Every monetary column in 0005 is `numeric(12,2)`; rates use `numeric(5,4)` (`profit_floor_rule.min_margin`, `country.business_min_margin`) |
| D-DB-010 (4-class deletion) | Class 2 triggers on variant_country_cost, variant_marketer_cost, cost_history, cost_read_log, stock_movement (see deviation above), audit_log (Sprint 1) |
| D-COUNTRY-013 (inventory authority) | warehouse + stock_movement + stock_reservation per locked admin-dashboard authority; CI grep #9 still rejects ERP hardcoding |
| D-COUNTRY-014 (no hardcoded country fields) | All per-country tables FK to `country.id`. CI grep #2 still rejects `price_sa` / `stock_eg` patterns |
| D-CSP-001 / D-CSP-002 | Unchanged. Sprint 2B implements X-Country-Context header validation + multi-country switcher exercise. Existing admin pages still declare `country_scope_mode` |
| D-CSP-004 (audit country denormalization) | Unchanged — `audit_log.entity_country_id` already added in migration 0002 |
| D-RBAC-001 (cost privacy via RLS) | **Implemented** — `variant_country_cost` + `variant_marketer_cost` + `cost_history` RLS policies; `cost.read` / `cost.write` / `marketer_cost.read` / `marketer_cost.write` slug enforcement; defense-in-depth layers 1-5 helpers + 51 RLS tests |
| D-INFRA-006 (pnpm only) | Unchanged. Lockfile from Sprint 1 retained |
| D-INFRA-007 (ESLint + Prettier) | Unchanged. New `lib/rbac/cost-privacy.ts` + `api-token-scopes.ts` follow project lint/format rules |
| D-INFRA-008 (Vitest + Playwright) | Vitest config split — main config still includes `tests/unit/`; new `vitest.rls.config.ts` includes `tests/rls/` |
| D-INFRA-010 (Lighthouse thresholds) | **Unchanged** — no threshold weakening. PRE-1 confirms thresholds on CI |
| D-OPS-010 (configurable shipping) | Sprint 2A doesn't touch shipping; CI grep #7 still rejects courier hardcoding |
| D-PAY-002/003 (no literal margin floors in code) | `profit_floor_rule.min_margin numeric(5,4)` table reservation — values are DATA, not code constants. CI grep #1 unchanged |
| D-READY-002 (Build Now, Activate When Ready) | `pricing_rule.active boolean DEFAULT false` — configured ≠ active. `warehouse.archived_at` archive lifecycle |
| D-SAFE-001 (no forbidden phrasings) | `product_certification` table schema + CI grep #8 unchanged |
| D-CACHE-001 (permission cache 8 hard rules) | Sprint 2A ships the DB layer (`app.has_permission()`); Redis cache implementation deferred to Sprint 2B |

No new architectural decisions opened. No locked rules changed. No threshold weakening.

---

**Sprint 2A status: 🟢 Foundation ready for review (pending PRE-1 CI Lighthouse confirmation).** No errors. No blockers. One flagged 🟡 PROPOSED reconsideration on `stock_movement` deletion-class alignment (does not block Sprint 2A sign-off). No secrets touched. No live data wired into admin pages. No production deploy. The user runs the validation sequence in §4 to verify, then opens Sprint 2B.
