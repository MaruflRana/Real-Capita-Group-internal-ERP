# Prompt 9 Scope

## Prompt 9 May Build

- The next explicitly requested backend or platform capability on top of the Prompt 8 CRM & Property Desk Core.
- New Prisma schema changes, raw SQL migration steps, NestJS modules, services, DTOs, controllers, tests, and docs only when required by the next prompt.
- Reuse of the established auth, bootstrap, Org & Security, accounting, voucher engine, project/property master, and CRM/property desk foundations without unnecessary rework.

## Prompt 9 Must Preserve

- `apps/web` remains frontend-only.
- `apps/api` remains the only backend entry point.
- REST-only boundary between web and API.
- Prompt 4 auth endpoints and bootstrap flow remain intact unless Prompt 9 explicitly expands them.
- Prompt 5 Org & Security Core admin APIs remain intact unless Prompt 9 explicitly expands them.
- Prompt 6 chart-of-accounts and voucher APIs remain intact unless Prompt 9 explicitly expands them.
- Prompt 7 project/property master APIs remain intact unless Prompt 9 explicitly expands them.
- Prompt 8 CRM/property desk APIs remain intact unless Prompt 9 explicitly extends them.
- Company-scoped role assignments remain the access baseline.
- User identities remain global records, while company access remains controlled through `user_roles`.
- Prisma remains the default database access layer.
- PostgreSQL-backed accounting invariants remain the baseline.
- Prompt 7 project/property hierarchy enforcement remains intact.
- Prompt 7 fixed unit-status catalog remains controlled unless a later prompt explicitly changes that model.
- Prompt 8 booking insert rules (`AVAILABLE` -> `BOOKED`) remain intact.
- Prompt 8 sale contract insert rules (`BOOKED` -> `SOLD`, booking `ACTIVE` -> `CONTRACTED`) remain intact.
- Prompt 8 collection-to-posted-voucher explicit linkage remains intact unless a later prompt explicitly expands it.
- Docker Compose remains the single-VM baseline.

## Prompt 9 Must Not Assume

- No unrelated ERP domains beyond the next explicit prompt.
- No fake/demo data or tutorial CRUD.
- No Next.js backend routes or server-action business operations.
- No auth rewrite, org-core rewrite, accounting rewrite, project/property master rewrite, or CRM/property desk rewrite unless explicitly requested.
- No refund, reversal, transfer, reporting, payroll, or document-management behavior unless Prompt 9 explicitly asks for it.
- No cross-company data model shortcuts that bypass the established company-scoped access rules.
- No automatic financial recognition logic unless Prompt 9 explicitly asks for it.

## Prompt 9 Starting Checklist

- Read `AGENTS.md`.
- Read `docs/handoffs/foundation-status.md`.
- Read `docs/handoffs/prompt-7-status.md`.
- Read `docs/handoffs/prompt-8-status.md`.
- Confirm the root `.env` still contains JWT secrets that are at least 32 characters long.
- Confirm migrations are applied.
- Confirm bootstrap admin creation has been run at least once in the local database.
- Confirm health, auth, Swagger, Prompt 5 Org & Security, Prompt 6 accounting, Prompt 7 project/property, and Prompt 8 CRM/property desk endpoints still respond before adding new scope.
- Preserve the Docker/Prisma runtime behavior that regenerates the Prisma client before API container startup.
- Preserve the direct `api:dev:development` compose startup path, including the Nx-state reset required to keep the API container healthy under Docker.
