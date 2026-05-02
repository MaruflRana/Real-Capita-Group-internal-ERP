# Prompt 33 Scope

Prompt 33 is **RCG Context-Aligned Synthetic Demo/UAT Data Upgrade**.

This is a demo-data refinement prompt. It upgrades the existing Prompt 30 synthetic Demo/UAT seed so supervisor demos, dashboard analytics, reports, and module walkthroughs use public Real Capita Group naming context while all private operational records remain synthetic.

## Starting Point

Prompt 33 must start from:

- the locked stack and architecture rules in `AGENTS.md`
- the Prompt 30 synthetic Demo/UAT data foundation
- the Prompt 31/32 analytics and reporting UI
- existing Phase 1 REST endpoints and role-aware access behavior
- the current demo seed, reset, verify, and demo-data operations docs

Before implementation, read:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-32-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/phase-1-technical-handoff.md`
- `scripts/seed-demo-data.mjs`
- `scripts/reset-demo-data.mjs`
- `scripts/verify-demo-data.mjs`
- `scripts/lib/demo-data.mjs`

## Allowed Direction

Prompt 33 may refine the existing synthetic Demo/UAT seed for:

- company, sister-concern, location, and department context using public Real Capita Group family names
- RCG-context project/property master data using public project names, locations, categories, blocks, zones, sizes, and unit-type patterns
- synthetic CRM/property desk records tied to the RCG-context projects and units
- accounting/reporting vouchers and chart-of-account labels that make existing reports meaningful
- synthetic HR/payroll records across existing departments, locations, attendance devices, leave, salary structures, and payroll runs
- safe synthetic attachment metadata, attachment links, and audit events
- verification checks for non-zero coverage, meaningful RCG-context coverage, synthetic private-data safeguards, reset safety, and report readiness
- handoff and operations documentation

## Source Discipline

Public Real Capita Group context may be used only for:

- company and sister-concern names
- project names
- project locations
- public project categories
- public block, zone, size, and unit-type patterns
- public amenities, infrastructure, and surrounding-context labels

All private operational data must remain synthetic:

- customers
- employees
- phone numbers
- emails
- payments
- voucher amounts
- payroll amounts
- contracts
- collections
- attendance
- leave
- attachment metadata
- audit events

Do not describe this as production or operational source data. Use **RCG context-aligned synthetic demo/UAT data**.

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules.
- No new transactional workflows.
- No new dashboard features or charts.
- No new CRUD domains.
- No new database tables or migrations.
- No production auto-seeding.
- No migration auto-seeding.
- Existing role-aware access behavior remains intact.
- Existing seed commands remain:
  - `corepack pnpm seed:demo`
  - `corepack pnpm seed:demo:reset`
  - `corepack pnpm seed:demo:verify`

## Out Of Scope

- new ERP workflows
- new frontend dashboard widgets, charts, or hardcoded analytics values
- new reporting endpoints
- new seed-data command names
- new schema tables or Prisma migrations
- non-synthetic customer, employee, contract, payment, payroll, attendance, document, or audit data
- approval engines
- import systems
- production auto-seeding
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- Phase 2 implementation

## Decision Gate

If a requested change requires a new workflow, new business module, new data model, real private operational data, production auto-seeding, or frontend hardcoded chart values, stop and document it as roadmap scope before implementing code.
