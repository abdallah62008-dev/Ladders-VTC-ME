# ZATCA Phase 2 (KSA)

**Status:** Draft (stub)
**Owner:** Finance + Legal

Saudi Tax Authority Phase 2 e-invoicing requirements (Fatoora).

## Mandatory requirements

- All B2B and B2C invoices issued in compliant XML schema.
- QR code on every invoice.
- Cryptographic stamp.
- Real-time or near-real-time submission to ZATCA.
- Standardized invoice numbering.

## Implementation approach

- Partner with ZATCA-certified SaaS (Zoho / Odoo / ClearTax / dedicated provider). TODO: pick partner.
- Generate invoice XML; submit to partner; receive signed XML + QR.
- Store invoice ID, XML, QR, stamp on `invoice` record.
- Customer receives PDF with QR.

## Phase 7 deliverable

- ZATCA integration live before KSA public launch.

## TODO

- TODO: pick ZATCA partner.
- TODO: production certificate provisioning.
- TODO: invoice template designs.
