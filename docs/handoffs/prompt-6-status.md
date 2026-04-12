# Prompt 6 Status

## Implemented

- Accounting Core schema expansion on top of Prompt 5:
  - `account_classes`
  - `account_groups`
  - `ledger_accounts`
  - `particular_accounts`
  - `vouchers`
  - `voucher_lines`
  - Prisma enums for `AccountNature`, `VoucherType`, and `VoucherStatus`
- Canonical account class strategy implemented as fixed master data seeded in the Prompt 6 migration:
  - `ASSET`
  - `LIABILITY`
  - `EQUITY`
  - `REVENUE`
  - `EXPENSE`
- Backend chart-of-accounts module with read/list/create/update/activate/deactivate flows for:
  - account classes (read-only list)
  - account groups
  - ledger accounts
  - particular accounts
- Voucher module with:
  - voucher draft creation
  - voucher draft header update
  - voucher list with filter/search/sort baseline
  - voucher detail with lines
  - voucher line create/update/remove while draft
  - explicit voucher posting action
- Company-scoped accounting access baseline:
  - new `company_accountant` role definition
  - new `RequireCompanyAccountingAccess` decorator allowing `company_admin` or `company_accountant`
  - company-scoped guard reuse with no cross-company accounting leakage
- Swagger documentation for all Prompt 6 accounting endpoints.
- Scoped backend tests for chart-of-accounts hierarchy/conflict behavior and voucher lifecycle behavior.

## Database Logic Added

- Migration `20260316011758_prompt_6_accounting_core` adds:
  - accounting tables and enums
  - fixed account class seed rows
  - `company_accountant` role seed/upsert
  - `voucher_lines_nonnegative_amounts_check`
  - `voucher_lines_single_sided_amount_check`
  - `enforce_voucher_line_rules()` trigger function
  - `enforce_voucher_posting_rules()` trigger function
  - `prevent_posted_voucher_delete()` trigger function
- Posting is enforced in PostgreSQL, not only in application code:
  - a voucher cannot be posted with zero lines
  - a voucher cannot be posted when total debit and total credit differ
  - a voucher cannot be posted if a referenced posting account is inactive
  - voucher lines must be single-sided and non-negative
  - voucher lines must use a posting account from the same company as the voucher
  - posted vouchers reject line insert/update/delete at the database level
  - posted vouchers reject unsafe header updates and deletes at the database level

## New Authorization Behavior

- Prompt 4 auth remains intact.
- Prompt 5 company-admin baseline remains intact.
- Prompt 6 adds `company_accountant` as an assignable company-scoped role definition.
- Prompt 6 accounting routes allow either:
  - `company_admin`
  - `company_accountant`
- Non-accounting admin routes still retain their Prompt 5 `company_admin` requirements.

## Endpoints Added

### Account Classes

- `GET /api/v1/companies/:companyId/accounting/account-classes`

### Account Groups

- `GET /api/v1/companies/:companyId/accounting/account-groups`
- `GET /api/v1/companies/:companyId/accounting/account-groups/:accountGroupId`
- `POST /api/v1/companies/:companyId/accounting/account-groups`
- `PATCH /api/v1/companies/:companyId/accounting/account-groups/:accountGroupId`
- `POST /api/v1/companies/:companyId/accounting/account-groups/:accountGroupId/activate`
- `POST /api/v1/companies/:companyId/accounting/account-groups/:accountGroupId/deactivate`

### Ledger Accounts

- `GET /api/v1/companies/:companyId/accounting/ledger-accounts`
- `GET /api/v1/companies/:companyId/accounting/ledger-accounts/:ledgerAccountId`
- `POST /api/v1/companies/:companyId/accounting/ledger-accounts`
- `PATCH /api/v1/companies/:companyId/accounting/ledger-accounts/:ledgerAccountId`
- `POST /api/v1/companies/:companyId/accounting/ledger-accounts/:ledgerAccountId/activate`
- `POST /api/v1/companies/:companyId/accounting/ledger-accounts/:ledgerAccountId/deactivate`

### Particular Accounts

- `GET /api/v1/companies/:companyId/accounting/particular-accounts`
- `GET /api/v1/companies/:companyId/accounting/particular-accounts/:particularAccountId`
- `POST /api/v1/companies/:companyId/accounting/particular-accounts`
- `PATCH /api/v1/companies/:companyId/accounting/particular-accounts/:particularAccountId`
- `POST /api/v1/companies/:companyId/accounting/particular-accounts/:particularAccountId/activate`
- `POST /api/v1/companies/:companyId/accounting/particular-accounts/:particularAccountId/deactivate`

### Vouchers

- `GET /api/v1/companies/:companyId/accounting/vouchers`
- `GET /api/v1/companies/:companyId/accounting/vouchers/:voucherId`
- `POST /api/v1/companies/:companyId/accounting/vouchers`
- `PATCH /api/v1/companies/:companyId/accounting/vouchers/:voucherId`
- `POST /api/v1/companies/:companyId/accounting/vouchers/:voucherId/lines`
- `PATCH /api/v1/companies/:companyId/accounting/vouchers/:voucherId/lines/:voucherLineId`
- `DELETE /api/v1/companies/:companyId/accounting/vouchers/:voucherId/lines/:voucherLineId`
- `POST /api/v1/companies/:companyId/accounting/vouchers/:voucherId/post`

## Query And Validation Notes

- Account-group, ledger-account, and particular-account list endpoints support pagination/search/sort plus active-status filtering.
- Ledger-account and particular-account list endpoints support parent filters to preserve company-scoped hierarchy visibility.
- Voucher list supports pagination/search/sort plus filter by:
  - `voucherType`
  - `status`
  - `dateFrom`
  - `dateTo`
- Voucher lines accept decimal-string debit/credit values and enforce exactly one positive side per line.
- Draft-only mutation is enforced in the service layer and backed by PostgreSQL triggers for posting protection.

## Environment And Runtime Notes

- No new environment variables were added in Prompt 6.
- Docker Compose API startup now runs `prisma generate` before `nx run api:dev:development`.
- `apps/api/Dockerfile` development command now mirrors the direct `api:dev:development` target.
- This change preserves the Prompt 5 Prisma-generation safeguard and avoids the Nx alias handoff stall that left the API container unhealthy during compose startup.

## Verification Commands

```powershell
corepack pnpm prisma:format
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:dev --name prompt_6_accounting_core
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
docker compose up -d --build api web
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me/refresh/logout
- company/location/department/user/role list endpoints
- account class list
- account group create/list/detail/update/activate/deactivate
- ledger account create/list/detail/update/activate/deactivate
- particular account create/list/detail/update/activate/deactivate
- voucher create/list/detail/update
- voucher line add/update/remove
- balanced voucher posting
- empty voucher post rejection
- unbalanced voucher post rejection
- posted voucher mutation rejection
- direct PostgreSQL trigger rejection for posted voucher line update

## Intentionally Out Of Scope

- Balance sheet
- Profit & loss
- Trial balance
- General ledger reports
- Payroll posting integration
- CRM/property desk
- Employee/attendance modules
- Project catalog / property inventory
- Frontend accounting screens
- Fake/demo ERP data
- Next.js backend routes or server actions
- Automated voucher numbering workflows beyond this phase
- Reversals, approvals, recurring vouchers, or financial closing flows

## Ready State

Prompt 6 delivered the minimum production-grade backend Accounting Core required for a 4-level chart of accounts and a database-protected double-entry voucher engine. The repo is ready for Prompt 7.
