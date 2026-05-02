# Prompt 39 Scope

Prompt 39 must be **Supervisor Demo Visual QA + Final Polish**.

## Starting Point

Prompt 39 starts after Prompt 38's Operational Module Analytics Redesign.

Use these as source of truth:

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-38-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/phase-1-technical-handoff.md`
- Prompt 34 design-system foundation
- Prompt 35 shell/page frame
- Prompt 36 professional chart primitives
- Prompt 37 financial reports redesign and yearly report
- Prompt 38 operational module analytics redesign

## Allowed Direction

Prompt 39 may cover:

- live supervisor-demo visual QA across the seeded Demo/UAT walkthrough
- final frontend polish for spacing, readability, clipping, overflow, labels, empty/loading/error states, and responsive behavior
- small corrections to existing UI composition where Prompt 34-38 surfaces look inconsistent in the live demo
- route-level visual QA at desktop/tablet widths used by the supervisor demo
- targeted test updates where final polish changes affect selectors, labels, rendering, or access behavior
- documentation and handoff updates for final demo readiness

## Must Preserve

- Next.js frontend remains an API consumer only.
- NestJS remains the only backend entry point.
- No Next.js server actions for business operations.
- No new ERP business modules.
- No new transactional workflows.
- No new CRUD domains.
- No database schema changes or migrations.
- No seed-system redesign or production auto-seeding.
- No fake or hardcoded analytics values.
- Existing financial report calculations and operational analytics data sources remain compatible.
- Existing CSV export, browser print behavior, role-aware access, and Docker Compose baseline remain intact.

## Out Of Scope By Default

- new backend endpoints
- new financial report calculations
- new operational analytics scope beyond polish and defect correction
- redesigning the full dashboard again
- redesigning Financial Reports again
- new workflow engines, approvals, cancellation, refund, transfer, shift, overtime, roster, OCR, public sharing, document versioning, or import systems
- `.xlsx` export
- server-side PDF rendering
- production deployment changes
- release tagging unless explicitly requested
- Phase 2 business implementation

## Suggested QA Coverage

- Confirm the seeded Demo/UAT supervisor walkthrough works from login through dashboard, financial reports, operational modules, exports/print surfaces, and audit/documents.
- Verify no global horizontal overflow at `1440px`, `1366px`, and `1024px`.
- Verify numbers, labels, legends, navigation, cards, tables, buttons, filters, and empty/error/loading states are readable and not clipped.
- Verify role-aware navigation and forbidden states still hide or block unauthorized modules.
- Verify the dashboard remains executive-level and does not become cluttered with every module metric.

## Decision Gate

If Prompt 39 feedback requests new business capability, new data model, new backend aggregation, new workflow, new seed coverage, new output format, or Phase 2 behavior, document it as roadmap scope before implementing code.
