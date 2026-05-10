# LLM Provider Abstraction

**Status:** Draft
**Owner:** AI lead

---

## Why

To swap LLM providers (Anthropic ↔ OpenAI ↔ Gemini ↔ local) per task without rewriting orchestration. Vendor concentration risk + cost optimization + benchmarking.

## `LLMProvider` interface (TypeScript-style spec)

```ts
interface LLMProvider {
  name: 'anthropic' | 'openai' | 'gemini' | 'local';

  chat(input: {
    messages: Message[];
    system?: string;
    tools?: ToolDefinition[];
    model: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: 'json' | 'text';
    metadata?: Record<string, string>;
  }): Promise<{
    content: string;
    parsed_output?: object;          // structured output if requested
    tool_calls: ToolCall[];
    usage: { input_tokens, output_tokens, total_tokens };
    model: string;
    provider: string;
    latency_ms: number;
  }>;
}
```

## Per-task config

```yaml
# ai/routing.yaml (illustrative; TODO: confirm format)
intent_classifier:
  provider: anthropic
  model: claude-haiku-4-5
sales_reasoning:
  provider: anthropic
  model: claude-sonnet-4-6
  fallback:
    provider: openai
    model: gpt-4.1
order_summary:
  provider: anthropic
  model: claude-sonnet-4-6
faq_reranking:
  provider: anthropic
  model: claude-haiku-4-5
```

## Outage fallback

If primary provider returns error/timeout:
1. Retry once.
2. Fail over to configured `fallback`.
3. If fallback also fails → return graceful degraded response (canned templates) → handoff.

## Vendor-specific quirks

| Vendor | Quirk |
|---|---|
| Anthropic | Tool use uses `tool_use` content blocks; structured output via prompt engineering |
| OpenAI | `tools` parameter; `response_format: json_schema` for structured |
| Gemini | Different tool call schema; needs adapter |
| Local | Quality varies; tool use less reliable; only for non-customer-facing tasks (e.g., summarization) |

Each adapter normalizes vendor specifics behind the interface.

## Cost tracking

Every call returns `usage`. Logged to `ai_response.tokens_in/out`. Daily cost dashboard sums by provider × model × task.

## TODO

- TODO: confirm config format (YAML in repo vs DB rows).
- TODO: vendor adapter implementations spec.
- TODO: load testing plan for provider swap.
