# Smart Ladders Commerce — Documentation

This is the documentation repository for the **Smart Ladders Commerce Platform**, an Arabic-first smart ecommerce platform for selling ladders in Saudi Arabia, Egypt, Iraq, and future countries.

---

## Status

| Field | Value |
|---|---|
| **Phase** | Phase 0 — Documentation Drafts |
| **Master Plan version** | v4 (signed off) |
| **Phase 0 Execution Plan** | Signed off |
| **Started** | 2026-05-07 |
| **Implementation status** | Not started — no code written yet |

> ⚠️ **No application code exists yet.** This documentation is generated from the approved Final Master Plan v4. Many decisions are still pending and marked with `TODO` — those require business sign-off before Phase 1 can begin.

---

## Important Rules for Contributors

- This is **documentation only**. No code, no migrations, no live integrations.
- **Cost data, secrets, API keys, payment credentials are NOT in any document.** If you find any, remove immediately and rotate the credential.
- Where decisions are pending, files contain `TODO` markers — **do not invent answers**. Bring the question to the Phase 0 review meeting.
- All files use **UTF-8** encoding to support Arabic content.
- Internal links use relative paths.
- Diagrams in Mermaid (text-in-repo, version-controlled).

---

## Folder Structure

```
/docs
├── README.md                        ← this file
├── GLOSSARY.md                      domain vocabulary
├── ROADMAP.md                       phase summary, links to v4 plan
├── CHANGELOG.md                     documentation change history
│
├── 00-architecture/                 system-level decisions
│   ├── overview.md
│   ├── stack-decisions.md
│   ├── environment-topology.md
│   └── adr/                         Architecture Decision Records (30+)
│
├── 01-database/                     schema, RLS, indexes, migrations
│   ├── 01-erd.md
│   ├── 02-tables-by-module.md       (master schema reference)
│   ├── 03-rls-policies.md
│   ├── 04-indexes.md
│   ├── 05-migration-plan.md
│   ├── 06-views.md
│   └── 07-triggers.md
│
├── 02-api/                          REST API conventions and contract
│   ├── 01-conventions.md
│   ├── 02-openapi.yaml              (OpenAPI 3.1 skeleton)
│   ├── 03-webhook-events.md
│   ├── 04-rate-limiting.md
│   ├── 05-idempotency.md
│   └── 06-versioning.md
│
├── 03-rbac/                         roles, permissions, RLS, cost privacy
│   ├── 01-roles.md
│   ├── 02-permissions.md
│   ├── 03-scopes.md
│   ├── 04-cost-privacy.md
│   └── 05-segregation-of-duties.md
│
├── 04-ai/                           AI sales assistant architecture
│   ├── 01-architecture-overview.md
│   ├── 02-state-machine.md
│   ├── 03-tools.md
│   ├── 04-prompts/                  system prompt templates per locale × state
│   ├── 05-guardrails.md
│   ├── 06-confidence-scoring.md
│   ├── 07-handoff.md
│   ├── 08-inventory-aware-rules.md
│   ├── 09-provider-abstraction.md
│   ├── 10-cost-budgeting.md
│   ├── 11-golden-conversations.md
│   └── 12-logging-and-audit.md
│
├── 05-payments/                     payment provider abstraction
│   ├── 01-providers-matrix.md
│   ├── 02-provider-abstraction.md
│   ├── 03-routing-engine.md
│   ├── 04-stripe.md
│   ├── 05-mada-and-ksa-locals.md
│   ├── 06-bnpl-tabby-tamara.md
│   ├── 07-paymob-fawry.md
│   ├── 08-zaincash-fastpay.md
│   ├── 09-cod-flow.md
│   ├── 10-deposits-payment-links.md
│   ├── 11-refund-dispute.md
│   ├── 12-invoices.md
│   └── 13-webhook-security.md
│
├── 06-whatsapp/                     WhatsApp Cloud API integration
│   ├── 01-cloud-api-overview.md
│   ├── 02-templates.md
│   ├── 03-numbers.md
│   ├── 04-confirmation-flow.md
│   ├── 05-consent-and-optout.md
│   ├── 06-window-policy.md
│   ├── 07-incoming-router.md
│   └── 08-failover.md
│
├── 07-reporting/                    dashboards, metrics, BI
│   ├── 01-dashboard-list.md
│   ├── 02-metric-definitions.md
│   ├── 03-data-quality-issues.md
│   ├── 04-ai-daily-brief.md
│   ├── 05-smart-notifications.md
│   ├── 06-report-builder.md
│   ├── 07-exports.md
│   ├── 08-decision-log-format.md
│   └── 09-experimentation-log-format.md
│
├── 08-backups/                      backup, restore, encryption, DR
│   ├── 01-backup-types.md
│   ├── 02-pre-risky-change-triggers.md
│   ├── 03-restore-runbook.md
│   ├── 04-encryption-key-management.md
│   ├── 05-secrets-exclusion-policy.md
│   ├── 06-verification-plan.md
│   └── 07-disaster-recovery.md
│
├── 09-import-export/                bulk operations
│   ├── 01-supported-entities.md
│   ├── 02-csv-schemas.md
│   ├── 03-validation-rules.md
│   ├── 04-preview-ux.md
│   ├── 05-error-report-format.md
│   ├── 06-bulk-pricing-flow.md
│   ├── 07-cost-import-policy.md
│   └── 08-rollback-policy.md
│
├── 10-overrides/                    manual override policy
│   ├── 01-override-types.md
│   ├── 02-override-policy-defaults.md
│   ├── 03-dual-approval-rules.md
│   ├── 04-reason-categories.md
│   ├── 05-anomaly-detection.md
│   ├── 06-override-runbook.md
│   └── 07-monthly-governance-review.md
│
├── 11-admin-ui/                     admin information architecture
│   ├── 01-information-architecture.md
│   ├── 02-screen-list.md
│   ├── 03-component-inventory.md
│   ├── 04-rtl-ltr-rules.md
│   └── 05-states.md
│
├── 12-public-site/                  storefront sitemap and routing
│   ├── 01-sitemap.md
│   ├── 02-route-list.md
│   ├── 03-locale-routing.md
│   ├── 04-country-switching.md
│   ├── 05-seo-page-types.md
│   └── 06-rtl-ltr-rules.md
│
├── 13-brand/                        visual identity and content briefs
│   ├── tokens.md
│   ├── typography.md
│   ├── color-palette.md
│   ├── photography-brief.md
│   └── copywriter-brief.md
│
├── 14-risks/
│   └── risk-register.md
│
├── 15-phases/                       phase plans and acceptance criteria
│   ├── phase-0-execution-plan.md
│   ├── phase-1-execution-plan.md
│   ├── phase-1-acceptance.md
│   └── phase-1-prompt.md
│
├── 16-quality/                      QA strategy
│   ├── test-strategy.md
│   ├── performance-budgets.md
│   ├── visual-regression-strategy.md
│   └── accessibility-checklist.md
│
├── 17-compliance/                   regional legal/tax compliance
│   ├── ksa-pdpl.md
│   ├── egyptian-pdpl.md
│   ├── iraqi-data-laws.md
│   ├── zatca-phase-2.md
│   ├── eta-egypt-einvoice.md
│   └── consent-records.md
│
├── 18-runbooks/                     incident response
│   ├── incident-response.md
│   ├── on-call-rotation.md
│   ├── sev-1-runbook.md
│   ├── payment-provider-outage.md
│   ├── whatsapp-outage.md
│   └── ai-outage-fallback.md
│
└── 99-templates/                    document templates
    ├── adr-template.md
    ├── runbook-template.md
    └── pr-template.md
```

---

## Folder numbering — gap notice (added 2026-05-09)

The `/docs` folder structure currently ends at `18-runbooks/` and `99-templates/`, then **jumps to** `19-performance-growth/`, `20-shipping-logistics/`, `24-decision-engine/`, `25-safety-compliance/`, `26-trust-layer/`, `27-readiness-engine/`. Folders **21, 22, and 23 do not exist**.

This gap is **intentional** and **reserved for future modules or structural expansion**. New engineers should not interpret the gap as a typo or missing content.

### Why the gap

When the strategic enhancements landed in Phase 0 (Decision Engine, Safety & Compliance, Trust Layer, Readiness Engine), they were assigned numbers 24–27 to align with the database `Module 24/25/26/27` schema reservations in `01-database/02-tables-by-module.md`. Folders 21–23 were left available for:

- Possible reorganization of existing folders (e.g., splitting `09-import-export/` into smaller domains)
- Future cross-cutting modules surfaced by Phase 1+ design work
- Potential reservation for B2B-specific docs (currently scattered across `15-phases/LAUNCH_CATALOG.md` + `01-database/02-tables-by-module.md` Module 15)

### Why Modules 24–27 should NOT be renumbered now

Renaming folders to close the gap (e.g., `24-decision-engine/` → `21-decision-engine/`) would:
- Break ~50+ cross-references already in /docs (every Module 24/25/26/27 mention in tracker, CHANGELOG, schema, RBAC, admin IA, readiness engine, glossary)
- Force a documentation churn pass with no architectural benefit
- Risk introducing inconsistency between schema module numbers (24/25/26/27 in `01-database/02-tables-by-module.md`) and folder names — currently aligned

**Recommendation:** preserve the gap. If folders 21/22/23 are ever needed for new modules, assign them at that time. Document the reservation here, and link from any new turn that proposes folder renumbering.

This decision is also recorded in CHANGELOG (2026-05-09 Phase 0 Cleanup Step 3 entry).

---

## Reading Order for New Team Members

1. [README.md](README.md) (this file)
2. [GLOSSARY.md](GLOSSARY.md)
3. [ROADMAP.md](ROADMAP.md)
4. [00-architecture/overview.md](00-architecture/overview.md)
5. [00-architecture/stack-decisions.md](00-architecture/stack-decisions.md)
6. [01-database/01-erd.md](01-database/01-erd.md)
7. [01-database/02-tables-by-module.md](01-database/02-tables-by-module.md)
8. [03-rbac/01-roles.md](03-rbac/01-roles.md)
9. [03-rbac/04-cost-privacy.md](03-rbac/04-cost-privacy.md)
10. [04-ai/01-architecture-overview.md](04-ai/01-architecture-overview.md)
11. [15-phases/phase-1-execution-plan.md](15-phases/phase-1-execution-plan.md)

---

## Document Lifecycle

Every document moves through these states:

```
draft → in-review → approved → active → superseded | archived
```

Each document carries a `Status` field at the top. `draft` documents may contain TODO markers; `approved` documents may not.

---

## TODO Conventions

Use this convention consistently across all documents:

- `TODO:` — pending decision or open question
- `TODO(@owner):` — assigned TODO
- `TODO[2026-05-15]:` — TODO with target resolution date
- `BLOCKED:` — waiting on external dependency
- `RISK:` — identified risk needing mitigation

A consolidated TODO list is maintained in `15-phases/phase-0-execution-plan.md` §20 (the 80 pre-coding questions).

---

## Editing Convention

- One topic per file. If a file exceeds ~600 lines, split it.
- Use Mermaid for diagrams; commit the source.
- Tables prefer GitHub-flavored Markdown.
- Arabic text right-to-left in source (UTF-8); English LTR.
- Use absolute clarity over brevity for cross-team docs.

---

## Phase 0 Closure

Phase 0 closes when all acceptance criteria in [15-phases/phase-0-execution-plan.md §22](15-phases/phase-0-execution-plan.md) are met. Until then, treat all documents as drafts.
