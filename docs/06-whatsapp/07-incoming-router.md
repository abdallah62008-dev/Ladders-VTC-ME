# Incoming Message Router

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Routing

Inbound webhook → channel adapter normalizes → routes to:
1. **Auto-Reply Rules Engine** first (deterministic templates for known patterns).
2. If no rule matches OR mode is AI → **Conversation Orchestrator** (state machine + LLM).
3. If a human has claimed the conversation (handoff active) → goes to Live Inbox; AI bypassed.

## Decision tree

```
inbound message
  ↓
identify country (by which number received)
  ↓
identify customer (by phone — known? recognize prior conversation/order)
  ↓
detect opt-out keyword
  → if yes: process opt-out, send confirmation, end
  ↓
load conversation (or create new)
  ↓
check if human is claimed
  → if yes: route to agent inbox (push notification)
  ↓
Auto-Reply Rules Engine
  → if rule matches with mode = template_only: send template, log, end
  → if rule matches with mode = human_only: route to inbox, end
  → if rule matches with mode = AI / template_first_AI_fallback / etc: continue
  ↓
Conversation Orchestrator (state machine + LLM)
```

## TODO

- TODO: implementation spec for Auto-Reply rule resolution algorithm.
- TODO: priority of human-claimed-conversation override.
