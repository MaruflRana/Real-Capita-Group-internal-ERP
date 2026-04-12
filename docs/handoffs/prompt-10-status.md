# Prompt 10 Status

## Implemented

- Payroll Core schema expansion on top of Prompt 9:
  - `salary_structures`
  - `payroll_runs`
  - `payroll_run_lines`
- Backend payroll module with company-scoped REST APIs for:
  - salary structures
  - payroll runs
  - payroll run lines
  - explicit payroll-to-accounting posting
- New company-scoped `company_payroll` role definition seeded into the database and included in bootstrap role guarantees.
- Reuse of the existing auth, company-assignment guard, Org & Security admin foundation, accounting voucher engine, project/property foundation, CRM/property desk foundation, and HR foundation without frontend or Next.js backend changes.
- Swagger documentation for all Prompt 10 payroll endpoints.
- Scoped backend tests for salary structure, payroll run, payroll run line, payroll posting, and payroll authorization behavior.

## Database Logic Added

- Migration `20260316205221_prompt_10_payroll_core` adds:
  - Prompt 10 payroll tables and enum
  - `company_payroll` role seed/upsert
  - composite company-scoped keys for payroll runs and payroll run lines
  - `cost_centers_id_companyId_key` support index for company-safe payroll run linkage
  - active payroll period/scope uniqueness for non-cancelled payroll runs
  - non-negative, positive-gross, and net-formula check constraints for salary structures and payroll run lines
  - payroll-year and payroll-month range checks
  - `pgcrypto` enablement for voucher creation inside SQL posting logic
  - `enforce_payroll_run_scope_consistency()` trigger function
  - `enforce_payroll_run_update_rules()` trigger function
  - `enforce_payroll_run_line_rules()` trigger function
  - `post_payroll_run(...)` SQL function for explicit payroll posting into the accounting voucher engine
- Migration `20260316211200_prompt_10_payroll_posting_fix` replaces `post_payroll_run(...)` with fully qualified line-source aliases to remove the ambiguous `payrollRunId` reference in the posting aggregate query.
- PostgreSQL now enforces Prompt 10 payroll integrity:
  - salary structures are unique by `code` and `name` within company scope
  - payroll runs are unique by `(companyId, payrollYear, payrollMonth, projectId, costCenterId)` while status is not `CANCELLED`
  - payroll run optional project and cost center links must remain company-safe
  - selected cost center must belong to the selected project when both are provided
  - payroll run lines must stay in the same company as both the payroll run and employee
  - only one payroll run line can exist per employee within a payroll run
  - payroll line amounts and salary structure amounts must satisfy the stored net formula
  - only draft payroll runs can be mutated
  - payroll run lines cannot be inserted, updated, or deleted after the parent run leaves draft
  - posting requires a finalized payroll run, at least one payroll line, a positive gross total, balanced totals, and active same-company posting accounts

## New Authorization Behavior

- Prompt 4 auth remains intact.
- Prompt 5 company-admin baseline remains intact.
- Prompt 6 accounting access remains intact.
- Prompt 8 `company_sales` access remains intact.
- Prompt 9 `company_hr` access remains intact.
- Prompt 10 adds `company_payroll` as an assignable company-scoped role definition.
- Prompt 10 payroll routes allow either:
  - `company_admin`
  - `company_hr`
  - `company_payroll`
- Company-scoped access enforcement remains mandatory for all Prompt 10 routes.

## Endpoints Added

### Salary Structures

- `GET /api/v1/companies/:companyId/salary-structures`
- `GET /api/v1/companies/:companyId/salary-structures/:salaryStructureId`
- `POST /api/v1/companies/:companyId/salary-structures`
- `PATCH /api/v1/companies/:companyId/salary-structures/:salaryStructureId`
- `POST /api/v1/companies/:companyId/salary-structures/:salaryStructureId/activate`
- `POST /api/v1/companies/:companyId/salary-structures/:salaryStructureId/deactivate`

### Payroll Runs

- `GET /api/v1/companies/:companyId/payroll-runs`
- `GET /api/v1/companies/:companyId/payroll-runs/:payrollRunId`
- `POST /api/v1/companies/:companyId/payroll-runs`
- `PATCH /api/v1/companies/:companyId/payroll-runs/:payrollRunId`
- `POST /api/v1/companies/:companyId/payroll-runs/:payrollRunId/finalize`
- `POST /api/v1/companies/:companyId/payroll-runs/:payrollRunId/cancel`
- `POST /api/v1/companies/:companyId/payroll-runs/:payrollRunId/post`

### Payroll Run Lines

- `GET /api/v1/companies/:companyId/payroll-runs/:payrollRunId/lines`
- `GET /api/v1/companies/:companyId/payroll-runs/:payrollRunId/lines/:payrollRunLineId`
- `POST /api/v1/companies/:companyId/payroll-runs/:payrollRunId/lines`
- `PUT /api/v1/companies/:companyId/payroll-runs/:payrollRunId/lines/bulk`
- `PATCH /api/v1/companies/:companyId/payroll-runs/:payrollRunId/lines/:payrollRunLineId`
- `DELETE /api/v1/companies/:companyId/payroll-runs/:payrollRunId/lines/:payrollRunLineId`

## Query And Validation Notes

- Salary-structure list supports pagination/search plus `isActive`.
- Payroll-run list supports pagination/search/sort plus:
  - `payrollYear`
  - `payrollMonth`
  - `status`
  - `projectId`
  - `costCenterId`
- Payroll-run-line list supports pagination/search/sort plus:
  - `employeeId`
- Salary-structure codes and names are normalized and rejected on duplicate within company scope.
- Payroll runs remain intentionally minimal for this phase:
  - no salary-rule DSL
  - no automatic generation from salary structures
  - no auto-posting on creation
- Payroll runs can be updated only while `DRAFT`.
- Payroll runs must contain at least one line before finalization.
- Payroll run lines require same-company employees and reject duplicate employees within the same payroll run.
- Payroll run lines support single-create plus bulk upsert with duplicate-employee protection inside the submitted bulk payload.
- Payroll posting is explicit and requires the caller to provide:
  - `voucherDate`
  - `expenseParticularAccountId`
  - `payableParticularAccountId`
  - `deductionParticularAccountId` when deductions exist

## Payroll Posting Behavior In This Phase

- Posting creates a `JOURNAL` voucher through the existing accounting tables.
- Voucher reference is generated as `PAYROLL-YYYY-MM`.
- Voucher description uses payroll-run description when present, otherwise a fallback payroll reference description.
- Voucher lines are created as:
  - debit payroll gross to the explicit expense account
  - credit payroll deductions to the explicit deduction liability account when deductions exist
  - credit payroll net payable to the explicit payable account
- The voucher is marked `POSTED` inside the same database posting flow.
- The payroll run is updated to `POSTED`, `postedVoucherId`, and `postedAt` inside the same posting flow.
- Reposting is blocked because posted payroll runs no longer satisfy the finalized-only posting precondition and the voucher linkage is already stored.

## Environment And Runtime Notes

- No new environment variables were added in Prompt 10.
- Docker Compose runtime behavior from Prompt 7/8/9 remains intact:
  - Prisma client regeneration still happens before API container startup
  - direct `api:dev:development` compose startup path is preserved
  - the Nx-state reset required for API container health remains preserved

## Verification Commands

```powershell
corepack pnpm prisma:format
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:api
corepack pnpm test
docker compose up -d --build
```

Live verification completed against the running stack for:

- health
- Swagger
- auth login/me/refresh/logout
- company list
- role list including `company_payroll`
- location list
- department list
- account-class, account-group, ledger-account, particular-account, and voucher detail flows needed for payroll posting
- unit-status list
- customer list
- employee create/list flows needed for payroll lines
- salary-structure create/list/detail/update/activate/deactivate
- payroll-run create/list/detail/update/finalize/post/cancel
- payroll-run-line create/list/detail/update/bulk/delete
- invalid payroll amount rejection
- duplicate payroll run rejection
- duplicate payroll employee-line rejection
- successful payroll posting to accounting with balanced voucher lines and voucher linkage
- rejection of unsafe payroll mutation after posting
- rejection of invalid reposting

## Intentionally Out Of Scope

- Payslip PDF generation
- Bank transfer/export files
- Tax management beyond the stored payroll amounts in this phase
- Reimbursement or expense-claim workflows
- Bonus or performance workflow systems
- Salary assignment rules engines
- Automatic payroll generation from attendance, leave, shifts, or rosters
- Payroll approval hierarchies beyond the minimal draft/finalized/posted flow
- Frontend payroll screens
- Fake/demo ERP data
- Next.js backend routes or server actions

## Ready State

Prompt 10 delivered the minimum production-grade backend Payroll Core needed for salary structures, payroll preparation, payroll review, payroll run line management, and explicit payroll posting into the existing accounting voucher engine while preserving the Prompt 4-9 foundations. The repo is ready for Prompt 11.
