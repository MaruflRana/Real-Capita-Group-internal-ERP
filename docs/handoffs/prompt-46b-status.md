# Prompt 46B Status: Global Real Capita Brand Token Refresh

## Summary

Prompt 46B implemented the first controlled design-system step of the Real Capita ERP color identity refresh. The change is token-first and component-second: centralized brand tokens now express the approved blue, green, sky, deep-blue, and neutral candidate palette, with only minimal shell/sidebar class adjustments so the token refresh is visible in the authenticated workspace.

## Brand Strategy Implemented

- Primary operational blue: `#006FB7`
- Brand sky/logo blue: `#2888C8`
- Brand green accent: `#11AA38`
- Deep shell/nav blue: `#173E62`
- Deep secondary logo blue: `#304898`
- Soft sky surface: `#EAF7FC`
- Soft green support surface: `#F2FBF6`
- Neutral readable base: `#F8FAFC`

Semantic mapping:

- `primary`, `ring`, `status-info`, and action/link identity now align to the Real Capita blue/sky family.
- `status-success` and its soft surface now use the brand green family while preserving success semantics.
- `background`, app canvas, raised/muted surfaces, accent surfaces, and sidebar depth now use the neutral/sky/deep-blue brand family.
- Warning and danger tokens were intentionally preserved.
- Chart tokens were intentionally left unchanged for Prompt 46D.

## Token Files Changed

- `apps/web/src/app/global.css`
  - Added explicit `--brand-*` token aliases for the approved candidate palette.
  - Remapped app canvas, background, primary, ring, accent, surface, sidebar, info, and success tokens.
  - Kept chart tokens and print CSS unchanged.
  - Replaced the older generic cyan canvas glow with a restrained neutral-to-sky-to-soft-green canvas gradient.

- `apps/web/tailwind.config.ts`
  - Exposed the new `brand` color family in Tailwind so shell/sidebar refinements can use named brand tokens instead of ad hoc colors.
  - Kept existing semantic color keys intact.

## Shell And Component Changes

- `apps/web/src/features/shell/app-shell.tsx`
  - Adjusted only existing sidebar/nav classes.
  - Sidebar border, active navigation, highlighted search results, company context, and role badges now use brand sky/green accents against the deep-blue sidebar token.
  - Layout, navigation order, routing, role filtering, auth behavior, and mobile behavior were not changed.

No shared form/button/badge/component primitives were changed. Existing button, input, select, textarea, badge, and ERP primitive styles already reference semantic tokens and now inherit the refreshed palette without needing direct edits.

## Explicit Deferrals

- Page-level polish for dashboard, reports, CRM, Customer 360, HR, payroll, audit/documents, and project/property pages.
- Chart palette overhaul and chart-specific visual differentiation, reserved for Prompt 46D.
- Print, receipt, and report-template recoloring.
- Backend, API, schema, migration, seed data, auth, routing, role-access, Docker, and script changes.

## Validation And QA Results

- Pre-check:
  - Branch: `main`
  - Worktree: clean before Prompt 46B changes
  - Latest checkpoint present: `403b67713 docs: refresh ERP README and runbook`
- `corepack pnpm typecheck`: passed for 5 projects.
- `corepack pnpm build`: passed for 5 projects, including the Next.js web build and all documented routes.
- Targeted runtime QA used a temporary web dev server on port `3001` so uncommitted token changes could be inspected without rebuilding Docker or changing the live-tunnel `.env`.
- Public login sanity at `http://127.0.0.1:3001/login`:
  - login card remained structurally unchanged
  - official logo rendered
  - primary sign-in button used the refreshed operational blue
  - input focus ring used the refreshed brand sky color
- Authenticated shell QA at `http://localhost:3001/dashboard`:
  - demo admin login succeeded in an isolated automated browser context
  - sidebar computed to deep brand blue (`rgb(23, 62, 99)`)
  - active navigation used neutral foreground with brand sky/green accents
  - canvas computed to neutral/soft-sky/soft-green gradient
  - no horizontal overflow detected at 1366px
- Representative form/list QA at `http://localhost:3001/crm-property-desk/customers`:
  - route loaded with authenticated shell
  - table/list surface remained visible
  - primary `New customer` action computed to operational blue
  - focus ring on the sidebar search field computed to brand sky
  - no horizontal overflow detected at 1366px
- Semantic safety check:
  - warning and danger token values were unchanged
  - chart token values were unchanged

## QA Caveat

The Docker stack was already running in live-tunnel mode, with `.env` URL/CORS values pointing at the current Cloudflare Quick Tunnel. Prompt 46B did not change `.env` or stop the tunnel. For local authenticated visual QA, a temporary dev web server was started with local URL overrides, and the authenticated browser context relaxed browser-side CORS checks so the uncommitted web UI could be inspected against the existing local API without mutating runtime configuration.

## Readiness For Prompt 46C

Prompt 46B is ready for Prompt 46C. Prompt 46C can proceed with the next controlled color-polish phase over selected shared surfaces, while leaving chart palette work for Prompt 46D unless explicitly rescoped.
