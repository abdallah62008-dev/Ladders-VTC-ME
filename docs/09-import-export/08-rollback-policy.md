# Import Rollback Policy

**Status:** Draft (stub)
**Owner:** Backend lead + Finance

---

## Approaches

### A. Pre-action backup
Most reliable. Pre-risky-change backup taken before import. Rollback = restore-to-staging or restore-to-production.

### B. Per-row reverse
For small imports: re-import original values from `country_data_audit.old_value`.

### C. Compensating change
For complex imports (e.g., bulk price change applied + sales already happened): document reversal in `decision_log`; do not unwind sold orders.

## Decision matrix

| Situation | Approach |
|---|---|
| Bad import, no orders affected yet | A (full restore) |
| Bad import, some orders placed at new prices | C (going forward only) + targeted refunds |
| Bad cost import | A (always restore — cost feeds into margin reports) |
| Bad translation | B (re-import correct values) |
| Bad coupon | A or B; deactivate immediately, communicate to affected customers |

## Audit

Every rollback recorded in `audit_log` + `decision_log` with full context.

## TODO

- TODO: scenarios catalog with response playbook.
- TODO: customer communication templates for affected refunds.
