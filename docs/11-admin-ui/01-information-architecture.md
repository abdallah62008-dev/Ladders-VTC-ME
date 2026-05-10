# Admin Information Architecture

**Status:** Draft
**Owner:** Design lead
**Source:** Final Master Plan v4 §20

---

## Sidebar groups (top-down)

```
Dashboard

Commerce
Countries & Warehouses
AI Sales
Auto Replies
Customer Messaging
Marketing
Landing Pages
Growth & Performance       ← added 2026-05-07
Decision & Recommendation  ← planned Phase 6 (D-DEC-001)
Safety & Compliance        ← planned Phase 6 (D-SAFE-001)
Trust & Reviews            ← planned Phase 4–6 (D-TRUST-001)
B2B
Operations
Maintenance & Service
Content & SEO
Reports & Intelligence
Finance*       (FINANCE+ only)
Import / Export
Approvals & Overrides
System
  ├── ...
  ├── Data Maintenance        ← added 2026-05-07
  ├── Database Health         ← added 2026-05-07
  └── Intelligence
        ├── Alerts Center     ← added 2026-05-07
        ├── Performance Incidents
        ├── Data Quality Alerts
        ├── Landing Page Alerts
        ├── Database Alerts
        ├── Cleanup Alerts
        ├── Webhook Alerts
        ├── Job Queue Alerts
        ├── AI Cost Alerts
        ├── Payment Alerts
        ├── Notification Rules
        └── Alert History
```

`*` = restricted by role.

### Growth & Performance — sub-pages

(per `19-performance-growth/03-landing-pages.md` §C.4)

```
Growth & Performance
  ├── Landing Pages
  ├── Product Landing Pages
  ├── Category Landing Pages
  ├── Campaign Pages
  ├── Marketer Pages
  ├── City Pages
  ├── Problem Pages
  ├── B2B Pages
  ├── Landing Page Builder
  ├── A/B Tests
  ├── Landing Page Analytics
  ├── Script Inventory                ← Phase 6+
  ├── Performance Budgets             ← Phase 1+
  └── Page Performance History
```

## Per group → sub-pages

See [Master Plan v4 §20](../15-phases/phase-0-execution-plan.md) and the README folder structure for full list.

## Locked workflows

- **Product Add/Edit (Country Pricing & Availability + Warehouse Stock tabs)** — see [`06-product-add-edit-workflow.md`](06-product-add-edit-workflow.md). 🟢 Confirmed 2026-05-07.
- **Warehouse Management (CRUD + lifecycle: deactivate / archive / reactivate / hard-delete with stock-safety checks)** — see [`07-warehouse-management.md`](07-warehouse-management.md). 🟢 Confirmed 2026-05-07. 8 fine-grained permission slugs replace the deprecated `warehouse.write`.
- **Inventory authority (🟢 D-COUNTRY-013 locked 2026-05-09):** **Admin Dashboard is the Phase 1 inventory source of truth.** All warehouse stock, product-country availability, stock adjustments, and stock reservations are managed via the **Operations / Warehouses + Stock** sidebar group. No external ERP is required for Phase 1; no two-way sync; no ERP dependency blocks Phase 1. ERP integration deferred to Phase 10+ if business requirements justify it (provider-agnostic integration pattern; no hardcoded ERP). Existing n8n / WhatsApp workflows MUST read platform inventory, not an external ERP. All inventory updates respect Country Access Control (top-bar selector) + RBAC + audit log.
- **Performance, Cleanup, Landing Page Growth & Alerts System** — see [`../19-performance-growth/00-index.md`](../19-performance-growth/00-index.md). 🟢 Confirmed and locked 2026-05-07; module split into 9 per-topic files 2026-05-09. Adds **Growth & Performance** sidebar group, **System / Intelligence → Alerts Center** branch (8 alert categories, 5 severity levels), **System / Data Maintenance** + **System / Database Health** sub-sections, ~25 new permission slugs across 5 groups, 18 hard safety rules. Phase 1 ships performance budgets + critical alerts skeleton; Phase 6 ships landing builder + intelligence; Phase 10 ships cleanup automation.
- **Decision & Recommendation Engine** — see [`../24-decision-engine/01-overview.md`](../24-decision-engine/01-overview.md). 🟢 Confirmed and locked 2026-05-07. Unifies Ladder Finder + AI recommendations + WhatsApp sales flow + checkout warnings under one rule engine. Phase 1 schema column reservation; Phase 6 build.
- **Safety & Compliance Center** — see [`../25-safety-compliance/01-overview.md`](../25-safety-compliance/01-overview.md). 🟢 Confirmed and locked 2026-05-07. Manages approved safety claims, certificates, incident reports, compliance profiles per country. Phase 1 schema reservations + AI guardrail integration; Phase 6 admin UI.
- **Trust Layer** — see [`../26-trust-layer/01-overview.md`](../26-trust-layer/01-overview.md). 🟢 Confirmed and locked 2026-05-07. Verified reviews, customer photos with publish-permission, verified-purchase badge. Phase 1 review schema reservation; Phase 4 collection via WhatsApp; Phase 6 surface rendering.
- **Unified Readiness Engine** — see [`../27-readiness-engine/01-unified-readiness.md`](../27-readiness-engine/01-unified-readiness.md). 🟢 Confirmed and locked 2026-05-07. Unifies country / product / landing-page / campaign / operational readiness into one dashboard. Phase 1 schema reservation; Phase 6 refactor; Phase 10 unified dashboard.
- **Shipping & Logistics — Configurable Provider System** — see [`../20-shipping-logistics/01-overview.md`](../20-shipping-logistics/01-overview.md). 🟢 Confirmed and locked 2026-05-09 (D-OPS-010). Provider-agnostic, country-specific, dashboard-configurable shipping system. **NO hardcoded couriers / tariffs / delivery promises / COD fees / return fees / shipping rules in application code.** New admin section **Operations / Shipping** with 8 sub-pages (Providers, Methods, Rate Cards, Zones, Rules, Failed Delivery Rules, Return Shipping Rules, Provider Settings). 7 new tables reserved Module 16. KSA initial primary = J&T Express (D-OPS-003 Answered 2026-05-09); operational onboarding tracked in [`../20-shipping-logistics/02-ksa-jt-express-onboarding.md`](../20-shipping-logistics/02-ksa-jt-express-onboarding.md). Phase 1 schema reservation + admin section structure; Phase 2 checkout integration; Phase 4 WhatsApp shipment status; Phase 7 COD reconciliation; Phase 9 courier analytics + returns + J&T API; Phase 10 shipping intelligence.

### Build Now, Activate When Ready — admin UI implications (🟢 D-READY-002 locked 2026-05-09)

Per the cross-platform operating principle (see `../GLOSSARY.md` "Build Now, Activate When Ready" + `../27-readiness-engine/01-unified-readiness.md`): **configured ≠ active**. Every admin list/edit screen for an entity that has a status lifecycle MUST surface:

| UI element | Required behavior |
|---|---|
| **Status badge** | Color-coded chip showing current status (draft / pending_approval / ready / active / paused / blocked / archived) on every list row + entity detail header |
| **Readiness score** | Per-entity composite score where applicable (e.g., Landing Page Score 0–100; Product Country Readiness checklist count); shown next to status badge |
| **Missing requirements list** | When status = pending_configuration / pending_approval / blocked: explicit list of unmet readiness checks with quick links to fix each |
| **Activation button** | Disabled when readiness fails; tooltip on hover shows reason. Enabled only when all required readiness checks pass. |
| **Reason why blocked** | Plain-language explanation when status = blocked (which check failed; what changed) |
| **Last reviewed by** | User + timestamp of most recent review/approval action |
| **Activated by** | User + timestamp of most recent activation; cleared on deactivation |
| **Activated at** | timestamptz; preserved on archive |

**Hard rule:** No admin UI element auto-activates an entity. Activation is always an explicit user action via the activation button, audit-logged with actor + reason + override_request_id (if applicable). See `19-performance-growth/03-landing-pages.md` §D.1 for the canonical pre-publish gate UI pattern.

### Country Context Switcher (🟢 D-CSP-001/002 locked 2026-05-09 — see `../03-rbac/03-scopes.md`)

**Top bar widget** appears on every admin page:

```
┌──────────────────────────────────────────────────────┐
│  [Logo]   Country Context: [Saudi Arabia ▼]   [User] │
└──────────────────────────────────────────────────────┘
```

#### Behavior matrix

| User country access | Top-bar appearance | Default selection |
|---|---|---|
| 1 country only | Fixed label (no dropdown) | The single country |
| 2+ specific countries | Dropdown with allowed countries only | Last-selected (cookie); first allowed if no cookie |
| `country_scope.all` | Dropdown with all active countries + "All Countries" | "All Countries" (user may pin) |

#### Page classification (`country_scope_mode` declaration mandatory on every admin route)

| Mode | Definition | Page behavior |
|---|---|---|
| `scoped` | Filtered by selected country | Data restricted to active country; "Editing <Country> data only" badge |
| `aware` | Global master + country overlay | Master remains global; country-specific columns surface for selected country |
| `global` | Not affected by selector | Country selector visually grayed-out / tooltip explains |

CI grep test enforces declaration on every admin route file. Missing → CI fails.

#### Page classification table

**Country-scoped pages (mode = `scoped`):** Dashboard Metrics · Orders · Customers · Warehouses · Warehouse Stock · Country Pricing & Availability · Shipping Providers · Shipping Methods · Shipping Rate Cards · Shipping Rules · Payment Methods · WhatsApp Numbers · WhatsApp Templates · Auto Replies · Landing Pages · Coupons · Campaigns · Marketers · Reports · Alerts · Customer Messaging · Conversations · Warranty/Service Tickets · Override Requests (when tied to country-specific entity) · Approvals (when tied to country-specific entity)

**Country-aware pages (mode = `aware`):** Products · Categories · Product Specifications · Product Media · Product Videos · Product SEO Templates · AI Knowledge Base · Decision Engine · Safety & Compliance content (jurisdiction-aware)

**Global-only pages (mode = `global`):** Users · Roles · Permissions · Global Security Settings · Backups · Restore Jobs · API Global Settings · Webhook Endpoints · System Health · Audit Log (global view, optional country filter) · Integration Settings · Secrets documentation references · Deployment settings · Global feature flags · Country Compliance Profiles · Performance Budgets · Promotion Checklist · Data Maintenance / Cleanup

Full spec in `../03-rbac/03-scopes.md` §F.

### Future / planned sub-pages

#### Decision & Recommendation (Phase 6)

```
Decision & Recommendation
  ├── Rules
  ├── Suitability Scores
  ├── Recommendation Events
  └── Wrong-Ladder Warnings
```

#### Safety & Compliance (Phase 6)

```
Safety & Compliance
  ├── Safety Guidelines
  ├── Approved Safety Claims
  ├── Certificates
  ├── Pending Safety Claim Approvals
  ├── Incident Reports
  └── Country Compliance Profiles
```

#### Trust & Reviews (Phase 4–6)

```
Trust & Reviews
  ├── Reviews (pending / approved / rejected)
  ├── Customer Photos (pending permission verification)
  └── Trust Asset Library
```

#### Readiness Engine (Phase 10 unified dashboard)

```
System → Readiness
  ├── Countries
  ├── Products
  ├── Landing Pages
  ├── Campaigns
  └── Operational
```

#### Operations / Shipping (Phase 1 admin section structure; Phase 2 checkout wiring)

```
Operations
  ├── ...
  └── Shipping
        ├── Shipping Providers
        ├── Shipping Methods
        ├── Shipping Rate Cards
        ├── Delivery Zones
        ├── Shipping Rules
        ├── Failed Delivery Rules
        ├── Return Shipping Rules
        └── Shipping Provider Settings
```

(per `20-shipping-logistics/01-overview.md` §C)

## Mobile-mandated surfaces

(Per Master Plan v4 §1.3 / Phase 0 §1.3)

These nine surfaces have first-class mobile support, PWA-installable, push notifications:
- Orders
- Conversations
- Handoff Inbox
- Stock Alerts
- Warehouse Health
- Customer Messaging
- Notifications
- Executive Dashboard
- Approvals & Overrides

Other surfaces fall back to "use desktop for full editing" notice on mobile.

## Visual hierarchy rules

- Sidebar sticky on desktop; bottom-nav on mobile (5 primary).
- Country switcher in header (when user has multi-country scope).
- User menu: profile, notifications, theme, log out.
- Search bar (Phase 10+) — global search across products / orders / conversations.

## Loading + empty + error states

See `05-states.md`.

## RTL/LTR

See `04-rtl-ltr-rules.md`.

## TODO

- TODO: low-fi wireframes for top 20 screens (`03-wireframes/`).
- TODO: low-fi mobile wireframes for 9 mandated surfaces (`04-mobile-wireframes/`).
- TODO: confirm sidebar group order.
