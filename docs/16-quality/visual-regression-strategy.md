# Visual Regression Strategy

**Status:** 🟢 **Tool locked 2026-05-09 (D-INFRA-009 Answered)**
**Owner:** QA lead + Frontend lead
**Last updated:** 2026-05-09

---

## Tool

**🟢 Playwright snapshot testing for Phase 1 (D-INFRA-009 locked 2026-05-09).**

**Reasons:**
- No extra SaaS dependency
- Works with Playwright already selected (D-INFRA-008)
- Good enough for Phase 1 design-system, RTL/LTR, admin shell, product page, country-context checks
- In-repo snapshots are version-controlled with the code

**Locked rules:**
- Playwright snapshots are the Phase 1 baseline
- Snapshots stored in repo per Playwright conventions (`__screenshots__/` adjacent to test files)
- CI fails on unexpected visual changes where snapshots are enabled
- Chromatic and Percy NOT introduced in Phase 1
- Chromatic / Percy reconsidered later only if design review workflow needs hosted visual approvals (Phase 6+ revisit if Marketing or Design proposes hosted-tool benefits)

## Coverage

- Every critical screen in **both directions** (RTL and LTR).
- Multiple viewport sizes:
  - Mobile (375x667)
  - Tablet (768x1024)
  - Desktop (1440x900)
- Multiple themes (light + dark, if dark mode shipped).

## Frequency

Every PR. Diffs reviewed before merge.

## Exclusions

- Areas with naturally non-deterministic content (timestamps, random product order) masked.

## TODO

- ~~TODO: pick tool.~~ — 🟢 **ANSWERED 2026-05-09 (D-INFRA-009):** Playwright snapshots for Phase 1.
- TODO: review process for diffs.
- ~~TODO: budget for Chromatic if chosen.~~ — N/A; Chromatic NOT introduced in Phase 1.
- TODO: snapshot stability practices (mask non-deterministic regions; freeze date/time in tests).
