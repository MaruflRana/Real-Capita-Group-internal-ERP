# Prompt 31 Scope

Prompt 31 is reserved for **Analytics/Graphs/Status UI Enhancement**.

## Starting Point

Prompt 31 must start from Prompt 30's synthetic demo/UAT data foundation and the existing Phase 1 backend REST endpoints.

Before implementation, read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-30-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/uat/module-wise-uat-scenarios.md`
- existing dashboard, reporting, and module frontend code under `apps/web`

## Allowed Direction

Prompt 31 may enhance existing frontend-only status, graph, and analytics presentation using existing REST APIs and the seeded synthetic demo/UAT data.

Candidate areas:

- dashboard status summaries
- revenue vs expense trend presentation
- voucher status/type distribution
- unit status, project, and unit-type distribution
- booking, contract, collection, and installment status summaries
- employee, attendance, and leave summaries
- payroll posted/finalized/draft summaries
- attachment and audit activity summaries

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules or workflows.
- Existing role-aware access behavior remains intact.
- Existing CSV export and browser print behavior remains read-only and role-scoped.
- Synthetic demo/UAT data must not be described as real data.

## Out Of Scope By Default

- new backend reporting endpoints unless explicitly assigned
- new ERP workflows
- new CRUD domains
- approval engines
- import systems
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- automatic demo seeding

## Decision Gate

If a requested graph or status view needs backend data that existing endpoints cannot provide, document the gap first and ask whether a backend API addition is intentionally assigned.
