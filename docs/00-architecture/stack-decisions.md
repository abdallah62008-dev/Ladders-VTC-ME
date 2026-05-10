# Stack Decision Checklist

**Status:** Draft — items marked `TODO` are unresolved
**Owner:** CTO
**Last updated:** 2026-05-07

---

## Confirmed (from Final Master Plan v4 §2)

| Item | Decision | ADR |
|---|---|---|
| Frontend framework | Next.js 15 App Router + TypeScript | ADR-001 |
| Styling | Tailwind v4 + shadcn/ui | ADR-002 |
| Animation | CSS + Motion.dev (Phase 1) + Lottie (Phase 2). Skip GSAP / Three.js. | ADR-003 |
| Backend pattern | Next.js Route Handlers + Directus admin | ADR-004 |
| Add Laravel? | No, unless PHP ERP integration arises later | ADR-005 |
| Database | PostgreSQL 16+ with Row-Level Security | ADR-006 |
| Vector store | pgvector on Postgres | ADR-007 |
| Search | Meilisearch self-hosted | ADR-008 |
| Cache + queue | Redis + BullMQ | ADR-009 |
| LLM default | Anthropic Claude (Sonnet 4.6 + Haiku 4.5) | ADR-011 |
| LLM abstraction | Internal `LLMProvider` interface | ADR-012 |
| Media storage | Cloudflare R2 | ADR-013 |
| CDN / WAF | Cloudflare | ADR-014 |
| Messaging | WhatsApp Business Cloud API (Meta direct) | ADR-015 |
| Locale routing | Sub-path `/{locale}/` via `next-intl` | ADR-025 |
| Country switcher behavior | Country and locale separate UI controls | ADR-026 |
| Component library generation | shadcn/ui CLI; copy components into repo | ADR-029 |
| Mobile push notifications | Web Push (VAPID) for PWA admin | ADR-030 |
| CI/CD | GitHub Actions + Vercel CI | ADR-024 |
| Auth (admin) | Directus built-in | ADR-021 |

## Pending decisions

| Item | Default recommendation | Owner | Status |
|---|---|---|---|
| Realtime transport | Centrifugo self-hosted | Backend lead | TODO: confirm Centrifugo vs Pusher |
| Email/SMS providers | Resend + Unifonic (KSA) + Vonage | Ops lead | TODO: contracts |
| Hosting frontend | Vercel | Infra lead | TODO: budget approval |
| Hosting backend services | **Hetzner Frankfurt** (AWS me-south-1 = future migration option) | Infra lead | ✅ **Confirmed 2026-05-07 — ADR-018 Accepted** (D-INFRA-001 🟢) |
| Observability | Sentry + Grafana + Loki | Infra lead | TODO: confirm |
| Auth (storefront) | Custom JWT or Auth.js | Backend lead | TODO: pick approach |
| Secrets manager | **1Password Secrets Automation** | Security lead | ✅ **Confirmed 2026-05-07 — ADR-022 Accepted** (D-BKP-001 🟢) |
| Backup destination | **Cloudflare R2 primary + Backblaze B2 offsite** | Infra lead | ✅ **Confirmed 2026-05-07 — ADR-023 Accepted** (D-BKP-002 🟢) |
| Schema migration tool | **`node-pg-migrate`** (SQL-first; ORM-free; explicit RLS / triggers / views) | DBA | ✅ **Confirmed 2026-05-07 — ADR-027 Accepted** (D-INFRA-004 🟢) |
| API doc tool | OpenAPI 3.1 + Stoplight or Redocly | Backend lead | TODO: pick (ADR-028) |
| Package manager | **`pnpm`** | Frontend lead | ✅ **Confirmed 2026-05-09** (D-INFRA-006 🟢). Locked rules: `pnpm-lock.yaml` committed; no mixed lockfiles (CI rejects `package-lock.json` / `yarn.lock`); CI uses `pnpm install --frozen-lockfile`; onboarding docs mention pnpm. Phase 0 documentation-only — no packages installed in Phase 0. |
| Linter + formatter | **ESLint + Prettier** | Frontend lead | ✅ **Confirmed 2026-05-09** (D-INFRA-007 🟢). Locked rules: ESLint is the standard linter; Prettier is the standard formatter; CI fails on lint/format errors; Biome rejected for Phase 1 (younger ecosystem; weaker plugin coverage for TypeScript+React+Tailwind+Next.js); revisit Biome later only if ecosystem clearly improves. |
| Test framework | **Vitest + Playwright** | QA lead | ✅ **Confirmed 2026-05-09** (D-INFRA-008 🟢). Locked rules: Vitest for unit/integration; Playwright for E2E/browser; CI runs both layers; Phase 1 ships foundation tests only — not exhaustive future-module testing. Jest+Cypress rejected for this stack. |
| Visual regression tool | **Playwright snapshots** (Phase 1) | QA lead | ✅ **Confirmed 2026-05-09** (D-INFRA-009 🟢). Locked rules: Playwright snapshots are Phase 1 baseline; snapshots stored in repo per Playwright conventions; CI fails on unexpected visual changes; Chromatic/Percy NOT introduced in Phase 1. Reconsider hosted tools later only if design review workflow needs hosted approvals. |
| Lighthouse CI thresholds | **Customer mobile ≥90 / desktop ≥95; Admin mobile ≥85 / desktop ≥90; CWV: LCP<2.0s, INP<200ms, CLS<0.05** | Frontend lead | ✅ **Confirmed 2026-05-09** (D-INFRA-010 🟢). Phase 1 representative customer pages: homepage, PLP, PDP. Phase 1 representative admin pages: dashboard, products, country pricing/stock, warehouses. CI fails if thresholds drop below limits unless approved `performance_budget_override` exists (per `10-overrides/01-override-types.md` — reason ≥30 chars + expiry + audit log + remediation plan). |

## Pre-coding question linkage

Each open question references the corresponding pre-coding question in `15-phases/phase-0-execution-plan.md` §20:

- TODO question 53: Hosting budget tier
- TODO question 70: Secrets manager
- TODO question 67: Backup offsite region

---

## Rejected alternatives (recorded for posterity)

| Alternative | Why rejected | ADR |
|---|---|---|
| Laravel + Inertia/Livewire as primary backend | Splits team; loses RSC/edge advantages | ADR-005 |
| MySQL/MariaDB | Weak Arabic FTS, no proper RLS | ADR-006 |
| Strapi | Acceptable, but Directus wins on Postgres schema fidelity | ADR-004 |
| Astro + React islands | Faster TTFB but second codebase | ADR-001 |
| MedusaJS / Saleor / Vendure | Off-the-shelf engines fight bespoke needs | ADR-001 |
| WordPress + WooCommerce | Fights every requirement (RTL, perf, AI, scale) | ADR-001 |
| Shopify | Cannot implement marketer cost model + AI orchestration in sandbox | ADR-001 |
| Algolia (instead of Meilisearch) | Costs more at scale | ADR-008 |
| OpenAI as default LLM | Acceptable, but Claude leads on Arabic + refusal | ADR-011 |
| GraphQL gateway in front of REST | Adds complexity without clear win | TODO ADR |

---

## Decision-readiness gates

Phase 1 cannot start until **every row above shows status `Confirmed` (no `TODO`)** AND the corresponding ADR is signed off by the named owner.

The PM tracks this checklist weekly during Phase 0.
