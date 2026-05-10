# Smart Notification Center

**Status:** Draft (stub)
**Owner:** Analytics lead + Ops lead

---

## Alert types

| Alert | Severity | Default recipient role |
|---|---|---|
| Low stock | High | Inventory Manager + Country Manager |
| Negative-profit order | High | Finance Admin |
| Campaign losing money | High | Marketing Manager + Super Admin |
| High-risk order | Medium | Sales Manager |
| Urgent service ticket (safety) | Critical | Maintenance Manager + Super Admin |
| AI handoff pending | Medium | Sales Agents |
| Payout request awaiting approval | Medium | Finance Admin |
| Payment webhook failed | High | Backend lead + Finance |
| Pixel event failed | Medium | Marketing Manager |
| Landing page slow (CWV) | Medium | Frontend lead |
| SEO issue (broken link, missing hreflang) | Low | Content/SEO Editor |
| Warranty batch risk | High | Maintenance Manager |
| WhatsApp message failure | Medium | Ops lead |
| Backup verification failed | Critical | Infra lead + Super Admin |
| Override anomaly (>3/week) | Medium | Super Admin |
| Restore-test failure | Critical | Infra lead + Super Admin |
| Cost leakage detected | Critical | Security lead + Super Admin |

## Channels

- In-app (Live Inbox notification badge)
- Email
- WhatsApp template (`alert_<type>`)
- Mobile push (PWA)
- Slack (TODO if used)

## Per-user preferences

`notification_rule` table:
- `recipient_user_id`, `alert_type`, `severity_min`, `channels`, `quiet_hours_respected`

## Anti-noise

- Deduplication: same alert within 5 min collapsed.
- Severity-based routing: low alerts → digest only; critical → immediate multi-channel.
- Rate limiting per recipient.

## TODO

- TODO: complete alert catalog.
- TODO: per-alert severity tuning over Phase 10.
- TODO: confirm whether Slack/Teams/etc. integration needed.
