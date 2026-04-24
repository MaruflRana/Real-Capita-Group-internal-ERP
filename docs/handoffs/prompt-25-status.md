# Prompt 25 Status

## Scope Delivered

Prompt 25 delivered Phase 1 backup, restore, and operations-readiness support only:

- PostgreSQL backup helper for the Docker Compose `postgres` service
- PostgreSQL restore helper with explicit destructive confirmation
- backup verification helper
- environment safety warning helper
- MinIO/S3 object-backup guidance
- release, maintenance, restore, and disaster-recovery runbook updates
- lightweight CI validation for ops helper help output and env-template checking

No ERP business modules, CRUD screens, reports, dashboards, approval workflows, notifications, imports, public features, fake data, Next.js backend routes, or server actions were added.

## Commands Added

- `corepack pnpm backup:db`
- `corepack pnpm restore:db -- --file <backup-file> --dry-run`
- `corepack pnpm restore:db -- --file <backup-file> --confirm-destroy-data`
- `corepack pnpm verify:backup -- --file <backup-file>`
- `corepack pnpm ops:env-check -- --strict`
- `corepack pnpm ops:smoke`

## Backup Behavior

- Backup runs from the repo root.
- Backup requires the running Compose `postgres` service.
- Backup validates required PostgreSQL env values from `.env`.
- Backup uses PostgreSQL-native `pg_dump` inside the `postgres` container.
- Backup writes custom-format dump files under `backups/postgres/`.
- Backup naming convention is `<database>-YYYYMMDDTHHMMSSZ.dump`.
- Backup does not mutate the database.
- Partial backup files are removed if `pg_dump` fails.
- `backups/` is ignored by git.

Validated backup file:

```text
backups/postgres/real_capita_erp-20260424T083915Z.dump
```

## Restore Behavior

- Restore runs from the repo root.
- Restore takes an explicit backup file path through `--file`.
- Restore refuses to run without `--confirm-destroy-data` or `--force`.
- Restore dry-run checks file readability, PostgreSQL readiness, and `pg_restore --list` metadata without changing data.
- Actual restore is destructive: it drops and recreates the `public` schema before `pg_restore`.
- Restore uses PostgreSQL-native `psql` and `pg_restore` inside the Compose `postgres` service.
- Post-restore instructions are documented: run migrations, restart app services if stopped, then run smoke checks.

## MinIO / S3 Guidance

`docs/operations/backup-restore.md` now documents that useful disaster recovery requires both:

- PostgreSQL dumps for ERP records and attachment metadata
- object-storage backups for all objects in `S3_BUCKET`

The documented Phase 1 approaches are:

- back up the Compose `minio-data` volume for local/single-VM MinIO, or mirror the bucket with MinIO Client
- use provider-native versioning, lifecycle, replication, or backup features for external S3-compatible storage
- keep database and object backups from the same maintenance window when attachments matter

## Environment And Secret Safety

Prompt 25 added `corepack pnpm ops:env-check -- --strict` for release-time warnings/failures around missing or placeholder env values.

Docs now call out:

- `.env` and local env overrides must not be committed
- database dumps and object backups must not be committed
- PostgreSQL passwords, JWT secrets, MinIO root credentials, and S3 access keys must be kept out of git
- JWT secret rotation invalidates active sessions and should be planned as maintenance
- database/S3 credential rotation requires env updates and service restarts

## Files Added

- `scripts/lib/ops.mjs`
- `scripts/backup-postgres.mjs`
- `scripts/restore-postgres.mjs`
- `scripts/verify-postgres-backup.mjs`
- `scripts/check-env-safety.mjs`
- `docs/operations/backup-restore.md`
- `docs/handoffs/prompt-25-status.md`
- `docs/handoffs/prompt-26-scope.md`

## Files Updated

- `.gitignore`
- `.github/workflows/ci.yml`
- `package.json`
- `README.md`
- `docs/operations/deployment.md`
- `docs/handoffs/foundation-status.md`

`AGENTS.md` was not changed because no durable architecture rule changed.

## Verification Completed

Repo validation:

```powershell
node --check scripts/lib/ops.mjs
node --check scripts/backup-postgres.mjs
node --check scripts/restore-postgres.mjs
node --check scripts/verify-postgres-backup.mjs
node --check scripts/check-env-safety.mjs
corepack pnpm backup:db -- --help
corepack pnpm restore:db -- --help
corepack pnpm verify:backup -- --help
corepack pnpm ops:env-check -- --env-file .env.example --allow-placeholders
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
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-20260424T083915Z.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260424T083915Z.dump --dry-run
# Expected non-zero refusal without --confirm-destroy-data:
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260424T083915Z.dump
corepack pnpm ops:smoke
docker compose ps
```

Observed results:

- `corepack pnpm backup:db` created `backups/postgres/real_capita_erp-20260424T083915Z.dump`
- backup size was `203.8 KiB`
- `corepack pnpm verify:backup` confirmed the file and `428` restore metadata entries
- restore dry-run completed without database mutation
- restore without `--confirm-destroy-data` exited non-zero and refused to run
- API health returned HTTP `200`
- Swagger returned HTTP `200`
- web root returned HTTP `200`
- Compose services `postgres`, `minio`, `api`, and `web` were healthy

## Out Of Scope And Still Not Built

- automated scheduled backups
- point-in-time recovery
- temporary-database restore rehearsal automation
- server-side PDF or export archive systems
- object-storage backup engine inside the app
- Kubernetes or external paid-service deployment requirements
- new ERP business behavior

## Prompt 26 Readiness

Prompt 25 is complete. The repo is ready for Prompt 26 as long as Prompt 26 preserves the locked stack, REST-only boundary, Prompt 22 runtime rules, Prompt 23 authorization rules, Prompt 24 output rules, and Prompt 25 backup/restore safety behavior.
