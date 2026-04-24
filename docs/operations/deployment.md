# Phase 1 Deployment And Operations

## Target

- Deployment target: single VM + Docker Compose
- Runtime services: `web`, `api`, `postgres`, `minio`
- Canonical local browser origin: `http://localhost:3000`
- Canonical local API origin: `http://localhost:3333`
- Canonical local object-storage origin for browser-facing presigned URLs: `http://localhost:9000`

Related release-candidate references:

- Route and module inventory: [phase-1-route-inventory.md](phase-1-route-inventory.md)
- Human UAT checklist: [phase-1-uat-checklist.md](phase-1-uat-checklist.md)
- Release checklist and caveats register: [phase-1-release-checklist.md](phase-1-release-checklist.md)

## Origin And Cookie Rules

- Use `http://localhost:3000` as the canonical local browser origin.
- `http://127.0.0.1:3000` is redirected to `http://localhost:3000` and is not the documented origin for this repo.
- `WEB_APP_URL`, `API_BASE_URL`, and every `CORS_ORIGIN` entry must share the same scheme and hostname while browser auth stays cookie-backed.
- The current browser auth cookies are host-only and do not set a cookie domain.
- In `NODE_ENV=production`, auth cookies are `Secure`, so non-localhost browser sessions must use HTTPS.

## Runtime Access Expectations

- Protected app routes redirect unauthenticated browser sessions to `/login`.
- Authenticated sessions that lack company-scoped access receive explicit `403` responses from the API and a clear forbidden state in the web shell.
- Shell navigation, dashboard quick actions, and dashboard panels only surface modules that the current company role set can access.
- Phase 1 company-scoped roles currently used by access hardening are:
  - `company_admin`
  - `company_accountant`
  - `company_hr`
  - `company_payroll`
  - `company_sales`
  - `company_member`

## Required Runtime Environment

These variables must be set correctly before a real release run:

- App metadata and routing:
  - `APP_NAME`
  - `NODE_ENV`
  - `API_GLOBAL_PREFIX`
  - `API_VERSION`
  - `ENABLE_SWAGGER`
  - `SWAGGER_PATH`
- Public/browser origins:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
  - `WEB_APP_URL`
  - `API_BASE_URL`
  - `CORS_ORIGIN`
- Database:
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- Auth:
  - `JWT_ACCESS_TOKEN_SECRET`
  - `JWT_ACCESS_TOKEN_TTL`
  - `JWT_REFRESH_TOKEN_SECRET`
  - `JWT_REFRESH_TOKEN_TTL`
- Object storage:
  - `MINIO_ROOT_USER`
  - `MINIO_ROOT_PASSWORD`
  - `S3_BUCKET`
  - `S3_REGION`
  - `S3_FORCE_PATH_STYLE`
  - `S3_PUBLIC_ENDPOINT`
- Host port mapping:
  - `WEB_PORT`
  - `API_PORT`
  - `POSTGRES_PORT`
  - `MINIO_API_PORT`
  - `MINIO_CONSOLE_PORT`

Notes:

- `DATABASE_URL` in `.env` is used for direct host-side Prisma or bootstrap commands.
- The Compose `api` and `ops` services replace the database hostname internally with `postgres`.
- `S3_PUBLIC_ENDPOINT` must stay browser-resolvable. Local Compose defaults to `http://localhost:9000`, but a real VM must use a VM-visible host or DNS name instead.
- `ENABLE_SWAGGER=true` is acceptable for local verification, but production should disable Swagger unless it is intentionally exposed.

## Local Direct-Run Flow

Use this when you want to run `web` and `api` directly on the host:

```powershell
Copy-Item .env.example .env
corepack pnpm install
corepack pnpm docker:infra
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm dev
```

## Canonical Docker Compose Flow

Use this for release-like local verification and for the approved single-VM baseline:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
docker compose ps
```

Useful follow-up commands:

```powershell
docker compose logs -f
docker compose down
```

## Backup Before Maintenance

Before every release, migration, restore rehearsal, or VM maintenance window, create and verify a PostgreSQL backup:

```powershell
docker compose up -d postgres
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump
```

Back up object storage on the same operational cadence. For local MinIO this means the `minio-data` Docker volume or an `mc mirror` copy of the configured `S3_BUCKET`. For external S3-compatible storage, use the provider's bucket backup, versioning, replication, or lifecycle tooling.

The detailed backup, restore, MinIO/S3, and disaster-recovery runbook is [backup-restore.md](backup-restore.md).

## Bootstrap Admin Flow

Preferred repo-root command:

```powershell
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

Raw Compose equivalent:

```powershell
docker compose --profile ops run --rm -e BOOTSTRAP_COMPANY_NAME="Real Capita" -e BOOTSTRAP_COMPANY_SLUG="real-capita" -e BOOTSTRAP_ADMIN_EMAIL="admin@example.com" -e BOOTSTRAP_ADMIN_PASSWORD="change-me-secure-admin-password" api-bootstrap
```

Notes:

- The bootstrap flow is explicit and never runs automatically during `docker compose up`.
- The helper is idempotent for an existing active admin and company pairing.
- If the same identity belongs to multiple companies, the browser login flow will require an explicit company selection after the first sign-in attempt.

## Single-VM Production Flow

1. Copy `.env.example` to `.env` and replace every placeholder secret before the first deployment.
2. Run `corepack pnpm ops:env-check -- --strict` and fix every warning before real production use.
3. Set `NODE_ENV=production`.
4. Set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL`, `WEB_APP_URL`, and `API_BASE_URL` to the real HTTPS origins you intend users to open.
5. Keep `CORS_ORIGIN` aligned with the same browser hostname as `WEB_APP_URL`.
6. Set `S3_PUBLIC_ENDPOINT` to the VM-visible or DNS-visible object-storage origin that browser uploads and downloads can reach.
7. Consider setting `ENABLE_SWAGGER=false` unless Swagger must remain exposed on the VM.
8. Bring the stack up with `docker compose up -d --build`.
9. Run `corepack pnpm docker:migrate`.
10. Run the explicit bootstrap helper once.
11. Verify the runtime on the final public origin before handing the VM over for real use.

## Update And Release Procedure

Use this sequence for a normal Phase 1 release on the single VM:

```powershell
git pull
corepack pnpm ops:env-check -- --strict
docker compose up -d postgres minio
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm ops:smoke
docker compose ps
```

Notes:

- Run the backup before applying migrations.
- Keep the previous image source revision available until smoke checks pass.
- If smoke checks fail after release, inspect logs first, then redeploy the previous known-good revision and run smoke again.
- Do not run `docker compose down -v` during normal maintenance; `-v` removes named volumes including database and MinIO data.

## Restore Procedure

Use the restore runbook when a PostgreSQL restore is required:

```powershell
docker compose stop web api
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --dry-run
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --confirm-destroy-data
corepack pnpm docker:migrate
docker compose up -d api web
corepack pnpm ops:smoke
```

Restore is destructive and will not run without explicit confirmation. Restore MinIO/S3 object bytes from the matching object backup before reopening workflows that depend on attachments.

## MinIO / S3 Public Endpoint Notes

- The API container always uses the internal MinIO service URL `http://minio:9000` for service-to-service object access inside Compose.
- Browser-facing upload and download links always rely on `S3_PUBLIC_ENDPOINT`.
- For local Compose, `S3_PUBLIC_ENDPOINT=http://localhost:9000` is correct.
- For a real VM, do not leave `S3_PUBLIC_ENDPOINT` on `localhost` or set it to the internal `minio` hostname.
- If the storage endpoint is not browser-resolvable, attachment upload and secure download flows will fail even if the API stays healthy.

## Validation Sequence

Repo validation:

```powershell
corepack pnpm verify
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

Runtime validation:

```powershell
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --dry-run
```

Expected local URLs:

- `http://localhost:3000`
- `http://localhost:3333/api/v1/health`
- `http://localhost:3333/api/v1/health/ready`
- `http://localhost:3333/api/docs`
- `http://localhost:9000`
- `http://localhost:9001`

## Known Operational Caveats

- `localhost` is the only canonical local browser origin. Do not document `127.0.0.1` as equivalent.
- Production browser sessions require HTTPS because the auth cookies become `Secure` outside localhost development.
- The API emits production warnings if Swagger is still enabled, if browser-facing app URLs still point at loopback hosts, or if `S3_PUBLIC_ENDPOINT` is not browser-resolvable.
- `pnpm lint` currently passes with warnings that pre-date Prompt 22; Prompt 22 did not widen those warnings into errors.
- PostgreSQL backups under `backups/postgres/` are local files only; copy production backups off the VM or to separately managed durable storage.
- Restore only covers PostgreSQL. Attachment bytes also require MinIO/S3 object backup and restore.
