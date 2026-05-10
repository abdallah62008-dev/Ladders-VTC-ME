# Module 24 — Decision & Recommendation Engine

**Status:** 🟢 **Documentation locked 2026-05-07** (D-DEC-001 🟢 Answered); schema reservations Phase 1; build Phase 6
**Owner:** Product Lead + AI Lead + CTO
**Source:** Strategic Enhancements Evaluation (2026-05-08); Master Plan v4 §17 (AI sales tools); Ladder Finder spec in `04-ai/03-tools.md`

> ⚠️ **This module is documentation + Phase 1 schema reservation only.** Functional UI ships Phase 6 (replaces Ladder Finder + drives AI / WhatsApp / landing pages / checkout). No application code in Phase 0/1.

---

## Purpose

A unified rule engine that decides which ladder a customer should buy. It is consumed by every customer-facing surface so recommendations stay consistent regardless of channel.

**Consumed by:**
- Website product recommendations (PLP / PDP "you might prefer" blocks)
- Ladder Finder customer UX (the form-driven recommendation tool — `04-ai/03-tools.md` `find_recommended_ladder`)
- AI chat recommendations (every AI suggestion calls `recommendation.evaluate` first)
- WhatsApp sales flow (agent + bot use the same engine)
- Landing pages (programmatic SEO + campaign LPs render the engine's "best for X" framing)
- Checkout warnings (when customer-selected SKU doesn't match stated need)

**Replaces** ad-hoc Ladder Finder logic. Ladder Finder remains as the **customer-facing form UX**, but the underlying decision logic moves to this engine.

---

## Three responsibilities

### 1. Recommend
Given (use case, height needed, country, customer budget, storage limit, optional car-fit constraint), return:
- best recommended SKU
- 1–3 alternatives ranked by suitability
- explicit reason text per recommendation in customer locale
- explicit reason text per alternative ("why this might be a better fit if X")

### 2. Score
Compute a per-SKU **Suitability Score** (0–100) for any (variant, use_case) pair.
- Rule-based first (deterministic, explainable, auditable)
- AI-assisted later (Phase 10) for nuanced edge cases beyond the rule set
- Score is stored on `product_variant.suitability_scores jsonb` (Phase 1 reservation)

Status thresholds:
- **90–100 Excellent fit** ✅
- **75–89 Good fit** 🟢
- **60–74 Acceptable** 🟠
- **Below 60 Not recommended** 🔴

### 3. Warn ("Do Not Sell Wrong Ladder")
At PDP / cart / checkout / AI / WhatsApp surfaces, if customer-selected SKU has a low suitability score for their stated use case OR violates a hard constraint (height too short for "villa exterior", aluminum chosen for "electrician"), surface a warning that:
- explains why this SKU may not fit
- shows a better alternative with reason
- requires acknowledgment ("I understand and want to continue with my choice")
- logs the warning + the customer's choice in `recommendation_warning_log`

**Hard constraints** (always block — not just warn):
- Aluminum ladder selected for "electrician/electrical work" use case
- Customer-stated max storage length < SKU folded length (clear physical impossibility)
- Customer-stated weight capacity need > SKU rated load × 0.9 safety margin

---

## Phase 1 schema reservations (Module 24)

> Reserved as empty/skeleton tables in Phase 1; populated when functional UI ships Phase 6.

### `product_variant.suitability_scores` (column added Phase 1)

```
product_variant.suitability_scores jsonb DEFAULT '{}'::jsonb
```

Shape:
```json
{
  "villa_exterior_maintenance": 92,
  "home_indoor": 78,
  "contractor_daily_use": 65,
  "electrician_work": 0,
  "warehouse_indoor": 70,
  "car_fit": 88
}
```

Use-case keys are managed centrally (locked taxonomy in `recommendation_use_case` table — Phase 6).

### `recommendation_use_case` (Phase 6)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| key | text UNIQUE | `villa_exterior_maintenance`, `home_indoor`, etc. |
| name_translations | jsonb | per locale |
| description_translations | jsonb | |
| min_height_m | numeric(4,2) | optional minimum reach |
| max_storage_m | numeric(4,2) | optional folded-length ceiling |
| forbidden_materials | text[] | e.g., `['aluminum']` for electrician |
| min_load_kg | int | optional |
| active | bool | |

### `recommendation_rule` (Phase 6)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| use_case_key | text FK → `recommendation_use_case.key` | |
| variant_id | uuid FK → `product_variant.id` | |
| computed_score | int | 0–100 |
| reasoning_template_key | text | translation key for "why this fits" copy |
| hard_constraints_satisfied | bool | |
| hard_constraint_failures | jsonb | array of constraint violations |
| effective_from, effective_until | timestamptz | versioning |
| created_by_user_id | uuid FK | |
| created_at | timestamptz | |

### `recommendation_event` (Phase 6)

One row per recommendation served, regardless of surface.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK NULL | NULL for anonymous |
| session_id | text | |
| surface | text | `'website' \| 'ladder_finder' \| 'ai_chat' \| 'whatsapp' \| 'landing_page' \| 'checkout'` |
| input_use_case | text | |
| input_height_m | numeric(4,2) | |
| input_country_id | uuid FK | |
| input_budget_max | numeric(12,2) | |
| input_storage_max_m | numeric(4,2) NULL | |
| input_car_fit | bool NULL | |
| recommended_variant_id | uuid FK → `product_variant.id` | |
| alternative_variant_ids | uuid[] | up to 3 |
| served_at | timestamptz | |
| converted_to_order_id | uuid FK → `customer_orders.id` NULL | |
| converted_at | timestamptz NULL | |

### `recommendation_warning_log` (Phase 6)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK NULL | |
| session_id | text | |
| surface | text | |
| selected_variant_id | uuid FK | what customer was about to buy |
| stated_use_case | text | |
| warning_type | text | `'low_score' \| 'hard_constraint' \| 'storage_mismatch' \| 'load_mismatch' \| 'material_mismatch'` |
| score_for_selected | int | |
| recommended_alternative_id | uuid FK NULL | |
| acknowledgment_given | bool | did customer click "I understand"? |
| acknowledged_at | timestamptz NULL | |
| outcome | text | `'redirected' \| 'continued_with_warning' \| 'abandoned'` |
| created_at | timestamptz | |

---

## Integration points

| Surface | Integration |
|---|---|
| **AI chat** | `04-ai/03-tools.md` — adds `recommendation.evaluate(use_case, constraints) → score+alternatives` tool. AI cannot recommend a SKU with score < 70 without explicit override question to customer. |
| **AI guardrails** | `04-ai/05-guardrails.md` — output validator rejects any SKU recommendation without a preceding `recommendation.evaluate` tool call. |
| **WhatsApp** | New templates: `recommendation_alert_ar/_en`, `wrong_size_warning_ar/_en` (Meta approval required). |
| **Landing pages** | Programmatic SEO landings (e.g., `/lp/villa-4-4m`) render top-3 recommendations from this engine; campaign LPs surface "best for X" framing. |
| **Checkout** | Warning layer: if cart contains SKU with score < 60 for any stated use case in cart_event metadata, surface warning before payment step. |
| **Reports** | Module 18: Recommendation Acceptance Rate, Wrong-Ladder Save Rate (drop-off after warning), Decision Engine Drift (when AI recommends differently than rules — Phase 10). |

---

## RBAC (per `03-rbac/02-permissions.md`)

| Slug | Description |
|---|---|
| `decision.read` | Read recommendations + warning logs |
| `decision.rule.write` | Edit `recommendation_rule` (Product Manager + AI Supervisor) |
| `decision.override` | Override engine recommendation in admin (super_admin only; reason ≥30 chars) |

---

## Override types (per `10-overrides/01-override-types.md`)

- `recommendation_override` — Admin recommends a SKU the engine flagged as poor fit (e.g., for B2B custom orders). Reason ≥30 chars; audit logged.

---

## What this module does NOT do

- Does NOT auto-update product specifications.
- Does NOT generate copy (that's Module 13 + AI Draft Assistant).
- Does NOT decide pricing (that's `variant_country_price` + Profit Guardrails).
- Does NOT replace the customer's right to choose — it warns, never blocks (except hard constraints).

---

## Phase placement

| Phase | Work |
|---|---|
| **Phase 1** | Schema reservation: `product_variant.suitability_scores jsonb` column added. No UI. |
| Phase 6 | Build: `recommendation_rule`, `recommendation_event`, `recommendation_warning_log`, `recommendation_use_case` tables populate; Decision Engine API endpoint live; AI tool `recommendation.evaluate` integrated; warning layer surfaces on PDP + checkout + chat. |
| Phase 10 | AI-assisted scoring; Decision Engine Drift detection; Recommendation Acceptance Rate dashboard. |

---

## TODO

- TODO: lock `recommendation_use_case` initial taxonomy (likely 8–12 keys covering villa, home, contractor, electrician, warehouse, technician, B2B, car-fit, storage-constrained variants).
- TODO: confirm Hard Constraint list with Product + Safety Lead.
- TODO: design Ladder Finder form UX to feed Decision Engine inputs cleanly (Phase 6 design window).
- TODO: WhatsApp template approvals (Meta): `recommendation_alert_ar/_en`, `wrong_size_warning_ar/_en`.
