# Prompt 16 Scope

Prompt 16 should continue from the Prompt 15 CRM & Property Desk operational baseline without reworking the locked stack, auth/session model, or the existing Prompt 12 through Prompt 15 frontend slices.

## Goal

Build the production-grade frontend HR Core operational slice needed to operate the existing backend HR Core through the web app.

## Approved Scope

- employees UI
- attendance devices UI
- device-user mappings UI
- attendance logs UI
- leave types UI
- leave requests UI

## Allowed

- add HR navigation and protected HR routes in `apps/web`
- build frontend pages, filters, detail surfaces, and disciplined form flows against the existing HR REST APIs
- reuse the Prompt 12 through Prompt 15 auth, shell, API client, query, and form foundations
- add tests for route protection, error surfacing, and the approved HR workflows
- make only minimal backend compatibility tweaks if an existing HR workflow needs a small response-shape or selector-data fix for a production-grade frontend
- update handoff docs after completion

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting chart-of-accounts and voucher flows
- Prompt 14 project/property master behavior
- Prompt 15 CRM/property desk behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only

## Must Not Touch

- payroll run UI
- payroll posting UI
- payslip or bank export UI
- accounting report screens
- CRM/property screens
- document management screens
- fake/demo data
- backend HR business redesign unless a minimal compatibility fix is strictly necessary
- Next.js backend routes or server actions for business operations

## Architectural Rules

- keep `apps/web` frontend-only
- keep the strict REST boundary
- use the NestJS API for all HR operations
- preserve the existing company-scoped role model
- do not invent HR workflow states or business rules that are not already present in the backend
- prefer reusable operational table/detail/form/query patterns over one-off page logic

## Delivery Notes For Prompt 16

- Start by inspecting the existing HR backend APIs plus the Prompt 12 through Prompt 15 frontend infrastructure.
- Reuse backend HR APIs exactly and do not mock business data.
- If live verification data is missing in the selected company, document that explicitly or verify in a separate real company context instead of adding fake state.
- Keep verification grounded in real backend responses and preserve the existing Docker-based runtime path.

## Done When

- HR routes exist in the protected shell
- employees work against real backend endpoints
- attendance devices work against real backend endpoints
- device mappings work against real backend endpoints
- attendance logs work against real backend endpoints
- leave types work against real backend endpoints
- leave requests work against real backend endpoints
- Prompt 15 routes still work without regression
- lint, typecheck, build, test, and Docker verification pass again
- handoff docs reflect the actual Prompt 16 end state
