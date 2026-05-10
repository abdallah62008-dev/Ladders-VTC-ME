# Override Types

**Status:** Draft
**Owner:** Security lead + Finance
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §1.4 + `19-performance-growth/09-permissions-and-safety-rules.md` §K (D-PERF-001 🟢 Answered 2026-05-07) + Strategic Enhancements 2026-05-07 (D-DEC-001 + D-SAFE-001)

---

## All 15 types (8 original + 5 from D-PERF-003 + 2 from Strategic Enhancements)

| Type | Default approver | Dual approval | Auto-expire | Notes |
|---|---|---|---|---|
| `profit_guardrail` | Super Admin OR Finance Admin | No | 24h | Coupon, landing custom price, marketer cost override breaches floor |
| `price_below_min` | Super Admin | No | 24h | Selling price < `variant_country_price.min_selling_price` |
| `campaign_loss` | Super Admin + Marketing Manager | **Yes** | 7d | Campaign forecast shows negative business profit |
| `stock_override` | Super Admin OR Inventory Manager | No | 6h | Sell beyond reservation; allow oversell |
| `warranty_exception` | Maintenance Manager + Finance (high value) | **Yes** (high value) | per case | Out-of-warranty replacement; value-only-X exceptions |
| `payout_exception` | Finance + Super Admin | **Yes** | per case | Early payout, payout above threshold, payout to flagged marketer |
| `country_activation` | Super Admin + Country Manager | **Yes** | until readiness reached | Activate before readiness checklist passes |
| `payment_refund_exception` | Finance + Super Admin | **Yes** | per case | Refund > original charge; refund without delivery proof; manual chargeback decision |
| `performance_budget_override` ✨ | Super Admin + Frontend Lead | **Yes** | 14d | Ship a page exceeding the page-class performance budget (per `19-performance-growth/...` §A.3). Reason ≥30 chars, must include planned remediation date. Auto-creates Performance Incident if not remediated by expiry. Audit log + webhook `performance_budget.overridden`. |
| `landing_quality_gate_override` ✨ | Super Admin OR Marketing Manager | **Yes** when Critical-fail count > 1 | 7d | Publish a landing page with one or more **High** pre-publish gate failures (per §D.1). **Cannot override Critical-fail block on missing price, missing stock without waitlist, broken WhatsApp/buy CTA, expired coupon, or compliance violation** — those require their own override types below. Reason ≥30 chars; lists each waived check. Re-runs the gate after expiry; if still failing, page auto-unpublishes. |
| `landing_profit_guardrail_override` ✨ | Super Admin OR Finance Admin | No (single approver) | 7d | Specialization of `profit_guardrail` for landing-page-context guardrail breaches (per §D.7). Reason ≥30 chars must reference the offer/coupon/campaign and explicitly justify the margin impact in money terms. Computed margin + floor + delta snapshot frozen on the override. Webhook `landing_profit.overridden`. |
| `landing_inventory_guardrail_override` ✨ | Super Admin + Marketing Manager | **Yes** | 72h | Keep landing page live for an out-of-stock or low-stock SKU (per §D.8). Reason ≥30 chars must include explicit "out-of-stock CTA" mode (waitlist / lead-collect / redirect-to-alternative). Inventory snapshot frozen. Auto-pauses page if inbound stock not registered before expiry. |
| `sensitive_cleanup_override` ✨ | Super Admin + Finance Admin | **Yes** | per case (max 30d) | Run a sensitive cleanup job (PII deletion, audit-log archive, payment-log archive, customer-export-related cleanup, anonymization at scale) **outside the standard schedule + approval workflow** (per §F.4 / §K rule 3). Reason ≥30 chars must cite legal/compliance basis. **Pre-cleanup auto-backup is mandatory and cannot be skipped** even with this override. Cleanup preview report attached. Audit log + webhook `sensitive_cleanup.overridden`. |
| `safety_claim_override` 🆕 | Super Admin + Compliance Officer | **Yes** | 30d | Permits use of a borderline safety claim that lacks formal approval but has compelling reasoning (per `25-safety-compliance/01-overview.md` D-SAFE-001). Reason ≥30 chars must cite the borderline reasoning + the supporting (informal) evidence + the planned path to formal approval. Auto-expires 30 days; on expiry, all customer-facing surfaces using this claim are auto-flagged for re-review. Webhook `safety_claim.overridden` on issue + on expiry. |
| `recommendation_override` 🆕 | Super Admin only | No (single approver) | 14d | Permits the Decision Engine to recommend a SKU it has flagged as poor-fit for a specific customer / context (per `24-decision-engine/01-overview.md` D-DEC-001). Use case: B2B custom orders where the customer has expertise the engine can't capture; specialty cases. Reason ≥30 chars must cite the specific (customer_id, use_case, recommended_variant_id) tuple + business reason. Logged to `recommendation_warning_log` with `outcome='admin_override'`. Webhook `recommendation.overridden`. |

✨ = added 2026-05-07 with D-PERF-001.
🆕 = added 2026-05-07 with Strategic Enhancements (D-DEC-001 + D-SAFE-001).

### Override-type cross-reference

| Override type | Triggering rule | Source spec | Related table(s) |
|---|---|---|---|
| `performance_budget_override` | Page weight > class budget OR Lighthouse < class target | §A.3 | `landing_page`, `landing_page_performance_history`, `alert` |
| `landing_quality_gate_override` | Pre-publish quality gate Critical/High fail | §D.1 | `landing_page`, `landing_page_quality_gate_run` |
| `landing_profit_guardrail_override` | Landing-page profit margin < `country.business_min_margin` OR < marketer floor | §D.7 / `05-payments/14-profit-floors-and-guardrails.md` | `landing_page`, `profit_guardrail_log`, `profit_floor_rule` |
| `landing_inventory_guardrail_override` | Linked SKU stock = 0 OR ≤ `low_stock_threshold × 2` AND no inbound | §D.8 | `landing_page`, `variant_warehouse_stock`, `inbound_stock` |
| `sensitive_cleanup_override` | Cleanup job classified `sensitive` (PII / audit / payment / cost-related) | §F.4 / §K rule 3 | `cleanup_job`, `cleanup_job_run`, `retention_policy`, `backup_job` |

### Hard rules for all 5 new override types

1. **Reason ≥30 chars mandatory** (versus 10 chars baseline for the original 8 types — these are higher-stakes overrides).
2. **Audit log entry mandatory** with frozen `context_snapshot` of the failed check(s).
3. **Approval recorded** with approver user_id(s), timestamp, and (for dual-approval) approver order.
4. **Auto-expiry enforced server-side** regardless of UI; expired overrides revert the underlying state (page auto-unpublishes; cleanup job re-locks; performance budget re-enforced).
5. **Webhook fires** on issue + on expiry + on override revoke.
6. **Smart Notification** to default recipients (Super Admin + relevant lead) on issue + at 50% of expiry window + on expiry.
7. **No nested overrides** — using a Critical block override does NOT auto-bypass High warnings; each must be addressed independently.

## Override states

`pending → approved | rejected | auto_approved | expired → applied`

## Required fields per request

- `override_type`
- `entity_type` + `entity_id`
- `context_snapshot` (frozen state)
- `proposed_action`
- `reason` (free text, ≥10 chars baseline; **≥30 chars** for the 5 new override types added 2026-05-07)
- `reason_category` (enum per override type — see `04-reason-categories.md`)
- `expected_business_impact` (numeric, where applicable)
- `expected_marketer_impact` (numeric, where applicable)
- `remediation_plan` (text, mandatory for `performance_budget_override`, `landing_quality_gate_override`, `landing_inventory_guardrail_override`)
- `legal_compliance_basis` (text, mandatory for `sensitive_cleanup_override`)
- `pre_change_backup_job_id` (uuid FK → `backup_job`, mandatory for `sensitive_cleanup_override`)

## Server-side enforcement

- Cannot save reason shorter than the type-specific minimum (10 chars baseline; 30 chars for the 5 new types).
- Reason cannot be just whitespace/digits.
- `requires_dual_approval = true` enforced via DB trigger (see `01-database/07-triggers.md`).
- Override expires after `expires_at` regardless of UI.
- For the 5 new types: on expiry, server automatically reverts the underlying state (page unpublishes / budget re-enforces / cleanup job re-locks). No grace period.
- `sensitive_cleanup_override` cannot save without a successful `pre_change_backup_job_id` reference. Backup-skip flag is **forbidden** for this type.

## Audit

Every override creates audit entries:
- `override_request` row
- `audit_log` row referencing `override_request_id`
- `escalation_log` if applicable
- Smart Notification to default recipient(s)

## TODO

- TODO: confirm "high value" warranty threshold.
- TODO: confirm "above threshold" payout thresholds.
- TODO: confirm `country_activation` should also block storefront from going public until readiness or whether it allows partial-country soft launch.
- TODO: lock `performance_budget_override` page-weight overage delta cap (e.g., max +30% over class budget) and Lighthouse-floor cap (e.g., never below 80 even with override).
- TODO: lock `landing_inventory_guardrail_override` "out-of-stock CTA" mode UI copy per locale (waitlist / lead-collect / redirect-to-alternative templates).
- TODO: lock `sensitive_cleanup_override` legal-basis enum (e.g., `'pdpl_subject_request' | 'tax_law_max_retention' | 'court_order' | 'audit_finding' | 'other_with_legal_signoff'`).
