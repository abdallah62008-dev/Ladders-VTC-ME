# Smart Ladders Commerce Platform

Arabic-first ecommerce platform for selling ladders in Saudi Arabia, Egypt, and Iraq.

> **Phase 1 Sprint 2A — in progress.** Schema + RLS + Cost Privacy foundation. Sprint 1 signed off **GREEN-CONDITIONAL** (Gates 1–6 local Windows; Gate 7 Lighthouse deferred to CI/Linux per chrome-launcher EPERM workaround in `docs/15-phases/phase-1-sprint-1-report.md` §12). The first Sprint 2A PR triggers GitHub Actions to clear the conditional on Lighthouse before any other Sprint 2A commits land.
>
> **Phase 1 Sprint 1** — Foundation MVP scaffold. See `docs/15-phases/phase-0-close-summary.md` and `docs/15-phases/phase-1-acceptance.md`.

## Stack (locked Phase 0)

- Next.js 15 + App Router + TypeScript (D-INFRA-002 / ADR-001)
- Tailwind v4 + shadcn/ui-compatible components
- pnpm (D-INFRA-006 — locked)
- ESLint + Prettier (D-INFRA-007)
- Vitest + Playwright (D-INFRA-008)
- Playwright snapshots for visual regression (D-INFRA-009)
- Lighthouse CI (D-INFRA-010 — per-surface thresholds)
- PostgreSQL 16+ via node-pg-migrate (D-INFRA-004 / ADR-027)
- Hetzner Frankfurt backend (D-INFRA-001 / ADR-018)
- Cloudflare R2 + Backblaze B2 backups (D-BKP-002 / ADR-023)
- 1Password Secrets Automation (D-BKP-001 / ADR-022)

## Project structure

```
/
├── app/                      # Next.js App Router
│   ├── layout.tsx
│   └── [locale]/             # 6-locale routing: ar-sa / en-sa / ar-eg / en-eg / ar-iq / en-iq
│       ├── layout.tsx
│       ├── page.tsx
│       ├── globals.css
│       └── admin/            # Admin shell with Country Context Switcher
├── components/
│   ├── ui/                   # status-badge, readiness-badge
│   └── admin/                # admin-shell, country-context-switcher
├── lib/
│   ├── i18n/                 # Locale config + next-intl request handler
│   ├── rbac/                 # Page classification + permission cache stub
│   └── cn.ts
├── messages/                 # i18n dictionaries (ar.json, en.json — placeholders)
├── migrations/
│   └── sql/                  # node-pg-migrate files (0001, 0002, 0003 in Sprint 1)
├── tests/
│   ├── unit/                 # Vitest
│   └── e2e/                  # Playwright
├── scripts/ci/               # Lockfile + grep checks
├── .github/workflows/        # CI pipeline (12 steps)
└── docs/                     # Phase 0 documentation (172+ files; 20,500+ lines)
```

## Setup (after Sprint 1 review)

```bash
# 1. Install dependencies
pnpm install

# 2. Install Playwright browsers
pnpm dlx playwright install --with-deps chromium

# 3. Set up local DB (optional — only when ready to run migrations)
cp .env.example .env.local
# edit DATABASE_URL to point at a local Postgres

# 4. Run migrations (when ready)
pnpm db:migrate up
```

## Available commands

| Command                        | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `pnpm dev`                     | Start Next.js dev server                                 |
| `pnpm build`                   | Production build                                         |
| `pnpm lint`                    | ESLint check                                             |
| `pnpm format`                  | Prettier format                                          |
| `pnpm format:check`            | Prettier check (CI)                                      |
| `pnpm typecheck`               | TypeScript typecheck                                     |
| `pnpm test:unit`               | Vitest unit + integration                                |
| `pnpm test:e2e`                | Playwright E2E                                           |
| `pnpm test:visual`             | Playwright visual regression                             |
| `pnpm test:lighthouse`         | Lighthouse CI (runs desktop then mobile per D-INFRA-010) |
| `pnpm test:lighthouse:desktop` | Lighthouse desktop pass only                             |
| `pnpm test:lighthouse:mobile`  | Lighthouse mobile pass only                              |
| `pnpm ci:grep`                 | CI grep tests (architectural enforcement)                |
| `pnpm ci:lockfiles`            | No mixed lockfiles check                                 |
| `pnpm db:migrate up`           | Apply migrations                                         |
| `pnpm db:migrate down`         | Rollback last (dev only)                                 |

> **Note (Lighthouse on Windows):** `pnpm test:lighthouse` may fail locally on Windows with a `chrome-launcher` `EPERM` error during post-audit temp-directory cleanup (Windows NTFS file-lock race against Windows Defender real-time protection). The audit itself completes — Chrome loads the page and computes all metrics — but `chrome-launcher@1.2.1` cannot synchronously delete its temp profile directory. Linux and macOS are not affected. Run Lighthouse on the GitHub Actions `ubuntu-latest` CI, in WSL2, or on a Linux/macOS machine for reliable local validation. **Do NOT lower D-INFRA-010 thresholds because of this Windows tooling regression.** Sprint 1 sign-off accepts CI as the canonical Lighthouse environment (see `docs/15-phases/phase-1-sprint-1-report.md` §12). This does not affect `pnpm test:unit`, `pnpm build`, or `pnpm test:e2e` — all of which validate cleanly on Windows.

## Locked architectural rules (CI-enforced)

- **D-DB-001**: Main orders table is `customer_orders` (plural). NO bare `order` or quoted `"order"`.
- **D-DB-002**: ALL UUID PKs default to `gen_random_uuid()`. NO `uuid_generate_v4()`.
- **D-DB-003**: ALL monetary columns are `numeric(12,2)`. NO `float`/`double precision`/`real`/`money`.
- **D-DB-010**: 4-class deletion policy (soft / never / hard-after-retention / PII anonymization).
- **D-COUNTRY-013**: No external ERP integration in Phase 1. Admin Dashboard is the inventory source of truth.
- **D-COUNTRY-014**: NO hardcoded country fields. All per-country data via `country_id` FK.
- **D-CSP-002**: Every admin route declares `country_scope_mode: 'scoped' | 'aware' | 'global'`.
- **D-INFRA-006**: pnpm only. No `package-lock.json` or `yarn.lock`.
- **D-OPS-010**: NO hardcoded couriers / cities / fees / SLAs.
- **D-PAY-002/003**: NO literal margin floors in code. Stored as data in `profit_floor_rule`.
- **D-RBAC-001**: Cost privacy enforced via RLS — only Super Admin + Finance Admin read `actual_product_cost`.
- **D-READY-002**: Build Now, Activate When Ready. Configured ≠ active.
- **D-SAFE-001**: NO forbidden safety claim phrasings ("100% accident-proof", "lifetime guarantee", etc.).

CI grep tests in `scripts/ci/grep-checks.sh` enforce these rules on every PR.

## Restrictions during Phase 1 sprint 1

- ❌ No production deployment
- ❌ No live payment / WhatsApp credentials in repo
- ❌ No production migrations (file authoring only)
- ❌ No expansion of Phase 1 scope beyond `docs/15-phases/phase-1-acceptance.md` Must Have items

## Documentation

All architecture, decisions, and policies live in `/docs`. Start with:

1. `docs/README.md` — folder structure
2. `docs/GLOSSARY.md` — domain vocabulary
3. `docs/15-phases/phase-0-close-summary.md` — what Phase 0 produced
4. `docs/15-phases/phase-1-acceptance.md` — what Phase 1 must deliver
5. `docs/15-phases/phase-1-execution-plan.md` — sprint roadmap
