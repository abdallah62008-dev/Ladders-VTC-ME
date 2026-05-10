# Pre-Risky-Change Backup Triggers

**Status:** Draft
**Owner:** Infra lead

---

## Triggers

The following actions trigger an automatic full backup **before** they execute. The action is **blocked** until the backup completes + checksum verifies.

| Action | Trigger detail |
|---|---|
| Bulk pricing change | Threshold: > X rows OR > Y% price decrease (TODO confirm) |
| Bulk stock adjustment | > X rows |
| Country activation | Always |
| Country deactivation | Always |
| Mass coupon activation | > N coupons or coupon affecting > Y orders/day projected |
| Mass refund / dispute action | > X refunds in batch |
| Production schema migration | Always |
| Marketer mass payout | Total payout > threshold |
| Mass customer export | > X customers |
| Bulk import that updates existing records | Always |
| Override that breaches profit floor by > Y% | Always |
| Restore-to-production | Pre-restore + post-restore backup |

## Implementation

```
async fn risky_action(...):
    backup = await trigger_backup('pre_risky_change', related_action_id)
    if not backup.checksum_verified:
        raise "backup failed"
    audit_log.append({action, backup_id})
    proceed_with_action()
```

## UX

- Action button shows: "Action will trigger pre-action backup. Continue?"
- Progress indicator while backup runs (typically 30s–5min).
- On failure: action aborts; admin sees clear error; Smart Notification fires.

## Schema

```
backup_job.related_action_type = 'bulk_pricing_change' | 'mass_refund' | …
backup_job.related_action_id = uuid of the action
```

## Anti-bypass

- Server-side enforcement; UI cannot skip the backup.
- Action API endpoints check `backup_job.status = 'completed'` AND `checksum_verified = true` before proceeding.

## TODO

- TODO: confirm thresholds (X rows, Y% price change, etc.).
- TODO: latency budget per backup type.
- TODO: queue/lock to prevent concurrent risky actions.
