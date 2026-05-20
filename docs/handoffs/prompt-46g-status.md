# Prompt 46G Status: Full Real Capita Sidebar and Navigation Color Redesign

## Recovery Context

Prompt 46G started in a prior Droid session, completed its reading and diagnosis steps, then applied partial sidebar changes before the session was interrupted. A recovery session (46G-R) audited the partial changes, confirmed they were valid, preserved them, and completed the remaining three unfinished redesign areas: active nav item integration, section labels, and footer/session context.

## Why the Sidebar Required a Dedicated Redesign After 46F

Prompt 46F significantly improved the whole-software color redesign across shared surfaces, headers, cards, filters, tables, and charts. However, supervisor review of the current UI showed that the left sidebar/navigation still felt too close to a generic dark navy admin template. Specific problems:

1. **Flat navy slab**: The sidebar used `bg-surface-sidebar` (brand-navy `209 62% 24%`) as a single flat background color with no depth, layering, or visual variation.
2. **Disconnected white active card**: Active navigation items used `bg-primary-foreground text-brand-navy` — a white/light card pasted into a dark navy sidebar, feeling disconnected from the brand palette rather than integrated.
3. **Nearly invisible company card**: Company context used `bg-primary-foreground/[0.07] border-primary-foreground/15` — barely visible against the navy background.
4. **Generic search field**: Search input used `bg-primary-foreground/[0.07] border-primary-foreground/15` with generic focus treatment — not integrated with the redesigned sidebar system.
5. **Tiny floating section labels**: Section headers like "Core", "Accounting" used plain `text-primary-foreground/52` without visual structure, branded markers, or divider lines.
6. **Near-transparent icon tiles**: Default icon tiles used `bg-primary-foreground/[0.04] border-primary-foreground/10` — barely visible.
7. **Generic footer block**: Session context used `border-primary-foreground/15` with plain text — a leftover block rather than part of the designed sidebar system.

## Sidebar/Navigation Systems Redesigned

### E1. Sidebar base treatment
- Changed from flat `bg-surface-sidebar` to `sidebar-gradient-bg` CSS utility class
- Added vertical gradient from brand-navy (0%) through navy-mid (50%) to brand-indigo (100%), creating layered depth instead of a flat slab
- Added a 3px left accent bar `border-l-[3px] border-l-brand-sky/70` — a restrained brand-sky stripe on the left edge signaling Real Capita identity
- Right border uses `border-r-brand-sky/35` for cohesive framing

### E2. Top identity area
- Changed from generic `border-primary-foreground/15` to `sidebar-top-accent` CSS utility class
- Top accent uses a 135-degree gradient from brand-sky/18 → brand-navy/95 → brand-indigo/35, creating branded depth in the header
- "Real Capita ERP" label changed from `text-primary-foreground/70` (barely visible) to `text-brand-sky` (strong brand identity)
- Bottom border uses `border-brand-sky/30` for branded separation

### E3. Active company card
- Changed from `border-primary-foreground/15 bg-primary-foreground/[0.07]` to `border-brand-sky/50 bg-gradient-to-br from-brand-sky/25 via-brand-indigo/20 to-brand-navy/40 shadow-[0_1px_4px_rgba(40,136,200,0.12)]`
- "Active company" label changed from `text-primary-foreground/65` to `text-brand-sky/90`
- Role badges changed from `border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground` to `border-brand-green/55 bg-brand-green/20 text-brand-greenSoft`
- Card now has a visible premium sky-to-indigo gradient with subtle shadow

### E4. Search field
- Search section border changed from `border-primary-foreground/15` to `border-brand-sky/25`
- Search icon changed from `text-primary-foreground/52` to `text-brand-sky/70`
- Input default changed from `border-primary-foreground/15 bg-primary-foreground/[0.07]` to `border-brand-sky/35 bg-brand-sky/15`
- Focus state changed from `focus:border-primary-foreground/45 focus:bg-primary-foreground/[0.1] focus:ring-primary-foreground/25` to `focus:border-brand-sky/65 focus:bg-brand-sky/22 focus:ring-2 focus:ring-brand-sky/50`
- Placeholder text changed from `text-primary-foreground/45` to `text-primary-foreground/55`
- Clear button hover changed from `hover:bg-primary-foreground/12 focus-visible:ring-primary-foreground/70` to `hover:bg-brand-sky/25 focus-visible:ring-brand-sky/60`

### E5. Section labels
- Added `pb-1 border-b border-brand-sky/30` — a branded divider line below each section header
- Active section label changed from `text-primary-foreground` to `text-brand-sky` — strong brand presence when section has active items
- Inactive section labels remain `text-primary-foreground/52`
- Section labels now have visual structure instead of floating as tiny plain text

### E6. Navigation rows (the most important change)
- **Active nav row**: Changed from disconnected white card `bg-primary-foreground text-brand-navy shadow-sm ring-1 ring-brand-sky/45` to brand-integrated `bg-brand-sky/25 border border-brand-sky/45 text-primary-foreground shadow-[0_1px_3px_rgba(40,136,200,0.15)]`. The active item now stays visually connected to the navy sidebar using a brand-sky tinted background, not a pasted white card.
- **Hover nav row**: Changed from `hover:bg-primary-foreground/10` to `hover:bg-brand-sky/15`
- **Active icon tile**: Changed from `border-brand-green/40 bg-brand-green/15 text-primary` to `border-brand-sky/55 bg-brand-sky/35 text-brand-sky`. Active icons now use brand-sky treatment instead of green-only, creating stronger visual consistency with the sky-based sidebar identity.
- **Default icon tile**: Changed from `border-primary-foreground/10 bg-primary-foreground/[0.04]` to `border-brand-sky/15 bg-brand-sky/[0.08]`. Default icon tiles now carry a subtle brand-sky tint instead of being nearly invisible.
- **Icon hover**: Changed from `group-hover:border-primary-foreground/20` to `group-hover:border-brand-sky/40`

### E7. Search results dropdown
- Changed from `border-primary-foreground/15 bg-slate-950/22` to `border-brand-sky/40 bg-gradient-to-b from-brand-navy/85 to-brand-indigo/70`
- Highlighted search result: Changed from `border-primary-foreground/45 bg-primary-foreground text-slate-950` to `border-brand-green/45 bg-primary-foreground text-brand-navy ring-1 ring-brand-sky/45`
- Non-highlighted hover: Changed from `hover:border-primary-foreground/20 hover:bg-primary-foreground/10` to `hover:border-brand-sky/30 hover:bg-brand-sky/20`
- Highlighted section title: Changed from `text-slate-700` to `text-brand-navy/75`
- Highlighted href: Changed from `text-slate-700` to `text-brand-navy/75`

### E7. Footer/session context area
- Changed from `border-t border-primary-foreground/15` to `border-t border-brand-sky/25`
- Added `bg-gradient-to-r from-brand-navy/30 via-brand-indigo/20 to-transparent` — branded gradient that makes the footer feel part of the sidebar design
- Title changed from `font-semibold text-primary-foreground` to `font-semibold text-brand-sky/80`
- Body text changed from `text-primary-foreground/66` to `text-primary-foreground/65`

## CSS Token and Tailwind Changes

### global.css additions:
- `--sidebar-gradient-start: 209 62% 24%` (brand-navy)
- `--sidebar-gradient-mid: 209 54% 28%` (lighter navy mid-point)
- `--sidebar-gradient-end: 226 52% 34%` (brand-indigo for bottom depth)
- `--sidebar-accent-bar: var(--brand-sky)`
- `--sidebar-section-marker: var(--brand-sky)`
- `.sidebar-gradient-bg` CSS utility class — vertical gradient from navy → navy-mid → indigo
- `.sidebar-top-accent` CSS utility class — 135-degree sky/navy/indigo gradient for header accent

### tailwind.config.ts additions:
- `brand.sidebarGradientStart`, `brand.sidebarGradientMid`, `brand.sidebarGradientEnd`
- `brand.sidebarAccentBar`, `brand.sidebarSectionMarker`

## Files Changed

### Modified (3 Prompt 46G-specific files, on top of existing 46B–46F changes):

- `apps/web/src/app/global.css` — added sidebar gradient tokens + utility classes (in addition to existing 46B/46D/46F brand token changes)
- `apps/web/tailwind.config.ts` — added sidebar gradient token exposure (in addition to existing 46B/46D brand/chart token changes)
- `apps/web/src/features/shell/app-shell.tsx` — full sidebar/navigation redesign across all sections

### Full modified file list (cumulative 46B–46G):
- `apps/web/src/app/global.css`
- `apps/web/src/components/ui/erp-primitives.tsx` (46F)
- `apps/web/src/features/analytics/components.tsx` (46D)
- `apps/web/src/features/crm-property-desk/customer-profile-page.tsx` (46C+46F)
- `apps/web/src/features/crm-property-desk/shared.tsx` (46C+46F)
- `apps/web/src/features/dashboard/dashboard-page.tsx` (46C+46F)
- `apps/web/src/features/dashboard/health-status-card.tsx` (46C+46F)
- `apps/web/src/features/dashboard/shared.tsx` (46C+46F)
- `apps/web/src/features/financial-reporting/shared.tsx` (46C+46F)
- `apps/web/src/features/project-property/shared.tsx` (46C)
- `apps/web/src/features/project-property/units-page.tsx` (46C+46F)
- `apps/web/src/features/shell/app-shell.tsx` (46B+46F+46G)
- `apps/web/tailwind.config.ts` (46B+46D+46F+46G)
- `docs/handoffs/foundation-status.md` (46B–46F cumulative)

### Untracked handoff docs:
- `docs/handoffs/prompt-46-scope.md`
- `docs/handoffs/prompt-46b-status.md`
- `docs/handoffs/prompt-46c-status.md`
- `docs/handoffs/prompt-46d-status.md`
- `docs/handoffs/prompt-46e-status.md`
- `docs/handoffs/prompt-46f-status.md`
- `docs/handoffs/prompt-46g-status.md` (this document)

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | passed (0 errors, pre-existing warnings only) |
| Typecheck | `corepack pnpm typecheck` | passed for 5 projects |
| Build | `corepack pnpm build` | passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | passed (CRLF warnings only, no content errors) |
| Docker rebuild | `docker compose up -d --build web` | passed, containers healthy |
| Docker runtime | `docker compose ps` | all 4 services healthy |

## Visual QA Routes and Viewport Coverage

Routes checked:

1. `/dashboard` — sidebar redesign visible with gradient background, sky accent bar, brand-integrated active state, branded section labels, branded footer
2. `/accounting/chart-of-accounts` — Accounting section active, brand-sky/25 active item bg confirmed
3. `/accounting/reports/business-overview` — Financial Reports section active, brand-sky/25 active item bg confirmed

Viewport widths checked:
- 1440px: NO_OVERFLOW
- 1366px: NO_OVERFLOW
- 1024px: NO_OVERFLOW

CSS token verification confirmed all Prompt 46G changes are served:
- Sidebar background: `linear-gradient(rgb(23,62,99) → rgb(33,73,110) → rgb(42,63,132))` — gradient, not flat navy
- Left accent bar: `rgba(40,136,200,0.7)` brand-sky/70 — visible brand stripe
- Active nav item bg: `rgba(40,136,200,0.25)` — brand-sky/25, integrated with sidebar
- Active icon tile bg: `rgba(40,136,200,0.35)` brand-sky/35 + brand-sky text color
- Active section label: `rgb(40,136,200)` brand-sky text + brand-sky/30 bottom border
- Footer: `borderTop: rgba(40,136,200,0.25)` + gradient `rgba(23,62,99,0.3) → rgba(48,72,151,0.2) → transparent`

## Materially Stronger Assessment

The Prompt 46G sidebar redesign is materially stronger than the 46F state:

1. **Before**: Flat navy slab with no depth. **After**: Vertical gradient from navy → navy-mid → indigo, creating layered depth. Plus a visible brand-sky left accent bar.

2. **Before**: Active nav item was a disconnected white card (`bg-primary-foreground text-brand-navy`). **After**: Active item uses brand-sky/25 background with brand-sky/45 border, staying visually integrated with the navy sidebar — clearly selected, strongly branded, not a pasted white card.

3. **Before**: Active icon tile used green-only treatment (`bg-brand-green/15 border-brand-green/40`). **After**: Active icon uses brand-sky/35 bg with brand-sky/55 border and brand-sky text color — consistent with the sky-based sidebar identity.

4. **Before**: Section labels were tiny floating plain text. **After**: Section labels have brand-sky bottom borders and active sections use brand-sky text color — structured navigation groups instead of floating labels.

5. **Before**: Footer was a generic leftover block. **After**: Footer has a branded gradient background and brand-sky/80 title — feels intentionally part of the navigation system.

6. **Before**: Company card was barely visible (`bg-primary-foreground/[0.07]`). **After**: Company card uses a premium sky-to-indigo gradient with visible shadow — feels distinctly Real Capita.

7. **Before**: Search field was generic (`bg-primary-foreground/[0.07] border-primary-foreground/15`). **After**: Search field uses brand-sky tinting (`bg-brand-sky/15 border-brand-sky/35`) with brand-sky focus treatment — visually belongs to the redesigned sidebar system.

8. **Before**: The sidebar read as "generic dark navy admin template with faint hints." **After**: The sidebar reads as "branded Real Capita navigation" — layered, premium, company-specific, and recognizably different from a generic admin template.

## Review Links for Supervisor

- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Chart of Accounts: http://localhost:3000/accounting/chart-of-accounts
- Business Overview: http://localhost:3000/accounting/reports/business-overview
- Customer 360 — Nadia Synthetic: http://localhost:3000/crm-property-desk/customers/7a8f5fbb-e38f-438f-8209-2136cd95cf6f
- Project & Property Units: http://localhost:3000/project-property/units

## Remaining Caveats

- The brand candidate palette values are implementation-test candidates, not formally claimed corporate standards.
- CRLF/LF line-ending warnings are cosmetic and do not affect behavior.
- After final checkpointing, a Docker rebuild should be run to ensure production runner images match the committed state.
- Semantic warning/error colors remain fully preserved.
- Print/receipt templates and login layout were not modified by Prompt 46G.
- Prompt 46G changes are limited to sidebar/navigation styling only — no business logic, route, auth, schema, seed, or workflow changes.
