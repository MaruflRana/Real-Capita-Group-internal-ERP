# Prompt 41C Status: Final Receipt QA, Demo Seed Refresh, And Git Push

## Summary

Prompt 41C completed the printable Customer Collection Receipt delivery end to end for the MD/UAT demo path.

It preserved the Prompt 41B receipt implementation, fixed the Demo/UAT seed verification blocker, validated the receipt on the rebuilt runtime, confirmed print behavior, regression-smoked the shared printable financial reports, and prepared the worktree for commit/push.

## Root Cause

The blocked verification was caused by stale customer data inside the reserved synthetic company:

- one manually added customer record inside `real-capita-demo-uat` was not synthetic
- that row had no Demo/UAT seed marker
- `corepack pnpm seed:demo` previously behaved as an incremental upsert, so stray demo-company records could survive until `corepack pnpm seed:demo:verify` failed on synthetic-data and reset-marker checks

The verifier itself was correct and was not weakened.

## Demo-Seed Fix

- `scripts/lib/demo-data.mjs` now makes `corepack pnpm seed:demo` rebuild the reserved `Real Capita Demo / UAT` company before reseeding.
- `corepack pnpm seed:demo:reset` remains conservative and still refuses unmarked records when used directly.
- The authoritative seed continues to keep all customer, employee, contact, contract, collection, payroll, attendance, attachment, and audit data synthetic.

## Seeded Receipt Scenario

The seeded CRM/property/accounting chain now remains clean and demo-ready after the authoritative refresh.

Recommended receipt walkthrough:

- login: `demo.sales@demo.realcapita.test`
- company: `Real Capita Demo / UAT`
- collection reference: `DEMO-COL-2026-001`

That scenario provides:

- synthetic customer `DEMO Customer Nadia Synthetic`
- booking on `DEMO-MAYA-A-B-2P5-001`
- sale contract `DEMO-SC-2026-RC-MAYA-001`
- installment `#1`
- posted receipt voucher `DEMO-COL-2026-001`
- collection `DEMO-COL-2026-001`
- receipt route `/crm-property-desk/collections/[collectionId]/receipt`

## Receipt QA Result

Validated on the rebuilt runtime with seeded demo data:

- collections table shows the `Receipt` action
- collection detail side panel shows `Open Receipt`
- receipt route loads successfully for the seeded collection
- receipt screen shows customer, collection amount/date/reference, posted voucher context, project/unit context, sale contract, installment, acknowledgement note, and `Received By` / `Authorized Signature`
- no visible `undefined` or `null` placeholders were found
- the print-only receipt was tightened to show human-readable booking context instead of a raw booking UUID

## Print QA Result

Browser print-media validation confirmed:

- sidebar/header/app chrome hidden
- screen controls hidden
- printable receipt content visible
- A4 portrait output intact
- customer, amount, voucher, project/unit, contract, and installment details readable
- signature area visible
- no blank or duplicated print content after receipt data loaded

## Financial Print Regression

The shared printable financial-report layout was regression-smoked after the receipt work:

- Business Overview
- Daily
- Weekly
- Monthly
- Yearly
- Trial Balance
- General Ledger
- Profit & Loss
- Balance Sheet

Existing print-media and CSV behaviors remained intact.

## Validation Commands

```powershell
docker compose up -d --build
corepack pnpm seed:demo
corepack pnpm seed:demo:verify
corepack pnpm docker:smoke
corepack pnpm exec tsx --tsconfig apps/api/tsconfig.app.json --test apps/api/src/app/crm-property-desk/collections.service.spec.ts
corepack pnpm exec playwright test tests/e2e/crm-property-desk.spec.ts --config tests/e2e/playwright.config.ts
corepack pnpm exec playwright test tests/e2e/financial-reporting.spec.ts --config tests/e2e/playwright.config.ts
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

## Final Status

Prompt 41C leaves the repo demo-ready for the printable Customer Collection Receipt and ready for Git commit/push on `main`.
