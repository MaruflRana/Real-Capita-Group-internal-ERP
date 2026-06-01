# Phase 3 Trace Search And Anchors

## Scope

Phase 3 improves the read-only Defense Trace overlay for live practicum use. It
keeps the feature frontend-only and does not add API capture, backend changes,
database changes, package changes, or sensitive runtime data display.

## Topic Search

The overlay now includes topic search. Search checks:

- label
- category
- route patterns
- visible UI text hints
- Prisma model names
- search command labels and commands
- presenter summary
- stack context

Current route matching remains the default selection. Selecting a search result
manually keeps that trace visible even if it differs from the current route.
Use `Back to current route` to return to the route-matched trace.

Useful practicum searches include:

- `dashboard`
- `auth`
- `role`
- `voucher`
- `trial balance`
- `business overview`
- `customer`
- `attachment`
- `payroll`
- `prisma`
- `database`

## Panel Preferences

Overlay usability preferences are stored only in browser `localStorage` under:

```text
real-capita:defense-trace:preferences
```

Stored preferences:

- panel position: `right`, `left`, or `bottom`
- minimized state

The workspace root remains separate under:

```text
real-capita:defense-trace:workspace-root
```

No absolute path is committed to Git.

## Scoped Click-To-Trace Anchors

Selected high-value UI regions now include `data-defense-trace="<traceEntryId>"`
attributes. When trace mode is enabled, clicking a tagged region selects the
matching trace entry in the overlay. The handler does not call
`preventDefault`, so links and buttons continue their normal behavior.

Anchors added:

- authenticated sidebar navigation container: `sidebar-navigation`
- sidebar Dashboard link: `dashboard`
- sidebar Vouchers link: `vouchers`
- sidebar Trial Balance link: `trial-balance`
- sidebar Business Overview link: `business-overview`
- sidebar Customers link: `customers`
- sidebar Attachments link: `attachments-documents`
- sidebar HR links: `hr`
- sidebar Payroll links: `payroll`
- dashboard page and KPI area: `dashboard`
- dashboard `Open company admin` action: `role-access`
- login card/form area: `login-auth`
- vouchers page/list/create area: `vouchers`
- trial balance report screen: `trial-balance`
- customer list page: `customers`
- customer profile page: `customer-profile`

Skipped for this phase:

- Deep row-level anchors inside every table row. Those would add noise and are
  better handled later with explicit row trace mapping.
- API/network capture. That remains out of scope for Phase 3.
- Broad anchors across every module page. This phase favors high-confidence
  defense surfaces over exhaustive coverage.

## Trace Ladder

Each selected trace shows a compact professional ladder:

```text
UI -> Frontend -> API -> Backend -> Data Model
```

Layer meanings:

- UI: what the user sees/clicks.
- Frontend: React/Next.js screen code.
- API: REST helper/request boundary.
- Backend: NestJS controller/service business logic.
- Data Model: Prisma/PostgreSQL structure.

Each layer is marked as present or unavailable for the selected trace entry.
This helps explain whether the topic is a pure UI surface, a frontend/API flow,
a backend-owned workflow, or database-backed behavior.

## Manual Verification

Recommended checks:

1. Open `/dashboard` normally and confirm no trace UI appears.
2. Open `/dashboard?trace=1` and confirm the overlay appears.
3. Search `voucher`; select the Vouchers trace.
4. Search `database`; select Database/Prisma.
5. Use `Back to current route` and confirm Dashboard returns.
6. Change panel position to left, right, and bottom, then refresh.
7. Click tagged dashboard/sidebar/login/report regions in trace mode.
8. Confirm normal links and buttons still perform their normal actions.
9. Confirm Study Notes remain collapsed by default.
10. Confirm the trace ladder is visible and uses professional wording.
