# Prompt 15 Scope

Prompt 15 should build the frontend CRM & Property Desk operational slice on top of the Prompt 14 shell, accounting UI, and project/property master UI.

## Goal

Add the first production-grade CRM/property frontend for customer, lead, booking, contract, installment, and collection operations that already exist in the backend core from Prompt 8.

## Allowed

- extend `apps/web` navigation with CRM/property desk entries
- build frontend pages, filters, tables, forms, and detail/edit surfaces for the existing Prompt 8 CRM/property APIs
- reuse the Prompt 12, Prompt 13, and Prompt 14 auth, shell, API client, query, and form foundations
- use the existing project/property masters and accounting references as selectable upstream data
- add practical tests for CRM/property route protection and operational flows
- make only minimal backend compatibility tweaks if a small response-shape or filter-alignment fix is strictly required
- update handoff docs after completion

## Target Frontend Scope

- customers
- leads
- bookings
- sale contracts
- installment schedules
- collections

## Must Preserve

- Prompt 12 auth/session behavior
- Prompt 13 accounting chart-of-accounts and voucher flows
- Prompt 14 project/property master UI and hierarchy behavior
- strict REST-only browser-to-API boundary
- `apps/web` as frontend-only

## Must Not Touch

- accounting report screens
- payroll posting screens
- HR/payroll admin screens
- document management screens
- fake/demo data
- automatic accounting posting redesign
- backend CRM/property business redesign unless a minimal compatibility fix is strictly necessary
- Next.js backend routes or server actions for business operations

## Architectural Rules

- keep `apps/web` frontend-only
- keep the strict REST boundary
- use the NestJS API for all CRM/property operations
- preserve the existing company-scoped role model
- expose CRM/property desk navigation only to roles already supported by the backend for that slice, primarily `company_admin` and `company_sales`
- prefer reusable operational tables, forms, and query helpers over one-off page logic
- keep property desk workflows grounded in real project, unit, customer, and voucher data rather than mock state

## Done When

- CRM/property desk routes exist in the protected shell
- customer, lead, booking, sale-contract, installment-schedule, and collection pages work against real backend endpoints
- booking and contract state transitions are understandable in the UI
- installment and collection linkage is visible and operational
- lint, typecheck, build, test, and Docker verification pass again
- handoff docs reflect the actual Prompt 15 end state
