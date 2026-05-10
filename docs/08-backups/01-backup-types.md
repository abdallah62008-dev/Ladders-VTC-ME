# Backup Types

**Status:** 🟢 **Destinations locked 2026-05-07** (D-BKP-002 Answered)
**Owner:** Infra lead + Security lead
**Last updated:** 2026-05-07
**Source:** Final Master Plan v4 §1.2; ADR-023 (✅ Accepted 2026-05-07)

> ⚠️ **Storage destinations confirmed:** **Primary = Cloudflare R2** (zero egress, consistent with ADR-013 media storage); **Offsite = Backblaze B2** (different cloud, cheap cold storage). Replication R2 → B2 via scheduled BullMQ worker. All backup payloads encrypted at rest with AES-256; key in 1Password `vtc-prod-backup-keys` vault (ADR-022) with split-knowledge escrow.

---

## Backup type matrix

| Type | Cadence | Retention | Primary | Offsite | Tool |
|---|---|---|---|---|---|
| Postgres logical backup | Hourly | 48 hours | **R2** (`vtc-backup-pg-logical`) | — | `pg_dump` |
| Postgres PITR (WAL streaming) | Continuous | 14 days | **R2** (`vtc-backup-pg-wal`) | **B2** weekly archive | `pgBackRest` |
| Postgres full snapshot | Daily | 90 days | **R2** (`vtc-backup-pg-snapshots`) | **B2** weekly | `pgBackRest` |
| Postgres weekly archive | Weekly | **7 years** | R2 (`vtc-backup-pg-archive`) | **B2** (`vtc-offsite-pg-archive`) | Archived |
| Media (R2 bucket) | Daily incremental | 90 days | R2 (`vtc-backup-media-replica`) | **B2** (`vtc-offsite-media`) | R2 sync |
| Files / configs | Daily | 90 days | R2 (`vtc-backup-files-configs`) | **B2** (`vtc-offsite-files`) | `restic` |
| Pre-risky-change snapshot | On trigger | 30 days | R2 (`vtc-backup-pre-risky-change`) | — | Triggered by app |

## Excluded — never backed up via this system

- `.env` files
- Secrets (API keys, payment credentials, webhook secrets)
- Encryption keys (live in secrets manager with separate escrow)

These live in the secrets manager with their own backup/escrow policy. See `04-encryption-key-management.md` and `05-secrets-exclusion-policy.md`.

## Encryption

All backups encrypted at rest (AES-256). Keys held in secrets manager with split-knowledge escrow.

## Checksum

SHA-256 checksum recorded per backup. Verified on restore.

## Targets

- **RPO** (Recovery Point Objective): ≤ 1 hour (PITR achieves this).
- **RTO** (Recovery Time Objective): ≤ 4 hours critical, ≤ 24 hours non-critical.

## Verification

Quarterly automated restore-test on a random backup. Failure → Smart Notification + Sev-1 runbook.

## TODO

- TODO: confirm `pg_dump` vs `pgBackRest` (recommendation `pgBackRest` for Phase 1+).
- ~~TODO: offsite destination — Backblaze B2 vs AWS S3 different region.~~ — 🟢 **ANSWERED 2026-05-07 (D-BKP-002)**: Backblaze B2 selected.
- TODO: file backup tool — `restic` recommended (S3-compatible, encrypted by default, mature).
