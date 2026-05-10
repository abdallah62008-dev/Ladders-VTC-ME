# WhatsApp Cloud API — Overview

**Status:** Draft
**Owner:** Ops lead + Backend lead

---

## Why direct (not via reseller)

- Lower cost
- Full template control
- Direct webhook access
- Faster troubleshooting

## Architecture

```
Customer (WhatsApp app)
    ↕
Meta WhatsApp Cloud API
    ↕
/api/v1/webhooks/whatsapp           ← inbound
Outbound: HTTPS POST to Cloud API   ← we send
    ↕
Channel adapter → Conversation Orchestrator (see 04-ai/01-architecture-overview.md)
```

## Numbers per country

| Country | Number | Display name |
|---|---|---|
| KSA | TODO +966 ... | Smart Ladders KSA |
| Egypt | TODO +20 ... | Smart Ladders Egypt |
| Iraq | TODO +964 ... | Smart Ladders Iraq |

Each verified separately via Meta Business Manager (see `03-numbers.md`).

## Inbound flow

1. Customer messages WhatsApp number.
2. Meta calls our webhook with message payload.
3. We verify Meta signature.
4. Channel adapter normalizes message into canonical envelope.
5. Conversation orchestrator processes.
6. AI/template/human reply dispatched.

## Outbound flow

1. App calls `/messages` endpoint of Cloud API.
2. **Within 24h customer-initiated window**: free-form messages allowed.
3. **Outside 24h window**: only pre-approved templates allowed.
4. Dispatch worker (BullMQ) handles outbound queue.
5. Status webhooks (delivered/read/failed) update `message_log`.

## Authentication

Cloud API access token in secrets manager. Rotated per Meta policy.

## Rate limits

Meta enforces per-number rate limits (initially 1k messages/day → 10k → 100k as account ages). Track usage; throttle.

## Webhook verification

Two-step:
1. Meta GET `/api/v1/webhooks/whatsapp?hub.verify_token=...&hub.challenge=...` — return challenge if token matches.
2. Meta POST events with `X-Hub-Signature-256` HMAC; verify before processing.

## Failover

If Meta Cloud API is down:
- Outbound queued in BullMQ for retry.
- Smart Notification fires after 5 minutes of failures.
- Inbound: nothing we can do — Meta will retry delivery to our webhook when service recovers.

## TODO

- TODO: confirm 3 numbers verified.
- TODO: rate limit telemetry dashboard.
- TODO: account aging strategy (start with 1k/day; ramp gradually).
