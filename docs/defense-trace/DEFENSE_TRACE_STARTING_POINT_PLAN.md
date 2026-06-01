# Defense Trace Starting Point Plan

## Purpose

Defense Trace is a developer trace/debug foundation for the Real Capita Group
Internal ERP practicum defense. Its job is to connect a live ERP screen to the
source files that explain it:

- Next.js route files
- frontend feature components and hooks
- typed frontend API helpers
- NestJS controllers and services
- Prisma models and safe search commands
- notes that explain likely edit impact and risk

This phase does not add a visible overlay and does not change existing app
behavior. It creates the typed foundation and professional documentation needed
for a later UI layer.

## Presenter Mode And Hidden Study Notes Mode

Future UI should treat trace information as two display levels:

- Presenter mode: projector-safe labels and short explanations suitable for
  faculty review. It should show fields such as `presenterSummary`,
  `explanation`, `implementationNotes`, `editImpact`, `riskNotes`, and
  `stackContext`.
- Hidden study notes mode: deeper private preparation notes for the presenter,
  driven by `studyNotes` and beginner-oriented explanations. This can include
  extra path-following guidance without cluttering the live screen.

The current registry already separates concise presenter summaries from
beginner explanations and study notes so Phase 2 can choose the correct display
mode without rewriting the data model.

## Professional Visible Labels

Visible labels must read like a professional developer tool. The defense
projector should show terms such as `presenterSummary`, `explanation`,
`implementationNotes`, `editImpact`, `riskNotes`, `stackContext`, and
`studyNotes`.

This matters because the feature is part of a production-minded internal ERP.
Faculty should see a traceability and debugging aid, not informal wording. The
registry therefore uses business and engineering language: route, API helper,
backend controller/service, Prisma model, source of truth, edit impact, and
risk notes.

## Build Phases

### Phase 0 - Typed Foundation

Status: implemented in `apps/web/src/lib/defense-trace/types.ts`.

Phase 0 defines:

- trace entry categories
- registry entry shape
- file references based on relative paths
- future open/copy strategies
- search command metadata
- workspace-root settings for per-machine path resolution
- resolved file target shape for future VS Code and copy actions

### Phase 1 - Initial Registry And Documentation

Status: implemented in `apps/web/src/lib/defense-trace/trace-registry.ts` and
`docs/defense-trace/`.

Phase 1 adds initial trace entries for the core defense surfaces:

- Dashboard
- Login/Auth
- Role Access
- Chart of Accounts
- Vouchers
- Trial Balance
- Business Overview
- Customers
- Customer Profile
- Attachments/Documents
- HR
- Payroll
- Sidebar/Navigation
- API Client
- Database/Prisma

Entries use verified relative project paths when known. When a path relationship
is intentionally distributed or not owned by a single backend controller, the
entry leaves `backendFiles` empty or partial and provides `rg` commands.

### Phase 2 - Trace Overlay UI

Not implemented in this phase.

Phase 2 can add a professional overlay that reads the registry and shows the
active route's trace entry. It should preserve all current app behavior, avoid
changing existing workflows, and keep display labels faculty-safe.

Expected Phase 2 UI capabilities:

- route-aware matching from `routePatterns`
- compact trace panel
- presenter mode
- hidden study notes mode
- quick copy of relative path or search command
- no backend/database changes

### Phase 3 - Portable VS Code Opening

Not implemented in this phase.

Phase 3 can add per-machine workspace root storage and construct VS Code file
links from relative paths. It should use `localStorage`, not Git-tracked config,
so the desktop and laptop can each keep their own workspace root.

### Phase 4 - Defense QA And Polish

Not implemented in this phase.

Phase 4 should test the overlay on the actual projector/laptop setup, verify
professional visible wording, confirm path actions, and keep fallback copy
actions available when a browser blocks custom URI links.

## How The Registry Powers Future UI

Each `DefenseTraceEntry` is a complete source map for one ERP concept. A future
overlay can:

1. Match the current route to `routePatterns`.
2. Display `label`, `presenterSummary`, and `stackContext`.
3. Show route, feature, API helper, backend, and Prisma file groups.
4. Provide copy/open actions from each `DefenseTraceFileReference`.
5. Offer `searchCommands` when exact ownership is distributed across modules.
6. Show `editImpact` and `riskNotes` before a developer edits code.
7. Keep `studyNotes` hidden until the presenter enables preparation mode.

This structure keeps the UI simple while preserving enough depth for a live
source-code explanation.

## How This Helps A Newer Full-Stack Presenter

The ERP has several layers: frontend routes, feature components, API helpers,
NestJS controllers/services, Prisma models, and PostgreSQL records. A newer
presenter can get lost if they jump straight into global search.

Defense Trace creates a reliable starting point:

- Frontend: shows which route and component render the visible screen.
- API helper: shows which typed browser-side function calls the REST API.
- Backend: shows the likely NestJS controller/service owner when verified.
- Database/Prisma: shows which models explain the stored business data.
- Safe edits: explains whether a change is frontend-only, backend/API, or
  database-backed.
- Search backup: gives `rg` commands when ownership is distributed or needs
  confirmation.

The result is a disciplined trace path from live UI to source code without
modifying ERP behavior.
