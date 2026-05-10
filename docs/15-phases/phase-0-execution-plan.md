# Phase 0 Execution Plan

**Status:** Approved (planning baseline)
**Owner:** PM + CTO
**Source:** Master Plan v4 → Phase 0 conversion

This document is the canonical Phase 0 plan. It supersedes any earlier draft.

---

## Objective

Convert Final Master Plan v4 into a complete, decision-ready blueprint for Phase 1 — without writing code.

By Phase 0 close:
- Every architectural decision recorded.
- Every external dependency contracted or in-flight.
- Every schema, API contract, RBAC matrix, RLS policy, AI tool spec exists as a document.
- Every risk has a named owner.
- Phase 1 can start with the prompt in `phase-1-prompt.md`.

## Scope

A. Decisions & ADRs
B. Schema design
C. API contracts
D. RBAC + RLS specs
E. AI architecture spec
F. Payment architecture spec
G. WhatsApp architecture spec
H. Reporting spec
I. Backup/restore spec
J. Import/export spec
K. Override module spec
L. Admin dashboard wireframes
M. Mobile admin wireframes
N. Public site wireframes
O. Brand & content prep
P. Infrastructure provisioning (empty)
Q. Third-party applications submitted
R. Secrets manager chosen
S. Risk register
T. Phase 1 acceptance criteria
U. Phase 1 starter prompt

## Exclusions

- ❌ Application code
- ❌ DB schema in real DB
- ❌ Migrations
- ❌ Package installs
- ❌ Production secrets / API keys / payment credentials / webhook secrets
- ❌ Live WhatsApp templates (only applications submitted)
- ❌ Live payments testing
- ❌ Directus collections beyond paper design
- ❌ Photography / video shooting (booked, not yet shot)
- ❌ Final Arabic copy
- ❌ AI agents
- ❌ Admin UI / storefront UI
- ❌ High-fidelity design comps

## Required documents

See `15-phases/phase-0-execution-plan.md` Section 19 in the canonical conversation transcript or the Phase 0 plan provided to the team. All documents under `/docs/<module>/` of this repo.

## Deliverables checklist

See `phase-1-acceptance.md` for the gating criteria.

## Phase 0 close target date (🟢 D-LAUNCH-010 locked 2026-05-09)

**Phase 0 close target = end of week 3 from Phase 0 start.** Stakeholder sign-off meeting scheduled at end-of-week-3.

**Important clarification:** Phase 0 close does NOT require completion of every external dependency. Photography, WhatsApp Meta approval, payment provider approvals, content delivery, and brand asset production must be **initiated from Day 1** (per the Day-1 Parallel-Track Operational Actions section above) but their **completion is tracked during Phase 1**, not Phase 0.

Phase 0 close requires:
1. Stakeholder sign-off recorded (CTO + Finance Director + Ops Director + Security Lead + PM)
2. Phase 1 readiness confirmed:
   - Architecture spine locked (39 answered decisions per `PHASE_0_DECISIONS_TODO_TRACKER.md`)
   - Documentation cleanup complete (Steps 1, 2, 3 + final accuracy fixes done)
   - 7 Day-1 parallel-track actions kicked off (initiated, not completed)
   - 12 operational decisions resolved (close in Phase 0 review meeting)
3. Phase 1 starter prompt approved (`phase-1-prompt.md`)

Risk P0-07 (Phase 0 sliding indefinitely) is mitigated by this hard close date.

## Acceptance criteria

Phase 0 is complete when:
- [ ] All 30 ADRs accepted
- [ ] Stack decision checklist 100% complete
- [ ] All 80 pre-coding questions answered in writing
- [ ] ERD covers all 70+ tables
- [ ] RBAC matrix with zero TBDs
- [ ] OpenAPI spec validates
- [ ] At least one of {Stripe, Moyasar, Tap} approved for KSA card processing
- [ ] WhatsApp Business Cloud API approved + ≥1 KSA number verified + ≥6 templates approved
- [ ] DNS at Cloudflare and verified
- [ ] All accounts provisioned per §21.C
- [ ] Backup destination buckets created and writable
- [ ] Encryption key generated, escrowed, recovery drill scheduled
- [ ] Engineering team identified per workstream
- [ ] Designer assigned
- [ ] Arabic copywriter contracted
- [ ] Photography shoot booked
- [ ] Stakeholder sign-off recorded
- [ ] Phase 1 acceptance criteria written and signed off
- [ ] Phase 1 starter prompt approved

## Day-1 Parallel-Track Operational Actions (🟢 added 2026-05-09 — Phase 0 Cleanup Step 3)

> ⚠️ **These tasks must be initiated on Day 1 of Phase 0**, in parallel with documentation work. They are gated by **external lead times** (Meta approval, photographer booking, copywriter sourcing, payment-provider review cycles, finance budget approval) — if deferred to Phase 0 week 2 or 3, they become Phase 1 blockers AT Phase 1 start. Documentation cleanup and operational kickoff are independent workstreams; assign separate owners.

| # | Action | Owner | Day-1 deadline | Lead time | Tracks |
|---|---|---|---|---|---|
| 1 | **Photography** — finalize photography brief (`13-brand/photography-brief.md`); contact at least **3 photographers or studios** with the 10-SKU shot list (per `LAUNCH_CATALOG.md` §5: 10 SKUs × ~7 shots + 10 video clips); request quotes + sample portfolios + availability windows. | Design lead + Ops lead | EOD Day 1 | 4–6 weeks (incl. post-production) | D-LAUNCH-011 |
| 2 | **Arabic Copywriter** — finalize copywriter brief (`13-brand/copywriter-brief.md`); shortlist + initial outreach to native Saudi Arabic copywriters; aim to contract 1 by week 1 end. | Content lead | EOD Day 1 | 1–2 weeks to contract; ongoing delivery | D-SEO-005 |
| 3 | **WhatsApp Business Cloud API** — submit Meta WhatsApp Business Cloud API application; collect required documents (commercial registration, KSA business address, contact name + email + phone). | Ops lead | EOD Day 1 | 1–4 weeks Meta approval | D-WA-001 |
| 4 | **KSA WhatsApp Number** — start procurement / verification process for KSA WhatsApp number (dedicated SIM, virtual line, OR hosted number); add to Meta Business Manager once D-WA-001 approved. | Ops lead | EOD Day 1 (procurement initiated) | 1–4 weeks (depends on D-WA-001) | D-COUNTRY-010 |
| 5 | **Payment Providers** — submit applications **in parallel** for Stripe + Moyasar + Tap + Tabby + Tamara + Paymob + ZainCash. Whichever approves first wins KSA primary; others become redundancy / multi-country future. | Finance + Ops | EOD Day 1 | 1–4 weeks per provider | D-PAY-010 |
| 6 | **Brand Assets** — audit current brand assets and identify gaps: logo (SVG + raster + variants), color palette (primary / secondary / semantic), typography pair (IBM Plex Sans Arabic + body fallback), product photo style guide, social templates (per platform). Decide: existing brand vs build from scratch. | Design lead + CEO | EOD Day 1 (audit complete) | 1–3 weeks if rebuild needed | D-LAUNCH-005 |
| 7 | **Hosting Budget** — prepare hosting budget approval memo for CFO covering: Vercel Pro signup, Hetzner Frankfurt sizing (per ADR-018), Cloudflare plan tier (Pro recommended), R2 bucket creation, 1Password seat licenses (per D-BKP-001), Backblaze B2 account (per D-BKP-002). Itemized monthly + annual costs. | Finance Director + Infra lead | EOD Day 1 (memo drafted) | 3–7 days for CFO sign-off | D-LAUNCH-006 |
| 8 | **DPO designation** (🟢 D-LAUNCH-013 Answered 2026-05-09) — Designate internal DPO. Preferred: Legal Lead. Interim: Operations Director with privacy responsibility + training. **Hard rule:** Phase 0 close requires the DPO designation to be recorded (named individual + email + start date). External DPO contracted Phase 4+ if volumes warrant. | Legal | EOD Day 7 (designation recorded) | Days | D-LAUNCH-013 |

### Why these are Day-1 (not Day-7 or Day-14)

These 7 actions all share two properties:
1. **External lead time** — they depend on third parties (Meta, photographers, copywriters, payment providers, CFO) whose response time is OUR lead time and is not under our control.
2. **They block Phase 1 launch readiness** — without photography there's no PDP; without copywriter there's no Arabic copy; without WhatsApp approval there's no "Order Now" button; without payment providers there's no checkout in Phase 6; without brand there's no design system; without hosting budget there's no infrastructure.

If any of these are deferred to Phase 0 week 2 or 3, the lead time push them into Phase 1 sprint 2 or later, where they become **execution blockers** instead of **planning items**. The fix is cheap (initiate Day 1, accept some context will refine over Phase 0 weeks 2–3); the cost of skipping is expensive (Phase 1 slip).

### Tracking

Each Day-1 action ties to a Top 10 Phase 1 blocker in `PHASE_0_DECISIONS_TODO_TRACKER.md`. Status updates roll into the tracker daily until the blocker closes. **Operations Director owns the daily standup for these 7 items** for the duration of Phase 0; Documentation cleanup runs as a separate parallel workstream.

### What is NOT Day-1

The following are also Phase 1 blockers but do NOT need Day-1 initiation (they have shorter lead times OR depend on Day-1 outcomes):

- D-LAUNCH-007 (Engineering team allocation) — internal CTO decision, Day 5
- D-LAUNCH-010 (Phase 0 close target date) — internal PM decision, Day 1 review meeting outcome
- D-LAUNCH-013 (Privacy officer / DPO designation) — internal Legal decision, Day 7
- D-COUNTRY-013 (Inventory authority Directus vs ERP) — internal CTO + Ops decision, Day 7
- D-INFRA-006 (Package manager pnpm/npm/yarn) — engineering tooling, hours not days

---

## Phase 0 → Phase 1 handoff

Send the prompt in `phase-1-prompt.md` to begin Phase 1.

## TODO

- This is a stub linking to the original Phase 0 plan delivered in conversation. Full document content lives there.
- Mirror full Phase 0 plan verbatim into this file if a single-source-of-truth file is desired.
