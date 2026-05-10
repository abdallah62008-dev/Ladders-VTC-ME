# AI Guardrails

**Status:** Draft
**Owner:** AI lead + Security lead

---

## Topic classifier

First-pass cheap classifier (Haiku or rules) labels every inbound message. Off-topic messages get a polite redirect:

> "أهلاً، أنا مساعد مبيعات [Brand] للسلالم. سأكون سعيداً بمساعدتك في اختيار السلم المناسب. هل تبحث عن شيء معين؟"

Off-topic categories:
- Politics, religion
- Medical, legal advice
- Other product types we don't sell
- Personal off-topic chat
- Spam / scam attempts

## Output validator

Every LLM response passes through a validator that rejects:
- Mentions of certifications not present in `product_certification` for the cited SKU **AND with `approval_status='approved'`** (per D-SAFE-001)
- Stock claims without preceding `check_stock_availability` tool call
- Discount mentions without active coupon for that customer/country
- Promises of warranty/replacement beyond `product.warranty_period`
- "Limited time only" language unless campaign is actually time-bounded
- **Safety claims not in `safety_claim` with `approval_status='approved'` for the cited locale + jurisdiction** (per D-SAFE-001 / `25-safety-compliance/02-safety-claim-policy.md`)
- **Forbidden claim phrasings** (per `25-safety-compliance/02-safety-claim-policy.md` Forbidden list): "100% accident-proof", "100% safe", "completely safe", "lifetime guarantee", "best in market" without proof, "certified" without specific cert ID, "approved by [authority]" without authority confirmation, "used by [airline/hospital]" without contractual proof, comparisons to competitors by name, medical/health-protection claims
- **Product recommendations without a preceding `recommendation.evaluate` tool call** (per D-DEC-001 / `24-decision-engine/01-overview.md`)
- **Wrong-ladder recommendations** — if `recommendation.evaluate` returned a score < 70 for the SKU AI is recommending, AI must surface a warning + alternative; if AI proceeds without the warning, validator rejects

If validator rejects → AI asked to retry once with stricter prompt; second rejection → handoff with reason `output_validation_failed`.

## Wrong-Ladder Warning Rules (D-DEC-001 🟢 2026-05-07)

When AI recommends a SKU based on customer-stated use case, AI MUST:

1. Call `recommendation.evaluate(use_case, constraints)` first.
2. If returned score < 70 OR any hard constraint failed: surface warning copy in customer locale (template `wrong_size_warning_ar/_en` for WhatsApp; inline copy for chat).
3. Show a better alternative with explicit reason ("3.8m fits a small car trunk; 4.4m does not — based on what you described, you may want to compare").
4. Require customer acknowledgment before proceeding ("I understand and want to continue with my choice" or equivalent intent).
5. Log to `recommendation_warning_log` with `acknowledgment_given` flag.

**Hard constraints AI cannot recommend through:**
- Aluminum ladder selected for "electrician/electrical work"
- SKU folded length > customer-stated max storage length
- Customer-stated weight need > SKU rated load × 0.9 safety margin

These are blocks, not warnings — AI must redirect to a compliant alternative or escalate to a human.

## Safety Claim Restrictions (D-SAFE-001 🟢 2026-05-07)

AI cannot mention any safety claim, certificate, or compliance approval that isn't in the database with current approval status. This is enforced at:

1. **Tool layer** — `find_safety_claims_for_sku` returns only approved + non-expired claims for the cited locale + jurisdiction.
2. **Output validator** — secondary check rejecting forbidden phrasings (see Output validator above).
3. **Audit** — every cost/safety mention writes `audit_log` row with the claim ID referenced.

If a customer asks about a safety attribute the AI cannot verify, AI says: "Let me connect you with a colleague who can help with that question" → handoff with reason `safety_claim_unverified`.

## PII redactor

Before logging conversation transcripts to analytics, regex-redact:
- Phone numbers → `[PHONE]`
- Email addresses → `[EMAIL]`
- Address-shaped strings → `[ADDRESS]`
- Card numbers → `[CARD]`

`message.text_raw` retains full text for support replay (encrypted at rest, restricted access).
`message.text_redacted` is the redacted version for analytics dashboards.

## Prompt injection defenses

| Defense | Mechanism |
|---|---|
| System prompt above customer text | Customer text always wrapped in `<user_input>...</user_input>`; system prompt makes clear that anything inside `<user_input>` is data, not instruction |
| Suspicious-pattern detector | Regex-based flagging of `ignore previous instructions`, `system:`, `you are now`, etc. — flagged messages get extra-cautious handling |
| Instruction stripping | Optional: strip suspicious imperative patterns from customer text before passing to LLM |
| Output sanitization | Even if LLM is hijacked, output validator catches forbidden content |
| Token budget cap | Hijacked agents tend to generate long output; per-conversation budget bounds damage |

## Token budget

| Scope | Limit |
|---|---|
| Per turn | 4k input + 1k output (Sonnet) |
| Per conversation | 50k input + 10k output total |
| Per conversation per day | hard reset 24h after first message |

Exceeding → AI says "let me connect you with a colleague" → handoff.

## Cross-country mixing rules (🟢 D-CSP-001 locked 2026-05-09)

Per `03-rbac/03-scopes.md`. AI must NOT mix prices, stock, delivery promises, payment methods, or WhatsApp numbers across countries.

### Hard rules

1. **AI uses `conversation.country_id`** as the authoritative country for the conversation. Never inferred from message content; never derived from prior turns; always read from the conversation row.
2. **Tool calls validate country context.** Every tool that returns country-specific data (`check_stock_availability`, `get_country_price`, `find_recommended_ladder`, `get_shipping_promise`, etc.) takes `country_id` as required input AND validates it matches `conversation.country_id`. Mismatch → tool returns error; AI handles via handoff with reason `country_context_mismatch`.
3. **Output validator rejects** any AI response that:
   - Quotes a price from a different country than `conversation.country_id`
   - Quotes shipping/delivery promise from a different country
   - References a payment method not active in `conversation.country_id`
   - References a WhatsApp number not equal to `country.whatsapp_number` for `conversation.country_id`
   - Compares pricing across countries without explicit customer intent ("compare to Egypt") AND user permission
4. **Cross-country recommendation requires explicit intent.** Customer must say "compare to <other country>" OR similar — AI cannot proactively cross-reference. Even with intent, the cross-country comparison still requires the active session to have appropriate scope.
5. **Agents only see conversations for countries they can access.** Conversation list filtered by `conversation.country_id IN user_country_access`. Agent's AI playground for testing prompts shows only allowed-country tone profiles.
6. **WhatsApp number / template scoping.** Agent assigned to Saudi Arabia only cannot send via Egypt WhatsApp number even if technically possible — backend rejects + audit-logs the attempt as `denied_cross_country_access_attempt`.
7. **Customer Messaging broadcasts.** A broadcast targets a country (`customer_segment.country_id`). The Marketing Manager initiating must have access to that country. Multi-country broadcast = `country_scope.all` permission required.

## Banned content list (output filter)

- Fake certifications (e.g., "ISO certified" if not in DB)
- Fake stock urgency ("only 1 left!" without tool data)
- Fake testimonials
- Cost values
- Internal pricing structures
- Information about other customers
- Any URL not from the official brand domain `ladders.vtc-me.com` (or its `staging.` / `dev.` subdomains for non-production). When `tl.vtc-me.com` is activated as a short-link domain (Phase 5–6+), it joins the allow-list.

## TODO

- TODO: full regex catalog for PII redactor.
- TODO: tune topic classifier on Arabic — false positives are user-unfriendly.
- TODO: red-team testing schedule (monthly).
- TODO: prompt injection test corpus (golden adversarial examples).
