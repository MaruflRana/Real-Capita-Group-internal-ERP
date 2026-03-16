# Prompt 4 Scope

## Prompt 4 May Build

- The first explicitly requested backend or platform capability on top of the Prompt 3 foundation.
- DTOs, controllers, services, Prisma schema changes, and persistence wiring only when they are required by the next prompt.
- Reuse of the Prompt 3 config, database, storage, health, and common API infrastructure without reworking the foundation unnecessarily.

## Prompt 4 Must Preserve

- `apps/web` remains frontend-only.
- `apps/api` remains the only backend entry point.
- REST-only boundary between web and API.
- Prisma remains the default database access layer.
- MinIO remains the S3-compatible storage target.
- Docker Compose remains the single-VM baseline.

## Prompt 4 Must Not Assume

- No unrelated ERP domains beyond the next explicit prompt.
- No fake/demo data or tutorial CRUD.
- No Next.js backend routes or server-action business operations.
- No broad infrastructure expansion that bypasses the locked stack.

## Prompt 4 Starting Checklist

- Read `AGENTS.md`.
- Read `docs/handoffs/foundation-status.md`.
- Read `docs/handoffs/prompt-3-status.md`.
- Confirm the root `.env` includes `NODE_ENV`, `WEB_APP_URL`, and `API_BASE_URL`.
- Confirm health, readiness, dependency, and Swagger endpoints still return `200` before adding new module work.
