# Prompt 42 Scope: Customer 360 Profile + Customer Records + Transaction History

Prompt 42 is approved as the next management-feedback enhancement after the Prompt 41 printable customer collection receipt.

The selected direction is a dedicated read-only Customer 360 profile for CRM & Property Desk users, focused on stronger customer details, records, history, transaction history, and overall customer-profile representation.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-40d-status.md`
- `docs/handoffs/prompt-41-scope.md`
- `docs/handoffs/prompt-41b-status.md`
- `docs/handoffs/prompt-41c-status.md`
- `docs/release/demo-readiness-guide.md`
- `docs/uat/phase-1-demo-walkthrough.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/operations/demo-data.md`

## Approved Direction

Prompt 42B implements:

- dedicated frontend route `/crm-property-desk/customers/[customerId]`
- new consolidated read-only backend endpoint `GET /companies/:companyId/customers/:customerId/profile`
- customer identity/contact/status
- booking records
- sale contract records
- installment schedules
- collection/payment transaction history only, newest-first
- posted voucher context for collections
- printable receipt actions through collection ids
- minimal business timeline from existing customer, booking, contract, installment, and collection records

## Access Boundary

Customer Profile inherits the current CRM & Property Desk access model:

- `company_admin`
- `company_sales`

Prompt 42 does not expand access to accountants.

## Explicit Deferrals

- No Prisma schema changes or migrations.
- No new persistent tables.
- No customer code/reference field.
- No overloading of the existing customer detail endpoint used by edit forms.
- No audit-event history.
- No attachment/document panel.
- No headline outstanding amount.
- No headline remaining amount.
- No overdue amount/count.
- No heuristic payment allocation.
- No `.xlsx` generation.
- No server-side PDF.
- No seed-data change unless later runtime QA proves a blocker.

Installment-level collected/balance values may appear only when computed from collections directly linked to that exact installment schedule.

## Prompt 42B Implementation Result

Prompt 42B implemented the approved Customer 360 profile:

- added `GET /companies/:companyId/customers/:customerId/profile`
- added `/crm-property-desk/customers/[customerId]`
- added `View Profile` from the customer register
- consolidated customer, bookings, sale contracts, installment schedules, collection transaction history, posted voucher context, receipt actions, and timeline from backend queries
- kept existing customer detail, create/edit, collection receipt, access model, schema, migrations, and seed data unchanged

## Prompt 42C Runtime QA Result

Prompt 42C completed final runtime QA and validation:

- verified `DEMO Customer Nadia Synthetic`, behind `DEMO-COL-2026-001`, as the seeded Customer 360 demo candidate
- confirmed the customer register `View Profile` entry point opens `/crm-property-desk/customers/[customerId]`
- confirmed customer overview, summary, booking records, sale contracts, installment schedules, transaction history, printable receipt action, and timeline render against live Demo/UAT data
- confirmed a sparse customer profile renders professional empty states without `undefined` or `null`
- confirmed the transaction-history `Printable Receipt` action still opens the Prompt 41 receipt route
- confirmed responsive behavior at 1440px, 1366px, and 1024px
- kept zero schema change, zero migration, no seed-data change, and no accountant access expansion
