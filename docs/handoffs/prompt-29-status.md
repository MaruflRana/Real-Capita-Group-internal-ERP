# Prompt 29 Status

## Scope Delivered

Prompt 29 completed the final Phase 1 deployment/tag/release handoff pass from the Prompt 28 release-candidate package.

No actual stakeholder UAT blocker list was provided, so Prompt 29 was handled as final deployment/tagging support instead of a UAT issue-fix sprint.

This phase changed documentation only. It did not add or modify application code, backend routes, frontend pages, Prisma schema, database migrations, business logic, workflows, fake/demo data, Docker runtime architecture, or output formats.

## Release-Candidate Checkpoint

Starting checkpoint:

```text
c04c93e5874f369b3bb47721e0c98bdcbd2b2532
```

Initial `git status --short` was clean, and `HEAD` matched the checkpoint above before Prompt 29 documentation edits.

## Documentation Updated

- `docs/release/phase-1-release-notes.md` now records the current release-candidate checkpoint and keeps the release status honest as technically verified for deployment/UAT handoff while stakeholder UAT/sign-off remains pending.
- `docs/release/phase-1-verification-summary.md` now records Prompt 29 verification evidence.
- `docs/release/phase-1-technical-handoff.md` now includes a final pre-deploy sequence and points continuation to Prompt 30.
- `docs/operations/phase-1-release-checklist.md` now includes the final pre-deploy command sequence and tag-after-approval guidance.
- `docs/release/tagging-and-release.md` now explains when and how to create release-candidate or final release tags.
- `docs/handoffs/foundation-status.md` now records Prompt 29 completion.
- `docs/handoffs/prompt-30-scope.md` reserves the next prompt for UAT blocker fixes, production deployment assistance, or Phase 2 roadmap depending on stakeholder outcome.

## Verification Completed

Commands run:

```powershell
git status --short
corepack pnpm verify
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-20260425T142454Z.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-20260425T142454Z.dump --dry-run
```

Observed result:

- `git status --short` was clean before Prompt 29 edits.
- `corepack pnpm verify` passed.
- Lint passed with pre-existing warnings only.
- Typecheck passed.
- Build passed.
- API tests passed: 154.
- Playwright e2e tests passed: 45.
- Docker Compose rebuilt and started the release-minded `web` and `api` runner services with `postgres` and `minio`.
- `corepack pnpm docker:migrate` completed with no pending migrations.
- `corepack pnpm docker:smoke` passed for web, API readiness, and Swagger.
- PostgreSQL backup was created at `backups/postgres/real_capita_erp-20260425T142454Z.dump`.
- Backup verification confirmed a `207.1 KiB` dump and `428` restore metadata entries.
- Restore dry-run completed without database mutation.
- No destructive restore was run.
- Final post-documentation `corepack pnpm verify` also passed.

## Source Of Truth Preserved

Prompt 29 preserved:

- locked Nx + pnpm, Next.js frontend-only, NestJS REST-only, Prisma/PostgreSQL, MinIO, Playwright, GitHub Actions, Docker Compose stack
- strict REST-only boundary between `apps/web` and `apps/api`
- `apps/web` as an API consumer only
- `apps/api` as the only backend entry point
- Prompt 22 Docker Compose runner-service runtime rules
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 CSV export and browser-native print rules
- Prompt 25 backup/restore safety behavior
- Prompt 27 UAT package and honest sign-off requirements
- Prompt 28 release handoff bundle

## Remaining Caveats

- Stakeholder UAT has not yet been executed or signed off.
- This state is technically verified for deployment/UAT handoff, not accepted as a final production release.
- Production use still requires real secrets, `corepack pnpm ops:env-check -- --strict`, HTTPS outside localhost, browser-resolvable `S3_PUBLIC_ENDPOINT`, and object-storage backup alongside PostgreSQL backup.
- No release tag was created by Prompt 29.
- Existing lint warnings remain non-blocking because the lint gate passes.

## Prompt 30 Readiness

The repo is ready for Prompt 30 as one of:

- UAT blocker fix sprint, if stakeholder UAT finds issues.
- Production deployment assistance, if the team is ready to deploy.
- Phase 2 roadmap, if Phase 1 is accepted.
