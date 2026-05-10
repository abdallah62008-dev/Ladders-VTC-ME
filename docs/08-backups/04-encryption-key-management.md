# Encryption Key Management

**Status:** Draft (stub)
**Owner:** Security lead

---

## Keys

| Key | Purpose | Storage |
|---|---|---|
| `BACKUP_ENCRYPTION_KEY` | Encrypts backup payloads | Secrets manager + escrow |
| `DB_AT_REST_KEY` | Postgres encryption-at-rest (managed by hosting if managed instance) | Managed by provider OR secrets manager |
| `MEDIA_ENCRYPTION_KEY` | Encrypts sensitive media if any (rare) | Secrets manager |
| Provider webhook secrets | Each payment + courier provider | Secrets manager, rotated quarterly |
| `JWT_SIGNING_KEY` | Customer JWT signing | Secrets manager, rotated quarterly |
| LLM API keys | Anthropic, OpenAI fallback | Secrets manager |

## Generation

- Use cryptographically secure RNG.
- Length: ≥256 bits.
- Generated locally (not via provider) for `BACKUP_ENCRYPTION_KEY`.

## Escrow (for `BACKUP_ENCRYPTION_KEY`)

**Split-knowledge** between two named guardians:
- Guardian A holds half of the key (e.g., via Shamir Secret Sharing 2-of-3).
- Guardian B holds half.
- Third copy in tamper-evident sealed envelope at offsite location.

Recovery requires 2 of 3 fragments.

## Rotation

- Backup key: annually OR on suspected compromise.
- Webhook secrets: quarterly OR on suspected compromise.
- JWT signing: quarterly with overlap (old + new accepted for transition).
- LLM API keys: on team member departure.

## Recovery drill

Annually:
- Reassemble `BACKUP_ENCRYPTION_KEY` from fragments.
- Decrypt a test backup.
- Confirm restore works.
- Re-seal fragments.
- Document drill in `decision_log`.

## TODO

- TODO: name the two guardians (TODO question Phase 0).
- TODO: pick Shamir Secret Sharing tool.
- TODO: schedule first recovery drill.
