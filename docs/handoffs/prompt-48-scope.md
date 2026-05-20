# Prompt 48 Scope: ERP-Wide Visual Analytics Audit, Redundancy Map, and Redesign Blueprint

## Why This Workstream Was Opened

The supervisor paused Business Overview improvement because a more foundational issue must be addressed first: the ERP's visual analytics layer contains too many visuals, too much redundancy, and the prior visual work (Prompts 31–39, 46D) was technically clean but unsatisfactory in design impact. The ERP needs fewer, stronger, more meaningful, more professional visuals — and some may be better removed or consolidated rather than merely redesigned.

## Core Design Principle

"Fewer visuals, stronger visuals, clearer business meaning."

Do not assume every current chart deserves to survive.

## Prompt 48A: Visual Analytics Audit and Redundancy Blueprint

### Goal

Audit the entire ERP visual analytics layer. Produce a rigorous redundancy map and redesign blueprint. No implementation. No code edits. No CSS changes. No visual removals yet.

### Scope

- Inventory every visual representation in the frontend codebase
- Map where visuals appear across every ERP route
- Identify redundancy, clutter, repeated chart logic, and overdecoration
- Classify every visual element into: keep redesign, merge, remove, keep as-is, or defer
- Decide whether remove/consolidate-first or redesign-in-place is the best approach
- Propose a future visual architecture with hierarchy, placement rules, and anti-redundancy rules
- Recommend the Prompt 48B–48E implementation sequence

### Forbidden scope

- Editing any application code
- Modifying any CSS
- Removing any visual
- Redesigning any chart
- Staging, committing, or pushing
- Backend, API, schema, migration, seed, auth, routing, or workflow changes

### Allowed output

- Documentation only (prompt-48-scope.md, prompt-48a-status.md)
- Written analysis, tables, and recommendations
- No file edits outside docs/handoffs/

## Subsequent Prompts (after 48A approval)

### Prompt 48B — Remove and Consolidate Redundant Visuals
- Eliminate low-value or repeated visuals
- Simplify page structure
- Document what remains and why

### Prompt 48C — Rebuild Shared Visual Analytics Design System
- Chart shells, legends, labels, empty/loading states
- Tooltip treatment, consistent chart card hierarchy
- Shared visual primitives

### Prompt 48D — Redesign Retained High-Value Visuals by Priority
- Dashboard, Business Overview, other retained page visuals

### Prompt 48E — Final QA and checkpoint

Exact scope for 48B–48E will be refined after the 48A blueprint is approved by the supervisor.
