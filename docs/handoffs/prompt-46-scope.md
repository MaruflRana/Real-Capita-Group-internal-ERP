# Prompt 46 Scope: Real Capita Brand Color Identity Refresh

Prompt 46 is the approved color-identity continuation after the README/runbook refresh and Prompt 46A analysis. The management feedback item is:

> Improve the ERP color design so it better reflects Real Capita Group's signature brand identity, especially blue, green, and sky-tone families.

## Source Of Truth

- `AGENTS.md`
- `README.md`
- `docs/architecture/phase-1-architecture-baseline.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-43-scope.md`
- `docs/handoffs/prompt-43e-status.md`
- `docs/handoffs/prompt-44-scope.md`
- `docs/handoffs/prompt-44d-status.md`
- `docs/operations/phase-1-route-inventory.md`
- `docs/release/demo-readiness-guide.md`
- `apps/web/public/brand/real-capita-group-logo.png`

## Prompt 46A Conclusion

- The current theme is centralized through global CSS variables and Tailwind semantic tokens.
- The ERP visual system is coherent but still reads as a generic navy/cyan enterprise theme rather than distinctly Real Capita.
- No formal official palette was found in the repository.
- The approved implementation direction is a logo-derived, brand-informed candidate palette for controlled testing.

## Candidate Palette For Implementation Testing

- Primary operational blue: `#006FB7`
- Brand sky/logo blue: `#2888C8`
- Brand green accent: `#11AA38`
- Deep shell/nav blue: `#173E62`
- Deep secondary logo blue: `#304898`
- Soft sky surface: `#EAF7FC`
- Soft green support surface: `#F2FBF6`
- Neutral readable base: `#F8FAFC`

## Brand Strategy

- Blue is the primary operational and action identity.
- Green is the supporting growth, trust, and brand accent.
- Sky/light blue is the atmospheric surface tint.
- Deep blue is the shell/sidebar depth.
- Neutral white/slate surfaces preserve ERP readability.
- Red and amber semantic error/warning behavior must remain intact.

## Prompt 46B Scope

Prompt 46B implements the first controlled design-system step: Global Real Capita Brand Token Refresh.

Approved implementation order:

1. Update centralized global brand tokens first.
2. Align Tailwind semantic token exposure with the refreshed brand palette.
3. Adjust app shell/sidebar classes only where token changes alone are insufficient.
4. Touch shared UI components only when hardcoded colors block the token strategy.
5. Record the handoff status and validation results.

## Prompt 46C Scope

Prompt 46C implements the second controlled design step: High-Visibility Product Surface Polish.

This phase builds directly on the uncommitted Prompt 46B token refresh. It does not restart the color-system plan and does not replace the global token work. The approved target is limited page/component surface refinement where token inheritance alone leaves visible product areas looking generic.

Priority surfaces:

1. Dashboard context, health, summary, quick-action, attention, and timeline surfaces.
2. Financial reporting screen-only filter/context/value/assumption surfaces.
3. CRM Customer 360 identity, commercial summary, transaction-history, and activity framing.
4. One representative Project/Property record surface where high-impact polish is justified.
5. Shared CRM and Project/Property callout helpers only where hardcoded generic status colors conflict with the refreshed semantic token system.

Prompt 46C must preserve:

- existing layouts and displayed business data
- REST-only frontend/API boundary
- semantic danger and warning behavior
- existing chart-series palettes
- print, report-template, and receipt-template output
- login layout and authentication behavior

## Prompt 46C Completion Direction

Prompt 46C completion should leave the product surfaces visually more aligned to the Real Capita blue, green, sky, deep-blue, and neutral identity while remaining restrained. The next planned design phase is Prompt 46D for chart and data-visualization palette work.

## Prompt 46D Scope

Prompt 46D implements the third controlled design step: Chart/Data Visualization Brand Palette.

This phase builds directly on the uncommitted Prompt 46B + 46C brand-refresh state. It does not restart the color-system plan and does not replace the global token or product-surface work.

Approved implementation direction:

1. Remap centralized chart CSS variables to the Real Capita brand family (blue, sky, green, navy, indigo) while preserving semantic amber/rose for warning/danger and slate for neutral/de-emphasis.
2. Refresh Tailwind chart token exposure to match the new CSS variable names.
3. Adjust chart tone style mapping in the central analytics components only where the new bar colors make the soft/text/primitiveTone assignments inconsistent.
4. Do not change chart layouts, card shells, bar widths, legend structure, or component structure.

Prompt 46D must preserve:

- existing chart layouts and component structure
- REST-only frontend/API boundary
- semantic danger (rose), warning (amber), and success (green) meaning
- print, report-template, and receipt-template output
- login layout and authentication behavior
- all Prompt 46B and 46C product-surface work

## Prompt 46D Completion Direction

Prompt 46D completion should leave the chart/data-visualization palette visually aligned to the Real Capita blue, green, sky, and deep-blue brand identity while preserving readability, series differentiation, and semantic meaning. The next potential design phase is Prompt 46E for final QA/checkpoint preparation or for any residual brand-alignment work the supervisor identifies.

## Explicit Deferrals

- No broad page redesign.
- No route-by-route visual polish.
- No dashboard, Customer 360, CRM panel, report, or receipt redesign.
- No chart palette overhaul; this is reserved for Prompt 46D.
- No backend, API, Prisma schema, migration, seed-data, auth, routing, access-role, print-template, or report-template changes.
- No formal claim that the candidate palette is an official corporate standard.
