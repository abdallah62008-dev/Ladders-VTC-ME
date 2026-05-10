# Disaster Recovery

**Status:** Draft (stub)
**Owner:** Infra lead

---

## RTO / RPO targets

| Data category | RPO | RTO |
|---|---|---|
| Customer orders + payments | ≤ 1 hour | ≤ 4 hours |
| Customer profiles | ≤ 1 hour | ≤ 4 hours |
| Catalog + pricing | ≤ 1 hour | ≤ 4 hours |
| Conversations | ≤ 4 hours | ≤ 24 hours |
| Media | ≤ 24 hours | ≤ 72 hours |
| Reports / analytics | ≤ 24 hours | ≤ 72 hours |

## Scenarios

| Scenario | Plan |
|---|---|
| Hosting region outage | Failover to backup region (TODO confirm DR strategy) |
| Database corruption | Restore from PITR within last hour |
| Compromised credentials | Rotate all secrets; restore from clean backup if data tampered |
| Ransomware | Restore from offsite (immutable) backup |
| Accidental data deletion | Use audit log to reconstruct OR restore-to-staging + cherry-pick |
| Provider data loss (rare) | Restore from offsite |

## Multi-region

For Phase 1: single primary region (Hetzner Frankfurt OR AWS me-south-1) with offsite backup region.
For later phase: warm standby in second region (TODO Phase 10+).

## Communication

If outage affecting customers:
- Status page update.
- WhatsApp template `service_disruption` (TODO submit).
- Storefront banner.
- Internal: incident channel + on-call.

## Post-incident

Every incident:
- Post-mortem within 48 hours.
- Action items in decision_log.
- Runbook updates.

## TODO

- TODO: status page tool (Statuspage.io / BetterStack / built-in).
- TODO: confirm DR region.
- TODO: customer-facing comms templates.
