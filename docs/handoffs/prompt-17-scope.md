# Prompt 17 Scope

Prompt 17 should continue from the Prompt 16 frontend HR Core baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 16 frontend slices.

## Goal

Build the production-grade frontend Payroll Core operational slice on top of the existing backend payroll APIs.

## Recommended Next Scope

- salary structures UI
- payroll runs UI
- payroll run line UI
- payroll run finalize and cancel actions
- explicit payroll posting UI against the existing accounting voucher posting endpoint
- operational detail visibility needed to keep payroll preparation and posting understandable and safe

## Allowed

- extend `apps/web` navigation for the approved payroll operational routes
- build frontend pages, filters, detail surfaces, and disciplined form flows against the existing payroll REST APIs
- reuse the Prompt 12 through Prompt 16 auth, shell, API client, query, and form foundations
- add tests for route protection, payroll state-machine error surfacing, and the approved payroll workflows
- make only minimal backend compatibility tweaks if an existing payroll workflow needs a small response-shape or metadata fix for a production-grade frontend
- update handoff docs after completion

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting chart-of-accounts and voucher flows
- Prompt 14 project/property master behavior
- Prompt 15 CRM/property desk behavior
- Prompt 16 HR Core behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only

## Must Not Touch

- accounting report screens
- CRM/property exception workflows unless a later prompt explicitly asks for them
- document management screens
- fake/demo data
- backend payroll business redesign unless a minimal compatibility fix is strictly necessary
- automatic payroll generation from attendance, leave, shifts, or rosters
- payslip PDF generation
- bank export files
- Next.js backend routes or server actions for business operations

## Architectural Rules

- keep `apps/web` frontend-only
- keep the strict REST boundary
- use the NestJS API for all payroll operations
- preserve the existing company-scoped role model
- do not invent payroll workflow states or posting rules that are not already present in the backend
- prefer reusable operational table/detail/form/query patterns over one-off page logic

## Delivery Notes For Prompt 17

- Start by inspecting the existing payroll backend endpoints and the Prompt 16 HR data/query/form patterns before adding payroll UI.
- Confirm which payroll selectors need project, cost center, employee, salary-structure, and account references before building forms.
- Keep payroll posting explicitly user-driven and aligned with the existing backend voucher-posting contract.
- If live verification data is missing in the selected company, use a dedicated company context for safe verification rather than introducing fake data.
- Keep verification grounded in real backend responses and preserve the existing Docker-based runtime path.

## Done When

- approved payroll routes exist in the protected shell
- salary structures work against real backend endpoints
- payroll runs work against real backend endpoints
- payroll run lines work against real backend endpoints
- finalize, cancel, and explicit post actions surface backend lifecycle rules clearly
- Prompt 16 HR routes still work without regression
- lint, typecheck, build, test, and Docker verification pass again
- handoff docs reflect the actual Prompt 17 end state
