# Test Strategy

**Status:** 🟢 Tooling locked 2026-05-09 (D-INFRA-007/008/009 Answered); test scope still Draft
**Owner:** QA lead
**Last updated:** 2026-05-09

> 🟢 **Locked tooling (2026-05-09):** Vitest (unit/integration) · Playwright (E2E + visual regression) · ESLint + Prettier (lint/format). Per D-INFRA-007/008/009. Jest+Cypress and Chromatic/Percy explicitly rejected for Phase 1.

---

## Layers

| Layer | Tool | Coverage |
|---|---|---|
| Lint | **ESLint** (🟢 D-INFRA-007) | TypeScript + React + Next.js + Tailwind + accessibility + import rules |
| Format | **Prettier** (🟢 D-INFRA-007) | All source files; CI fails on format errors |
| Unit | **Vitest** (🟢 D-INFRA-008) | Pure functions, utilities, validators |
| Integration | **Vitest** + supertest (🟢 D-INFRA-008) | API routes, DB queries |
| **RLS** | Custom Postgres test runner | Cost privacy, country scoping |
| E2E | **Playwright** (🟢 D-INFRA-008) | Customer flows, admin flows, country selector, RTL/LTR |
| Visual regression | **Playwright snapshots** (🟢 D-INFRA-009) | Both RTL and LTR; in-repo snapshots; Chromatic/Percy NOT in Phase 1 |
| Lighthouse | **Lighthouse CI** (🟢 D-INFRA-010 thresholds locked) | Customer mobile ≥90 / desktop ≥95; Admin mobile ≥85 / desktop ≥90 |
| Golden conversation | Custom replayer | AI chat regression |
| Accessibility | axe-core via Playwright | WCAG AA |
| Security | Semgrep + Trufflehog + custom | Cost-leak grep, secrets |

## Phase 1 baseline

- 70% unit coverage on shared utilities
- 100% coverage on RLS policy paths
- E2E: critical paths (PLP → PDP, Country admin CRUD, Warehouse admin CRUD)
- Visual regression: 3 reference screens in 6 locale × 2 direction combinations (Playwright snapshots in-repo)
- **Lighthouse thresholds (🟢 D-INFRA-010 locked):**
  - Customer-facing mobile ≥ 90 (homepage / PLP / PDP)
  - Customer-facing desktop ≥ 95 (homepage / PLP / PDP)
  - Admin mobile ≥ 85 (dashboard / products / country pricing/stock / warehouses)
  - Admin desktop ≥ 90 (same admin pages)
  - Core Web Vitals: LCP < 2.0s; INP < 200ms; CLS < 0.05
- **Phase 1 focuses on foundation tests only** — not exhaustive future-module testing (per D-INFRA-008 locked rule).

## CI gates

- Lint + type check
- Unit + integration
- RLS test
- Visual regression
- Lighthouse
- Cost-leak grep
- Trufflehog secrets scan

Failures block PR.

## Test data

- Seed scripts produce realistic test data (countries, products, marketers, etc.).
- No production data in test environments.

## TODO

- ~~TODO: tool decisions (Vitest vs Jest; Playwright vs Cypress).~~ — 🟢 **ANSWERED 2026-05-09 (D-INFRA-008):** Vitest + Playwright.
- ~~TODO: visual regression service (in-house Playwright vs Chromatic).~~ — 🟢 **ANSWERED 2026-05-09 (D-INFRA-009):** Playwright snapshots for Phase 1; Chromatic/Percy reconsidered later only if needed.
- TODO: load testing tool (k6, Artillery).
- TODO: golden conversation corpus + replayer (Phase 3 design).
