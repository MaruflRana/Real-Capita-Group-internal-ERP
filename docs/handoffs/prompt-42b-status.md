# Prompt 42B Status: Customer 360 Profile + Customer Records + Transaction History

## Summary

Prompt 42B implemented the approved management-feedback enhancement for a dedicated Customer 360 Profile under CRM & Property Desk.

The profile lets authorized CRM users open one customer and review the operational story:

Customer -> Booking -> Sale Contract -> Installment Schedule -> Collection -> Posted Voucher -> Printable Receipt.

## Route Added

- `/crm-property-desk/customers/[customerId]`

The existing customer register now includes a `View Profile` action per customer row.

## Endpoint Added

- `GET /companies/:companyId/customers/:customerId/profile`

The endpoint is read-only and separate from the existing `GET /companies/:companyId/customers/:customerId` detail endpoint used by edit forms.

## Access

Access inherits the CRM & Property Desk boundary only:

- `company_admin`
- `company_sales`

Accountant access was not added.

## Page Sections Implemented

- Customer Overview
- Customer Records Summary
- Booking Records
- Sale Contracts
- Installment Schedule
- Transaction History
- Customer Activity Timeline

Empty states are rendered for bookings, contracts, installment schedules, collections, and timeline gaps.

## Summary Metrics Included

- `totalBookings`
- `activeBookingCount`
- `saleContractCount`
- `totalContractAmount`
- `installmentScheduleCount`
- `totalScheduledInstallmentAmount`
- `totalCollectionsCount`
- `totalCollectedAmount`
- `latestCollectionDate`
- `postedVoucherBackedCollectionAmount`

Installment-level `collectedAmount` and `balanceAmount` are returned only when collections are directly linked to that exact installment schedule.

## Explicitly Deferred

- headline outstanding amount
- headline remaining amount
- overdue amount/count
- heuristic payment allocation
- documents/attachments panel
- audit-event history
- accountant access
- schema changes
- migrations
- seed-data changes
- `.xlsx`
- server-side PDF

## Files Changed

- `apps/api/src/app/crm-property-desk/customers.controller.ts`
- `apps/api/src/app/crm-property-desk/customers.service.ts`
- `apps/api/src/app/crm-property-desk/dto/customers.dto.ts`
- `apps/api/src/app/crm-property-desk/customers.service.spec.ts`
- `apps/web/src/app/(app)/crm-property-desk/customers/[customerId]/page.tsx`
- `apps/web/src/features/crm-property-desk/customer-profile-page.tsx`
- `apps/web/src/features/crm-property-desk/customers-page.tsx`
- `apps/web/src/features/crm-property-desk/hooks.ts`
- `apps/web/src/lib/api/crm-property-desk.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/routes.ts`
- `tests/e2e/crm-property-desk.spec.ts`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-42-scope.md`
- `docs/handoffs/prompt-42b-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/uat/phase-1-demo-walkthrough.md`

## Tests Added Or Updated

- Backend customer service spec now verifies:
  - consolidated profile data
  - safe summary metrics
  - newest-first transaction-history query ordering
  - direct installment-linked collected/balance behavior
  - empty linked-record safety
- CRM Playwright spec now verifies:
  - customer list `View Profile`
  - profile route load
  - customer identity and summary rendering
  - booking, contract, installment, transaction-history, and timeline sections
  - printable receipt action from transaction history
  - no visible `undefined` / `null` placeholders

## Validation Run

```powershell
corepack pnpm exec prettier --write <changed files>
corepack pnpm exec tsx --tsconfig apps/api/tsconfig.app.json --test apps/api/src/app/crm-property-desk/customers.service.spec.ts
corepack pnpm typecheck
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/crm-property-desk.spec.ts --config tests/e2e/playwright.config.ts
```

Observed result:

- Focused backend customer service spec passed: 5 tests passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed and included `/crm-property-desk/customers/[customerId]` in the Next route output.
- Focused CRM Playwright spec initially caught one overly broad duplicate-text assertion in the new profile test. The assertion was tightened to the transaction row, then the focused spec passed: 6 tests passed.

## Deferred To Prompt 42C

- Docker rebuild/restart
- demo seed refresh or seed verification
- Docker smoke
- live authenticated runtime QA on `http://localhost:3000`
- browser/responsive visual verification against the seeded `DEMO-COL-2026-001` customer profile
- printable receipt regression on the live seeded customer profile path

## Final Status

READY FOR PROMPT 42C.
