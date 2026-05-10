# Backup Verification Plan

**Status:** Draft (stub)
**Owner:** Infra lead

---

## Quarterly automated restore-test

Every quarter:
1. Pick a random backup from the last 30 days.
2. Spin ephemeral staging environment.
3. Restore.
4. Run verification suite:
   - Checksum matches
   - Row counts within tolerance vs source
   - Spot-check critical tables (orders, customers, products)
   - RLS policies still enforced
   - Application boots and connects
5. Tear down staging.
6. Record in `backup_verification`.
7. On failure: Sev-1 incident; runbook activated.

## Continuous integrity

- Every backup checksums on creation.
- Random sample (1%) re-checksummed weekly to detect bit rot.

## Annual recovery drill

- Encryption key reassembly drill (see `04-encryption-key-management.md`).
- Cross-team disaster simulation (production restore).

## Schema

```
backup_verification (
  id, backup_job_id, checksum_match: bool,
  restore_test_passed: bool, tested_at, tested_by,
  notes
)
```

## TODO

- TODO: full verification SQL suite.
- TODO: ephemeral staging provisioning automation.
- TODO: drill runbook + comms plan.
