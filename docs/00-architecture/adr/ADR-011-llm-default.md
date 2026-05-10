# ADR-011 — LLM default: Anthropic Claude (Sonnet 4.6 + Haiku 4.5)

**Status:** Proposed
**Date:** 2026-05-07
**Owner:** AI lead
**Supersedes:** none
**Superseded by:** none

---

## Context

The AI sales assistant must:
- Converse fluently in Arabic (per-country tone variations).
- Refuse confidently when asked to fabricate facts ("I don't know" instead of hallucinating).
- Use tool calls reliably (catalog/price/stock fetched via tools, never invented).
- Handle prompt injection from customer text.
- Run cost-effectively at MENA conversation volumes.
- Operate behind a `LLMProvider` abstraction so we can swap providers per task without rewriting orchestration.

We need two model tiers:
- **Sonnet-class** for sales reasoning, recommendations, comparison logic, judgment calls.
- **Haiku-class** for cheap classification (intent detection, FAQ matching), summarization for handoff briefs.

## Options considered

| Option | Verdict | Reason |
|---|---|---|
| **Anthropic Claude (Sonnet 4.6 + Haiku 4.5)** | ✅ Selected (default) | Best Arabic; strong refusal-on-uncertainty; robust tool use |
| OpenAI GPT-4.1 + GPT-4o-mini | 🔵 Backup, ready via abstraction | Strong tool use; Arabic acceptable; multimodal a plus |
| Google Gemini 2.x | 🔵 Backup, ready via abstraction | Long context; Arabic competent |
| Local open models (Llama 3.x, Qwen) | ❌ Rejected for Phase 1 | Arabic quality + tool-use reliability not yet at parity for production sales |
| Cohere Command-R | ❌ Rejected | Smaller ecosystem, less battle-tested for Arabic sales |

## Decision

Use **Anthropic Claude as the default provider**:
- **`claude-sonnet-4-6`** — primary reasoning, sales, recommendation, conversation.
- **`claude-haiku-4-5`** — intent classification, simple FAQ matching, summarization, handoff briefs.

Implement behind `LLMProvider` interface (ADR-012):
- All LLM calls go through `LLMProvider`.
- Per-task model + provider selectable via config (e.g., `intent_classifier.provider = 'anthropic'`, `intent_classifier.model = 'claude-haiku-4-5'`).
- Fallback chain: Claude → OpenAI on outage.

## Consequences

### Positive
- Strong Arabic dialect handling (formal Gulf, MSA-friendly Egyptian, direct Iraqi).
- Refusal-on-uncertainty behavior reduces hallucination risk.
- Tool use (function calling) is robust and well-documented.
- Provider abstraction means switching is config-only.

### Negative / risks
- Vendor concentration risk if Anthropic outage occurs.
- Pricing changes affect TCO.
- Token cost can exceed budget if conversations are long or cached poorly.

### Mitigations
- Provider abstraction with OpenAI as ready alternate (ADR-012).
- Conversation token budget caps (see `04-ai/10-cost-budgeting.md`).
- Cache common Q&A in Redis (see `04-ai/01-architecture-overview.md`).
- Monitor token spend daily; alert on anomalies.

## Per-task default routing (initial)

| Task | Default model | Rationale |
|---|---|---|
| Intent classification | Haiku | Cheap, deterministic, often rule-based first |
| FAQ matching (vector retrieval) | Haiku for re-ranking | Cheap |
| Sales reasoning / recommendation | Sonnet | Quality matters; user-facing |
| Order summary phrasing | Sonnet | Short but high-quality |
| Handoff brief generation | Haiku | Small, deterministic |
| Auto-reply AI fallback | Sonnet | User-facing |

Routing is config; can be retuned in production based on quality + cost telemetry.

## Phase 0 deliverables

- `LLMProvider` interface specified (text only, no implementation).
- Per-task model assignment table reviewed.
- Token budget cap proposed (TODO: confirm monthly cap).
- 50+ golden conversation specs covering ar-sa primary use cases (see `04-ai/11-golden-conversations.md`).

## References

- Master Plan v4 §9 (AI Sales Assistant Architecture)
- ADR-012 (LLM abstraction)
- `04-ai/01-architecture-overview.md`
- `04-ai/03-tools.md`
