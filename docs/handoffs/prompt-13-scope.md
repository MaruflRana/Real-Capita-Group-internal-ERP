# Prompt 13 Scope

Prompt 13 should build the next frontend slice for the existing Accounting backend foundation.

## Goal

Add the first production-grade Accounting UI on top of the Prompt 12 shell, auth, session, API client, and Org & Security baseline.

## Allowed

- extend `apps/web` navigation with an Accounting section
- build frontend pages, forms, tables, and detail flows for the existing accounting APIs
- reuse the Prompt 12 auth/session/query/form infrastructure
- add practical frontend tests for the accounting slice
- make only minimal backend compatibility tweaks if the existing accounting APIs need small response-shape or docs cleanup for clean frontend use
- update handoff docs after completion

## Target Accounting Scope

- account classes
- account groups
- ledger accounts
- particular accounts
- vouchers:
  - list
  - detail
  - draft create/edit
  - line add/update/delete
  - post action

## Must Not Touch

- Org & Security frontend behavior except for shared reusable shell/navigation refinements
- project/property UI
- CRM/property desk UI
- HR/payroll UI
- document management UI
- dashboards beyond tiny accounting placeholders if needed
- backend business redesign
- Next.js backend routes or server actions for business mutations

## Architectural Rules

- keep `apps/web` frontend-only
- keep the strict REST boundary
- use the NestJS API for all accounting operations
- preserve the Prompt 12 auth/session patterns
- keep TanStack Query as the data layer
- prefer reusable admin UI patterns, not page-local fetch logic

## Done When

- accounting routes exist in the protected shell
- chart-of-accounts admin flows work against real backend endpoints
- voucher draft and posting flows work against real backend endpoints
- lint, typecheck, build, test, and Docker verification pass again
- handoff docs reflect the actual Prompt 13 end state
