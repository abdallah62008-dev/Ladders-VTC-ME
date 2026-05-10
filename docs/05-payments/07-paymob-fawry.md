# Egypt Providers — Paymob, Fawry, Vodafone Cash, Orange Money

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Paymob
- Cards + integrated wallets.
- Unified API for cards + Vodafone/Orange wallets.
- Webhook signature verification.

## Fawry
- Cash voucher: customer receives a code, pays at any Fawry kiosk/agent.
- Order remains pending until Fawry confirms via webhook.
- Long expiry windows (24–72h).

## Vodafone Cash / Orange Money
- Wallet payment via SMS confirmation.
- Often through Paymob aggregator.

## Egypt-specific concerns

- **COD dominant** (40–60% of orders).
- Order confirmation flow critical: WhatsApp confirmation before dispatch (see Customer Messaging module).
- Egyptian Tax Authority (ETA) e-invoice mandatory.

## TODO

- TODO: confirm Paymob vs PayTabs for Egypt cards.
- TODO: ETA e-invoice integration partner.
- TODO: Vodafone Cash SMS template approval.
