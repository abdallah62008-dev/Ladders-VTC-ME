# Payment Provider Abstraction

**Status:** Draft
**Owner:** Backend lead

---

## Build Now, Activate When Ready (🟢 D-READY-002 locked 2026-05-09)

Payment providers may exist in admin as `pending_approval` or `sandbox` (test-mode keys only) before they appear to customers. **Activation requires:** provider `status='active'` AND credentials configured (1Password `op://` reference, never plaintext) AND webhook signing secret in 1Password AND at least one supported payment method per country. **Customers see only `active` providers in checkout.** Backend rejects checkout queries that would return `pending_approval` or `sandbox` provider rows in production environment. See `../27-readiness-engine/01-unified-readiness.md` for the full activation requirements + status enum.

Example: Stripe / Tap / Paymob can each exist as `pending_approval` or `sandbox` while waiting for live-mode account approval. They cannot surface to customers until provider `status='active'` AND credentials configured AND webhook signing secret set in 1Password vault.

## Why

Internal `PaymentProvider` interface so we can:
- Add a provider without touching checkout code
- Swap providers per country without rewrites
- Test in mock mode in CI
- Apply consistent webhook security

## Interface (TypeScript-style spec)

```ts
interface PaymentProvider {
  code: 'stripe' | 'moyasar' | 'tap' | 'paymob' | 'fawry' | 'tabby' | 'tamara' | 'zaincash' | 'cod';
  countries: CountryCode[];
  supported_methods: PaymentMethod[];

  // Initiate payment
  createCheckoutSession(input: {
    order_id, amount, currency, customer, return_url, cancel_url, idempotency_key, metadata
  }): Promise<{ session_url, session_id }>;

  // Or for in-page
  createPaymentIntent(input: {
    order_id, amount, currency, customer, idempotency_key, metadata
  }): Promise<{ intent_id, client_secret }>;

  // Refund
  refund(input: {
    transaction_id, amount?, reason, idempotency_key
  }): Promise<{ refund_id, status }>;

  // Verify webhook signature
  verifyWebhookSignature(headers, body, secret): boolean;

  // Fetch transaction status
  getTransaction(transaction_id): Promise<{ status, amount, currency, ... }>;

  // Generate payment link (for WhatsApp orders)
  createPaymentLink(input: {
    order_id, amount, currency, expires_at, idempotency_key
  }): Promise<{ link_url, link_id }>;
}
```

## Money & Minor Units (🟢 D-DB-003 locked 2026-05-07)

> All money in the database is stored as `numeric(12,2)` regardless of currency (per `01-database/02-tables-by-module.md` Conventions). The payment provider abstraction is the **only layer** allowed to convert to/from a provider's native minor unit.

### Conversion rules

| Currency | DB storage | Provider unit (when applicable) | Conversion factor (DB → provider) |
|---|---|---|---|
| SAR | `numeric(12,2)` (e.g., `1499.50`) | halalas (Stripe, Moyasar, Tap) | × 100 → `149950` |
| EGP | `numeric(12,2)` (e.g., `2999.00`) | piasters (Stripe, Tap, Paymob) | × 100 → `299900` |
| IQD | `numeric(12,2)` (e.g., `175000.00`) | dinars (ZainCash; no minor unit) | × 1 → `175000` (drop fractional) |

### Hard rules

1. **DB layer always stores `numeric(12,2)`** — even for IQD. Display rounding to whole-IQD happens at presentation; provider conversion happens at adapter.
2. **Adapter responsibility:** every `PaymentProvider.createCheckoutSession`, `createPaymentIntent`, `createPaymentLink`, and `refund` call must convert the input `amount` (a `numeric(12,2)` value) to the provider's expected wire format before transmission. Inverse conversion happens on `getTransaction` and webhook receipt.
3. **Round-half-up** at any conversion boundary. Banker's rounding rejected for retail consistency.
4. **IQD has no minor unit on the wire** for ZainCash (and most Iraqi providers). DB still stores `175000.00`; adapter sends `175000` (integer); on receipt the stored value remains `175000.00`. Any non-zero fractional component on an IQD value is a data-integrity bug — adapter logs an alert.
5. **Idempotency.** Conversion functions must be deterministic and round-trip safe: `from_provider(to_provider(x)) === x` must hold for any `x` ∈ `numeric(12,2)` in the supported currency.
6. **Test coverage.** Each provider adapter ships with conversion tests for boundary values: `0.00`, `0.01`, `0.99`, `1.00`, `99.99`, smallest currency unit, largest representable amount under `numeric(12,2)` = `9_999_999_999.99`.
7. **No floating-point arithmetic at any layer.** Adapter code uses integer math (`amount × 100` after parsing as `Decimal`/`bigint`) — never `parseFloat` or `Number()` on monetary strings.
8. **Currency code travels with the amount.** Every adapter call includes the currency; never assume a default. Mismatched currency between order and provider call → reject.

### Currency display (separate from storage)

Display rounding lives in the frontend formatter, governed by `country.price_rounding_pattern` + `currency.decimals`:
- SAR: `..99` typical (e.g., `1,499.99`)
- EGP: `..990` (e.g., `2,999.00`; rounded to nearest 10 EGP for psychological pricing)
- IQD: `..000` (e.g., `175,000`; rounded to nearest 1,000 IQD; never shows fractional)

DB storage is independent of any of these patterns.

## COD adapter

Special case — no real provider call. Generates internal `payment_transaction` row with `status='pending_cod_confirmation'`.

## Mock provider (for tests)

Returns deterministic responses so checkout flows can be tested without real API calls.

## Per-provider config

Each provider has settings rows in `payment_provider`:
- API endpoint
- Test/live mode
- Credentials (in secrets manager, referenced by ID)
- Webhook signing secret (in secrets manager)
- Country eligibility
- Fee structure (for Profit Guardrails)

## Routing

See `03-routing-engine.md` for which provider to use per (country, currency, value, customer profile).

## TODO

- TODO: per-provider conversion-test fixture set covering boundary values (per "Money & Minor Units" §7).
- TODO: confirm IQD whole-unit rule with each Iraqi provider (ZainCash + FastPay) — some merchants quote in USD; verify before locking IQD = no minor unit at adapter layer.
- TODO: ensure refund adapter calls preserve original currency context (no SAR refund issued against an EGP transaction).

- TODO: lock interface signatures.
- TODO: write per-provider adapter docs (`04-stripe.md`, etc.).
- TODO: mock provider behavior fully specified.
