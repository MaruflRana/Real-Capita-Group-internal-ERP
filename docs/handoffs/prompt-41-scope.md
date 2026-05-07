# Prompt 41 Scope: Post-Checkpoint Continuation

Prompt 41 must be selected based on what happens after the Prompt 40D Git checkpoint. It should not automatically expand ERP feature scope.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-40d-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `docs/uat/phase-1-demo-walkthrough.md`
- `docs/operations/demo-data.md`

## Allowed Direction

Prompt 41 should be one of:

- supervisor feedback fixes
- production deployment readiness
- release candidate tag

The chosen direction must be explicit before implementation begins.

## Must Not Do By Default

- Do not add new ERP modules.
- Do not add backend endpoints or business workflows unless the selected Prompt 41 direction explicitly requires them.
- Do not add accounting calculations.
- Do not add Prisma schema changes or migrations unless explicitly scoped.
- Do not add seed data.
- Do not add `.xlsx` generation.
- Do not add server-side PDF generation.
- Do not tag or deploy unless Prompt 41 is explicitly selected for release/deployment work.
- Do not present Demo/UAT data as production evidence.

## Starting Point

Prompt 40D completed final print/export QA for all 9 printable financial reports, kept CSV/browser-print as the Phase 1 output boundary, and prepared the repo for the next explicit checkpoint direction.
