# AI Outage / Fallback

**Status:** Draft (stub)
**Owner:** AI lead

## Detection

- Anthropic API errors > N% for X minutes.
- Token cost anomaly (spike).
- Hallucination spike (output validator rejection rate up).

## Response

### Anthropic outage
1. Failover to OpenAI per `LLMProvider` configuration.
2. Smart Notification.
3. Monitor quality + cost on alternate provider.

### Both providers down
1. Disable AI mode in Auto-Reply.
2. Switch all rules to "Template only" mode.
3. Conversations route directly to human agents.
4. Storefront chat widget shows: "Live chat is busy — please use WhatsApp or email."

### Hallucination spike
1. Disable AI mode for affected routes.
2. Roll back to previous prompt version.
3. Investigate via golden conversation suite.

## Recovery

1. Provider recovered or new prompt version validated.
2. Re-enable AI mode incrementally.
3. Monitor for 24 hours.

## TODO

- TODO: confirm OpenAI is fully wired with same tools for failover.
- TODO: define hallucination spike threshold.
