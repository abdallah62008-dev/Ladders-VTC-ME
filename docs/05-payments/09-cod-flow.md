# Cash on Delivery (COD) Flow

**Status:** Draft
**Owner:** Backend lead + Ops lead

---

## Statuses

`pending → pending_cod_confirmation → confirmed → shipped → out_for_delivery → delivered_cod_collected → reconciled`
`pending_cod_confirmation → cancelled` (customer declines or unreachable)
`out_for_delivery → cod_failed` (customer not present, refused, etc.) → reschedule or cancel

## Flow per country

### Egypt + Iraq (heavy COD)
1. Order created with COD selected.
2. Status `pending_cod_confirmation`.
3. WhatsApp confirmation template sent.
4. Customer confirms via WhatsApp reply OR ops calls within 4 business hours.
5. Confirmed → `confirmed` → dispatch.
6. Courier delivers + collects cash.
7. Courier reports COD collection (webhook).
8. Status `delivered_cod_collected`.
9. Daily reconciliation: courier deposits cash → bank → matched to orders.

### KSA (lower COD usage)
- COD available but secondary to online/BNPL.
- COD fee surcharge (e.g., +25 SAR) shown transparently.

## Risk-based COD restrictions

- Customer with 2+ prior COD cancellations → require deposit (e.g., 30% online).
- Order value above country threshold → require deposit.
- New customer + high-value order → require deposit OR limit COD.

## Reconciliation

- Daily report: COD collected per courier per city.
- Variance flagged for ops investigation.
- Smart Notification on >5% discrepancy.

## TODO

- TODO: COD fee per country.
- TODO: deposit threshold per country.
- TODO: courier-specific COD reconciliation API.
- TODO: cash handling SOP for ops team.
