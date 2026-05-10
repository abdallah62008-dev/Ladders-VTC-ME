# Sev-1 Runbook

**Status:** Draft (stub)
**Owner:** Infra lead

Generic Sev-1 procedure. See specific runbooks for payment / WhatsApp / AI outages.

## Checklist

1. Acknowledge.
2. Page Super Admin + relevant lead.
3. Status page banner.
4. Internal incident channel created.
5. Determine impact (customers affected, regions, revenue).
6. Mitigation:
   - Revert recent deployment? (most common)
   - Failover provider?
   - Disable feature flag?
   - Restore from backup?
7. Confirm mitigation works.
8. Update status page.
9. Customer communication if widespread.
10. Post-mortem scheduled within 24 hours.

## Common patterns

- **Database connection pool exhausted** → scale pool or kill long queries.
- **Payment provider 5xx** → failover to alternate; communicate degraded mode.
- **WhatsApp template flagged by Meta** → switch to free-form within window OR pause campaigns.
- **AI cost spike** → disable AI for affected route; fall back to template-only auto-reply.

## TODO

- TODO: full playbook per common pattern.
- TODO: status page templates.
