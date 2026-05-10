# Risk Register

**Status:** Draft
**Owner:** PM + Security lead
**Last updated:** 2026-05-07

Consolidated risks from Master Plan v3, v4, and Phase 0 Execution Plan. Each numbered for traceability.

---

## Format

`# | Risk | Likelihood | Impact | Owner | Mitigation | Status`

---

## Master Plan v3/v4 risks (1–58)

| # | Risk | L | I | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|
| 1 | LLM hallucinates product specs | M | **Critical** | AI lead | Tools-only retrieval; golden conversation suite; refusal-on-uncertainty | Active |
| 2 | actual_cost leaks via API or admin | L | **Critical** | Security | RLS + scope checks + audit log + CI tests | Active |
| 3 | Marketer cost override breaks profit floor | M | High | Finance | Profit Guardrails on save | Phase 5 |
| 4 | Coupon stacking creates negative-margin | M | High | Backend | Cart-time + order-time validation | Phase 5 |
| 5 | Auto-reply fires wrong template | M | M | AI Supervisor | Sandbox before activation | Phase 3 |
| 6 | Marketer attribution conflict | H | M | Marketing | Documented hierarchy | Phase 5 |
| 7 | Landing page custom price below floor | M | High | Marketing | Profit Guardrails on save | Phase 5 |
| 8 | Machine-translated Arabic | H | High | Content | Native copywriter from Phase 0 | Active |
| 9 | Prompt injection from customer | M | High | AI lead | Input sanitization; system prompt above user text | Phase 3 |
| 10 | WhatsApp Cloud API approval delays | M | High | Ops | Submit Phase 0; click-to-WA fallback | Active |
| 11 | Payment provider approval slip | M | High | Finance | Submit Phase 0 in parallel | Active |
| 12 | RTL bugs in third-party libs | H | M | Frontend | Visual regression CI both directions | Phase 1 |
| 13 | Hreflang misconfiguration | M | High | Frontend | Screaming Frog audit; CI test | Phase 1 |
| 14 | Iraqi address rejected for missing postal | H | M | Backend | Country-templated forms; postal optional in IQ | Phase 7 |
| 15 | AI confidence miscalibration | H | M | AI lead | 200-conversation audit; tune thresholds | Phase 3 |
| 16 | LLM token cost overrun | M | M | AI lead | Haiku for cheap; caching; length caps; cost dashboard | Active |
| 17 | Marketer fraud (self-clicks, fake orders) | M | High | Marketing | Quality score; cancellation triggers | Phase 5 |
| 18 | Landing A/B variant pollution | L | M | Frontend | Variant-group cookies | Phase 6 |
| 19 | ZATCA Phase 2 non-compliance | M | High | Finance | Specialist consultant | Phase 7 |
| 20 | Conversation PII leak | L | **Critical** | Security | Redaction pipeline; encryption | Phase 3 |
| 21 | COD confirmation queue overflow | M | M | Ops | SLA dashboards | Phase 4 |
| 22 | Profit Guardrail bypass via UI bug | L | High | Backend | Server-side enforcement | Phase 5 |
| 23 | Stripe webhook signature skipped | L | High | Backend | Mandatory verification middleware | Phase 7 |
| 24 | Stock oversold during reservation race | M | High | Backend | DB row lock; TTL release | Phase 2 |
| 25 | Pre-dispatch photo missing | M | M | Ops | Hard-block dispatch without photo | Phase 9 |
| 26 | Warranty claim flood from one batch | L | High | Maintenance | Defect-rate alert; auto-suppress | Phase 9 |
| 27 | Broadcast in quiet hours | L | High | Marketing | Scheduler enforces quiet hours | Phase 4 |
| 28 | Messaging without consent | L | **Critical** | Legal + Ops | Consent check at dispatch; instant unsub | Phase 4 |
| 29 | API token leak | M | High | Security | Hashed at rest; rotation; anomaly alerts | Phase 1 |
| 30 | Migration ordering data loss | L | **Critical** | DBA | Review process; staging dry-run; daily backups | Phase 1 |
| 31 | Custom pixel script abuse (XSS/exfil) | M | High | Security | Super-admin only; sandboxed worker; CSP | Phase 10 |
| 32 | Tax law change mid-build | M | M | Legal | Tax/legal advisor; defer to config | Active |
| 33 | AI generates fake testimonials/certs | L | **Critical** | AI lead | Output validator; banned-phrase list | Phase 3 |
| 34 | Marketer terminates with pending payouts | M | M | Finance | Reconciliation flow | Phase 5 |
| 35 | Reach Calculator unsafe height advice | L | High | Product | Conservative formula; disclaimer | Phase 6 |
| 36 | Country launched without readiness checks | M | High | Ops | Readiness gate enforced server-side | Phase 8 |
| 37 | Bulk price update applied without preview | L | High | Backend | Mandatory preview + Profit Guardrails | Phase 5 |
| 38 | Product active in country without stock | H | M | Inventory | Readiness flags; storefront filter | Phase 1 |
| 39 | AI promises stock that isn't there | M | High | AI lead | Inventory-aware AI; tool checks | Phase 3 |
| 40 | Dead stock not surfaced to marketing | M | L | Marketing | Dead Stock Campaigns weekly job | Phase 9 |

## v4-specific risks (41–58)

| # | Risk | L | I | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|
| 41 | Bulk import wipes legitimate data | M | **Critical** | Backend | Mandatory preview; per-row diff; pre-action backup | Phase 2 |
| 42 | Cost column leaks via export | M | **Critical** | Security | `cost.export` scope; auto-redaction; audit | Phase 2 |
| 43 | Import bypasses Profit Guardrails | M | High | Backend | Guardrails dry-run at validation step | Phase 5 |
| 44 | Restore to production overwrites valid data | L | **Critical** | Infra | Dual approval; maintenance window; reason | Phase 1 |
| 45 | Backup encryption key lost | L | **Critical** | Security | Key escrow split-knowledge; quarterly drill | Phase 0 |
| 46 | Backup not restorable when needed | M | **Critical** | Infra | Quarterly verification; alert on failure | Phase 1 |
| 47 | `.env` accidentally backed up | L | **Critical** | Security | Explicit exclusion; CI grep test | Phase 1 |
| 48 | Mobile admin used on shared device → session leak | M | High | Security | Short session TTL; biometric re-auth | Phase 10 |
| 49 | Push notifications expose details on lock screen | M | M | Frontend | Summary only; details require unlock | Phase 10 |
| 50 | Override becomes routine | H | M | Security | Quarterly governance review; anomaly alerts | Phase 5 |
| 51 | Override approver rubber-stamps | M | High | Security | Dwell-time tracking; audit | Phase 5 |
| 52 | Override expires unnoticed | L | M | Backend | Notification on apply + on expiry | Phase 5 |
| 53 | Dual-approval bypassed by single actor with two accounts | L | **Critical** | Security | Server-side identity + role + fingerprint checks | Phase 5 |
| 54 | Import scheduled job runs on stale file | L | M | Backend | Files versioned by checksum | Phase 2 |
| 55 | Mobile Lighthouse regression | M | M | Frontend | CI gate at ≥85 | Phase 1 |
| 56 | Pre-risky-change backup adds latency | M | L | Infra | Async with progress indicator | Phase 1 |
| 57 | Manual backup button hammered | L | L | Backend | Rate limit per user | Phase 1 |
| 58 | Override audit log exceeds retention but legal needs it | L | M | Security | 7-year retention | Phase 5 |

## Phase 0 specific risks (P0-01..P0-20)

| # | Risk | L | I | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|
| P0-01 | WhatsApp Business API approval delayed >3 weeks | M | High | Ops | Submit Day 1; weekly check with Meta | Active |
| P0-02 | Payment provider approvals slip | H | High | Finance + Ops | Submit ALL Day 1; COD-only soft launch acceptable | Active |
| P0-03 | ADR conflicts unresolved by Phase 0 close | M | High | CTO | Weekly ADR review; deadlock → CTO decides | Active |
| P0-04 | Pre-coding questions unanswered by Phase 0 close | H | High | PM | Weekly burndown sync | Active |
| P0-05 | Arabic copywriter not contracted in time | M | High | Content | Identify 3 candidates Day 1; contract by week 2 | Active |
| P0-06 | Photography shoot date drifts | M | M | Design + Ops | Book Day 1; alternate photographer on standby | Active |
| P0-07 | Stakeholder sign-off delayed | M | High | PM + CTO | Schedule end of week 3; pre-share docs | Active |
| P0-08 | Schema review reveals unanticipated complexity | M | High | DBA | Weekly DBA + backend lead review | Active |
| P0-09 | Encryption key escrow guardians not named | L | High | Security | Name 2 guardians by week 2 | Active |
| P0-10 | Wireframes not at sufficient detail for Phase 1 | M | M | Design | Design check-ins twice/week | Active |
| P0-11 | RLS policy edge case missed → cost leak Phase 1 | M | **Critical** | DBA + Security | RLS peer-reviewed by 2 DBAs; CI plan agreed | Active |
| P0-12 | Stack disagreement reignited | L | High | CTO | ADR-001+005 signed off week 1 | Active |
| P0-13 | Budget approval slips | M | High | Finance Director | Itemize costs week 1; approval week 2 | Active |
| P0-14 | Legal review delays compliance docs | M | M | Legal | Engage week 1; provide templates | Active |
| P0-15 | Test strategy underspecified | M | M | QA | QA writes by week 2 | Active |
| P0-16 | Mobile wireframes missed | M | M | Design | Mobile own track | Active |
| P0-17 | Override policy defaults not signed by Finance | M | High | Finance + Security | Finance review by week 3 | Active |
| P0-18 | LLM token budget too low for realistic conversations | M | M | AI lead | Pilot 50 conversations; revise | Active |
| P0-19 | Initial FAQ corpus author not contracted | M | High | Content | Same as copywriter or separate, contracted by week 2 | Active |
| P0-20 | Pre-launch logistics partner contracts not signed | M | High | Ops | Procurement Day 1; alternates | Active |

---

## TODO

- TODO: weekly review of risk register; update Status column.
- TODO: identify additional risks during Phase 0 work.
- TODO: severity recalibration after stakeholder review.
