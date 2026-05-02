# Prompt 32 Scope

Prompt 32 is reserved for **supervisor feedback fixes, UAT/demo polish, or Phase 2 roadmap planning** after Prompt 31 review.

## Starting Point

Prompt 32 must start from:

- the locked stack and architecture rules in `AGENTS.md`
- Prompt 30 synthetic Demo/UAT data foundation
- Prompt 31 frontend analytics/status UI enhancement
- existing Phase 1 REST endpoints and role-aware access behavior

Before implementation, read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-30-status.md`
- `docs/handoffs/prompt-31-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/uat/module-wise-uat-scenarios.md`

## Allowed Direction

Prompt 32 may cover one intentionally assigned track:

- supervisor feedback fixes on Prompt 31 analytics/status UI
- UAT/demo polish over existing Phase 1 modules
- documentation updates from UAT findings
- Phase 2 roadmap planning after Phase 1 review
- small bug fixes discovered during demo/UAT, if they preserve the existing module boundaries

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules unless explicitly assigned as Phase 2 scope.
- Existing role-aware access behavior remains intact.
- Existing CSV export and browser print behavior remains read-only and role-scoped.
- Synthetic Demo/UAT data must not be described as real production data.

## Out Of Scope By Default

- new ERP workflows
- new CRUD domains
- approval engines
- import systems
- production auto-seeding
- `.xlsx` export
- server-side PDF rendering
- production deployment changes unless explicitly assigned
- broad UI redesign unrelated to review findings

## Decision Gate

If Prompt 32 is used for Phase 2 planning, do not implement Phase 2 code until the intended Phase 2 module or workflow is explicitly assigned and confirmed against the locked stack.
