# Override Runbook

**Status:** Draft (stub) — synced to 15-type model 2026-05-09
**Owner:** Security lead
**Source:** `01-override-types.md` (15 override types — 8 original + 5 from D-PERF-003 + 2 from Strategic Enhancements)

> 🟢 **Synced 2026-05-09 (D-DOC-001 Step 2 cleanup):** This runbook applies to **all 15 override types**. Per-type approver matrix + dual-approval rules + reason-length minimum + auto-expiry + remediation-plan requirements live in `01-override-types.md` and `03-dual-approval-rules.md`. The flow below is generic and works for every type.

---

## Requester flow

1. Attempt gated action (e.g., publish coupon that breaches floor).
2. System detects breach → blocks action → opens Override modal.
3. Modal shows:
   - What's being requested
   - Why it's blocked (which floor, computed values, failed gate check)
   - Reason text field — **minimum length per override type: 10 chars baseline; 30 chars for the 5 override types added 2026-05-07 (`performance_budget_override`, `landing_quality_gate_override`, `landing_profit_guardrail_override`, `landing_inventory_guardrail_override`, `sensitive_cleanup_override`) + the 2 added with Strategic Enhancements (`safety_claim_override`, `recommendation_override`)**
   - Reason category select (per type — see `04-reason-categories.md`)
   - Expected impact (auto-computed display)
   - **Remediation plan** (mandatory for `performance_budget_override`, `landing_quality_gate_override`, `landing_inventory_guardrail_override`)
   - **Legal/compliance basis** (mandatory for `sensitive_cleanup_override`)
   - **Pre-cleanup backup reference** (mandatory for `sensitive_cleanup_override` — backup-skip flag forbidden)
   - Acknowledgement checkbox: "I understand this will reduce business profit by $X" (or override-type-specific copy)
4. Submit.
5. Status → `pending`.
6. Approver notified.
7. Requester sees pending status; can edit reason but not proposed action.

## Approver flow

1. Notification: "Override request from [requester] for [type]".
2. Open in admin (or mobile per `mobile_admin.access`).
3. Review:
   - context_snapshot (frozen state at request time)
   - proposed_action
   - guardrail_output (which floor, by how much)
   - reason + category + acknowledgement
   - requester history (recent overrides)
   - related entity history
4. Decide:
   - **Approve** — single approval OR mark first-of-dual.
   - **Reject** — reason required (≥10 chars).
   - **Request changes** — return to requester with note.
5. If dual approval, second approver receives notification.

## Apply phase

1. Once approved, requester sees "approved, click to apply".
2. Click → action executes.
3. `applied_at` recorded.
4. Audit log entry references `override_request_id`.

## Expiry

- After `expires_at`, status → `expired`. Cannot be applied. Requester notified.
- New request needed for repeat action.
- **Per-type auto-expiry windows** (per `01-override-types.md`):
  - `profit_guardrail` — 24h
  - `price_below_min` — 24h
  - `campaign_loss` — 7d
  - `stock_override` — 6h
  - `warranty_exception` / `payout_exception` / `payment_refund_exception` — per case
  - `country_activation` — until readiness reached
  - `performance_budget_override` — 14d
  - `landing_quality_gate_override` — 7d
  - `landing_profit_guardrail_override` — 7d
  - `landing_inventory_guardrail_override` — 72h
  - `sensitive_cleanup_override` — per case (max 30d)
  - `safety_claim_override` — 30d
  - `recommendation_override` — 14d
- **Server-side auto-revert on expiry** for the 5 override types added with D-PERF-003: page auto-unpublishes / budget re-enforces / cleanup job re-locks. No grace period.

## Mobile

Approvers can review + approve from mobile (Approvals & Overrides surface).
- Biometric re-auth required for approval action.
- Notification details on lock screen are summary only ("Override request awaiting your approval"); full context requires authenticated open.

## TODO

- TODO: full UX wireframes (modal, approver view, mobile).
- TODO: localized reason category labels.
- TODO: SLA on approver response (notify if no decision in N hours).
