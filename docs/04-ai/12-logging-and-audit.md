# AI Logging and Audit

**Status:** Draft
**Owner:** AI lead

---

## What gets logged

### Per message
- `text_raw` (encrypted at rest, restricted access)
- `text_redacted` (PII-redacted, available for analytics)
- `intent_label`, `confidence`
- `llm_model`, `prompt_version_id`
- `tokens_in`, `tokens_out`, `latency_ms`
- `created_at`, `sender`, `channel`, `conversation_id`

### Per tool call
- `tool_name`, `input` (redacted), `output` (redacted), `duration_ms`, `success`, `error`
- `created_at`, `message_id`

### Per state transition
- `from_state → to_state`, `trigger`, `payload`, `created_at`

### Per handoff
- `reason`, `urgency`, `summary`, `requested_at`, `claimed_by`, `claimed_at`, `closed_at`

### Per LLM call
- `model`, `prompt_version_id`, `raw_completion`, `parsed_output`, `confidence`, `refusal_reason?`, `cost_usd`

## Retention

| Data | Retention |
|---|---|
| Raw transcripts | TODO: confirm (recommendation 90d) |
| Redacted transcripts | 7 years (compliance) |
| Tool call logs | 1 year |
| State transition logs | 1 year |
| Handoff logs | 1 year |
| Cost telemetry | 7 years |

## Access control

- `super_admin`, `ai_supervisor`: full access (raw + redacted)
- `customer_support_agent`, `sales_agent`: redacted only, scoped to their handled conversations
- `read_only_auditor`: redacted, all conversations
- All other roles: no access

## Replay

Admin Live Inbox shows full conversation transcript when an agent claims a handoff. Replay rendered with timestamps, tool calls inline, confidence scores visible.

## Privacy

- PII redactor runs **before** persistence to analytics tables.
- Customers can request data deletion (KSA PDPL, Egyptian PDPL); raw transcripts deleted, redacted retained for compliance.

## Compliance

- Audit log entries cannot be modified (trigger blocks UPDATE/DELETE).
- Cost values redacted from logs at all layers.
- Sentry beforeSend hook scrubs cost/PII fields.

## TODO

- TODO: confirm raw transcript retention period (90d / 1y / 7y).
- TODO: implement redactor with regex patterns + ML-based PII detector for edge cases.
- TODO: legal sign-off on log retention per country (KSA PDPL specifies maximums).
