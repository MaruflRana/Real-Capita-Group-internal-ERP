# Phase 1 Tagging And Release Guidance

Use this guide when the operator is ready to create a Git tag for the Phase 1 release candidate or final accepted release.

## When To Tag

Tag only after:

- the intended release checkpoint is identified
- `git status --short` is clean
- `corepack pnpm verify` passes
- Docker Compose migration and smoke checks pass for the target release environment
- PostgreSQL backup, backup verification, and restore dry-run evidence are recorded
- stakeholder UAT/sign-off status is recorded in the UAT package

If stakeholder UAT has not signed off, tag only as a release candidate. Do not tag or describe the build as a final production release until sign-off is complete and no release-blocking issues remain.

## Suggested Tag Names

Use one consistent format:

- `v1.0.0-rc1`
- `phase1-rc1`
- `v1.0.0` only after Phase 1 is accepted for production handoff

## Pre-Tag Verification

Run from the repository root:

```powershell
git status --short
corepack pnpm verify
```

For a deployment handoff, also confirm the latest runtime evidence is recorded:

```powershell
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:smoke
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/<backup>.dump
corepack pnpm restore:db -- --file backups/postgres/<backup>.dump --dry-run
```

Do not run destructive restore as part of tagging.

## Create And Push The Tag

Replace `<tag>` with the approved release-candidate or final tag:

```powershell
git tag -a <tag> -m "Real Capita ERP Phase 1 Release Candidate"
git push origin <tag>
```

If creating a final accepted release tag, use a final-release message instead:

```powershell
git tag -a <tag> -m "Real Capita ERP Phase 1 Release"
git push origin <tag>
```

## Metadata To Record

After a tag is created, update the release evidence with:

- tag name
- tagged commit SHA
- tag creation date
- verification command results
- backup file and verification result
- restore dry-run result
- object-storage backup evidence or operator acknowledgement
- stakeholder UAT/sign-off decision

Keep `docs/release/phase-1-release-notes.md` honest: release-candidate tags are not accepted production releases unless stakeholder sign-off is complete.
