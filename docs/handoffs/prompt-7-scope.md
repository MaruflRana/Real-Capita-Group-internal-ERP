# Prompt 7 Scope

## Prompt 7 May Build

- The next explicitly requested backend or platform capability on top of the Prompt 6 Accounting Core.
- New Prisma schema changes, raw SQL migration steps, NestJS modules, services, DTOs, controllers, tests, and docs only when required by the next prompt.
- Reuse of the established auth, bootstrap, company admin API, company assignment guard, chart-of-accounts, voucher engine, database, storage, health, and pagination foundations without unnecessary rework.

## Prompt 7 Must Preserve

- `apps/web` remains frontend-only.
- `apps/api` remains the only backend entry point.
- REST-only boundary between web and API.
- Prompt 4 auth endpoints and bootstrap flow remain intact unless the next prompt explicitly expands them.
- Prompt 5 Org & Security Core admin APIs remain intact unless the next prompt explicitly extends them.
- Prompt 6 chart-of-accounts and voucher APIs remain intact unless the next prompt explicitly extends them.
- Company-scoped role assignments remain the access baseline.
- User identities remain global records, while company access remains controlled through `user_roles`.
- Prisma remains the default database access layer.
- PostgreSQL-first database enforcement for accounting invariants remains the baseline.
- Docker Compose remains the single-VM baseline.

## Prompt 7 Must Not Assume

- No unrelated ERP domains beyond the next explicit prompt.
- No fake/demo data or tutorial CRUD.
- No Next.js backend routes or server-action business operations.
- No auth rewrite, org-core rewrite, or permission-matrix expansion unless explicitly requested.
- No financial reports, payroll posting integration, or accounting automation unless Prompt 7 explicitly asks for them.
- No employee/attendance/payroll/accounting-adjacent modules unless Prompt 7 explicitly asks for them.

## Prompt 7 Starting Checklist

- Read `AGENTS.md`.
- Read `docs/handoffs/foundation-status.md`.
- Read `docs/handoffs/prompt-5-status.md`.
- Read `docs/handoffs/prompt-6-status.md`.
- Confirm the root `.env` still contains JWT secrets that are at least 32 characters long.
- Confirm migrations are applied.
- Confirm bootstrap admin creation has been run at least once in the local database.
- Confirm health, auth, Swagger, Prompt 5 Org & Security, and Prompt 6 accounting endpoints still respond before adding new scope.
- Preserve the Docker/Prisma runtime behavior that regenerates the Prisma client before API container startup.
- Preserve the direct `api:dev:development` compose startup path that keeps the API container healthy under Docker.
