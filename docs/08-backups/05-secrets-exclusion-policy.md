# Secrets Exclusion Policy

**Status:** 🟢 **Secrets manager locked 2026-05-07** (D-BKP-001 Answered)
**Owner:** Security lead
**Source:** ADR-022 (✅ Accepted 2026-05-07)

> ⚠️ **Single source of truth for all credentials: 1Password Secrets Automation.** Six production vaults: `vtc-prod-payment`, `vtc-prod-whatsapp`, `vtc-prod-ai`, `vtc-prod-infra`, `vtc-prod-backup-keys`, plus `vtc-staging` and `vtc-dev` (test-mode keys only). See ADR-022 for full vault structure and access control.

---

## Hard rule

Secrets must **never** appear in:
- Application code
- Git history (including past commits)
- **Documentation** (this file included — no actual values, only placeholders + 1Password references like `op://vtc-prod-payment/stripe/secret_key`)
- Backups (R2 primary or B2 offsite — payloads encrypted, but secrets must be excluded entirely as defense-in-depth)
- Logs
- CI environment variables (other than the 1Password service-account bootstrap token, which is itself rotated quarterly)
- Sentry / Grafana telemetry
- Webhooks
- Database dumps
- `.env` files committed to git (only `.env.example` with placeholders)

## What counts as a "secret"

- API keys (LLM providers, payment providers, courier APIs)
- Webhook signing secrets
- Database passwords
- JWT signing keys
- Encryption keys
- OAuth client secrets
- Any credential that grants access if leaked

## Implementation

### Backups
- Backup tools configured to skip:
  - `*.env*` files
  - Files matching secret-name patterns
  - Specific tables/columns if any (currently none — secrets not in DB)
- CI test: grep backup payload for known secret patterns; fail build on hit.

### Logs
- Sentry beforeSend hook scrubs known secret patterns + field names matching `/key|secret|token|password|api_key/i`.
- Grafana log pipeline runs same scrubber.
- Application logger never logs request body for secrets-bearing endpoints (settings, webhook config).

### Code review
- PRs containing strings that look like secrets (high-entropy, long) auto-flagged by linter.
- `.gitignore` includes all env file patterns.

### CI
- **Single bootstrap secret in CI:** the 1Password service-account token (`OP_SERVICE_ACCOUNT_TOKEN`) stored in GitHub Actions Secrets.
- All other secrets fetched at runtime from 1Password via the `op` CLI: `op read "op://vtc-prod-infra/db/password"`.
- The bootstrap token itself rotates quarterly.
- No other env variable in CI may hold a live secret value.

### 1Password vault structure (locked per ADR-022)

| Vault | Used by | Access |
|---|---|---|
| `vtc-prod-payment` | Payment provider keys (Stripe, Moyasar, Tap, Paymob, ZainCash, Tabby, Tamara, Fawry) + webhook signing secrets | Super Admin + Finance Admin |
| `vtc-prod-whatsapp` | WhatsApp Cloud API tokens, Meta verify tokens, per-country phone IDs | Super Admin + Ops lead |
| `vtc-prod-ai` | Anthropic API key, OpenAI API key | Super Admin + AI lead |
| `vtc-prod-infra` | DB credentials, Redis password, Cloudflare API token, Vercel deploy token, Sentry DSN | Super Admin + Infra lead |
| `vtc-prod-backup-keys` | `BACKUP_ENCRYPTION_KEY` shards (split-knowledge), R2 access keys, B2 access keys | Super Admin + Security lead + escrow guardians A & B |
| `vtc-staging` | Same categories for staging | Per category lead |
| `vtc-dev` | Test-mode keys only (no live credentials ever) | All engineers |

Hardware-key (YubiKey) MFA mandatory on Super Admin + Finance Admin + Security Lead 1Password accounts.

## Detection

- TruffleHog or similar runs on every commit + nightly.
- Failed leak detection → block PR; rotate any leaked secret immediately.

## Incident response

If a secret leaks:
1. Rotate immediately.
2. Audit recent activity using the leaked credential.
3. Document in `decision_log`.
4. Post-mortem within 48 hours.

## TODO

- TODO: write CI grep test for backup payloads (Trufflehog + custom patterns).
- TODO: implement Sentry scrubber.
- TODO: secret-rotation runbook per provider (quarterly cadence locked).
- TODO: 1Password vault provisioning checklist for Phase 0 week 1–2.
- TODO: hardware-MFA enrollment for the 3 super-vault holders before any production secret loaded.
