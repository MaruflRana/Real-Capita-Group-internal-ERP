# Prompt 29 Scope

Prompt 29 must continue from the Prompt 28 final Phase 1 release packaging and handoff bundle.

## Default Purpose

Prompt 29 is reserved for one of two directions:

- UAT issue-fix sprint, if stakeholder UAT produces confirmed issues.
- Final deployment/tagging support, if no UAT blockers exist.

Prompt 29 should not start new feature work by default.

## Must Preserve

- the locked stack:
  - Nx + pnpm
  - Next.js App Router frontend-only `apps/web`
  - NestJS REST-only `apps/api`
  - Prisma + PostgreSQL 15
  - MinIO / S3-compatible object storage
  - Playwright
  - GitHub Actions
  - Docker Compose for the single-VM target
- strict REST-only boundary between `apps/web` and `apps/api`
- `apps/web` as an API consumer only
- `apps/api` as the only backend entry point
- all Prompt 12 through Prompt 28 delivered behavior, runtime hardening, documentation, UAT package, release packaging, and release-readiness checks
- Prompt 22 runtime and Compose runner-service rules
- Prompt 23 authorization and role-aware UX rules
- Prompt 24 CSV export and browser-native print rules
- Prompt 25 backup/restore safety behavior
- Prompt 26 release-candidate documentation
- Prompt 27 UAT package
- Prompt 28 release handoff bundle:
  - `docs/release/phase-1-release-notes.md`
  - `docs/release/phase-1-technical-handoff.md`
  - `docs/release/operator-quick-start.md`
  - `docs/release/demo-readiness-guide.md`
  - `docs/release/phase-1-artifact-inventory.md`
  - `docs/release/phase-1-verification-summary.md`

## Must Not Regress

- backup files must remain ignored by git
- generated `*.tsbuildinfo` files must remain ignored by git
- PostgreSQL restore must remain explicitly confirmed before destructive changes
- restore dry-run must remain non-mutating
- backup/restore helpers must not embed secrets
- MinIO/S3 browser-resolvable `S3_PUBLIC_ENDPOINT` behavior must remain intact
- Docker Compose must remain the approved Phase 1 deployment baseline
- unauthenticated protected routes must redirect to `/login?next=...`
- authenticated unauthorized sessions must receive stable API `403` behavior and clear frontend forbidden states
- Phase 1 CSV/print output surfaces must remain read-only and role-scoped
- UAT and release docs must remain honest about known limitations and deferred scope

## Allowed Prompt 29 Directions

If stakeholder UAT produces issues:

- classify each issue by severity and priority
- fix confirmed defects only
- update UAT issue status and retest notes
- run focused tests plus required verification

If no UAT blockers exist:

- support release checkpoint creation
- support tag or branch guidance
- support final deployment checklist execution
- update sign-off or release evidence documents
- run release verification commands

## Out Of Scope Unless Explicitly Assigned

- new ERP business modules
- new CRUD domains
- new dashboards or reports
- approval workflows
- notifications
- import systems
- public-facing features
- fake/demo ERP data
- `.xlsx` generation
- server-side PDF rendering
- automated scheduled backup infrastructure
- point-in-time recovery
- Kubernetes or redesigned runtime architecture

## Required Starting Point For Prompt 29

Read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-28-status.md`
- `docs/handoffs/prompt-29-scope.md`
- `docs/release/phase-1-release-notes.md`
- `docs/release/phase-1-technical-handoff.md`
- `docs/release/operator-quick-start.md`
- `docs/release/demo-readiness-guide.md`
- `docs/release/phase-1-artifact-inventory.md`
- `docs/release/phase-1-verification-summary.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/operations/phase-1-release-checklist.md`
- `docs/uat/README.md`
- any stakeholder UAT issue log or explicit Prompt 29 user scope

## Prompt 29 Decision Gate

Before implementing anything in Prompt 29, classify the request as one of:

- UAT defect fix
- issue triage only
- final deployment/tagging support
- documentation correction
- out-of-scope new feature request

If the request is a new feature request, confirm that it is intentionally assigned and does not violate the locked architecture.
