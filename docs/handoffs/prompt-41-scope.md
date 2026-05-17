# Prompt 41 Scope: Printable Customer Collection Receipt

Prompt 41 is approved as a targeted management/supervisor demo feedback improvement after the Prompt 40D print/export checkpoint.

The selected direction is a browser-printable customer collection receipt / payment acknowledgement for the existing CRM & Property Desk collections flow.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-40d-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/uat/phase-1-demo-walkthrough.md`
- `docs/operations/demo-data.md`

## Allowed Direction

Prompt 41B may implement:

- a read-only receipt route under the existing CRM route family
- browser-printable customer collection receipt / payment acknowledgement output
- minimal read-response expansion of the existing collection detail endpoint when needed for receipt context
- collection list/detail entry points that open the receipt for authorized CRM users
- focused tests and handoff documentation for the receipt feature

The receipt completes the live management-demo story:

Customer -> Booking -> Sale Contract -> Installment Schedule -> Posted Accounting Voucher -> Collection -> Printable Customer Receipt.

## Must Not Do By Default

- Do not add new ERP modules.
- Do not add new business workflows.
- Do not add a new backend endpoint unless the existing collection detail endpoint cannot safely support the read-only receipt.
- Do not add accounting calculations.
- Do not add Prisma schema changes or migrations.
- Do not add seed data.
- Do not add bank, payment-gateway, settlement, ownership-transfer, or automatic accounting behavior.
- Do not add `.xlsx` generation.
- Do not add server-side PDF generation.
- Do not tag or deploy.
- Do not restart, rebuild, reseed, or disrupt the active live demo unless a later runtime QA prompt explicitly allows it.
- Do not present Demo/UAT data as production evidence.

## Starting Point

Prompt 40D completed final print/export QA for all 9 printable financial reports, kept CSV/browser-print as the Phase 1 output boundary, and prepared the repo for the next explicit checkpoint direction.

Prompt 41B starts from the existing collection list and existing `GET /companies/:companyId/collections/:collectionId` API. It must preserve existing collection creation, voucher posting, role access, demo data, and live demo behavior.

## Prompt 41B Implementation Result

Prompt 41B implemented the approved receipt enhancement:

- added `/crm-property-desk/collections/[collectionId]/receipt`
- reused the existing collection detail endpoint with minimal read-response expansion for customer contact, posted voucher, booking/project/unit, sale contract, and installment context
- added receipt entry points on the collections table and collection detail side panel
- reused browser print, A4 portrait print CSS, screen-only controls, and printable report primitives from the Prompt 40 print system
- preserved the `company_admin` and `company_sales` CRM & Property Desk access model
- added focused backend and e2e coverage for linked receipt data, receipt actions, and print-media behavior
- kept zero schema change, zero migration, zero seed change, no payment gateway behavior, no server-side PDF, and no new accounting workflow

## Prompt 41C Final Result

Prompt 41C completed the final demo-readiness pass for the printable customer collection receipt:

- fixed the Demo/UAT seed verification blocker by making `corepack pnpm seed:demo` rebuild the reserved `real-capita-demo-uat` company before reseeding
- preserved the strict synthetic-data verifier instead of weakening customer/reset-marker checks
- confirmed the seeded management-demo receipt scenario through `DEMO-COL-2026-001`
- verified receipt entry points from the collections table and detail side panel
- verified browser-print receipt output under print media and regression-smoked the existing printable financial reports
- prepared the receipt feature and demo-seed refresh path for commit/push
