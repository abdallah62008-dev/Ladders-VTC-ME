# Golden Conversation Suite

**Status:** Draft
**Owner:** AI lead + Content lead

---

## Purpose

50+ scripted test conversations used in CI to detect AI regressions. Each has expected behavior at every turn. CI replays them against new prompts/models and compares output to expected behavior.

---

## Coverage matrix

| Category | Count | Locales |
|---|---|---|
| Happy path — recommendation + draft order | 10 | ar-sa primary, ar-eg, ar-iq, en-sa each |
| Inventory edge — out of stock + alternative | 6 | ar-sa primary |
| Inventory edge — low stock disclaimer | 4 | ar-sa |
| B2B detection (qty > 10) | 4 | ar-sa, ar-eg |
| Refund / return intent → handoff | 4 | per locale |
| Frustrated customer → handoff | 4 | per locale |
| Adversarial — prompt injection | 6 | mixed |
| Adversarial — fake certification request | 3 | ar-sa |
| Off-topic redirect | 3 | mixed |
| Mid-flow correction | 4 | per locale |
| Country-aware shipping question | 3 | per country |
| Reach calculator conversational | 2 | ar-sa, en-sa |
| Fits-in-car conversational | 2 | ar-sa |
| Service ticket creation from chat | 3 | per locale |
| Auto-reply fallback path | 2 | ar-sa, ar-eg |

**Total: ~60 scenarios.** Expandable.

---

## Format (per scenario)

```yaml
id: GC-001
name: KSA villa customer, 4m reach, COD, happy path
locale: ar-sa
country: sa
channel: whatsapp
known_phone: true
turns:
  - actor: customer
    text: "أحتاج سلم لفيلتي"
  - actor: ai
    expected_state: product_discovery
    expected_intent: recommendation_request
    expected_tools: []
    expected_min_confidence: 0.6
    expected_text_contains_any:
      - "للاستخدام في الفيلا"
      - "الصيانة"
  - actor: customer
    text: "للصيانة الخارجية، حوالي 4 متر"
  - actor: ai
    expected_state: product_recommendation
    expected_tools:
      - check_stock_availability
      - recommend
    expected_text_contains_any:
      - "أنصحك"
      - "TLA"
  - ...
final:
  expected_state: draft_order_created
  expected_total_handoffs: 0
  expected_max_total_tokens: 12000
```

## CI execution

```
nightly:
  - replay all golden conversations through current prompt set
  - assertion: expected behaviors match
  - on regression: PR fails; AI lead reviews
```

## TODO

- TODO: write all 60 scenarios as YAML files in `scenarios/` subfolder.
- TODO: build replayer harness (Phase 3 work).
- TODO: human-grader sampling — 10% of golden conversations also human-graded for quality.
