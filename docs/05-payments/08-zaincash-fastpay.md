# Iraq Providers — ZainCash, FastPay, Bank Transfer

**Status:** Draft (stub)
**Owner:** Backend lead

---

## Iraq context

- COD dominates (~70%+ of orders).
- ZainCash + FastPay for digital-savvy customers.
- Bank transfer common for B2B.
- IQD is the local currency; some merchants quote in USD — TODO confirm currency strategy.

## ZainCash
- Wallet payment.
- Integration via ZainCash API.
- Webhook signature verification.

## FastPay
- Wallet/payment service.
- Integration via FastPay API.

## Bank transfer
- Manual reconciliation.
- Customer uploads receipt; ops team verifies.
- For B2B, common path.

## COD specifics for Iraq

- **WhatsApp confirmation mandatory** before dispatch (often 2-step: phone call + WhatsApp).
- Address landmarks essential (postal codes uncommon).
- Higher delivery failure rate → factor into pricing/risk score.

## TODO

- TODO: ZainCash API access + KYC.
- TODO: FastPay API access.
- TODO: bank account in Iraq for COD reconciliation + bank transfer receipts.
- TODO: confirm IQD vs USD pricing strategy on storefront.
- TODO: courier partners for Iraq (local logistics).
