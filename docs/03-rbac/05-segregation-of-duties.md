# Segregation of Duties

**Status:** Draft
**Owner:** Security lead

---

## Principle

High-impact actions require two distinct user IDs from two distinct roles, with different IP/UA fingerprints (so one person operating two accounts cannot fake dual approval).

---

## Dual-approval requirements

| Action | First approver | Second approver | Notes |
|---|---|---|---|
| `restore.production` | Super Admin | Finance Admin OR another Super Admin | Reason mandatory; maintenance window declared |
| `marketer.payout.approve` (above threshold) | Finance Admin | Super Admin | Threshold TODO |
| `override.approve.country_activation` | Super Admin | Country Manager | Needed when activating before readiness checklist passes |
| `override.approve.payment_refund_exception` | Finance Admin | Super Admin | Refund > original charge or without delivery proof |
| `override.approve.payout_exception` | Finance Admin | Super Admin | Early payout, payout to flagged marketer |
| `override.approve.warranty_exception` (high value) | Maintenance Manager | Finance Admin | "High value" = TODO threshold |
| `override.approve.campaign_loss` | Super Admin | Marketing Manager | Forecast shows negative business profit |

---

## Server-side enforcement

Trigger on `override_request` UPDATE (see `01-database/07-triggers.md`):

```sql
IF NEW.requires_dual_approval AND NEW.status = 'approved' THEN
  IF NEW.approved_by IS NULL OR NEW.second_approved_by IS NULL THEN
    RAISE EXCEPTION 'Dual approval required';
  END IF;
  IF NEW.approved_by = NEW.second_approved_by THEN
    RAISE EXCEPTION 'Dual approval requires two distinct users';
  END IF;
  -- Role distinctness checked via lookup
END IF;
```

Application also checks:
- IP and UA differ between approvers (anti-collusion soft signal)
- Time gap ≥ 30 seconds between first and second approval (anti-rubber-stamp)

---

## Anti-collusion telemetry

- IP/UA fingerprint comparison on approvals.
- Same approver pairing across many overrides → flagged for governance review.
- Approver dwell-time tracked: <10 seconds → soft warning.

---

## TODO

- TODO: confirm thresholds (payout, warranty value) with Finance.
- TODO: implement role-distinctness check in trigger via lookup join.
- TODO: dwell-time enforcement — block <5 seconds, warn 5–30 seconds, accept >30 seconds.
