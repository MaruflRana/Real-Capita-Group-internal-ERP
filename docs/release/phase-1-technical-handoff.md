# Phase 1 Technical Handoff

## Purpose

This guide helps a technical owner receive, run, verify, deploy, and continue the Real Capita ERP Phase 1 release candidate without expanding scope.

## Repository Structure

```text
apps/
  api/              NestJS REST API and Dockerfile
  web/              Next.js App Router frontend and Dockerfile
packages/
  config/           Shared access matrix, runtime constants, and env helpers
  eslint-config/    Shared ESLint config
  tsconfig/         Shared TypeScript configs
  types/            Shared TypeScript contracts
  ui/               Shared non-business UI primitives
prisma/
  schema.prisma     Prisma schema and migrations
scripts/
  *.mjs             Docker, smoke, backup, restore, and env helper scripts
tests/e2e/
  *.spec.ts         Playwright smoke and module coverage
docs/
  architecture/     Phase 1 architecture baseline
  operations/       Deployment, release, route, UAT, and backup runbooks
  uat/              UAT, demo, limitation, issue-log, and sign-off package
  release/          Final Phase 1 release packaging and handoff bundle
```

## Stack Summary

- Monorepo: Nx + pnpm
- Frontend: Next.js App Router in `apps/web`, frontend-only API consumer
- Backend: NestJS REST API in `apps/api`, only backend entry point
- Database: Prisma + PostgreSQL 15
- Object storage: MinIO / S3-compatible storage
- Testing: Playwright plus backend tests
- CI: GitHub Actions
- Deployment baseline: Docker Compose for a single VM

## Architecture Rules To Preserve

- Keep the strict REST-only boundary between `apps/web` and `apps/api`.
- Do not add Next.js server actions or API routes for ERP business operations.
- Keep Prisma as the default CRUD, migration, and generated-type tool.
- Use raw SQL only where justified by complex transactions, reporting, or PL/pgSQL-triggered database flows.
- Do not add fake ERP data, tutorial placeholders, or unassigned business modules.

## Local Direct-Run Commands

Use this when running app processes on the host and using Docker only for PostgreSQL and MinIO:

```powershell
Copy-Item .env.example .env
corepack pnpm install
corepack pnpm docker:infra
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm dev
```

## Docker Compose Commands

Use this for release-like verification and the approved single-VM baseline:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
docker compose ps
```

Useful runtime commands:

```powershell
docker compose logs -f
docker compose down
```

Do not run `docker compose down -v` during normal maintenance unless the operator intentionally wants to destroy named volumes.

## Migration And Bootstrap

Migration:

```powershell
corepack pnpm docker:migrate
```

Bootstrap the first company admin only when needed:

```powershell
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "<replace-with-strong-password>"
```

Bootstrap is explicit and does not run automatically on app startup. It is idempotent for an existing active admin and company pairing.

## Smoke And Verification Commands

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
corepack pnpm docker:smoke
corepack pnpm ops:smoke
docker compose ps
```

Manual URLs:

- Web: `http://localhost:3000`
- API health: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- Swagger: `http://localhost:3333/api/docs`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Use `http://localhost:3000` as the canonical local browser origin. `http://127.0.0.1:3000` redirects to the canonical localhost origin and should not be the documented verification URL.

## Backup And Restore Commands

Create a PostgreSQL backup:

```powershell
corepack pnpm backup:db
```

Verify a backup:

```powershell
corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump
```

Run a non-mutating restore dry-run:

```powershell
corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run
```

Actual restore is destructive and requires explicit confirmation:

```powershell
corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --confirm-destroy-data
```

PostgreSQL backup helpers do not back up MinIO/S3 object bytes. Pair database backups with object-storage backups when attachments matter.

## Key Docs Map

- [Release notes](phase-1-release-notes.md)
- [Operator quick start](operator-quick-start.md)
- [Demo readiness guide](demo-readiness-guide.md)
- [Artifact inventory](phase-1-artifact-inventory.md)
- [Verification summary](phase-1-verification-summary.md)
- [Tagging and release guidance](tagging-and-release.md)
- [Architecture baseline](../architecture/phase-1-architecture-baseline.md)
- [Deployment guide](../operations/deployment.md)
- [Release checklist](../operations/phase-1-release-checklist.md)
- [Route inventory](../operations/phase-1-route-inventory.md)
- [Backup/restore runbook](../operations/backup-restore.md)
- [UAT package](../uat/README.md)
- [Known limitations](../uat/phase-1-known-limitations.md)

## Where To Continue Phase 2

Phase 2 should start only after Phase 1 UAT results are reviewed. Use [prompt-30-scope.md](../handoffs/prompt-30-scope.md) to decide whether the next step is:

- UAT issue-fix sprint, if stakeholder UAT produces defects.
- Production deployment assistance, if the team is ready to deploy.
- Phase 2 roadmap, if Phase 1 is accepted.

For any new Phase 2 feature request, first confirm that it is intentionally assigned and still preserves the locked stack and REST-only architecture.

## Prompt 29 Final Pre-Deploy Sequence

Use this sequence after the target `.env` exists and before handing a VM to operators or stakeholders:

```powershell
git status --short
corepack pnpm verify
corepack pnpm ops:env-check -- --strict
docker compose up -d postgres minio
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump
corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "<replace-with-strong-password>"
corepack pnpm docker:smoke
docker compose ps
```

Notes:

- Run bootstrap only when the first company admin is missing or must be created.
- Replace all production secrets before strict env validation.
- Production browser origins outside localhost must use HTTPS.
- `S3_PUBLIC_ENDPOINT` must be browser-resolvable; do not use the internal `minio` hostname for browser upload/download links.
- Back up MinIO/S3 object storage in the same maintenance window as the PostgreSQL backup.
- Keep the previous known-good revision and matching database/object backups available until smoke and UAT handoff checks pass.

## Deployment Handoff Checklist

Before handing a VM or release branch to another operator, record:

- final git revision or tag
- environment URL
- `corepack pnpm verify` result
- `corepack pnpm ops:env-check -- --strict` result for the target `.env`
- migration result
- admin bootstrap result, if bootstrap was needed
- `corepack pnpm docker:smoke` or `corepack pnpm ops:smoke` result
- latest PostgreSQL backup file and verification result
- restore dry-run result
- object-storage backup location or operator acknowledgement
- UAT issue log location
- sign-off checklist status
- known unresolved caveats

## Git And Release Checkpoint Guidance

Use a final release checkpoint only after the documentation package, verification result, and UAT decision are recorded.

Suggested pre-checkpoint commands:

```powershell
git status --short
git diff --stat
corepack pnpm verify
```

If stakeholder UAT has not signed off, keep the release as a release candidate and avoid naming it as accepted production handoff. If UAT signs off without blockers, record the final commit SHA and tag or release name in [phase-1-release-notes.md](phase-1-release-notes.md) and [../uat/phase-1-signoff-checklist.md](../uat/phase-1-signoff-checklist.md).

## Known Operational Caveats

- Stakeholder UAT and sign-off are still pending.
- Real production use requires real secrets and `corepack pnpm ops:env-check -- --strict`.
- Non-localhost production browser sessions require HTTPS.
- `S3_PUBLIC_ENDPOINT` must be browser-resolvable for attachments.
- Swagger should be disabled in production unless intentionally exposed.
- Backup/restore is operator-run and manual.
- Restore is destructive unless run with `--dry-run`.
- MinIO/S3 object backup is outside the PostgreSQL helper scripts.
- CSV and browser print are the only Phase 1 output paths.
- Freshly bootstrapped companies may have empty pages until real UAT records exist.
