# Payment Providers Matrix

**Status:** Draft
**Owner:** Backend lead + Finance
**Last updated:** 2026-05-07

---

## Per-country availability

| Provider | KSA | Egypt | Iraq | Global | Notes |
|---|---|---|---|---|---|
| **Stripe** | ✅ where supported | ❌ | ❌ | ✅ | Cards, wallets, multi-currency |
| **Moyasar** | ✅ | ❌ | ❌ | ❌ | Mada + cards |
| **Tap** | ✅ | ✅ | ❌ | ❌ | Cards, Mada |
| **PayTabs** | ✅ | ✅ | ❌ | ❌ | Cards, Mada |
| **HyperPay** | ✅ | ❌ | ❌ | ❌ | Cards, Mada |
| **Apple Pay** | ✅ | ❌ | ❌ | ❌ | Native checkout button |
| **Tabby** | ✅ | ❌ | ❌ | ❌ | BNPL — required display |
| **Tamara** | ✅ | ❌ | ❌ | ❌ | BNPL — required display |
| **Paymob** | ❌ | ✅ | ❌ | ❌ | Cards, wallets |
| **Fawry** | ❌ | ✅ | ❌ | ❌ | Cash voucher |
| **Vodafone Cash** | ❌ | ✅ | ❌ | ❌ | Wallet |
| **Orange Money** | ❌ | ✅ | ❌ | ❌ | Wallet |
| **ZainCash** | ❌ | ❌ | ✅ | ❌ | Wallet |
| **FastPay** | ❌ | ❌ | ✅ | ❌ | Wallet |
| **Bank transfer** | ✅ | ✅ | ✅ | ✅ | B2B + large IQ orders |
| **COD** | ✅ | ✅ (40–60%) | ✅ (70%+) | — | Egypt + Iraq dominant |
| **Store credit** | ✅ | ✅ | ✅ | ✅ | Refund credits |

## Per-country dominant flow

| Country | Primary | Secondary | Tertiary |
|---|---|---|---|
| KSA | Mada (via Moyasar/Tap) | Apple Pay | Tabby/Tamara BNPL |
| Egypt | COD | Vodafone Cash / Fawry | Paymob cards |
| Iraq | COD | ZainCash / FastPay | Bank transfer |

## Phase 0 application status

All applications must be submitted in Phase 0. Status (TODO update as each completes):

| Provider | Test mode | Live mode |
|---|---|---|
| Stripe | TODO submitted | TODO |
| Moyasar | TODO submitted | TODO |
| Tap | TODO submitted | TODO |
| Tabby | TODO submitted | TODO |
| Tamara | TODO submitted | TODO |
| Paymob | TODO submitted | TODO |
| ZainCash | TODO submitted | TODO |

## Currency support

| Provider | SAR | EGP | IQD |
|---|---|---|---|
| Stripe | ✅ | ✅ | ❌ |
| Moyasar | ✅ | ❌ | ❌ |
| Tap | ✅ | ✅ | ❌ |
| Paymob | ❌ | ✅ | ❌ |
| ZainCash | ❌ | ❌ | ✅ |

## Decision rule per country

Implemented in `03-routing-engine.md`. Examples:

- KSA orders > 1000 SAR: surface BNPL prominently
- Iraq orders: COD default, ZainCash secondary
- Egypt orders < 500 EGP: COD default, Paymob optional

## TODO

- TODO: confirm Stripe approval for KSA (some Saudi merchants face friction).
- TODO: confirm if HyperPay needed (overlaps with PayTabs).
- TODO: cost rates per provider (transaction fees) — fed into Profit Guardrails.
- TODO: bank account details for COD reconciliation per country.
