# Human Handoff

**Status:** Draft
**Owner:** AI lead

---

## Triggers

| Trigger | Detection |
|---|---|
| Confidence below threshold | Per-turn confidence calc |
| Frustration keywords | Per-locale keyword list (e.g., "زهقت", "مش فاهم", "كلمني انسان", "I want to speak to a human") |
| 3+ failed clarifications on same intent | State machine counter |
| Explicit "speak to human" / "تكلم مع موظف" | Intent classifier |
| B2B intent above qty threshold | `recommend` tool returns B2B flag |
| Refund / return / complaint intent | Intent classifier |
| Suspected fraud | Risk score above threshold |
| Off-business-hours but customer escalates urgency | Business hours check + customer message pattern |

## Behavior

1. AI sends handoff acknowledgement (templated, in customer's locale):

> "وصلتك مع زميل من فريق المبيعات، رح يجاوبك قريباً 🙏"
> "Connecting you with a sales colleague — they'll reply shortly."

2. State transitions: `<current> → human_handoff → human_handling`.
3. `handoff_request` row created with `reason`, `urgency`, `summary`, `suggested_reply`.
4. Realtime push to admin Live Inbox + smart notification.
5. Once an agent claims it (`handoff_request.claimed_by`):
   - AI stops responding on this conversation.
   - Agent sees: customer info, full transcript, AI's last suggested response (editable), urgency level.
6. After agent resolves: `handoff_request.closed_at` + conversation status → `resolved`.

## Handoff brief generation

Cheap Haiku call summarizes the conversation for the agent in 3–5 lines:
- What customer wants
- Tools already called and what they returned
- Stuck points (clarifications attempted)
- Suggested next step

## Handoff queue UX

Admin Live Inbox shows queue sorted by:
1. Urgency (critical → high → normal → low)
2. Wait time
3. Customer type (VIP, B2B → top)

Agent claims → conversation enters their personal queue.

## SLA

| Urgency | Target first response |
|---|---|
| Critical (safety, fraud, complaint) | <2 minutes |
| High (refund, B2B above threshold, angry) | <10 minutes |
| Normal (low confidence, B2B small) | <30 minutes |
| Low (off-hours, scheduled callback) | next business day |

> TODO: confirm SLAs with operations team.

## Off-business-hours

Auto-reply: "نراجع طلبك أول دوام، رقم تتبع مبدئي #..."
Conversation flagged `off_hours_handoff`; surfaces in next-day inbox.

## Anti-loop protection

If conversation has been handed off → returned to AI → handed off again within 1 hour:
- Force human handling
- Smart Notification to operations manager

## Metrics

- Handoff rate per day per country
- Top handoff reasons
- Time-to-claim by agent
- Resolution time by agent
- Customer satisfaction post-handoff (survey)

## TODO

- TODO: handoff acknowledgement copy approved per locale × country.
- TODO: SLA agreement with ops team.
- TODO: agent Live Inbox UX wireframe (mobile + desktop).
