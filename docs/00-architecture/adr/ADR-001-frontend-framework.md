# ADR-001 — Frontend framework: Next.js 15 App Router + TypeScript

**Status:** Proposed
**Date:** 2026-05-07
**Owner:** CTO
**Supersedes:** none
**Superseded by:** none

---

## Context

Smart Ladders Commerce is a multi-surface platform serving:
- 6 locales (`ar-sa, ar-eg, ar-iq, en-sa, en-eg, en-iq`) with future country expansion.
- Public commerce site (homepage, PLP, PDP) needing strong SEO and CWV.
- Group sales pages and fast direct-response landing pages with strict JS budgets.
- Programmatic SEO landing pages refreshed on price/stock change.
- Interactive surfaces (Ladder Finder, Compare, Reach Calculator, Cart) requiring rich UX.
- Web chat widget integrated with AI orchestrator and WhatsApp.

Requirements:
- Strong RTL/LTR support
- ISR for SEO landings
- React Server Components to reduce mobile JS payload (MENA 4G coverage matters)
- Sub-path locale routing for hreflang correctness
- Edge middleware for geo-detection
- Mature image optimization (AVIF/WebP, responsive `srcset`)
- TypeScript across the stack

## Options considered

| Option | Verdict | Reason |
|---|---|---|
| **Next.js 15 App Router + TypeScript** | ✅ Selected | Native i18n routing, RSC, ISR, edge middleware, large ecosystem |
| Next.js 14 | ❌ Rejected | App Router stable in 15; no reason to start one major behind |
| Pages Router (Next.js) | ❌ Rejected | Loses RSC benefits; ecosystem moving to App Router |
| Astro + React islands | ❌ Rejected | Faster TTFB but interactive surfaces dominate; second mental model |
| SvelteKit | ❌ Rejected | Smaller ecosystem; weaker Arabic-aware component libraries |
| Nuxt 3 | ❌ Rejected | Smaller ecosystem for this stack profile; team familiarity matters |
| Remix | ❌ Rejected | Strong DX but App Router has caught up; fewer commerce examples |
| Pure React + Vite | ❌ Rejected | No SSR/ISR built-in; significant work to recreate |

## Decision

Use **Next.js 15 App Router + TypeScript**.

Specifics:
- App Router (`app/` directory, not `pages/`).
- React Server Components by default.
- TypeScript strict mode.
- `next-intl` for i18n (selected separately in ADR-025).
- `pnpm` as package manager (TODO confirm).
- Node 20 LTS or later runtime.

## Consequences

### Positive
- Strong SEO + ISR for landing pages.
- Edge middleware enables geo + locale detection without extra hop.
- RSC reduces shipped JS — beneficial for MENA 4G users.
- Mature image optimization via `next/image`.
- Large ecosystem for shadcn/ui, Tailwind, auth libraries, payment SDKs.

### Negative / risks
- App Router still evolving; may require careful upgrade discipline.
- Team learning curve if unfamiliar with RSC mental model.
- Vercel-optimized; self-hosted deployments need explicit care for ISR + edge runtime.

### Mitigations
- Lock Next.js minor version in `package.json`; controlled upgrades.
- Internal documentation (see `02-api/01-conventions.md`) on RSC vs Client Component patterns.
- Test self-hosted Next.js (e.g., on Hetzner) early during Phase 1 if Vercel is not the final hosting choice.

## References

- Master Plan v4 §2 (Final Stack Recommendation)
- Master Plan v4 §3 (Alternative Stack Evaluation)
- ADR-025 (Locale routing)
- ADR-029 (shadcn/ui CLI)
