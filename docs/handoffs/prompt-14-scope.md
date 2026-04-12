# Prompt 14 Scope

Prompt 14 builds the frontend Project & Real-Estate Master slice on top of the existing backend Project & Real-Estate Master Core.

## Goal

Add the first production-grade project/property master UI to the authenticated web app.

## Allowed

- extend `apps/web` navigation with a project/property master section
- build frontend pages, filters, tables, forms, and side-panel workflows for project/property master data
- reuse the Prompt 12 and Prompt 13 auth, session, shell, API client, query, and form patterns
- add practical tests for route protection and project/property UX
- make only minimal backend compatibility tweaks if a small response-shape or filter-alignment fix is strictly required
- update handoff docs after completion

## Target Frontend Scope

- projects
- cost centers
- project phases
- blocks
- zones
- unit types
- unit statuses
- units

## Must Not Touch

- booking screens
- sale contract screens
- installment collection screens
- accounting report screens
- HR/payroll screens
- document management screens
- fake/demo data
- backend project/property business redesign
- Next.js backend routes or server actions for business operations

## Architectural Rules

- keep `apps/web` frontend-only
- keep the strict REST boundary
- use the NestJS API for all project/property operations
- preserve the Prompt 12 auth/session patterns
- preserve the Prompt 13 accounting UI and client/query patterns
- prefer reusable master-data form/table/query patterns, not page-local fetch logic

## Done When

- project/property routes exist in the protected shell
- projects, cost centers, hierarchy masters, unit types, unit statuses, and units pages work against real backend endpoints
- hierarchy context is clear and usable in the UI
- unit-status read-only behavior matches the backend contract
- lint, typecheck, build, test, and Docker verification pass again
- handoff docs reflect the actual Prompt 14 end state
