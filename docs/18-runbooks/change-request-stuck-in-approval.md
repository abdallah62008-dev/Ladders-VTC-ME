# Runbook — Change Request Stuck in Approval

**Status:** Stub (Phase 1 placeholder; full content Phase 6+)
**Owner:** Operations Director + Super Admin
**Triggered by:** Alert category `business`, sub-type `change_request_stuck` OR `override_request_stuck`

---

## When this runbook applies

An `approval` row OR `override_request` row has been in `pending` status longer than its expected SLA. Common patterns:

- Approver on PTO; secondary owner not designated
- Approver did not see notification (channel preferences incorrect)
- Request lacks sufficient context for approver to decide
- Approver unsure of policy (escalation needed)

---

## SLA expectations

| Override / approval type | Expected SLA |
|---|---|
| `profit_guardrail` | 4 business hours |
| `price_below_min` | 4 business hours |
| `campaign_loss` | 24 business hours |
| `stock_override` | 1 business hour (operational urgency) |
| `warranty_exception` | 48 business hours |
| `payout_exception` | 48 business hours |
| `country_activation` | 7 business days |
| `payment_refund_exception` | 24 business hours |
| `performance_budget_override` | 48 business hours |
| `landing_quality_gate_override` | 4 business hours |
| `landing_profit_guardrail_override` | 4 business hours |
| `landing_inventory_guardrail_override` | 4 business hours |
| `sensitive_cleanup_override` | 24 business hours |
| `safety_claim_override` | 48 business hours (Compliance review needed) |
| `recommendation_override` | 24 business hours |

(Per `10-overrides/01-override-types.md` + Module 25.)

---

## Diagnostic steps

1. Pull the stuck request: `SELECT * FROM override_request WHERE id = '<id>'` or `SELECT * FROM approval WHERE id = '<id>'`.
2. Check `requested_at` vs SLA — how overdue?
3. Check `approval_required_role` — is the role's user_id available?
4. Check the user's `last_login_at` — recently active?
5. Check `notification` log — did they receive notification?
6. Check `audit_log` — any partial actions (e.g., started review but didn't complete)?

---

## Resolution paths

- **Notify approver** via secondary channel (WhatsApp + phone if email unanswered)
- **Reassign to secondary owner** (per `data-ownership-matrix.csv`) if primary owner unreachable
- **Escalate to Super Admin** if both unreachable
- **Cancel the request** if no longer needed (audit-log the cancel reason)
- **Escalate to CTO** if institutional decision is missing

---

## Prevention

- On-call rotation populated for each approver role (per `18-runbooks/on-call-rotation.md`)
- Smart Notification escalation chain configured (acknowledged → assigned → escalated)
- PR review template includes "approver designated and aware" checkbox

---

## TODO

- TODO: full procedure Phase 6 with admin Pending Requests dashboard.
- TODO: auto-reassignment policy after 50% of SLA elapses.
- TODO: integration with Smart Notification escalation chain.
