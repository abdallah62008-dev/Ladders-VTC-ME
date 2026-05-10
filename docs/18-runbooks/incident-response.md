# Incident Response Runbook

**Status:** Draft (stub)
**Owner:** Infra lead

---

## Severity levels

- **Sev-1** — Site down, payment broken, security breach, cost data leak.
- **Sev-2** — Significant degradation, AI hallucination spike, payment provider outage.
- **Sev-3** — Minor bug, single-feature breakage.
- **Sev-4** — Cosmetic.

## Steps (Sev-1)

1. **Acknowledge** in incident channel.
2. **Page** on-call (super_admin + relevant lead).
3. **Communicate**: status page banner, internal channel.
4. **Triage**: identify scope, root cause hypothesis.
5. **Mitigate**: revert deployment, failover provider, restore from backup if needed.
6. **Resolve**: confirm issue gone.
7. **Communicate**: status page resolved.
8. **Post-mortem within 48 hours**: blameless, action items in `decision_log`.

## Sev-1 specific runbooks

- `sev-1-runbook.md` — generic Sev-1
- `payment-provider-outage.md`
- `whatsapp-outage.md`
- `ai-outage-fallback.md`

## Cost data leak (super-Sev-1)

1. **Disable** the leaking surface immediately (route, endpoint, export).
2. **Rotate** credentials if applicable.
3. **Identify scope**: who saw what.
4. **Notify** Super Admin + Finance + Legal.
5. **Audit** access logs.
6. **Remediate** — close the leak.
7. **Post-mortem** + legal counsel involvement.

## TODO

- TODO: incident channel tool (Slack? PagerDuty?).
- TODO: status page tool.
- TODO: on-call rotation defined (`on-call-rotation.md`).
