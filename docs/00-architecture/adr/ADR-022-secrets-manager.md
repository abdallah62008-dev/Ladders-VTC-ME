# ADR-022 — Secrets manager

**Status:** ✅ **Accepted — 2026-05-07**
**Date:** 2026-05-07
**Owner:** Security lead
**Supersedes:** none
**Tracker decision:** D-BKP-001 (🟢 Answered 2026-05-07)

---

## Context

Phase 0 requires a secrets manager chosen and provisioned (account created, no production secrets stored yet). All credentials (DB, payment provider, WhatsApp, LLM, courier APIs, encryption keys) must live there — never in code, env files committed to git, or backups.

## Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **1Password Secrets Automation** | Familiar UX, good audit log, strong access controls, MENA team-friendly, simple for owner/team operations, supports vault separation | Subscription cost; CLI integration adds some boilerplate | ✅ **Selected for Phase 1** |
| **Doppler** | Developer-first DX, env-var injection, multi-env, free tier viable | Smaller compliance posture; vendor lock-in | ❌ Rejected — less mature audit story |
| **AWS Secrets Manager** | Native if hosting on AWS; KMS integration | Tied to AWS; heavier setup; harder for non-engineers to use | ❌ Rejected — too AWS-coupled before D-INFRA-001 (hosting region) settled |
| **HashiCorp Vault (self-hosted)** | Full control; OSS available | Operations burden; over-engineered for our scale | ❌ Rejected — over-engineered for Phase 1 team size |
| **Vercel env vars + GitHub Actions secrets** | Zero extra cost | Two systems to manage; harder rotation; no fine-grained audit | ❌ Rejected — does not meet "audit log of every secret read" requirement |

## Decision

Use **1Password Secrets Automation** as the Phase 1 secrets manager.

### Why 1Password (Phase 1 rationale)

- Simple for owner/team operations — most teammates already have 1Password familiarity.
- Vault separation cleanly separates production / staging / dev and credential categories (payment, WhatsApp, AI, infra).
- Strong audit log of every credential read.
- Easier initial setup than AWS Secrets Manager (which couples to specific AWS regions) or HashiCorp Vault (which adds operational burden).
- Subscription cost is acceptable at our scale.

### Vault structure (locked)

Six top-level vaults in 1Password:

| Vault | Contents | Access |
|---|---|---|
| `vtc-prod-payment` | Stripe, Moyasar, Tap, PayTabs, Tabby, Tamara, Paymob, Fawry, ZainCash live + webhook signing secrets | Super Admin + Finance Admin only |
| `vtc-prod-whatsapp` | WhatsApp Cloud API tokens, Meta verify tokens, per-country phone-number IDs | Super Admin + Ops lead |
| `vtc-prod-ai` | Anthropic API key, OpenAI API key (fallback), pgvector model keys if any | Super Admin + AI lead |
| `vtc-prod-infra` | DB credentials (PG password), Redis password, Cloudflare API token, Vercel deploy token, Sentry DSN, observability tokens | Super Admin + Infra lead |
| `vtc-prod-backup-keys` | `BACKUP_ENCRYPTION_KEY` shards (split-knowledge with Guardian A + B), R2 access keys, B2 access keys | Super Admin + Security lead + escrow guardians |
| `vtc-staging` | All of the above for staging environment | Super Admin + relevant lead per category |

`vtc-dev` separate vault for shared developer workstation credentials (test-mode keys only, never live keys).

### Why not store live keys in `vtc-dev`

Test-mode keys are kept separate (lower-risk secrets). Live keys never appear in any vault accessible to engineers without a `production` role.

## Consequences

### Positive
- Familiar tool reduces onboarding friction.
- Vault separation enforces least-privilege at credential level (engineer with `vtc-staging` access cannot pull live keys).
- 1Password CLI (`op`) integrates with bootstrap scripts so the application reads secrets at boot via `op://...` references.
- Audit log shows who read what + when.

### Negative / risks
- 1Password subscription cost scales per seat. Manageable but a recurring OPEX line.
- 1Password CLI in CI requires a service account token; that token itself is bootstrap-secret stored in GitHub Actions Secrets (the only place outside 1Password where any credential lives).
- If 1Password were compromised at the vendor level, blast radius is high. Mitigation: master account has hardware-key 2FA mandatory.

### Mitigations
- Hardware-key (YubiKey) MFA on Super Admin + Finance Admin + Security Lead 1Password accounts mandatory.
- Quarterly rotation of all live keys (per ADR-022 constraint "rotation policy").
- Annual recovery drill: simulate 1Password outage; verify split-knowledge backup-key escrow allows backup decryption.
- Bootstrap token rotation policy: rotate the `op` CLI service account token quarterly.

## Phase 0 deliverables

- [x] 1Password account created (Super Admin owner).
- [ ] 6 production vaults created with access policies (Phase 0 week 1–2).
- [ ] Hardware MFA enrolled for the 3 super-vault holders.
- [ ] Bootstrap service account token issued (stored in GitHub Actions Secrets only).
- [ ] CI integration documented (how the application reads secrets at boot).
- [ ] Annual recovery drill scheduled.

## Phase 1 deliverables

- All credentials sourced exclusively from 1Password vaults.
- No `.env` file in repo (only `.env.example` with placeholders).
- CI runtime injects via `op` CLI.
- Phase 1 acceptance test: assert no secret-shaped strings in repo (Trufflehog) and no plaintext secrets in any backup payload.

## References

- Master Plan v4 §1.2 (Backup) and §15 (Cost privacy)
- Pre-coding question #70
- D-BKP-001 (Tracker decision, 🟢 Answered 2026-05-07)
- ADR-023 (Backup destination — depends on this)
- `08-backups/05-secrets-exclusion-policy.md`
- `08-backups/04-encryption-key-management.md`
