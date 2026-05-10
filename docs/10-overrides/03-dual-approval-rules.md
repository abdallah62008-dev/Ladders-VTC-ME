# Dual Approval Rules

**Status:** Draft (stub)
**Owner:** Security lead

---

## Rule

Dual approval = two distinct user IDs from two distinct roles, with different IP/UA fingerprints.

## Server-side enforcement

DB trigger on `override_request` UPDATE:

```sql
IF NEW.requires_dual_approval AND NEW.status = 'approved' THEN
  -- both approvers set
  IF NEW.approved_by IS NULL OR NEW.second_approved_by IS NULL THEN
    RAISE EXCEPTION 'Dual approval required';
  END IF;
  -- distinct
  IF NEW.approved_by = NEW.second_approved_by THEN
    RAISE EXCEPTION 'Dual approval requires two distinct users';
  END IF;
  -- distinct roles (lookup)
  IF (SELECT role_id FROM "user" WHERE id = NEW.approved_by)
     = (SELECT role_id FROM "user" WHERE id = NEW.second_approved_by) THEN
    RAISE EXCEPTION 'Dual approval requires two distinct roles';
  END IF;
END IF;
```

## Application-side checks

- IP and UA differ between approvers (anti-collusion soft signal).
- Time gap ≥ 30 seconds between first and second approval (anti-rubber-stamp).
- Approver dwell-time tracked: <10 seconds → soft warning; <5 seconds → soft block.

## Anti-collusion telemetry

- Same approver pairing across many overrides → flagged for governance review.
- Same approver always uses same IP/device → flagged.

## Bypass

Only `super_admin` can override the dual-approval requirement, and only by setting `requires_dual_approval = false` on the policy AND including a reason. Recorded in audit log + escalation log.

## TODO

- TODO: tune dwell-time thresholds.
- TODO: anti-collusion ML model (Phase 10+).
