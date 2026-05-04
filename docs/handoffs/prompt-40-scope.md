# Prompt 40 Scope: Supervisor Feedback / Final Release Decision Gate

Prompt 40 is reserved for work after supervisor review. It must not become a new feature phase by default.

## Allowed Scope

- Fix supervisor feedback discovered during the live demo.
- Apply small visual, wording, spacing, readability, responsive, or demo-doc corrections from supervisor review.
- Triage concrete UAT/demo issues and document whether each issue is a blocker, follow-up, or Phase 2 candidate.
- Create a final release-candidate checkpoint/tag only if explicitly requested after supervisor approval.
- Assist with production deployment preparation only if explicitly requested.

## Architecture Rules To Preserve

- Keep the locked stack: Nx + pnpm, Next.js App Router frontend, NestJS REST API, Prisma + PostgreSQL 15, MinIO, Playwright, GitHub Actions, Docker Compose single-VM baseline.
- Preserve the strict REST-only boundary between `apps/web` and `apps/api`.
- Keep `apps/web` as an API consumer only.
- Keep NestJS as the only backend business-operation entry point.
- Use Prisma for normal CRUD, migrations, and generated types.
- Use raw SQL only for complex transactions or PL/pgSQL-triggered database flows.

## Must Not Do By Default

- Do not add new ERP modules.
- Do not add database schema changes or migrations.
- Do not add backend workflows or new reporting logic unless a specific approved defect requires a small read-only fix.
- Do not add new seed systems or hardcoded metrics.
- Do not add transactional workflows.
- Do not add `.xlsx` export or server-side PDF generation.
- Do not change production deployment, tag a release, or push forcefully unless explicitly requested.

## Decision Gate

- Visual/demo-readiness feedback can be fixed in Prompt 40 if it is small and directly tied to supervisor review.
- Business-feature requests, new reports, new workflow behavior, data-model changes, and new integrations should be captured as Phase 2 or a separately approved follow-up.
- Production deployment assistance should begin only after supervisor approval and explicit deployment instructions.

## Starting Files For Prompt 40

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-39-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/phase-1-technical-handoff.md`
- `docs/release/demo-readiness-guide.md`
- `docs/uat/phase-1-demo-walkthrough.md`
- `docs/uat/phase-1-signoff-checklist.md`

## Expected Output

Prompt 40 should end with one of these outcomes:

- supervisor feedback fixes completed and ready for final release-candidate checkpoint
- release-candidate checkpoint/tagging completed by explicit request
- production deployment assistance completed by explicit request
- NOT READY, with specific supervisor/UAT blockers listed
