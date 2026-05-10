# 24-Hour Window Policy

**Status:** Draft (stub)
**Owner:** Ops lead

---

## The rule

Meta enforces:
- **Within 24h of last customer message** → free-form messages allowed.
- **Outside 24h window** → only pre-approved templates.

## Tracking

`conversation.last_customer_message_at` updated on every inbound message. Application checks before sending free-form.

## Outbound dispatch logic

```
if message_type = template:
    send (always allowed, even outside window)
elif message_type = free_form:
    if conversation.last_customer_message_at within 24h:
        send free-form
    else:
        ABORT — must use template OR re-engage via marketing template
```

## AI agent behavior

If AI wants to follow up after 24h (e.g., abandoned cart), it must:
1. Check window.
2. If outside → use approved `abandoned_cart` template.
3. Once customer responds, window opens again → free-form possible.

## Re-engagement templates

`abandoned_cart`, `reorder_reminder`, `seasonal_campaign` are all `MARKETING` templates designed for outside-window engagement.

## TODO

- TODO: dashboard showing % of conversations inside vs outside window.
- TODO: tooling to detect when free-form would fail and prevent dispatch.
