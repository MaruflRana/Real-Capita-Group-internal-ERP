# Prompt 11 Scope

## Prompt 11 May Build

- The next explicitly requested backend or platform capability on top of the Prompt 10 Payroll Core API.
- New Prisma schema changes, raw SQL migration steps, NestJS modules, services, DTOs, controllers, tests, and docs only when required by the next prompt.
- Reuse of the established auth, bootstrap, Org & Security, accounting, voucher engine, project/property master, CRM/property desk, HR, and payroll foundations without unnecessary rework.

## Prompt 11 Must Preserve

- `apps/web` remains frontend-only.
- `apps/api` remains the only backend entry point.
- REST-only boundary between web and API.
- Prompt 4 auth endpoints and bootstrap flow remain intact unless Prompt 11 explicitly expands them.
- Prompt 5 Org & Security Core admin APIs remain intact unless Prompt 11 explicitly expands them.
- Prompt 6 chart-of-accounts and voucher APIs remain intact unless Prompt 11 explicitly expands them.
- Prompt 7 project/property master APIs remain intact unless Prompt 11 explicitly expands them.
- Prompt 8 CRM/property desk APIs remain intact unless Prompt 11 explicitly expands them.
- Prompt 9 HR APIs remain intact unless Prompt 11 explicitly expands them.
- Prompt 10 payroll APIs remain intact unless Prompt 11 explicitly expands them.
- Company-scoped role assignments remain the access baseline.
- User identities remain global records, while company access remains controlled through `user_roles`.
- Prisma remains the default database access layer.
- PostgreSQL-backed accounting, HR, and payroll invariants remain the baseline.
- Prompt 10 payroll posting remains explicit and controlled.
- Prompt 10 salary-structure, payroll-run, payroll-run-line, and payroll-voucher linkage models remain normalized and company-scoped.
- Docker Compose remains the single-VM baseline.

## Prompt 11 Must Not Assume

- No unrelated ERP domains beyond the next explicit prompt.
- No fake/demo data or tutorial CRUD.
- No Next.js backend routes or server-action business operations.
- No auth rewrite, org-core rewrite, accounting rewrite, project/property master rewrite, CRM/property desk rewrite, HR rewrite, or payroll rewrite unless explicitly requested.
- No payslip PDFs, bank payout/export files, compensation-policy engines, tax engines, or payroll automation flows unless Prompt 11 explicitly asks for them.
- No cross-company data model shortcuts that bypass the established company-scoped access rules.
- No automatic financial recognition or automatic payroll posting unless Prompt 11 explicitly asks for it.

## Prompt 11 Starting Checklist

- Read `AGENTS.md`.
- Read `docs/handoffs/foundation-status.md`.
- Read `docs/handoffs/prompt-9-status.md`.
- Read `docs/handoffs/prompt-10-status.md`.
- Confirm the root `.env` still contains JWT secrets that are at least 32 characters long.
- Confirm migrations are applied.
- Confirm bootstrap admin creation has been run at least once in the local database.
- Confirm health, auth, Swagger, Prompt 5 Org & Security, Prompt 6 accounting, Prompt 7 project/property, Prompt 8 CRM/property desk, Prompt 9 HR, and Prompt 10 payroll endpoints still respond before adding new scope.
- Preserve the Docker/Prisma runtime behavior that regenerates the Prisma client before API container startup.
- Preserve the direct `api:dev:development` compose startup path, including the Nx-state reset required to keep the API container healthy under Docker.
