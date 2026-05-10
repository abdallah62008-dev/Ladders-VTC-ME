# Restore Runbook

**Status:** Draft
**Owner:** Infra lead

---

## Staging restore (any super_admin)

1. Open Admin → System → Backups → Restore Jobs.
2. Select source backup.
3. Select scope:
   - Full database
   - Specific tables
   - Media only
   - Files only
4. Enter reason (mandatory, ≥10 chars).
5. Click "Restore to staging".
6. System spins ephemeral staging environment.
7. Restores backup; verifies checksum.
8. Emails URL to requester.
9. Audit-logged in `restore_job` and `audit_log`.

## Production restore (rare; double-approved)

**Use only for catastrophic data loss or compromised production.**

### Pre-flight
- Super Admin opens restore request with reason (≥30 chars; full incident summary).
- Second approver (Finance Admin or another Super Admin) reviews + approves.
- Maintenance window declared (storefront → maintenance mode).
- Affected users notified (if scope known).

### Execution
1. Take pre-restore backup of current production state (don't lose anything).
2. Restore backup to production database.
3. Verify checksum.
4. Run post-restore verification:
   - RLS policies still in place
   - Audit log intact
   - Cost columns still redacted for non-finance roles
   - Critical tables have expected row counts (within tolerance)
   - Recent in-flight orders reconciled
5. Re-enable production traffic.
6. Smart Notification: "production restore completed".
7. Post-mortem within 48 hours.

### Rollback
If restore fails or causes new issues, restore from the pre-restore backup taken in step 1.

## Common scenarios

| Scenario | Action |
|---|---|
| Accidental DELETE on a single record | Avoid full restore; use audit log to reconstruct + manual fix. |
| Bad migration | Forward-fix preferred; restore only if data corrupted. |
| Compromised data | Full restore from clean backup + secrets rotation. |
| Customer requests data deletion | Soft delete + scheduled hard delete; not a restore scenario. |

## Quarterly drill

Pick a random recent backup → restore to staging → run verification suite → confirm checksum. Failure → escalate.

## TODO

- TODO: maintenance-mode banner copy per locale.
- TODO: post-restore verification SQL suite.
- TODO: customer notification template.
- TODO: rollback procedure tested on staging at least once.
