# Phase 1 Starter Prompt

**Status:** Approved when Phase 0 closes
**Use:** Copy-paste this exact prompt to start Phase 1 implementation.

---

```
Phase 0 is complete and signed off. All 30 ADRs accepted, all 80 pre-coding
questions answered, all infrastructure provisioned (empty), payment + WhatsApp
applications in flight, brand assets finalized, photography booked.

We are now starting Phase 1 — Foundation MVP for KSA, single product live in
ar-sa + en-sa, in 4 weeks.

ALLOW Claude Code to access, read, inspect, analyze, edit, and save project
files as needed to complete Phase 1.

Reference documents (in /docs):
- /00-architecture/adr/* (all accepted ADRs)
- /01-database/* (schema, RLS, indexes, migration plan)
- /02-api/* (OpenAPI spec, webhook events)
- /03-rbac/* (roles, permissions, RLS policies, cost privacy)
- /11-admin-ui/* (information architecture, screen list)
- /12-public-site/* (sitemap, route list)
- /15-phases/phase-1-acceptance.md (acceptance criteria)
- /15-phases/phase-1-execution-plan.md (sprint scope)

Phase 1 scope (locked):
1. Next.js 15 App Router + TypeScript + Tailwind v4 + shadcn/ui scaffold.
2. pnpm workspace, ESLint + Prettier, GitHub Actions CI.
3. Locale routing for 6 locales via next-intl (placeholders for non-KSA).
4. RTL/LTR design system validated on 3 reference screens; visual regression in CI.
5. PostgreSQL schema migrated for catalog + customer + cost + country + warehouse
   modules WITH Row-Level Security policies enforced.
6. Directus deployed on Hetzner/AWS me-south-1, schema introspected.
7. Cloudflare CDN in front; R2 wired for media.
8. One product fully entered in Directus (ar-sa + en-sa) with images, video,
   certifications, country pricing for KSA, warehouse stock for one KSA warehouse.
9. Homepage, PLP, PDP rendering correctly in ar-sa and en-sa.
10. WhatsApp "Order Now" button on PDP linking to KSA WhatsApp number.
11. System → Countries admin functional (add/edit/activate/deactivate).
12. Operations → Warehouses admin functional.
13. Product → Country Pricing & Stock tab functional with Profit Guardrails
    soft warnings (hard enforcement lands Phase 5).
14. Audit log triggers active on price/cost/stock changes.
15. Daily Postgres backup running with checksum verification.
16. Lighthouse mobile ≥90 on PDP; visual regression CI green in both directions.
17. RLS test in CI: non-finance role returns 0 rows on actual_cost SELECT.
18. Country dynamism test in CI: adding a 4th country requires zero code changes.

Restrictions:
- Do not touch .env or secrets. Use the secrets manager for all credentials.
- Do not expose API keys or cost columns in any response, log, or webhook.
- Do not deploy to production. Staging only.
- Do not run migrations against any database without my approval.
- Do not install packages without naming them and getting approval first.
- Create a backup before any risky change.
- Report all files changed and commands run at the end of each work session.

Begin Phase 1 by:
1. Reading /docs/15-phases/phase-1-acceptance.md and confirming you understand
   every criterion.
2. Producing a sprint-by-sprint breakdown of the 4-week Phase 1 with explicit
   deliverables per sprint.
3. Listing every package you propose to install with justification, before
   installing any.
4. Asking me to approve the sprint plan and package list before you begin.

Do not write code until I approve the sprint plan and package list.
```

---

## Why this prompt is structured the way it is

- **Explicit scope grant** for `/docs` work and Phase 1 implementation (Phase 0 forbade application code).
- **References Phase 0 documentation** so the implementer reads the blueprint first.
- **Locks scope** to prevent drift.
- **Imposes structural restrictions** mirroring v4 (RLS, no cost leakage, audit triggers, backup before risky changes).
- **Forces a sprint plan + package approval gate** before any code is written.
- Aligns Phase 1 acceptance with `phase-1-acceptance.md`.

## When to send

Send this prompt only after:
- All Phase 0 acceptance criteria in `phase-0-execution-plan.md §22` met.
- Stakeholder sign-off recorded.
- Engineering team identified and ready.
