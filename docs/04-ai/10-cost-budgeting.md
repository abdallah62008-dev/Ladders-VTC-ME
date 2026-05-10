# Token Cost Budgeting

**Status:** Draft
**Owner:** AI lead + Finance

---

## Cost discipline

LLM cost is a real OPEX line. Without discipline it dominates.

## Levers

| Lever | Mechanism |
|---|---|
| **Model routing** | Haiku for cheap tasks (intent, FAQ rerank, summary); Sonnet only where quality matters |
| **Caching** | Common Q&A canned in Redis; tool results memoized per `(args_hash, ttl)` |
| **Per-conversation cap** | 50k input + 10k output total; over → handoff |
| **Per-turn cap** | 4k input + 1k output (Sonnet) |
| **Truncate long histories** | Use last N turns + brief summary of older context |
| **Compress system prompt** | Move static rules to "system" once; vary only state instructions |
| **Tool result truncation** | search_products returns top-5, not top-50 |
| **Streaming** | Stream output to user — perceived latency drops; cost identical |

## Daily budget

| Country | Initial monthly cap (USD, TODO confirm) |
|---|---|
| KSA | TODO |
| Egypt | TODO |
| Iraq | TODO |
| **Total** | TODO |

## Alerts

- Spend >50% of monthly budget → notification.
- Spend >75% → alert + Marketing Manager review.
- Spend >100% → halt non-essential AI tasks (auto-reply AI mode → template-only).

## Per-conversation telemetry

- `message.tokens_in`, `message.tokens_out`, `message.latency_ms` logged.
- `ai_response.cost_usd` computed (input × input_price + output × output_price).
- Aggregated daily into `ai_daily_cost_summary` (TODO add to materialized views).

## TODO

- TODO: confirm monthly budget cap.
- TODO: cost-per-conversation target.
- TODO: anomaly detection (per-conversation cost > 99th percentile → flag).
- TODO: prompt-cache-hit rate target.
