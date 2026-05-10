# Bulk Pricing Flow

**Status:** Draft (stub)
**Owner:** Backend lead + Finance

---

## Use case

Admin wants to apply a price change across many products (e.g., 10% off all telescopic ladders in KSA for Ramadan).

## Flow

1. Open Admin → Marketing → Bulk Pricing Editor.
2. Filter:
   - Country
   - Product group / category / individual SKUs
   - Optional: marketer scope (set custom prices for one marketer)
3. Choose change:
   - Percentage (+/- %)
   - Fixed amount
   - Set absolute price
   - Set sale_price + sale window
4. Preview impact:
   - Rows affected
   - Profit Guardrails dry-run on every row
   - Estimated revenue impact (if forecastable)
5. Run pre-action backup (if rows > threshold).
6. Submit for approval if breaches floor on any row.
7. Apply (per-row transaction).
8. Audit log per row.
9. Smart Notification on completion.

## Profit Guardrails interaction

- Rows passing → applied
- Rows warned → applied with warning logged
- Rows hard-blocked → require override request + reason + dual approval (depending on override type)

## Reversal

- Pre-action backup enables full restore if needed.
- Per-row reversal also possible via re-import of original values.

## TODO

- TODO: UX wireframe.
- TODO: confirm threshold for triggering pre-action backup.
- TODO: throttle to prevent accidental "apply -100%" disasters (e.g., max 50% absolute change in one operation without super_admin override).
