# Performance, Cleanup, Landing Page Growth & Alerts System

**Status:** 🟢 **Split into separate files 2026-05-09** per D-DOC-001 documentation cleanup. Architecture unchanged.

---

## ⚠️ This file has been split

The original 1226-line monolith has been reorganized into focused per-topic files for navigability. **No content was removed**; sections are preserved in their respective files.

**See [`00-index.md`](./00-index.md) for the full table of contents.**

| File | Topic | Original section |
|---|---|---|
| [`01-performance-engineering.md`](./01-performance-engineering.md) | CDN, page rendering, performance budgets, Core Web Vitals, JavaScript control, Script Weight Governance | A |
| [`02-image-video.md`](./02-image-video.md) | Image pipeline, 6 required variants, video rules, Auto Image Quality Scanner | B |
| [`03-landing-pages.md`](./03-landing-pages.md) | Landing Page Growth System + Advanced Landing Page Intelligence | C + D |
| [`04-cache-strategy.md`](./04-cache-strategy.md) | Cache rules, static snapshots, edge cache by country, SWR, smart invalidation | E |
| [`05-data-maintenance.md`](./05-data-maintenance.md) | Retention rules, cleanup jobs, safe workflow, lifecycle states, archiving | F |
| [`06-database-health.md`](./06-database-health.md) | Database Health Dashboard, partitioning, summary tables, materialized views | G |
| [`07-alerts.md`](./07-alerts.md) | 8 alert categories, severity levels, alert fields, workflow, Performance Incident System | H |
| [`08-feature-flags.md`](./08-feature-flags.md) | 16 suggested flags, flag attributes | I |
| [`09-permissions-and-safety-rules.md`](./09-permissions-and-safety-rules.md) | ~25 new permission slugs + 18 hard safety rules + cross-references | J + K + L |

---

## Why the split

The original single-file spec grew to 1226 lines covering 5 distinct subsystems (Performance Engineering, Image/Video, Landing Pages, Data Maintenance, Database Health, Alerts, Feature Flags, Permissions, Safety Rules). Per the Phase 0 Architecture Review (2026-05-09), this conflated independent concerns and made navigation difficult. The split:

1. Preserves all content (zero deletions)
2. Groups by topic so each file is independently navigable
3. Keeps cross-section references intact via internal links
4. Maintains single source of truth (no duplication)

**Architectural decisions are unchanged.** D-PERF-001 remains 🟢 Answered. The 18 hard safety rules, 5 alert severity levels, 8 alert categories, 6 image variants, performance budget table, and all other locked content survive intact in their new homes.

---

## Status

**🟢 Original module locked 2026-05-07.** **🟢 Split applied 2026-05-09 (D-DOC-001).** Module spans Phase 1 → Phase 10.

For backwards-compatible references from other docs, this file remains as a redirect stub.

External references in the form `19-performance-growth/PERFORMANCE_CLEANUP_LANDING_ALERTS_SYSTEM.md` continue to resolve to this stub. New references should target the per-topic files directly (e.g., `19-performance-growth/03-landing-pages.md` instead of the monolith).
