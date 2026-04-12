# Prompt 20 Status

## Scope Delivered

Prompt 20 delivered the minimum production-grade frontend Financial Reporting UI on top of the Prompt 19 backend reporting baseline:

- frontend-only financial reporting pages under `apps/web`
- authenticated shell navigation for Financial Reports
- typed financial reporting REST client methods
- TanStack Query hooks for the four report endpoints
- reusable report filter controls, metric cards, hierarchy tables, and report-state UI
- Playwright smoke coverage for route protection, report rendering, and general-ledger error surfacing
- handoff docs updated for Prompt 21 continuity

## Frontend Routes Added

- `/accounting/reports/trial-balance`
- `/accounting/reports/general-ledger`
- `/accounting/reports/profit-loss`
- `/accounting/reports/balance-sheet`

## Frontend Files Added Or Updated

### App Routes

- `apps/web/src/app/(app)/accounting/reports/trial-balance/page.tsx`
- `apps/web/src/app/(app)/accounting/reports/general-ledger/page.tsx`
- `apps/web/src/app/(app)/accounting/reports/profit-loss/page.tsx`
- `apps/web/src/app/(app)/accounting/reports/balance-sheet/page.tsx`

### Feature Slice

- `apps/web/src/features/financial-reporting/trial-balance-page.tsx`
- `apps/web/src/features/financial-reporting/general-ledger-page.tsx`
- `apps/web/src/features/financial-reporting/profit-and-loss-page.tsx`
- `apps/web/src/features/financial-reporting/balance-sheet-page.tsx`
- `apps/web/src/features/financial-reporting/hooks.ts`
- `apps/web/src/features/financial-reporting/filters.tsx`
- `apps/web/src/features/financial-reporting/shared.tsx`
- `apps/web/src/features/financial-reporting/tables.tsx`
- `apps/web/src/features/financial-reporting/utils.ts`

### Frontend Infrastructure

- `apps/web/src/lib/api/financial-reporting.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/features/shell/app-shell.tsx`
- `apps/web/src/components/ui/table.tsx`

### Tests

- `tests/e2e/financial-reporting.spec.ts`

## Report Behavior In This Phase

### Trial Balance

- company-aware date-range filters plus optional voucher-type filter
- renders live API sections and totals with opening, movement, and closing debit/credit values
- presents the backend hierarchy clearly across account class, account group, ledger account, and posting account
- shows explicit loading, empty, validation, and API-error states

### General Ledger

- company-aware posting-account search/select powered by live particular-account data
- date-range filters plus optional voucher-type filter
- renders account context, opening balance, period transactions, running balance, voucher reference, voucher ID context, and closing totals
- surfaces both client-side invalid date validation and backend invalid filter/account errors clearly
- does not expose voucher edit/post/write-back actions

### Profit & Loss

- company-aware date-range filters
- renders live backend revenue and expense hierarchy exactly from the Prompt 19 response contract
- emphasizes total revenue, total expense, and overall net profit/loss
- keeps the report explicitly read-only

### Balance Sheet

- company-aware as-of-date filter
- renders grouped assets, liabilities, and equity sections from the live backend
- surfaces the backend `isBalanced` state clearly
- presents the derived `UNCLOSED_EARNINGS` adjustment explicitly in a dedicated equity-adjustments section
- does not imply formal closing entries exist

## Backend Compatibility Tweaks Made

- No NestJS endpoint changes were required.
- No Prisma schema changes were required.
- No environment-variable or Docker Compose changes were required.
- One frontend-only shared table typing fix was made so report tables can use real table-cell props such as `colSpan`.

## Authorization And Navigation Rules In This Phase

- Financial Reports navigation is shown under the authenticated shell.
- Report pages remain protected by the existing `/accounting/**` route boundary.
- Report visibility follows existing accounting access:
  - `company_admin`
  - `company_accountant`
- Non-accounting sessions receive the existing accounting-access-required state instead of a custom permission engine.

## Tests Added

- `tests/e2e/financial-reporting.spec.ts`

Coverage includes:

- protected-route redirect for financial reporting routes
- shell navigation visibility for the Financial Reports section
- Trial Balance page smoke coverage
- General Ledger account-selection flow smoke coverage
- General Ledger client-side validation and backend error surfacing
- Profit & Loss page smoke coverage
- Balance Sheet page smoke coverage including derived equity-adjustment disclosure

## Verification Commands

```powershell
$env:NX_WORKSPACE_ROOT='C:\Users\wadud\Documents\New project'
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.
- `docker compose up -d --build` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3000` returned `200`.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/v1/health/ready` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- Swagger JSON still included all four `/api/v1/companies/{companyId}/accounting/reports/*` routes.
- Live login/browser verification succeeded on the canonical `http://localhost:3000` origin with `admin@example.com` plus explicit company selection for the main `Real Capita` company.
- Live Prompt 20 browser verification succeeded in the main `Real Capita` company for:
  - trial balance page load over live posted data using `1900-01-01` through `2100-12-31`
  - general ledger page load over live posting account `PARAST185933`
  - profit & loss page load over live posted data using `1900-01-01` through `2100-12-31`
  - balance sheet page load as of `2100-12-31` with `isBalanced=true` and visible `UNCLOSED_EARNINGS`

## Runtime Note

- Live browser verification should use the canonical `http://localhost:3000` origin. Using `http://127.0.0.1:3000` is not equivalent for this stack because the browser client targets `http://localhost:3333` for API requests, which creates a cross-origin mismatch.

## Out Of Scope And Still Not Built

- PDF export
- Excel export
- printing workflows
- executive dashboards beyond existing placeholders
- write-back accounting actions from reporting pages
- closing-entry workflows
- backend reporting redesign
- payroll, CRM/property desk, HR, or master-data scope expansion
- fake/demo data
- Next.js backend routes or server actions for report business operations

## Prompt 21 Readiness

Prompt 20 is complete. The repo now has production-minded frontend Financial Reporting pages for trial balance, general ledger, profit & loss, and balance sheet on top of the Prompt 19 backend reporting APIs while preserving the locked REST boundary and the existing Prompt 12 through Prompt 19 behavior. The repo is ready for Prompt 21.
