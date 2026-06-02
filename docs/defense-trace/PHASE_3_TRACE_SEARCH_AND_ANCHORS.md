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
matching trace entry in the overlay.

When Inspector Mode is off, tagged links and buttons keep their normal
behavior. When Inspector Mode is on, the click handler runs in capture mode and
prevents the clicked button or link action so the presenter can inspect the UI
without accidentally navigating, submitting, or triggering an operation.

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

## Universal Inspector Mode

Inspector Mode now works beyond manually tagged anchors. A click on an untagged
visible UI element is converted into a selected target with a safe label, kind,
source, current route, clicked text, and optional link path. The extractor uses
DOM context such as button, form field, table heading, navigation, nearby card
text, heading, ARIA label, and same-origin link path. It does not read request
bodies, response bodies, cookies, tokens, credentials, or form input values.

Matching order:

- explicit `data-defense-trace` anchor
- same-origin link path
- clicked text against trace `uiTexts`
- clicked text against trace label/category
- current route fallback

If no exact trace topic is matched, the panel still shows the selected UI label,
current route, likely route file, a `git grep` command for the clicked text, a
route-segment `git grep` command, and the guidance:

```text
No exact trace topic matched. Start with UI text search or current route file.
```

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
8. Enable Inspector Mode and click untagged headings, labels, KPI values,
   buttons, cards, table headings, sidebar items, and form fields.
9. Confirm untagged clicks show a selected UI target and fallback search
   commands when no exact trace topic exists.
10. Turn Inspector Mode off and confirm normal links and buttons perform their
   normal actions.
11. Confirm Study Notes remain collapsed by default.
12. Confirm the trace ladder is visible and uses professional wording.
