# Performance, Cleanup, Landing Page Growth & Alerts System — Index

**Status:** 🟢 **Confirmed and locked — 2026-05-07** (D-PERF-001 Answered); **split into separate files 2026-05-09** per D-DOC-001 documentation cleanup
**Owner:** CTO + Frontend Lead + Infra Lead + Marketing Manager
**Source:** Master Plan v4 §22 (Performance), §28 (Phasing), §1.3 (Override module); Tracker decision D-PERF-001

> ⚠️ Cross-cutting platform module. Spans frontend performance, image/video optimization, landing-page builder + intelligence, edge cache strategy, data maintenance/cleanup, database health, alerting, feature flags, RBAC, and safety rules. Phases this affects: Phase 1 (foundations) → Phase 6 (landing builder) → Phase 9 (operations) → Phase 10 (intelligence + cleanup automation).

---

## Files

This module was split from a 1226-line monolith into focused per-topic files for navigability. **No content was removed**; sections are preserved in their respective files.

| File | Topic | Original section |
|---|---|---|
| [`01-performance-engineering.md`](./01-performance-engineering.md) | CDN, page rendering, performance budgets, Core Web Vitals, JavaScript control, Script Weight Governance | A |
| [`02-image-video.md`](./02-image-video.md) | Image pipeline, 6 required variants, video rules, Auto Image Quality Scanner | B |
| [`03-landing-pages.md`](./03-landing-pages.md) | Landing Page Growth System + Advanced Landing Page Intelligence (Pre-Publish Quality Gate, Score, Compliance, Profit/Inventory Guardrails, Adaptive Pages, Smart CTA) | C + D |
| [`04-cache-strategy.md`](./04-cache-strategy.md) | What can/cannot be cached, static landing snapshots, edge cache by country, SWR, smart invalidation | E |
| [`05-data-maintenance.md`](./05-data-maintenance.md) | Retention rules, cleanup jobs, safe cleanup workflow, lifecycle states, archiving layer | F |
| [`06-database-health.md`](./06-database-health.md) | Database Health Dashboard, partitioning strategy, summary tables, materialized views | G |
| [`07-alerts.md`](./07-alerts.md) | 8 alert categories, severity levels, alert fields, workflow, Performance Incident System, Page Performance History, Revenue Impact, Slow Query Business Impact | H |
| [`08-feature-flags.md`](./08-feature-flags.md) | 16 suggested flags, flag attributes | I |
| [`09-permissions-and-safety-rules.md`](./09-permissions-and-safety-rules.md) | ~25 new permission slugs across 5 groups + 18 hard safety rules + cross-references | J + K + L |

The original `PERFORMANCE_CLEANUP_LANDING_ALERTS_SYSTEM.md` is preserved as a **redirect stub** pointing to this index.

---

## Status

**🟢 Confirmed and locked 2026-05-07.** Module spans Phase 1 → Phase 10. Phase 1 ships performance budgets + critical alerts skeleton. Phase 6 ships landing builder + intelligence. Phase 10 ships cleanup automation + scanners + adaptive landing.

**🟢 Documentation split 2026-05-09** (D-DOC-001) — original 1226-line monolith reorganized into 9 per-topic files for maintainability and navigability. Architecture unchanged.

---

## Cross-references (also in `09-permissions-and-safety-rules.md` §L)

- **Admin information architecture:** [`../11-admin-ui/01-information-architecture.md`](../11-admin-ui/01-information-architecture.md) — Growth & Performance sidebar group + System / Intelligence → Alerts Center branch
- **Database docs:** [`../01-database/02-tables-by-module.md`](../01-database/02-tables-by-module.md) — Module 23 schema reservations
- **Reporting / Data Quality:** [`../07-reporting/03-data-quality-issues.md`](../07-reporting/03-data-quality-issues.md)
- **RBAC / permissions:** [`../03-rbac/02-permissions.md`](../03-rbac/02-permissions.md)
- **Phase roadmap:** [`../15-phases/PROJECT_TIMELINE_AND_PHASE_REQUIREMENTS.md`](../15-phases/PROJECT_TIMELINE_AND_PHASE_REQUIREMENTS.md)
- **Decisions Tracker:** [`../15-phases/PHASE_0_DECISIONS_TODO_TRACKER.md`](../15-phases/PHASE_0_DECISIONS_TODO_TRACKER.md) — D-PERF-001 + D-DOC-001
- **Override module:** [`../10-overrides/01-override-types.md`](../10-overrides/01-override-types.md)
- **Backup / cleanup safety:** [`../08-backups/02-pre-risky-change-triggers.md`](../08-backups/02-pre-risky-change-triggers.md)
