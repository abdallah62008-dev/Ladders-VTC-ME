# Admin Screen List

**Status:** Draft (stub)
**Owner:** Design lead

Comprehensive list of admin screens with audience, primary actions, and Phase introduction.

| Slug | Screen | Audience | Primary actions | Phase |
|---|---|---|---|---|
| `/admin/dashboard` | Dashboard home | All admins | KPIs at-a-glance, alerts, quick links | 1 |
| `/admin/catalog/products` | Products list | Catalog roles | Filter, search, create, bulk import | 1 |
| `/admin/catalog/products/[id]` | Product editor | Catalog roles | Tabs: Basic Info, Translations, Variants, Images & Videos, Certifications, Group, **Country Pricing & Availability** (matrix per country, dynamic), **Warehouse Stock** (matrix per warehouse, dynamic), Marketer Pricing (P5), SEO, AI Knowledge (P3), Audit Log. See `06-product-add-edit-workflow.md` 🟢 locked. | 1 |
| `/admin/system/countries` | Countries list | Super admin, country managers | Add, edit, activate/deactivate | 1 |
| `/admin/system/countries/[id]` | Country editor | Super admin | Basics, payment methods, shipping methods, status, audit | 1 |
| `/admin/operations/warehouses` | Warehouses list | Inventory + Super Admin | List (with active/inactive/archived filter), Add new (per `warehouse.create`), bulk view. See `07-warehouse-management.md` 🟢 locked. | 1 |
| `/admin/operations/warehouses/[id]` | Warehouse editor | Inventory + Super Admin | Edit non-locked fields (name, address, contact, phone, priority, coverage, notes); lifecycle actions: Deactivate (with stock-safety check), Archive (with stock-safety check), Reactivate, Hard-Delete (Super Admin + empty + reason ≥30 chars). All actions audit-logged. See `07-warehouse-management.md` 🟢 locked. | 1 |
| `/admin/operations/stock-transfers` | Stock Transfers | Inventory roles | Create, approve, mark in-transit, mark received | 9 |
| `/admin/operations/stock-reservations` | Stock Reservations | Inventory + Sales roles | Read-only view of active/expiring/consumed reservations | 2 |
| `/admin/operations/warehouse-health` | Warehouse Health | Inventory roles | Per-warehouse stock health, low-stock alerts, dead stock | 9 |
| `/admin/orders` | Orders list | Sales, ops | Filter, view, ship, refund | 2 |
| `/admin/orders/[id]` | Order detail | Sales, ops | Status changes, refund, customer profile | 2 |
| `/admin/conversations` | Live inbox | Sales, support | Claim, reply, takeover from AI | 3 |
| `/admin/conversations/handoff-queue` | Handoff queue | Sales, support | Triage by urgency | 3 |
| `/admin/auto-reply/profiles` | Reply profiles | AI Supervisor | Create, edit profiles | 3 |
| `/admin/auto-reply/sandbox` | Sandbox | AI Supervisor | Test rules without sending | 3 |
| `/admin/customer-messaging/broadcast` | Broadcast | Marketing | Compose, schedule, send | 4 |
| `/admin/marketing/marketers` | Marketers list | Marketer Manager | Onboard, tier, terminate | 5 |
| `/admin/marketing/coupons` | Coupons | Marketing | Create, validate, schedule | 5 |
| `/admin/marketing/landing-pages` | Landing pages | Marketing | Block builder, A/B variants | 6 |
| `/admin/finance/profit-reports` | Profit reports | Finance | Per-country, per-product, per-campaign | 7 |
| `/admin/b2b/quotes` | Quote pipeline | B2B sales | Quote, negotiate, PDF | 8 |
| `/admin/maintenance/tickets` | Service tickets | Maintenance | Triage, assign, resolve | 9 |
| `/admin/reports/executive` | Executive dashboard | Owner / mgmt | Read-only KPIs | 10 |
| `/admin/import-export/jobs` | Import/Export jobs | Admins | Upload, preview, apply, download | 2+ |
| `/admin/approvals` | Pending approvals | Approvers | Review, approve, reject | 5+ |
| `/admin/system/backups` | Backups | Super admin, infra | Manual backup, restore, schedules | 1 |
| `/admin/system/audit-log` | Audit log | Super admin, auditor | Search, filter, export | 1 |

## TODO

- TODO: complete screen list (~80 screens at full rollout).
- TODO: assign each to specific Phase.
- TODO: low-fi wireframes per screen.
