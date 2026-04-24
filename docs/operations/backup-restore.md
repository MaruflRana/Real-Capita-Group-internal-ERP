# Phase 1 Backup And Restore Runbook

## Scope

This runbook covers the approved Phase 1 target:

- single VM
- Docker Compose
- PostgreSQL 15 in the `postgres` service
- MinIO or S3-compatible object storage for attachments and document bytes

The backup/restore helpers are operational wrappers only. They do not add ERP business features, change schemas, or proxy data through the web app.

For release sequencing, use this runbook together with [phase-1-release-checklist.md](phase-1-release-checklist.md).

## PostgreSQL Backups

Create a PostgreSQL backup from the repo root:

```powershell
corepack pnpm backup:db
```

Behavior:

- requires the Docker Compose `postgres` service to be running
- validates required PostgreSQL values from `.env`
- runs `pg_dump` inside the Compose `postgres` service
- writes PostgreSQL custom-format dumps under `backups/postgres/`
- names files as `<database>-YYYYMMDDTHHMMSSZ.dump`
- does not mutate the database
- deletes a partial output file if `pg_dump` fails

The default local backup directory is intentionally ignored by git. Keep production backups outside the repository working tree or copy them to durable VM storage after creation.

Optional output directory:

```powershell
corepack pnpm backup:db -- --output-dir D:\real-capita-backups\postgres
```

## Backup Verification

Verify that a backup exists, is non-empty, and is readable by `pg_restore`:

```powershell
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump
```

What this verifies:

- the file path exists
- the file is a regular non-empty file
- `pg_restore --list` can read the dump metadata through the Compose PostgreSQL tooling

What this does not verify:

- it does not restore into a temporary database
- it does not prove application-level business flows after restore
- it does not verify MinIO/S3 object bytes

For a file-only check without Docker metadata inspection:

```powershell
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --skip-metadata
```

## PostgreSQL Restore

Restore is destructive. It drops and recreates the `public` schema in the Compose database before replaying the backup.

Run a non-mutating restore check first:

```powershell
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --dry-run
```

Recommended restore sequence:

```powershell
corepack pnpm backup:db
docker compose stop web api
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --dry-run
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --confirm-destroy-data
corepack pnpm docker:migrate
docker compose up -d api web
corepack pnpm ops:smoke
```

Safety behavior:

- the restore command refuses to run without `--confirm-destroy-data` or `--force`
- `--dry-run` checks the backup file, PostgreSQL readiness, and dump metadata without changing data
- invalid files, missing Compose services, and PostgreSQL restore failures exit non-zero
- restore does not silently overwrite data

If the restore fails after the schema cleanup step, treat the database as unsafe for live traffic. Restore again from a known-good backup before restarting the app services.

## MinIO And S3 Object Backups

PostgreSQL stores attachment metadata and links. MinIO or external S3-compatible storage stores the uploaded document bytes, including attachment files such as contracts, NID scans, and supporting documents. A useful disaster-recovery backup must include both:

- PostgreSQL dump for ERP records and attachment metadata
- object-storage backup for every object in `S3_BUCKET`

In local Docker Compose, MinIO persists data in the named Docker volume:

```text
minio-data:/data
```

Practical Phase 1 approaches:

- For local/single-VM MinIO, stop application traffic and back up the `minio-data` volume with VM-level volume backup tooling, or use the MinIO Client `mc mirror` command to mirror the configured bucket to durable storage.
- For production S3-compatible storage outside the VM, use provider-native bucket versioning, lifecycle retention, replication, or backup features where available.
- Keep PostgreSQL and object backups from the same maintenance window when attachments matter. Restoring only the database can leave metadata pointing at missing objects; restoring only objects can leave orphaned bytes.

Example MinIO Client mirror shape:

```powershell
mc alias set real-capita http://localhost:9000 <access-key> <secret-key>
mc mirror --overwrite real-capita/real-capita-erp-dev D:\real-capita-backups\minio\real-capita-erp-dev
```

Do not commit object backups or access keys to the repository.

## Environment And Secret Safety

Run the env safety check before release work:

```powershell
corepack pnpm ops:env-check -- --strict
```

Expectations:

- `.env` and every `.env.*.local` file must stay untracked
- replace all `change-me` placeholders before production
- keep `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `S3_SECRET_KEY`, `JWT_ACCESS_TOKEN_SECRET`, and `JWT_REFRESH_TOKEN_SECRET` out of git, tickets, screenshots, and chat logs
- use unique JWT access and refresh secrets with at least 32 characters
- rotating JWT secrets invalidates active browser sessions and should be planned as maintenance
- rotating database or S3 credentials requires updating `.env` and restarting affected Compose services
- keep `S3_PUBLIC_ENDPOINT` browser-resolvable so attachment upload/download flows continue to work

## Disaster-Recovery Expectations

Phase 1 disaster recovery is manual and operator-run:

- no automated scheduled backup service is included
- no point-in-time recovery is configured by this repo
- no server-side PDF, export archive, or object-storage backup engine is added
- recovery depends on the latest valid PostgreSQL dump plus a matching object-storage backup
- operators should define their own backup frequency, retention, off-VM copy policy, and restore drill cadence

Minimum recommended habit for a single VM:

- take a PostgreSQL backup before every release
- copy backups off the VM or to separately managed storage
- back up MinIO/S3 objects on the same operational cadence as PostgreSQL
- run `verify:backup` after backup creation
- periodically rehearse restore on a non-production VM

## Post-Restore Smoke Verification

After restore and migrations:

```powershell
corepack pnpm docker:migrate
docker compose up -d api web
corepack pnpm ops:smoke
```

Manual checks:

- open `http://localhost:3333/api/v1/health`
- open `http://localhost:3333/api/v1/health/ready`
- open `http://localhost:3333/api/docs` when Swagger is enabled
- open `http://localhost:3000`
- sign in with a known admin account
- verify a recent attachment can still generate a download URL if object storage was restored
