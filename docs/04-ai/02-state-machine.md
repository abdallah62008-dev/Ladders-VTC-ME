# Conversation State Machine

**Status:** Draft
**Owner:** AI lead

---

## States

```
new
greeting
product_discovery
product_recommendation
answering_question
collecting_customer_name
collecting_phone
collecting_city
collecting_address
collecting_quantity
awaiting_order_review
awaiting_confirmation
confirmed
draft_order_created
human_handoff
human_handling
resolved
cancelled
closed
```

## Transition diagram

```mermaid
stateDiagram-v2
  [*] --> new
  new --> greeting
  greeting --> product_discovery
  product_discovery --> product_recommendation
  product_discovery --> answering_question
  product_recommendation --> answering_question
  answering_question --> product_recommendation
  product_recommendation --> collecting_customer_name : customer wants to order
  collecting_customer_name --> collecting_phone : if phone unknown
  collecting_customer_name --> collecting_city : if phone known (WhatsApp)
  collecting_phone --> collecting_city
  collecting_city --> collecting_address
  collecting_address --> collecting_quantity
  collecting_quantity --> awaiting_order_review
  awaiting_order_review --> awaiting_confirmation
  awaiting_confirmation --> confirmed : customer says "تأكيد"
  awaiting_confirmation --> awaiting_order_review : customer corrects
  confirmed --> draft_order_created
  draft_order_created --> [*]

  state "Branches" as B
  greeting --> human_handoff : explicit human request
  product_discovery --> human_handoff : low confidence
  answering_question --> human_handoff : refund/return intent
  collecting_address --> human_handoff : unclear address 3x
  human_handoff --> human_handling : agent claims
  human_handling --> resolved
  human_handling --> draft_order_created
  resolved --> [*]
  cancelled --> [*]
  closed --> [*]
```

## Guards

Transitions are gated by:
- Required fields populated (e.g., to enter `awaiting_order_review`, all customer fields and product selection must exist).
- Stock availability (cannot proceed past `product_recommendation` if `qty_available_total = 0` for the chosen variant — must suggest alternative).
- Guardrails (cost-leak attempts route to human).

## Persistence

State stored on `conversation.current_state`; transitions logged in `conversation_state_log`. State is recoverable across sessions and channels (web ↔ WhatsApp).

## Order capture sub-state machine

Within ORDER_CAPTURE (`collecting_*` states):

```
ASK_NAME → ASK_PHONE → CONFIRM_COUNTRY → ASK_CITY → ASK_ADDRESS → ASK_QTY → ASK_PAYMENT → REVIEW
```

Skips already-known fields if customer is recognized from prior order.
Each sub-state has validators (phone format per country, address required fields, etc.).

## Correction transitions

Customer correcting an earlier answer:
1. Customer types correction (e.g., "actually, address should be ...").
2. Detected by intent classifier as "correction".
3. State machine moves to relevant sub-state (e.g., back to `collecting_address`).
4. After correction, returns to where it was (e.g., `awaiting_order_review`).

## Mid-flow off-topic

Customer asking unrelated question mid-capture:
1. Detected by intent classifier as "FAQ" or "policy_question".
2. AI answers via FAQ tool, then prompts to continue capture.
3. State unchanged.

## TODO

- TODO: precise rule for when phone is "known" (recent WhatsApp session, prior order, manually verified).
- TODO: handle language switch mid-conversation (customer types in EN, then AR).
- TODO: define "draft_order_created" → "confirmed_order" transition (after admin confirmation).
