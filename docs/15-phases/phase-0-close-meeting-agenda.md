# Phase 0 Close Meeting — Agenda + Sign-Off Checklist

**Status:** Ready for stakeholder review (target: end of Phase 0 week 3 per D-LAUNCH-010)
**Owner:** PM
**Last updated:** 2026-05-09
**Source:** Phase 0 cleanup steps complete; 45 architectural / governance / tooling decisions answered; 4 remaining operational long-lead items in flight per Day-1 checklist

---

## A. Meeting objective

This meeting confirms Phase 0 closes and Phase 1 sprint 1 begins. By the end of the meeting:

1. Phase 0 documentation is **confirmed complete** by all named stakeholders
2. Architecture spine is **confirmed locked** (45 of 158 tracked decisions answered; all 10 cross-phase architecture decisions answered)
3. Phase 1 scope is **confirmed realistic** (~117 Must Have acceptance items per `phase-1-acceptance.md`, down from 241 — 51% reduction)
4. Day-1 operational actions are **confirmed initiated** (8 actions per `phase-0-execution-plan.md` Day-1 Parallel-Track Operational Actions section)
5. Stakeholder sign-offs are **recorded** (5 named roles)
6. **Phase 1 sprint 1 is approved to begin** the week following this meeting using the prompt in `phase-1-prompt.md`

This is a **close meeting**, not a working meeting. Documentation work is finished; no new architectural changes are in scope here.

---

## B. Required attendees

| Role | Required? | Authority |
|---|---|---|
| **CTO / Technical Lead** | ✅ Required | Architecture + Phase 1 technical readiness sign-off |
| **Finance Director** | ✅ Required | Cost privacy + profit guardrails + hosting budget sign-off |
| **Operations Director** | ✅ Required | Warehouse + shipping + Day-1 operational actions sign-off |
| **Security Lead** | ✅ Required | RBAC + RLS + secrets + audit sign-off |
| **PM / Project Owner** | ✅ Required | Scope + timeline + blockers sign-off; chairs the meeting |
| **Legal / DPO** | ✅ Required | Privacy ownership + PII rules sign-off (per D-LAUNCH-013) |
| **Design Lead** | 🟡 Optional but recommended | Brand assets status; design tokens; photography brief status |
| **Content Lead** | 🟡 Optional but recommended | Arabic copywriter status; copy delivery plan |
| **DBA** | 🟡 Optional but recommended | Migration plan + RLS + indexes |
| **Frontend Lead** | 🟡 Optional but recommended | CI tooling stack (pnpm + ESLint+Prettier + Vitest+Playwright + Lighthouse) |

**Quorum rule:** all 6 required attendees must be present (or have delegated written authority) for the close to proceed.

---

## C. Decisions already closed (45 of 158 tracked)

The architecture spine is locked. The following decisions are 🟢 Answered and should NOT be reopened in this meeting unless a stakeholder identifies a blocking issue.

### Database / Schema (5)
- **D-DB-001** — `customer_orders` plural naming (no bare `order` / no quoted `"order"`)
- **D-DB-002** — `gen_random_uuid()` from `pgcrypto` for ALL UUID PKs (no `uuid_generate_v4()`)
- **D-DB-003** — `numeric(12,2)` for ALL monetary columns (no `float`/`double`/`real`/`money`)
- **D-DB-010** — Mixed soft-delete / never-delete / hard-delete-after-retention / PII-anonymization policy (4 classes)
- **D-INFRA-004** — Schema migration tool: `node-pg-migrate` (SQL-first; ORM-free)

### Country / RBAC / Cost Privacy (8)
- **D-COUNTRY-001 / D-COUNTRY-002 / D-COUNTRY-014 / D-COUNTRY-015** — Dynamic country / pricing-stock matrix / launch warehouses / warehouse management workflow
- **D-RBAC-001** — Cost privacy: only Super Admin + Finance Admin read `actual_product_cost`; defense-in-depth across 7 layers
- **D-CSP-001 / D-CSP-002 / D-CSP-003 / D-CSP-004** — Country Access Control: RBAC extension + page classification rule + `country_scope.all` permission slug + country denormalization rule

### Profit Guardrails / Payments (3)
- **D-PAY-002** — Business margin floors per country (KSA 20% / EG 18% / IQ 22%; configurable, NOT hardcoded)
- **D-PAY-003** — Marketer margin floor 5% uniform; configurable
- **D-OPS-010** — Configurable shipping providers + rate cards (no hardcoded couriers / cities / fees / SLAs); J&T Express selected as KSA initial primary (D-OPS-003)

### Engineering Tooling (5)
- **D-INFRA-006** — Package manager: **pnpm** (with locked rules: `pnpm-lock.yaml` committed; CI uses `pnpm install --frozen-lockfile`; no mixed lockfiles)
- **D-INFRA-007** — Linter + formatter: **ESLint + Prettier**
- **D-INFRA-008** — Test framework: **Vitest + Playwright**
- **D-INFRA-009** — Visual regression: **Playwright snapshots** for Phase 1
- **D-INFRA-010** — Lighthouse CI thresholds: customer mobile ≥90 / desktop ≥95; admin mobile ≥85 / desktop ≥90; CWV: LCP<2.0s / INP<200ms / CLS<0.05

### Hosting / Backups / Secrets (3)
- **D-INFRA-001 / D-INFRA-018** — Hosting backend: Hetzner Frankfurt for Phase 1 (AWS me-south-1 future migration option); domain: `ladders.vtc-me.com`
- **D-BKP-001** — Secrets manager: 1Password Secrets Automation (7-vault structure)
- **D-BKP-002** — Backup destinations: Cloudflare R2 primary + Backblaze B2 offsite

### Strategic Modules (4)
- **D-DEC-001** — Decision & Recommendation Engine (Module 24)
- **D-SAFE-001** — Safety & Compliance Center (Module 25)
- **D-TRUST-001** — Trust Layer (Module 26)
- **D-READY-001** — Unified Readiness Engine (Module 27)

### Cross-cutting Architecture (4)
- **D-PERF-001** — Performance, Cleanup, Landing Page Growth & Alerts System (~25 permission slugs; 18 hard safety rules; 8 alert categories — split into 9 per-topic files)
- **D-PERF-002** — Script Inventory joint review (Security Lead + Marketing Manager)
- **D-PERF-003** — 5 new override types (15 total)
- **D-PERF-004** — Role × permission matrix CSV produced (24 roles × ~165 slugs)

### Operating Principles (1)
- **D-READY-002** — Build Now, Activate When Ready (configured ≠ active across 19 entity types)

### Privacy + Inventory (2)
- **D-LAUNCH-013** — Internal DPO designated (Legal Lead OR Operations Director as interim)
- **D-COUNTRY-013** — Inventory authority: Admin Dashboard / Directus-style admin only Phase 1; ERP deferred to Phase 10+

### Documentation Cleanup (4)
- **D-PHASE1-001** — Phase 1 acceptance scope reduction (241 → ~117 Must Have)
- **D-DOC-001** — Documentation cleanup + monolith split into 9 per-topic files
- **D-RBAC-MATRIX-001** — Role × permission CSV produced
- **D-CACHE-001** — Session-level Redis permission cache layer

### Schedule (1)
- **D-LAUNCH-010** — Phase 0 close target: end of week 3 from Phase 0 start

### Operational ownership (1)
- **D-OPS-003** — KSA initial primary logistics provider: J&T Express

**Total: 45 of 158 tracked decisions answered.** All architectural, governance, tooling, and operational doctrine decisions are closed.

---

## D. Remaining operational items (NOT decisions; long-lead actions in flight)

These items are **NOT decisions to make in this meeting.** They are external-dependency long-lead actions already initiated per the Day-1 Parallel-Track Operational Actions checklist in `phase-0-execution-plan.md`. **Per D-LAUNCH-010 lock, Phase 0 close requires only INITIATION of these items, not completion.** Completion tracks during Phase 1.

| # | Action | Owner | Status (to confirm in meeting) | Tracker ID |
|---|---|---|---|---|
| 1 | Photography brief sent to 3+ photographers | Design lead + Ops lead | ⏳ Initiated / Day 1 of close week | D-LAUNCH-011 |
| 2 | Arabic copywriter outreach + shortlist | Content lead | ⏳ Initiated / Day 1 of close week | D-SEO-005 |
| 3 | WhatsApp Business Cloud API submission | Ops lead | ⏳ Initiated / Day 1 of close week | D-WA-001 |
| 4 | KSA WhatsApp number procurement | Ops lead | ⏳ Initiated / Day 1 of close week | D-COUNTRY-010 |
| 5 | Payment provider applications (parallel: Stripe / Moyasar / Tap / Tabby / Tamara / Paymob / ZainCash) | Finance + Ops | ⏳ Initiated / Day 1 of close week | D-PAY-010 |
| 6 | Brand assets audit | Design lead + CEO | ⏳ Initiated / Day 1 of close week | D-LAUNCH-005 |
| 7 | Hosting budget memo to CFO | Finance Director + Infra lead | ⏳ Initiated / Day 1 of close week | D-LAUNCH-006 |
| 8 | DPO designation recorded | Legal | ⏳ Recorded by EOD Day 7 of close week | D-LAUNCH-013 |

**Internal CTO call (in meeting):** D-LAUNCH-007 — Engineering team allocation per workstream. Recommendation: Frontend 2 + Backend 2 + DBA + DevOps for Phase 1; AI specialist added Phase 3.

---

## E. Sign-off checklist

Each stakeholder confirms their domain in the meeting and signs off (recorded in meeting minutes).

| Stakeholder | Area | Must confirm | Status |
|---|---|---|---|
| **CTO** | Architecture + Phase 1 technical readiness | Approves Phase 1 technical plan; confirms 45 decisions are correctly architectural; confirms CI pipeline (12 steps per `phase-1-execution-plan.md`); locks engineering team allocation (D-LAUNCH-007). | ⏳ Pending |
| **Finance Director** | Cost privacy + profit guardrails + budget | Approves finance controls (cost.read RLS lockdown to Super Admin + Finance Admin only; profit floor seeds per country; cost-bearing export gating; cost_read_log Phase 2 mandatory instrumentation); approves hosting budget memo. | ⏳ Pending |
| **Operations Director** | Warehouse + shipping + Day-1 actions | Confirms operational readiness: RUH-01 warehouse seeded; J&T Express selected (operational onboarding TODO list in flight); Day-1 actions 1-7 initiated; inventory authority lock (D-COUNTRY-013) understood. | ⏳ Pending |
| **Security Lead** | RBAC + RLS + secrets + audit | Approves security controls: 24 roles × 165+ slugs CSV; D-RBAC-001 cost privacy defense-in-depth; D-CSP-001/002/003/004 Country Access Control; D-CACHE-001 permission cache layer (RLS still authoritative); 1Password 7-vault structure; YubiKey MFA on Super Admin / Finance Admin / Security Lead accounts. | ⏳ Pending |
| **PM / Project Owner** | Scope + timeline + blockers | Approves moving to Phase 1: ~117 Must Have items realistic for 4-week phase; 4 open Phase 1 blockers all operational/long-lead per Day-1 checklist; Phase 0 close end-of-week-3 met; Phase 1 starter prompt approved. | ⏳ Pending |
| **DPO / Legal** | Privacy ownership + PII rules | Approves privacy ownership: internal DPO designation recorded with named individual + email + start date (D-LAUNCH-013); reviewed `17-compliance/ksa-pdpl.md` + `17-compliance/egyptian-pdpl.md` + `17-compliance/iraqi-data-laws.md` + `17-compliance/consent-records.md`; approver in customer schema (migration 0007) + customer.export workflow + consent management. | ⏳ Pending |

**Recording rule:** sign-offs are recorded in meeting minutes with name + date + any attached caveats. Caveats become Phase 1 sprint 1 issues, not Phase 0 reopens.

---

## F. Go / No-Go decision

At the end of the meeting, PM proposes one of three outcomes:

### Option A: GO — Start Phase 1 Sprint 1

All 6 stakeholders sign off without caveats. All 8 Day-1 operational actions confirmed initiated. Engineering team allocated. Phase 1 sprint 1 starts the following week per the prompt in `phase-1-prompt.md`.

### Option B: GO WITH ACTIONS — Start Phase 1 with tracked operational actions

All 6 stakeholders sign off, but with named action items (e.g., specific Day-1 actions still need confirmation; CFO sign-off on hosting budget pending; Meta WhatsApp approval not yet received). Phase 1 sprint 1 starts on schedule; tracked actions roll into Phase 1 weekly status reports owned by Operations Director.

**Recommended outcome.** This is the realistic close because some Day-1 actions (especially Meta approval, photography contracting, payment provider responses) take days-to-weeks and may not all be visibly progressed by the end-of-week-3 close meeting.

### Option C: NO-GO — Blocked by unresolved stakeholder issue

A stakeholder identifies a blocking issue that requires architecture reopening, scope expansion, or material risk re-evaluation. PM reschedules close meeting; documents the blocker in tracker as a new decision with severity 🚨 Critical.

**This option should NOT be needed.** All architectural, governance, and tooling decisions are 🟢 Answered. If a stakeholder finds a new blocker, it indicates a missed gap in Phase 0 — investigate cause + re-plan close.

---

## Recommended outcome

**Option B: GO WITH ACTIONS.**

Reasoning:
- Architecture spine fully locked (45 answered decisions; 0 proposed; 113 open but none architectural)
- Phase 1 scope realistic (~117 Must Have items; matches 4-week capacity)
- Day-1 operational actions in flight (Operations Director runs daily standup)
- DPO designation locked
- Engineering tooling stack locked
- CI pipeline 12-step spec ready for sprint 1 wiring
- 4 remaining open Phase 1 blockers are external-dependency operational items (photography / copywriter / WhatsApp / payment providers) tracked through Phase 1 per D-LAUNCH-010 lock

Phase 1 sprint 1 begins the week following this meeting.

---

## Meeting minutes template

(To complete during/after the meeting)

| Field | Value |
|---|---|
| Meeting date | TODO |
| Attendees (name + role) | TODO |
| Outcome | A / B / C |
| Decisions made in meeting | D-LAUNCH-007 (engineering team allocation): [count + roles] |
| Caveats per stakeholder | TODO |
| Phase 1 sprint 1 start date | TODO |
| Tracker action items rolling into Phase 1 | TODO |
| Next status checkpoint | Weekly status report week 1 of Phase 1 |

Save completed minutes to `15-phases/phase-0-close-meeting-minutes.md` (TODO file at meeting end).
