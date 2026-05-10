# ADR-023 — Backup destination

**Status:** ✅ **Accepted — 2026-05-07**
**Date:** 2026-05-07
**Owner:** Infra lead
**Tracker decision:** D-BKP-002 (🟢 Answered 2026-05-07)

---

## Context

Phase 0 requires backup destinations provisioned (empty buckets created). Backups span Postgres logical, PITR (WAL), media (R2 replica), files/configs, and pre-risky-change snapshots. Two destinations required: primary + offsite (different region or different cloud).

## Options considered

### Primary
| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Cloudflare R2** | Zero egress fees; co-located with CDN; consistent with ADR-013 (media storage) | Newer service vs S3 | ✅ **Selected** |
| AWS S3 (me-south-1) | Battle-tested; native ZATCA-friendly region | Egress fees for offsite copy; couples to AWS hosting | ❌ Rejected |
| Backblaze B2 | Cheapest cold | Slower retrieval; better as offsite than primary | ❌ Rejected as primary (but selected as offsite) |

### Offsite
| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Backblaze B2** | Cheap cold storage; different cloud → reduces correlated-failure risk; S3-compatible API | Slower retrieval than hot tiers; trust-but-verify for compliance posture | ✅ **Selected** |
| AWS S3 in different region (e.g., eu-central-1) | Geographic separation | Cost adds up; same-cloud correlated risk | ❌ Rejected — same-cloud risk |
| Wasabi | Cheap; S3-compatible | Egress charges if frequent restore-tests | ❌ Rejected |

## Decision

- **Primary:** Cloudflare R2 (consistent with ADR-013 for media; zero egress; same control plane as CDN; familiar tooling).
- **Offsite:** Backblaze B2 (different cloud → reduces correlated-failure risk; cheapest sustainable cold; S3-compatible).

### Bucket layout

```
Cloudflare R2 (primary):
  ├── vtc-backup-pg-logical              hourly pg_dump, 48h retention
  ├── vtc-backup-pg-wal                  PITR WAL stream, 14d retention
  ├── vtc-backup-pg-snapshots            daily full snapshots, 90d retention
  ├── vtc-backup-pg-archive              weekly, 7y retention
  ├── vtc-backup-media-replica           daily incremental of media bucket, 90d
  ├── vtc-backup-files-configs           daily restic snapshot, 90d
  └── vtc-backup-pre-risky-change        triggered, 30d retention

Backblaze B2 (offsite):
  ├── vtc-offsite-pg-snapshots-weekly    cross-cloud replica of weekly
  ├── vtc-offsite-pg-archive             cross-cloud replica of 7y archive
  ├── vtc-offsite-media                  cross-cloud media DR
  └── vtc-offsite-files                  cross-cloud configs DR
```

R2 → B2 replication runs as a scheduled BullMQ job (Phase 1) using S3-compatible APIs. Initially weekly + on-demand for archives; can ramp to daily incremental once Phase 9 verification plan stabilizes.

### Encryption

- All backup payloads encrypted at rest with AES-256.
- Encryption key (`BACKUP_ENCRYPTION_KEY`) stored in 1Password (`vtc-prod-backup-keys` vault per ADR-022) with split-knowledge escrow between Guardian A + Guardian B (see `08-backups/04-encryption-key-management.md`).
- R2 + B2 both encrypt-in-transit (TLS) and at-rest (provider default).
- Application-layer envelope encryption for backup payloads → even if either provider is compromised, payloads remain encrypted with our own key.

### Access control

- Access keys for R2 and B2 stored in 1Password `vtc-prod-backup-keys`.
- Read access: `backup.read` scope (Super Admin + Infra lead + Security lead per ADR-022 vault structure).
- Write access (create new backups): `backup.create` (Super Admin + Infra lead + scheduled BullMQ workers).
- Restore-to-production access: `restore.production` requires dual approval (Super Admin + Finance Admin or another Super Admin).
- No external marketer or finance reporter ever has access to backup buckets.

## Consequences

### Positive
- Zero egress on the primary (R2 already used for media; same provider, same tooling).
- Cross-cloud offsite (R2 → B2) provides genuine correlated-failure resilience.
- Cost is predictable and low (R2 is cheap; B2 is cheaper).
- S3-compatible APIs on both sides keep tooling simple.

### Negative / risks
- Two providers = two access patterns to manage.
- B2 retrieval is slower than hot tiers. Mitigated: weekly archives suffice for DR; PITR + recent snapshots stay on R2.
- Cloudflare control plane is a single point of risk for the primary. Mitigated: B2 offsite gives DR fallback.

### Mitigations
- Quarterly automated restore-test (per `08-backups/06-verification-plan.md`) — random backup picked, restored to ephemeral staging, verified.
- Annual key-recovery drill: reassemble `BACKUP_ENCRYPTION_KEY` from Guardian A + B fragments and decrypt a test backup.
- Monthly B2 → R2 round-trip checksum verification on a sampled archive.

## Phase 0 deliverables

- [ ] R2 buckets provisioned (empty) with access policies.
- [ ] B2 account created; offsite buckets provisioned (empty).
- [ ] R2 → B2 replication credentials in 1Password `vtc-prod-backup-keys` vault.
- [ ] BullMQ worker stub for replication (no code yet — provisioning only).
- [ ] First recovery drill scheduled (within Phase 0 close + 6 months).

## Phase 1 deliverables

- Daily Postgres backup running with checksum verification.
- R2 buckets receiving payloads.
- First B2 replication confirmed (manual run + automated schedule).
- CI test: Trufflehog grep on a backup payload returns no secret matches (`.env` exclusion test).

## References

- Master Plan v4 §1.2 (Backup & Restore Dashboard)
- ADR-013 (Cloudflare R2 for media)
- ADR-022 (Secrets manager — 1Password)
- Pre-coding question #67
- D-BKP-002 (Tracker decision, 🟢 Answered 2026-05-07)
- `08-backups/01-backup-types.md`
- `08-backups/04-encryption-key-management.md`
- `08-backups/05-secrets-exclusion-policy.md`
- `08-backups/06-verification-plan.md`
