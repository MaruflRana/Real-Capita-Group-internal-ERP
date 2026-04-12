# Prompt 19 Status

## Scope Delivered

Prompt 19 delivered the minimum production-grade backend Financial Reporting API on top of the Prompt 18 baseline:

- read-only company-scoped reporting endpoints under `apps/api`
- trial balance API
- general ledger API
- profit & loss API
- balance sheet API
- raw SQL reporting query infrastructure for statement aggregation and ledger retrieval
- Swagger documentation for all new reporting routes
- backend-scoped tests for reporting contracts, validation, scope, and statement integrity
- handoff docs updated for Prompt 20 continuity

## Endpoints Added

- `GET /api/v1/companies/:companyId/accounting/reports/trial-balance`
- `GET /api/v1/companies/:companyId/accounting/reports/general-ledger`
- `GET /api/v1/companies/:companyId/accounting/reports/profit-loss`
- `GET /api/v1/companies/:companyId/accounting/reports/balance-sheet`

## Reporting Query Infrastructure Added

- New Nest module:
  - `apps/api/src/app/financial-reporting/financial-reporting.module.ts`
- New controller:
  - `apps/api/src/app/financial-reporting/financial-reporting.controller.ts`
- New service:
  - `apps/api/src/app/financial-reporting/financial-reporting.service.ts`
- New raw SQL/report-query repository:
  - `apps/api/src/app/financial-reporting/financial-reporting.repository.ts`
- New reporting DTO contracts:
  - `apps/api/src/app/financial-reporting/dto/financial-reporting.dto.ts`
- New reporting utilities:
  - `apps/api/src/app/financial-reporting/financial-reporting.utils.ts`
- App wiring:
  - `apps/api/src/app/app.module.ts`

## Report Behavior In This Phase

### Trial Balance

- uses `POSTED` vouchers only
- requires `dateFrom` and `dateTo`
- supports optional:
  - `voucherType`
  - `ledgerAccountId`
  - `particularAccountId`
- returns:
  - opening debit/credit
  - movement debit/credit
  - closing debit/credit
  - totals
  - hierarchy grouped by account class, account group, ledger account, and posting account

### General Ledger

- uses `POSTED` vouchers only
- requires:
  - `particularAccountId`
  - `dateFrom`
  - `dateTo`
- supports optional:
  - `voucherType`
- returns:
  - posting-account hierarchy context
  - opening balance before period start
  - period transaction lines
  - running balance
  - voucher traceability through `voucherId`, `voucherReference`, `voucherDate`, `voucherType`, and descriptions

### Profit & Loss

- uses `POSTED` vouchers only
- requires `dateFrom` and `dateTo`
- derives from live `REVENUE` and `EXPENSE` chart-of-accounts hierarchy
- returns grouped sections, section totals, and overall net profit/loss

### Balance Sheet

- uses `POSTED` vouchers only
- requires `asOfDate`
- derives from live `ASSET`, `LIABILITY`, and `EQUITY` chart-of-accounts hierarchy
- returns grouped sections, section totals, and overall balance-sheet totals
- fails loudly if assets do not equal liabilities plus equity after reporting adjustments

## Accounting Assumptions And Validation Notes

- Reporting is read-only. Prompt 19 does not mutate vouchers, voucher lines, accounts, or posting rules.
- Formal statements use `POSTED` vouchers as the accounting source of truth.
- Prompt 19 intentionally does not expose project or cost-center filters because the current voucher-line schema does not store generic project/cost-center dimensions. Exposing those filters would create misleading statement slices.
- The current accounting core does not have year-end closing entries. To keep the balance sheet mathematically sound without mutating accounting data, Prompt 19 adds a derived equity adjustment:
  - `UNCLOSED_EARNINGS`
- The current accounting core does not have a dedicated voucher-number sequence column. General ledger responses therefore expose:
  - `voucherId`
  - `voucherReference`
- Invalid date ranges are rejected clearly.
- Missing company / ledger account / particular account scope is rejected clearly.
- Authorization remains:
  - authenticated access only
  - `company_admin` or `company_accountant`
  - company-scoped access only

## Tests Added

- `apps/api/src/app/financial-reporting/financial-reporting.controller.spec.ts`
- `apps/api/src/app/financial-reporting/financial-reporting.service.spec.ts`

Tests cover:

- trial balance grouping and totals
- invalid date-range rejection
- general ledger account scope enforcement
- general ledger opening/running balance behavior
- profit & loss totals
- balance sheet balancing with unclosed earnings
- loud failure on balance-sheet imbalance
- controller guard coverage

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
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/v1/health/ready` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- Swagger JSON included:
  - `/api/v1/companies/{companyId}/accounting/reports/trial-balance`
  - `/api/v1/companies/{companyId}/accounting/reports/general-ledger`
  - `/api/v1/companies/{companyId}/accounting/reports/profit-loss`
  - `/api/v1/companies/{companyId}/accounting/reports/balance-sheet`
- Live API verification against the running Docker stack succeeded in the main `Real Capita` company for:
  - login plus explicit company selection through `POST /api/v1/auth/login`
  - trial balance over posted live data
  - general ledger over a live posting account returned by the trial balance
  - profit & loss over posted live data
  - balance sheet over posted live data with `isBalanced=true`

## Additional Reliability Fix

- Prompt 19 updated `tests/e2e/playwright.config.ts` so the required `corepack pnpm test` command clears a stale `apps/web/.next/lock` before the Playwright web-server build step.
- This change does not alter frontend business behavior. It only preserves the required verification path after prior build runs.

## Environment And Runtime Notes

- No new environment variables were added in Prompt 19.
- No Prisma schema changes were required in Prompt 19.
- No Docker Compose service changes were required in Prompt 19.

## Out Of Scope And Still Not Built

- frontend financial reporting pages
- dashboards
- PDF generation
- Excel export
- payroll UI changes
- CRM/property desk UI changes
- HR UI changes
- new transaction-entry business modules
- fake/demo data
- Next.js backend routes or server actions for business operations
- accounting closing workflows
- project/cost-center-dimensional accounting postings

## Prompt 20 Readiness

Prompt 19 is complete. The repo now has the minimum production-grade backend reporting layer needed to expose read-only trial balance, general ledger, profit & loss, and balance sheet views through the locked REST boundary while preserving Prompt 12 through Prompt 18 behavior. The repo is ready for Prompt 20.
