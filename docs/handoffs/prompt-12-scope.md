# Prompt 12 Scope

## Prompt 12 May Build

- The next explicitly requested backend or platform capability on top of the Prompt 11 Audit Trail + Attachments / Document Infrastructure API.
- New Prisma schema changes, raw SQL migration steps, NestJS modules, services, DTOs, controllers, tests, and docs only when required by the next prompt.
- Reuse of the established auth, bootstrap, Org & Security, accounting, voucher engine, project/property master, CRM/property desk, HR, payroll, attachments, and audit foundations without unnecessary rework.

## Prompt 12 Must Preserve

- `apps/web` remains frontend-only.
- `apps/api` remains the only backend entry point.
- REST-only boundary between web and API.
- Prompt 4 auth endpoints and bootstrap flow remain intact unless Prompt 12 explicitly expands them.
- Prompt 5 Org & Security Core admin APIs remain intact unless Prompt 12 explicitly expands them.
- Prompt 6 chart-of-accounts and voucher APIs remain intact unless Prompt 12 explicitly expands them.
- Prompt 7 project/property master APIs remain intact unless Prompt 12 explicitly expands them.
- Prompt 8 CRM/property desk APIs remain intact unless Prompt 12 explicitly expands them.
- Prompt 9 HR APIs remain intact unless Prompt 12 explicitly expands them.
- Prompt 10 payroll APIs remain intact unless Prompt 12 explicitly expands them.
- Prompt 11 attachment and audit APIs remain intact unless Prompt 12 explicitly expands them.
- Company-scoped role assignments remain the access baseline.
- User identities remain global records, while company access remains controlled through `user_roles`.
- Prisma remains the default database access layer.
- Attachments remain metadata-only in PostgreSQL. File bytes stay in object storage.
- Audit events remain append-oriented through normal application use.
- Docker Compose remains the single-VM baseline.
- The Docker dev startup path that syncs dependencies into the named `node_modules` volume before API/web startup remains preserved.
- Presigned attachment URLs must continue to use `S3_PUBLIC_ENDPOINT` when a public endpoint differs from the server-side `S3_ENDPOINT`.

## Prompt 12 Must Not Assume

- No unrelated ERP domains beyond the next explicit prompt.
- No fake/demo data or tutorial CRUD.
- No Next.js backend routes or server-action business operations.
- No auth rewrite, org-core rewrite, accounting rewrite, project/property master rewrite, CRM/property desk rewrite, HR rewrite, payroll rewrite, attachment rewrite, or audit rewrite unless explicitly requested.
- No OCR, approval workflow, e-signature, public sharing, report generation, or full DMS workflow unless Prompt 12 explicitly asks for them.
- No cross-company data model shortcuts that bypass the established company-scoped access rules.

## Prompt 12 Starting Checklist

- Read `AGENTS.md`.
- Read `docs/handoffs/foundation-status.md`.
- Read `docs/handoffs/prompt-10-status.md`.
- Read `docs/handoffs/prompt-11-status.md`.
- Confirm the root `.env` still contains JWT secrets that are at least 32 characters long.
- Confirm `.env` still defines `S3_PUBLIC_ENDPOINT` for Dockerized local attachment verification.
- Confirm migrations are applied.
- Confirm bootstrap admin creation has been run at least once in the local database.
- Confirm health, auth, Swagger, Prompt 5 Org & Security, Prompt 6 accounting, Prompt 7 project/property, Prompt 8 CRM/property desk, Prompt 9 HR, Prompt 10 payroll, and Prompt 11 attachment/audit endpoints still respond before adding new scope.
- Preserve the Docker/Prisma runtime behavior that regenerates the Prisma client before API container startup.
- Preserve the direct `api:dev:development` compose startup path, including the Nx-state reset required to keep the API container healthy under Docker.
