# Prompt 37 Status

## Scope Delivered

Prompt 37 delivered **Financial Reports Redesign + Yearly Report**.

The work stayed within the financial reporting UI/UX and read-only yearly reporting boundary. It did not add transactional workflows, database schema changes, migrations, seed-system changes, fake financial values, Next.js backend routes, server actions, `.xlsx` export, server-side PDF generation, or new non-report business modules.

## Plan Executed

- Inspected the existing financial-reporting API, frontend financial-reporting feature pages, report routes, route constants, shell navigation, Prompt 36 chart primitives, report primitives, and e2e coverage.
- Extended the existing read-only business overview report contract from day/week/month buckets to include year buckets.
- Added the missing Yearly Report route and navigation entry beside Business Overview, Daily, Weekly, and Monthly reports.
- Redesigned financial report pages around a consistent finance-grade structure: report header/actions, filters, executive summary, visual analysis, detailed table, and concise assumptions/calculation notes.
- Preserved REST-only frontend consumption, backend role/company scope, accounting-report protections, CSV export, and browser print behavior.

## Yearly Report Added

- Added `/accounting/reports/yearly`.
- Added the Yearly Report navigation item under Financial Reports.
- Reused the existing business overview endpoint with fixed `bucket=year` defaults for the yearly page.
- Yearly report includes contracted sales, collections, revenue, expenses, net profit/loss, voucher count, booking/contract/collection counts where supported, yearly chart analysis, detailed yearly table, CSV export, and print action.
- No fake values were introduced; report values come from the existing read-only reporting endpoint.

## Backend Reporting Changes

- `bucket=year` is now a supported read-only business overview bucket.
- Repository bucket SQL now supports yearly grouping with `date_trunc('year')` and one-year bucket windows.
- Service bucket key/label formatting now emits yearly labels such as `2026`.
- Controller/API protections remain company-scoped and role-protected through the existing accounting-report access boundary.

## Financial Report Redesign

- Business Overview now presents an executive financial-performance report with revenue/expense trend, profit/loss trend, contracted sales vs collections, count mix, period breakdown, and concise assumptions.
- Daily, Weekly, Monthly, and Yearly reports now share the same reporting structure while using their fixed period bucket defaults.
- Trial Balance now emphasizes debit/credit totals, opening/movement/closing comparison, balanced status, hierarchy readability, and finance-control notes.
- General Ledger now keeps account selection practical and presents opening balance, period movement, debit/credit visual comparison, voucher context, running balance, transaction table, and notes after account selection.
- Profit & Loss now presents revenue, expenses, and net profit/loss without masking losses as profit.
- Balance Sheet now emphasizes `Assets = Liabilities + Equity`, balance status, readable section totals, and a professional "Unclosed earnings adjustment" label.

## Export And Print Behavior

- Existing CSV export behavior was preserved and extended through existing safe report export paths where applicable.
- Browser print actions remain visible on report pages.
- Print-oriented content retains report title, company/period context, detailed tables, and calculation notes while shell/navigation chrome remains hidden by existing print rules.
- No server-side PDF or `.xlsx` export was added.

## Responsive And Readability Verification

Authenticated live verification passed at:

- `1440px`
- `1366px`
- `1024px`

Checked routes:

- `/accounting/reports/business-overview`
- `/accounting/reports/daily`
- `/accounting/reports/weekly`
- `/accounting/reports/monthly`
- `/accounting/reports/yearly`
- `/accounting/reports/trial-balance`
- `/accounting/reports/general-ledger`
- `/accounting/reports/profit-loss`
- `/accounting/reports/balance-sheet`

Observed result:

- no route-level crashes
- no global horizontal overflow
- no clipped non-scroll report content in the checked viewports
- filters/actions wrap cleanly
- financial chart legends and values remain readable
- report tables use scoped internal horizontal scrolling where dense accounting data requires it

## Validation

Prompt 37 validation was run on May 1, 2026 with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d --build
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed result:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed and included `/accounting/reports/yearly` in the Next.js route manifest.
- `corepack pnpm test` passed: 161 API tests and 52 Playwright e2e tests.
- `docker compose up -d --build` completed successfully, and the rebuilt `api` and `web` containers started healthy.
- `corepack pnpm seed:demo` completed for `Real Capita Demo / UAT`.
- `corepack pnpm seed:demo:verify` passed.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Live financial report verification passed at 1440px, 1366px, and 1024px.

## Remaining Caveats

- General Ledger still intentionally requires a posting account selection before rendering account-specific ledger lines.
- Dense accounting statement tables retain scoped internal horizontal scrolling where necessary.
- Existing lint warnings remain in older org-security/e2e/API areas outside Prompt 37 scope.
- Stakeholder UAT and supervisor sign-off remain separate from implementation verification.

## Final Verdict

READY FOR PROMPT 38.
