# Prompt 41B Status: Printable Customer Collection Receipt

## Summary

Prompt 41B implemented the approved management-demo enhancement for a browser-printable Customer Collection Receipt / Payment Acknowledgement.

The receipt completes the demo story:

Customer -> Booking -> Sale Contract -> Installment Schedule -> Posted Accounting Voucher -> Collection -> Printable Customer Receipt.

## Route Added

- `/crm-property-desk/collections/[collectionId]/receipt`

Access follows the existing CRM & Property Desk route family and remains available to:

- `company_admin`
- `company_sales`

## Backend Read-Response Expansion

No new endpoint was added.

The existing endpoint remains the source:

- `GET /companies/:companyId/collections/:collectionId`

The collection detail response now includes optional receipt context where linked records exist:

- customer phone/email
- voucher type/status/date/reference
- booking project and unit context
- sale contract reference/date
- installment sequence, due date, and amount

Optional booking, sale contract, and installment links remain nullable. Collection creation rules, voucher posting rules, and accounting calculations were not changed.

## Frontend Implementation

- Added a read-only receipt page under the CRM & Property Desk collections route family.
- Added a receipt action on the collections table.
- Added an Open Receipt action to the collection detail side panel.
- Reused the Prompt 40 printable report primitives, screen-only/print-only conventions, browser print trigger, and A4 portrait print behavior.
- The print receipt includes payment summary, optional commercial linkage, accounting linkage, a professional acknowledgement note, and Received By / Authorized Signature fields.

## Files Changed

- `apps/api/src/app/crm-property-desk/collections.service.ts`
- `apps/api/src/app/crm-property-desk/dto/collections.dto.ts`
- `apps/api/src/app/crm-property-desk/collections.service.spec.ts`
- `apps/web/src/app/(app)/crm-property-desk/collections/[collectionId]/receipt/page.tsx`
- `apps/web/src/features/crm-property-desk/collection-receipt-page.tsx`
- `apps/web/src/features/crm-property-desk/collections-page.tsx`
- `apps/web/src/features/crm-property-desk/forms.tsx`
- `apps/web/src/features/financial-reporting/printable-report.tsx`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/routes.ts`
- `tests/e2e/crm-property-desk.spec.ts`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-41-scope.md`
- `docs/handoffs/prompt-41b-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`

## Tests Added Or Updated

- Backend collection service spec now verifies expanded receipt data for linked records.
- Backend collection service spec now verifies optional receipt context remains nullable when links are absent.
- CRM & Property Desk Playwright spec now verifies:
  - collections table receipt action
  - collection detail Open Receipt action
  - receipt route load
  - Print Receipt action
  - linked receipt data display
  - print-media visibility for the printable receipt
  - hidden screen controls under print media
  - no `undefined` / `null` placeholders in the printable receipt

## Validations Run

```powershell
corepack pnpm exec prettier --write <changed files>
corepack pnpm exec tsx --tsconfig apps/api/tsconfig.app.json --test apps/api/src/app/crm-property-desk/collections.service.spec.ts
corepack pnpm typecheck
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/crm-property-desk.spec.ts --config tests/e2e/playwright.config.ts
git status --short
git diff --stat
```

Observed result:

- Prettier formatting completed for changed files.
- Focused backend collection service test passed: 4 tests passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed, including the new Next.js route.
- Focused CRM & Property Desk Playwright spec initially caught one overly broad duplicate-text locator in the new receipt assertion. The assertion was tightened to the screen receipt container, then the focused spec passed: 5 tests passed.
- Final git status shows Prompt 41B working-tree changes left unstaged for review and existing untracked `docs/diagrams/` left untouched.

## Deferred To Prompt 41C Because Live Demo Is Running

- No Docker rebuild/restart was run.
- No reseed or seed verification was run.
- No Docker smoke command was run.
- No tunnel command was run.
- Manual live-demo browser QA on `http://localhost:3000` was deferred.
- Browser print-dialog/manual print preview on the active demo runtime was deferred.

## Known Caveats

- Commercial linkage renders only when the collection has booking, sale contract, or installment relations available from the existing data model.
- The receipt remains browser-print only; no PDF library, server-side PDF, XLSX export, payment gateway behavior, settlement logic, or customer portal behavior was added.
- The receipt wording is intentionally limited to ERP acknowledgement of a recorded collection linked to a posted voucher and does not claim bank clearance, legal settlement, or ownership transfer.

## Next Recommended Prompt

Prompt 41C Final Receipt QA + Runtime Validation + Optional Git Checkpoint
