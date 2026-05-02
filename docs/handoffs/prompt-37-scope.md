# Prompt 37 Scope

Prompt 37 must be **Financial Reports Redesign + Yearly Report**.

## Starting Point

Prompt 37 starts after Prompt 36's Professional Chart Component System.

Use these as source of truth:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-35-status.md`
- `docs/handoffs/prompt-36-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/phase-1-technical-handoff.md`
- existing financial-reporting REST endpoints, report DTOs, exports, print behavior, and role-aware access rules

## Allowed Direction

Prompt 37 may cover:

- frontend redesign of existing financial report pages using the Prompt 36 chart system
- business overview, daily, weekly, monthly, yearly, trial balance, general ledger, profit and loss, and balance sheet presentation improvements
- a new `/accounting/reports/yearly` page over the existing read-only business overview reporting boundary
- safe `bucket=year` support in the existing business overview endpoint if it is not already available
- report headers, filter layout, summary strips, chart placement, report tables, section totals, assumption notes, empty/error/loading states, and print-aware layout refinement
- improved readability of debit/credit, revenue/expense, profit/loss, assets, liabilities, equity, and `UNCLOSED_EARNINGS` presentation
- reuse of existing CSV export and browser print surfaces
- tests only where report layout, chart rendering, export/print behavior, or access behavior is affected
- documentation and handoff updates for the financial reports redesign

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules.
- No new transactional workflows.
- No new CRUD domains.
- No new database tables or migrations.
- No new backend reporting calculations unless explicitly approved in a later scoped prompt.
- Existing financial report endpoint contracts remain compatible.
- Existing CSV export and browser print behavior remains read-only and role-scoped.
- Existing role-aware access behavior remains intact.
- Prompt 34 design tokens, Prompt 35 shell/page layout, and Prompt 36 chart primitives should be reused.
- Charts and report summaries must use real existing REST data or explicit empty states, never hardcoded business values.

## Out Of Scope By Default

- new reporting endpoints
- new report calculations
- new ERP workflows
- new CRUD domains
- approval engines
- import systems
- production auto-seeding
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- Phase 2 business implementation
- redesigning non-financial module pages except for shared components directly needed by financial reports

## Decision Gate

If Prompt 37 feedback asks for a new financial calculation, new reporting endpoint, new business workflow, new database model, non-synthetic customer/employee/contract/payment data, or Phase 2 capability, stop and document it as roadmap scope before implementing code.
