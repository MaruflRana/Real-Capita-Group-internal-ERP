# Prompt 42C Status: Customer 360 Runtime QA And Git Checkpoint

## Summary

Prompt 42C completed runtime QA, seeded Demo/UAT verification, responsive review, receipt-link regression, and final validation for the Customer 360 Profile + Customer Records + Transaction History feature from Prompt 42B.

## Runtime QA Result

Passed against the rebuilt Docker stack.

Executed:

```powershell
docker compose up -d --build
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
```

Observed:

- Docker Compose rebuilt and started the stack.
- `corepack pnpm seed:demo` refreshed the reserved `Real Capita Demo / UAT` company.
- `corepack pnpm seed:demo:verify` passed.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- Local `.env` still contained temporary live-demo canonical URL settings, so localhost browser QA used process-level localhost overrides for the Docker run without editing `.env`.

Local QA override used:

```powershell
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
WEB_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:3333
CORS_ORIGIN=http://localhost:3000
```

## Seeded Demo Customer

Prompt 42C confirmed the strong seeded Customer 360 candidate remains:

- login: `demo.sales@demo.realcapita.test`
- company: `Real Capita Demo / UAT`
- collection reference: `DEMO-COL-2026-001`
- customer: `DEMO Customer Nadia Synthetic`
- booking unit: `DEMO-MAYA-A-B-2P5-001`
- sale contract: `DEMO-SC-2026-RC-MAYA-001`
- installment: `#1`, due `2026-03-15`
- posted receipt voucher: `DEMO-COL-2026-001`
- printable receipt route through the collection id

The runtime profile returned:

- bookings: `1`
- sale contracts: `1`
- installment schedules: `4`
- collection transaction history rows: `1`
- timeline events: `8`

## Customer Register QA

Passed.

Verified:

- `/crm-property-desk/customers` loads for `company_sales`.
- customer register search works for `DEMO Customer Nadia Synthetic`.
- `View Profile` appears on the customer row.
- existing `New customer`, `Edit`, and active-state actions remain visible.
- clicking `View Profile` opens `/crm-property-desk/customers/[customerId]`.

## Customer Profile QA

Passed.

Verified:

- customer identity, phone, email, address, notes, active status, created/updated context, and `Back to Customers`
- Customer Records Summary with safe metrics only
- Booking Records with project/unit/date/amount/status/linked contract
- Sale Contracts with reference/date/amount plus readable linked-booking/project/unit context
- Installment Schedule with directly linked collected/balance only where directly backed by the linked collection
- Transaction History as newest-first collection/payment history
- posted voucher reference/type/date/status in transaction rows
- `Printable Receipt` action per collection
- Customer Activity Timeline from existing business records
- sparse customer profile empty states using `DEMO Customer Omar Synthetic`
- no visible `undefined` or `null` placeholders
- no misleading `Customer ledger` or `Account statement` wording
- no headline outstanding, remaining, or overdue amount/count

Prompt 42C made one targeted UI polish during QA:

- the sale-contract table no longer displays the linked booking as a raw UUID; it renders a readable booking-date/link label instead.

## Receipt-Link Regression

Passed.

From the Customer Profile transaction row:

- `Printable Receipt` linked to `/crm-property-desk/collections/[collectionId]/receipt`
- the receipt route loaded
- the receipt showed the customer, collection reference, and `Print Receipt` action
- no visible `undefined` or `null` placeholders appeared
- browser back navigation returned sensibly to the customer profile

## Responsive QA Result

Passed at:

- `1440px`
- `1366px`
- `1024px`

Observed:

- no global horizontal overflow
- profile content rendered at each width
- table overflow stayed contained inside table shells
- visible buttons stayed within the viewport
- no visible `undefined` or `null` placeholders at checked widths

## Data Correctness Sanity Check

Passed for `DEMO Customer Nadia Synthetic`.

Verified:

- booking count matched returned bookings
- sale contract count and amount matched returned contracts
- installment schedule count and scheduled amount matched returned schedules
- collection count and collected amount matched returned transaction-history rows
- latest collection date matched the newest returned collection
- posted-voucher-backed collection amount included only posted-voucher-backed collection rows
- installment `#1` collected/balance came from the directly linked collection only
- later schedules did not infer collected/balance from broader customer totals

## Validation Results

Executed:

```powershell
corepack pnpm exec tsx --tsconfig apps/api/tsconfig.app.json --test apps/api/src/app/crm-property-desk/customers.service.spec.ts
corepack pnpm exec playwright test tests/e2e/crm-property-desk.spec.ts --config tests/e2e/playwright.config.ts
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

Observed:

- focused customer service spec passed: `5` tests.
- focused CRM Playwright spec passed: `6` tests.
- `corepack pnpm lint` passed with pre-existing warnings only.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed and included `/crm-property-desk/customers/[customerId]`.
- `corepack pnpm test` passed: `164` API tests and `61` Playwright e2e tests.

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
- `docs/handoffs/prompt-42c-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/uat/phase-1-demo-walkthrough.md`

## Unsafe Files Left Unstaged

Unsafe/generated local paths were detected and intentionally kept out of staging:

- `.env`
- `.env.tunnel-backup`
- `.env.tunnel-backup-20260514-024911`
- `Caddyfile.tunnel`
- `backups/`
- backup `*.dump` files
- `node_modules/`
- `dist/`
- `test-results/`
- `playwright-report/`
- `.playwright-mcp/`
- `.live-demo/`
- `docs/diagrams/`

## Commit And Push

Pending at status-document write time. The final Prompt 42C response records the pushed commit hash and push result after the safe Git checkpoint is created.

## Final Verdict

READY FOR CUSTOMER 360 PROFILE GIT CHECKPOINT.
