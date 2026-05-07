# Prompt 40C Status: Printable Financial Statements Rollout

Prompt 40C applied the Prompt 40A/40B printable report-generation foundation to the formal statement-style financial reports. It did not add backend logic, accounting calculations, reporting contracts, Prisma schema changes, migrations, seed data, transactional workflows, `.xlsx` export, server-side PDF generation, deployment changes, or release tagging.

## Scope Delivered

- Wired the shared A4 printable report layout to:
  - `/accounting/reports/trial-balance`
  - `/accounting/reports/general-ledger`
  - `/accounting/reports/profit-loss`
  - `/accounting/reports/balance-sheet`
- Kept Business Overview, Daily, Weekly, Monthly, and Yearly on the existing shared printable templates from Prompts 40A and 40B.
- Kept the existing screen filters, charts, cards, hierarchy tables, CSV exports, and interactive report behavior intact.
- Print media now hides screen report content, shell/header/sidebar chrome, export controls, print controls, and screen analytics for the four statement reports.
- Trial Balance print output includes header/meta/footer, company, date range, generated timestamp, generated-by session email, source-of-truth note, debit/credit summary, balance status, closing difference, and a finance-readable hierarchy table.
- General Ledger print output includes header/meta/footer, selected account context, date range, opening balance, period debit/credit, closing balance, and transaction table. If no posting account/report is selected, the print layout shows a professional not-ready message.
- Profit & Loss print output includes header/meta/footer, company/date range, revenue, expense, clear net profit/net loss labeling, statement table, and assumptions.
- Balance Sheet print output includes header/meta/footer, company/as-of date, assets, liabilities, equity, balance status, equation summary, statement table, and user-facing unclosed earnings adjustment disclosure when present.

## Orientation

- Trial Balance: A4 landscape.
- General Ledger: A4 landscape.
- Profit & Loss: A4 portrait.
- Balance Sheet: A4 portrait.
- Business Overview, Daily, Weekly, Monthly, and Yearly keep their Prompt 40B orientations.

## Tests Updated

- `tests/e2e/financial-reporting.spec.ts` now verifies printable statement containers and print-media behavior for Trial Balance, General Ledger, Profit & Loss, and Balance Sheet.
- General Ledger coverage includes the no-account print state and the selected-account print state.
- Coverage verifies screen print/export controls, printable report visibility under print media, screen content hiding under print media, app shell chrome hiding, orientation metadata, printable header/meta/footer, and statement/summary table presence.
- Existing Business Overview and Daily/Weekly/Monthly/Yearly printable tests remain in place and pass.

## Validation Results

Executed:

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

Observed:

- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed: 161 API tests and 55 Playwright e2e tests.
- `docker compose up -d --build` rebuilt and started the stack successfully.
- `corepack pnpm seed:demo` passed for `Real Capita Demo / UAT`.
- `corepack pnpm seed:demo:verify` passed with financial report readiness totals intact.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.

## Live Print Verification

Authenticated print-media verification passed against the rebuilt Docker stack for:

- `/accounting/reports/trial-balance`
- `/accounting/reports/general-ledger`
- `/accounting/reports/profit-loss`
- `/accounting/reports/balance-sheet`
- `/accounting/reports/business-overview`
- `/accounting/reports/daily`
- `/accounting/reports/weekly`
- `/accounting/reports/monthly`
- `/accounting/reports/yearly`

Observed in print media:

- no sidebar/header/chrome visible
- printable header, metadata, footer visible
- generated timestamp and generated-by metadata visible
- summary plus statement or period breakdown table visible
- export and print buttons hidden
- screen chart/report sections hidden
- Trial Balance and General Ledger orientation metadata is `landscape`
- Profit & Loss and Balance Sheet orientation metadata is `portrait`
- Business/periodic report orientation metadata remains unchanged from Prompt 40B

Screenshots were written to:

```text
test-results/prompt-40c-print-media/
```

## Caveats For Prompt 40D

- Browser print remains the only Phase 1 print/PDF-from-browser path.
- CSV remains the only Phase 1 structured export format.
- Voucher detail still uses the earlier print-friendly behavior and was intentionally not changed.
- Prompt 40D should focus on final print/export QA, route sweep, docs consistency, Git checkpoint, and any small compatibility fixes found during QA.
- `.xlsx`, server-side PDF, new calculations, backend report contracts, seed changes, and schema changes remain out of scope unless explicitly approved later.

## Final Verdict

READY FOR PROMPT 40D.
