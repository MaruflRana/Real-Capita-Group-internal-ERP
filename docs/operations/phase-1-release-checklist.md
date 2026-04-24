# Phase 1 Release Checklist

This checklist is for the approved single-VM Docker Compose release path. It assumes no Kubernetes, no external workflow engine, and no new business scope.

## Pre-Release Audit

- Confirm the release branch contains no unintended generated artifacts such as `*.tsbuildinfo`, `.next`, `dist`, `playwright-report`, `test-results`, or `backups`.
- Confirm `apps/web` has no API routes or server actions for ERP business operations.
- Confirm `apps/api` remains the only backend entry point.
- Review `docs/operations/phase-1-route-inventory.md` for expected routes and access.
- Review `docs/operations/phase-1-uat-checklist.md` for human UAT coverage.

## Environment Setup

- Copy `.env.example` to `.env` on the target VM if `.env` does not already exist.
- Replace every placeholder secret and password.
- Set `NODE_ENV=production` for a real release.
- Set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL`, `WEB_APP_URL`, and `API_BASE_URL` to the final HTTPS origins.
- Keep `CORS_ORIGIN` aligned with the same scheme and hostname as `WEB_APP_URL`.
- Set `S3_PUBLIC_ENDPOINT` to a browser-resolvable storage origin.
- Consider `ENABLE_SWAGGER=false` unless Swagger is intentionally exposed.
- Run:

```powershell
corepack pnpm ops:env-check -- --strict
```

Do not proceed to production use until strict env warnings are resolved.

## Validation Before Deployment

Run from the repository root:

```powershell
corepack pnpm verify
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

`corepack pnpm verify` already runs lint, typecheck, build, and test; the repeated commands are listed because the release-candidate audit records each one explicitly.

## Backup Before Release

Start only persistence services if needed:

```powershell
docker compose up -d postgres minio
```

Create and verify a PostgreSQL backup:

```powershell
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump
```

Back up object storage for the configured `S3_BUCKET` from the same maintenance window. For local MinIO, back up the `minio-data` volume or mirror the bucket with MinIO Client. For external S3-compatible storage, use provider-native backup, versioning, or replication.

## Deploy

Build and start the release-minded runner services:

```powershell
docker compose up -d --build
```

Apply migrations:

```powershell
corepack pnpm docker:migrate
```

Bootstrap the first company admin only when needed:

```powershell
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "<replace-with-strong-password>"
```

Run runtime smoke:

```powershell
corepack pnpm docker:smoke
docker compose ps
```

## Post-Deploy Smoke

- Open `http://localhost:3333/api/v1/health`.
- Open `http://localhost:3333/api/v1/health/ready`.
- Open `http://localhost:3333/api/docs` if Swagger is enabled.
- Open `http://localhost:3000`.
- Sign in as a company admin and confirm `/dashboard` loads.
- Confirm one representative route each for Accounting, Financial Reports, Project & Property, CRM, HR, Payroll, Audit & Documents, and Org & Security.
- Confirm a financial report CSV export and browser print action where practical.
- Create and verify a fresh PostgreSQL backup after deployment if release policy requires it.
- Run restore dry-run against the latest backup:

```powershell
corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run
```

## Rollback Notes

- Keep the previous known-good source revision available until smoke and UAT pass.
- If app smoke fails after deploy, inspect logs first:

```powershell
docker compose logs --no-color api web
```

- Redeploy the previous revision and run `corepack pnpm docker:smoke`.
- Do not run `docker compose down -v` during rollback unless the operator intentionally wants to destroy named volumes.
- If a migration or restore attempt leaves the database unsafe, keep app traffic stopped and restore from a known-good PostgreSQL backup plus the matching object-storage backup.

## Known Caveats Register

| Caveat | Release Impact | Operator Action |
| --- | --- | --- |
| Production browser auth requires HTTPS outside localhost because cookies become `Secure`. | Non-HTTPS production logins fail. | Use real HTTPS origins before production handoff. |
| `S3_PUBLIC_ENDPOINT` must be browser-resolvable. | Attachment upload/download links fail if it points at `minio` or an unreachable host. | Set it to the VM-visible or DNS-visible storage URL. |
| PostgreSQL restore is destructive and manual. | Accidental restore would replace the active schema. | Use `--dry-run` first; actual restore requires `--confirm-destroy-data`. |
| MinIO/S3 object backup is not automated by the app. | Database-only restore can leave attachment metadata pointing at missing objects. | Back up object storage on the same cadence as database dumps. |
| No `.xlsx` generation or server-side PDF rendering exists in Phase 1. | Users must use CSV and browser print. | Do not promise Excel/PDF server output for Phase 1. |
| No automated scheduled backup infrastructure or point-in-time recovery exists in this repo. | Recovery depends on operator-run backups. | Define VM-level backup schedule, retention, off-VM copy, and restore drills. |
| Empty reports/lists are valid in a freshly bootstrapped company. | UAT may see empty operational pages before business data entry. | Treat clear empty states as pass; create only minimal UAT records when needed. |
| `pnpm lint` currently passes with pre-existing warnings in Org/Security, API, and e2e files. | The lint gate is green, but warning cleanup remains technical debt. | Do not treat warnings as release blockers unless they become errors or mask a defect. |
| The live company-selection login branch only appears for users with multiple active company assignments. | A single-company admin will sign in directly without the selector. | Verify the selector with a controlled multi-company test user when that data exists. |
| Local Docker and Windows file locks can leave stale `.next` or build artifacts. | Builds/tests can be noisy after interrupted runs. | Stop app processes and rerun canonical commands; generated artifacts remain ignored. |

## Release Sign-Off

Record:

- Git revision
- Date and time
- Operator
- Environment URL
- Backup file path and verification result
- Migration result
- Smoke result
- UAT checklist result
- Known unresolved caveats
