# Prompt 35 Scope

Prompt 35 must be **App Shell + Navigation + Page Layout Redesign**.

## Starting Point

Prompt 35 starts after Prompt 34's ERP design-system foundation.

Use these as source of truth:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-34-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/operations/demo-data.md`
- `docs/release/phase-1-technical-handoff.md`
- existing REST endpoints and role-aware access behavior

## Allowed Direction

Prompt 35 may cover:

- app-shell layout redesign
- sidebar/navigation hierarchy redesign
- authenticated header/session context redesign
- page layout rhythm and section spacing
- responsive layout improvements for desktop/tablet/mobile
- route-group navigation presentation using existing routes only
- stronger active, hover, focus, and forbidden/access states
- documentation and handoff updates for the layout redesign
- tests only if affected by layout/access behavior

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules.
- No new transactional workflows.
- No new CRUD domains.
- No new database tables or migrations.
- No new backend reporting logic.
- Existing role-aware access behavior remains intact.
- Existing CSV export and browser print behavior remains read-only and role-scoped.
- RCG context-aligned synthetic Demo/UAT data must remain synthetic Demo/UAT data.
- Prompt 34 design tokens and primitives should be reused instead of inventing a second visual system.

## Out Of Scope By Default

- page-by-page module redesign beyond shell/page-layout structure
- new ERP workflows
- new CRUD domains
- new analytics categories
- new reporting endpoints
- new seed-data systems
- approval engines
- import systems
- production auto-seeding
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- Phase 2 business implementation

## Decision Gate

If Prompt 35 feedback asks for a new business module, new data model, new workflow, non-synthetic customer/employee/contract/payment data, or Phase 2 capability, stop and document it as roadmap scope before implementing code.
