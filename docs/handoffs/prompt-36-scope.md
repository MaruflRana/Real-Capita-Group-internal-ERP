# Prompt 36 Scope

Prompt 36 must be **Professional Chart Component System**.

## Starting Point

Prompt 36 starts after Prompt 35's App Shell + Navigation + Page Layout Redesign.

Use these as source of truth:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-34-status.md`
- `docs/handoffs/prompt-35-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/operations/demo-data.md`
- `docs/release/phase-1-technical-handoff.md`
- existing REST endpoints and role-aware access behavior

## Allowed Direction

Prompt 36 may cover:

- shared frontend chart primitives for existing dashboard, analytics, and reporting surfaces
- consistent chart cards, chart headers, legends, tooltips, empty/loading/error states, and chart viewport sizing
- responsive chart readability for desktop, tablet, and mobile widths
- accessible chart labeling and non-color-only status cues
- standardizing existing chart presentations over existing REST API data
- tests only if affected by chart rendering, layout, access, or report behavior
- documentation and handoff updates for the chart component system

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
- Prompt 34 design tokens and Prompt 35 shell/page layout should be reused instead of inventing a second visual system.
- Charts must use real existing REST data or explicit empty states, never hardcoded business values.

## Out Of Scope By Default

- new analytics categories
- new reporting endpoints
- new report calculations
- page-by-page module redesign beyond chart containers and chart readability
- new ERP workflows
- new CRUD domains
- approval engines
- import systems
- production auto-seeding
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- Phase 2 business implementation

## Decision Gate

If Prompt 36 feedback asks for a new business module, new data model, new workflow, new reporting calculation, non-synthetic customer/employee/contract/payment data, or Phase 2 capability, stop and document it as roadmap scope before implementing code.
