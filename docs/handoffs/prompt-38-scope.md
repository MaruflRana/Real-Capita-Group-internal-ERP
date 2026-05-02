# Prompt 38 Scope

Prompt 38 must be **Operational Module Analytics Redesign**.

## Starting Point

Prompt 38 starts after Prompt 37's Financial Reports Redesign + Yearly Report.

Use these as source of truth:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-37-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- existing REST clients, role-aware access rules, Prompt 34 design tokens, Prompt 35 shell/page frame, and Prompt 36 chart primitives

## Allowed Direction

Prompt 38 may cover:

- frontend redesign of operational module analytics panels outside the financial report pages
- dashboard/module analytics presentation improvements for project/property, CRM/property desk, HR, payroll, audit/documents, and accounting operational summaries
- better chart selection, summary cards, empty/loading/error states, and responsive layout for existing operational analytics
- reuse of existing REST list/report data only
- tests where analytics rendering, route loading, responsive behavior, or access behavior is affected
- documentation and handoff updates for operational module analytics redesign

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules.
- No new transactional workflows.
- No new CRUD domains.
- No new database tables or migrations.
- Existing financial report calculations and report endpoint contracts remain compatible.
- Existing CSV export and browser print behavior remains read-only and role-scoped.
- Existing role-aware access behavior remains intact.
- Prompt 34 design tokens, Prompt 35 shell/page layout, and Prompt 36 chart primitives should be reused.
- Charts and summaries must use real existing REST data or explicit empty states, never hardcoded business values.

## Out Of Scope By Default

- new reporting endpoints
- new financial report calculations
- redesigning the financial report pages again
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

If Prompt 38 feedback asks for a new calculation, new endpoint, new workflow, new database model, non-synthetic operational data, or Phase 2 capability, stop and document it as roadmap scope before implementing code.
