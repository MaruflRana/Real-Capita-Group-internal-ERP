# Prompt 13 Status

## Scope Delivered

Prompt 13 delivered the first production-grade Accounting Core frontend on top of the Prompt 12 shell, auth, and query/form foundation:

- accounting navigation in the authenticated app shell
- chart-of-accounts UI for account classes, account groups, ledger accounts, and particular accounts
- voucher list UI with filters and company-scoped context
- voucher draft creation, detail/edit, line add/update/remove, and explicit posting UI
- reusable accounting API client methods, TanStack Query hooks, and form patterns
- Playwright coverage for accounting route protection and the draft-to-posted voucher workflow
- handoff docs updated for Prompt 14 continuity

## Frontend Routes Added

- `/accounting/chart-of-accounts`
- `/accounting/vouchers`
- `/accounting/vouchers/new`
- `/accounting/vouchers/[voucherId]`

## Frontend Infrastructure Added

- Accounting API/data layer:
  - typed accounting REST client in `apps/web/src/lib/api/accounting.ts`
  - accounting record/query payload types in `apps/web/src/lib/api/types.ts`
  - accounting TanStack Query hooks and cache invalidation patterns in `apps/web/src/features/accounting/hooks.ts`
- Shared accounting UI patterns:
  - page header, section, status/balance/read-only badges and notices
  - reusable chart-of-accounts side-panel forms
  - reusable voucher header and line forms with validation
- Auth and shell integration:
  - accounting route constants in `apps/web/src/lib/routes.ts`
  - accounting navigation in `apps/web/src/features/shell/app-shell.tsx`
  - `/accounting/**` route protection in `apps/web/src/proxy.ts`
  - accounting visibility derived from the existing auth/session provider

## Chart Of Accounts UX In This Phase

- The page presents account classes as stable canonical anchors.
- Account groups, ledger accounts, and particular accounts are managed through focused hierarchy drill-down:
  - select account class
  - focus group
  - focus ledger
  - manage posting-level accounts
- Each level supports:
  - company-scoped listing
  - search and status filtering
  - pagination
  - create/edit via side-panel forms
  - activate/deactivate actions where supported
- The UI intentionally prevents confusing orphan flows by constraining ledger creation to active groups and particular creation to active ledgers.

## Voucher Draft / Post UX In This Phase

- Voucher creation starts with the header only:
  - voucher type
  - voucher date
  - reference
  - description
- The voucher detail page then handles all draft operations:
  - add/edit/remove lines while draft
  - posting-account selection from active particular accounts only
  - live debit/credit totals and balance state
  - explicit post action
- Posting errors are rendered from the backend in plain language:
  - empty voucher rejection
  - unbalanced voucher rejection
- Once posted:
  - header form becomes disabled
  - line actions become read-only
  - posted status and posted timestamp are visible

## Backend Compatibility Tweaks Made

- None.
- Prompt 13 used the existing accounting backend APIs as-is. No backend accounting code, DTOs, response shapes, or schema files were changed.

## Files Added Or Materially Updated

- Frontend routes:
  - `apps/web/src/app/(app)/accounting/chart-of-accounts/page.tsx`
  - `apps/web/src/app/(app)/accounting/vouchers/page.tsx`
  - `apps/web/src/app/(app)/accounting/vouchers/new/page.tsx`
  - `apps/web/src/app/(app)/accounting/vouchers/[voucherId]/page.tsx`
- Accounting feature slice:
  - `apps/web/src/features/accounting/chart-of-accounts-page.tsx`
  - `apps/web/src/features/accounting/chart-of-accounts-forms.tsx`
  - `apps/web/src/features/accounting/vouchers-page.tsx`
  - `apps/web/src/features/accounting/voucher-create-page.tsx`
  - `apps/web/src/features/accounting/voucher-detail-page.tsx`
  - `apps/web/src/features/accounting/voucher-forms.tsx`
  - `apps/web/src/features/accounting/hooks.ts`
  - `apps/web/src/features/accounting/shared.tsx`
  - `apps/web/src/features/accounting/utils.ts`
- Shared frontend infrastructure:
  - `apps/web/src/lib/api/accounting.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/lib/format.ts`
  - `apps/web/src/components/providers/auth-provider.tsx`
  - `apps/web/src/features/shell/app-shell.tsx`
  - `apps/web/src/proxy.ts`
- Tests:
  - `tests/e2e/accounting.spec.ts`

## Verification Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose up -d
corepack pnpm prisma:migrate:deploy
```

## Verified Runtime Behavior

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed, including the new accounting Playwright coverage.
- `docker compose up -d` completed with healthy `postgres`, `minio`, `api`, and `web` services.
- `GET http://localhost:3333/api/v1/health` returned `200`.
- `GET http://localhost:3333/api/v1/health/ready` returned `200`.
- `GET http://localhost:3333/api/docs` returned `200`.
- Live browser verification against `http://localhost:3000` succeeded for:
  - login and company selection with the existing auth/session flow
  - accounting navigation visibility in the authenticated shell
  - chart-of-accounts page load against real APIs
  - live account group, ledger account, and particular account creation
  - voucher draft creation
  - empty-voucher post rejection messaging
  - unbalanced-voucher post rejection messaging
  - successful voucher posting
  - posted voucher read-only protection

## Out Of Scope And Still Not Built

- balance sheet UI
- P&L UI
- trial balance UI
- general ledger report UI
- payroll posting UI
- CRM/property UI
- HR/payroll admin UI
- document management UI
- fake/demo data
- Next.js backend routes or server actions for business operations

## Prompt 14 Readiness

Prompt 13 is complete. The repo now has a usable Accounting Core frontend that operates the existing backend through the locked REST boundary. Prompt 14 should build the next accounting slice on top of these patterns without reworking the shell, auth/session model, or accounting draft/post workflows.
