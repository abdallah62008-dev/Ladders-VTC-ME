# Invoices

**Status:** Draft
**Owner:** Backend lead + Finance

---

## Invoice types

| Type | Locale | Use |
|---|---|---|
| Customer simple receipt | per locale | All B2C orders |
| KSA tax invoice (ZATCA) | ar-sa primarily | All KSA orders mandatory |
| Egypt e-invoice (ETA) | ar-eg primarily | All Egypt orders mandatory |
| B2B tax invoice | per locale | B2B with full tax fields |
| Simplified invoice | per locale | Small-value retail |
| Credit note | per locale | Refunds |
| Quote PDF | per locale | B2B pre-sale |

## ZATCA Phase 2 (KSA)

**Mandatory** as of relevant compliance date. Requirements:
- QR code on every invoice
- Cryptographic stamp
- Submission to ZATCA system in real-time (or near-real-time)
- Standard XML schema

Implementation:
- Use ZATCA-compliant SaaS partner (Zoho / Odoo / ClearTax / dedicated provider) — TODO confirm.
- Generate invoice XML, send to partner, receive QR code + stamp.
- Store invoice ID, QR, stamp on `invoice` record.
- Customer receives PDF with QR.

## Egypt ETA e-invoice

Similar pattern. Tax Authority API integration. Invoice signed and submitted.

## Iraq

Less formalized; standard PDF with VAT line where applicable.

## PDF generation

- Server-side rendering via headless Chromium (e.g., Playwright) or PDFKit.
- Templates per locale (RTL Arabic carefully laid out).
- Includes brand logo, address, customer info, line items, totals, payment method, tax breakdown.

## Storage

- PDFs stored on R2 with versioned URLs.
- Linked from `invoice` table.
- Retained 7 years.

## TODO

- TODO: pick ZATCA partner.
- TODO: pick ETA partner.
- TODO: invoice template designs per locale.
- TODO: QR code library (qrcode-pro for high-DPI).
- TODO: confirm IQ tax compliance requirements.
