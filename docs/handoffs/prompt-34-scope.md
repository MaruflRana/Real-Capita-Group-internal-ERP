# Prompt 34 Scope

Prompt 34 starts after the Prompt 33 RCG Context-Aligned Synthetic Demo/UAT Data Upgrade.

## Starting Point

Prompt 34 must start from:

- the locked stack and architecture rules in `AGENTS.md`
- the Phase 1 route and module inventory
- the Prompt 30 synthetic Demo/UAT data foundation
- the Prompt 31/32 analytics and reporting UI
- the Prompt 33 RCG context-aligned synthetic demo/UAT seed
- existing REST endpoints and role-aware access behavior

Before implementation, read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-32-status.md`
- `docs/handoffs/prompt-33-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/phase-1-technical-handoff.md`
- relevant UAT/demo notes if supervisor feedback is supplied

## Allowed Direction

Prompt 34 may cover:

- supervisor feedback from reviewing the Prompt 33 demo seed and Prompt 31/32 analytics/report screens
- final UAT/demo polish over existing Phase 1 screens
- small visual, copy, spacing, responsiveness, or accessibility repairs
- small report-label, empty-state, or demo-data documentation clarifications
- test updates needed for polished existing behavior
- documentation and handoff updates from final demo findings

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules.
- No new transactional workflows.
- No new CRUD domains.
- No new database tables or migrations.
- Existing role-aware access behavior remains intact.
- Existing CSV export and browser print behavior remains read-only and role-scoped.
- RCG context-aligned synthetic Demo/UAT data must be described only as synthetic Demo/UAT data.
- Public RCG facts may be used only for company/project/location/master-data context unless a later scope explicitly says otherwise.

## Out Of Scope By Default

- new ERP workflows
- new CRUD domains
- new analytics categories unrelated to supervisor feedback
- new reporting endpoints unless a specific bug fix is explicitly approved and cannot be solved in the frontend
- new seed-data systems
- approval engines
- import systems
- production auto-seeding
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- Phase 2 implementation

## Decision Gate

If Prompt 34 feedback requests a new workflow, new business module, new data model, non-synthetic customer/employee/contract/payment data, or Phase 2 capability, stop and document it as roadmap scope before implementing code.
