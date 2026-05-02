# Prompt 32 Status

## Scope Delivered

Prompt 32 delivered **Professional Analytics + Periodic Business Reports**.

This phase replaced the weak Prompt 31 analytics rendering with a more polished ERP-grade reporting and visualization layer, and added real company-scoped daily, weekly, monthly, and business-overview reports for sales, collections, revenue, expenses, and profit/loss.

Prompt 32 did not add transactional workflows, CRUD modules, database tables, Prisma migrations, seed-data systems, fake chart values, fake financial numbers, Next.js backend routes, approval engines, import systems, `.xlsx` export, or server-side PDF rendering.

## Backend Reporting Added

- Added a read-only NestJS financial-reporting endpoint:
  - `GET /companies/:companyId/accounting/reports/business-overview`
  - query: `dateFrom`, `dateTo`, optional `bucket=day|week|month`
  - protected by the existing company accounting access rules
- Added CSV export:
  - `GET /companies/:companyId/accounting/reports/business-overview/export`
- The endpoint returns:
  - contracted sales amount
  - collected sales amount
  - posted-voucher revenue amount
  - posted-voucher expense amount
  - net profit/loss
  - profit and loss split values
  - voucher draft/posted/count summaries
  - booking, sale-contract, and collection counts
  - per-bucket rows and calculation assumptions

## Calculation Assumptions

- Contracted sales are summed from sale contract `contractAmount` by `contractDate`.
- Collected sales are summed from collection `amount` by `collectionDate`.
- Revenue is derived from posted voucher lines in `REVENUE` account classes as credit minus debit by `voucherDate`.
- Expenses are derived from posted voucher lines in `EXPENSE` account classes as debit minus credit by `voucherDate`.
- Net profit/loss is revenue minus expenses.
- Loss is shown as the absolute amount when net profit/loss is negative.
- Voucher, booking, sale-contract, and collection counts use their own existing business dates.
- All report output is company-scoped and read-only.

## Frontend Reporting Added

- Added Financial Reports routes:
  - `/accounting/reports/business-overview`
  - `/accounting/reports/daily`
  - `/accounting/reports/weekly`
  - `/accounting/reports/monthly`
- Added a shared `BusinessReportPage` for:
  - date range filters
  - bucket/period selector
  - summary metric cards
  - sales/collections trend
  - revenue/expense/profit-loss trend
  - operating-count distribution
  - period breakdown table
  - CSV export
  - browser print context
  - calculation assumptions
  - empty-state guidance for `corepack pnpm seed:demo`

## Dashboard And Analytics UI

- Dashboard financial analytics now use the new business overview endpoint for business performance and sales/collections trends.
- Dashboard summary quick links now prefer the business overview report route.
- Shared analytics components were tightened for:
  - wider responsive grids
  - readable chart legends
  - stronger min-width handling
  - less cramped trend charts
  - reduced small-label letter spacing
  - better table header readability
- Existing financial report visuals still preserve backend calculations and continue to display `Unclosed earnings adjustment` clearly for the backend `UNCLOSED_EARNINGS` adjustment.

## Demo/UAT Behavior

- Prompt 30 seed commands remain the supported way to populate meaningful visuals:

```powershell
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
```

- The UI does not auto-seed and does not hardcode chart values.
- Sparse report/analytics states remain honest and may show the demo seed guidance only when no matching data exists.

## Tests Updated

- API service tests cover bucketed business overview totals and profit/loss split behavior.
- API CSV export tests cover business overview bucket rows and totals.
- Playwright financial-reporting tests cover the new business overview, daily, weekly, and monthly pages.
- Dashboard e2e mocks and assertions now cover the business performance and sales/collections dashboard widgets.

## Verification

Prompt 32 verification should be run with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result on April 27, 2026:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: 160 API tests and 52 Playwright e2e tests passed.
- `docker compose up -d --build` rebuilt and started the stack successfully.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify` completed successfully for `Real Capita Demo / UAT`.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Live browser verification passed at 1440px, 1366px, and 1024px widths for `/dashboard`, `/accounting/reports/business-overview`, `/accounting/reports/daily`, `/accounting/reports/weekly`, `/accounting/reports/monthly`, `/accounting/reports/profit-loss`, `/accounting/reports/balance-sheet`, `/crm-property-desk/collections`, `/payroll/runs`, and `/audit-documents/audit-events` without global horizontal overflow, clipped numbers, or vertical word wrapping.

## Remaining Caveats

- Business revenue/expense/profit remains accounting-derived from posted vouchers only.
- Contracted sales and collected sales are intentionally separate CRM/property metrics and are not treated as accounting revenue.
- Dense tables may still use intentional internal horizontal scrolling inside table shells.
- Stakeholder UAT and final supervisor sign-off remain pending for Prompt 33/final demo polish.
