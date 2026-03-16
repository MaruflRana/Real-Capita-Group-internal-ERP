# Prompt 5 Scope

## Prompt 5 May Build

- The next explicitly requested backend or platform capability on top of the Prompt 4 auth core.
- New API modules, Prisma schema changes, services, DTOs, and persistence wiring only when they are required by the next prompt.
- Reuse of the established auth, RBAC, config, database, storage, and health foundations without reworking them unnecessarily.

## Prompt 5 Must Preserve

- `apps/web` remains frontend-only.
- `apps/api` remains the only backend entry point.
- REST-only boundary between web and API.
- Prompt 4 auth endpoints and bootstrap flow remain intact unless the next prompt explicitly expands them.
- Company-scoped RBAC remains the authorization baseline for future modules.
- Prisma remains the default database access layer.
- Docker Compose remains the single-VM baseline.

## Prompt 5 Must Not Assume

- No unrelated ERP domains beyond the next explicit prompt.
- No fake/demo data or tutorial CRUD.
- No Next.js backend routes or server-action business operations.
- No duplicate org-management or auth rewrites outside the scoped next prompt.

## Prompt 5 Starting Checklist

- Read `AGENTS.md`.
- Read `docs/handoffs/foundation-status.md`.
- Read `docs/handoffs/prompt-4-status.md`.
- Confirm the root `.env` still contains JWT secrets that are at least 32 characters long.
- Confirm migrations are applied.
- Confirm bootstrap admin creation has been run at least once in the local database.
- Confirm health, auth, and Swagger endpoints still respond before adding new scope.
