# Prompt 46I Status: From-Scratch Sidebar/Navigation Color System Redesign

## Why Prompt 46I Was Needed After 46G/46H

Prompt 46G redesigned the sidebar structure, creating gradient backgrounds and brand accents. Prompt 46H added mixed brand accents (green dot markers, split text coloring, green left accent stripes). However, supervisor review concluded that the result still felt too close to a blue/navy sidebar with small green decorations — green was limited to thin accent lines, tiny dot markers, split text coloring, and role badges. The sidebar did not read as deliberately designed for Real Capita Group's mixed blue-green-sky identity.

The supervisor decision was to discard incremental color balancing and redesign the sidebar/navigation color system from scratch, where Real Capita's blue, green, sky, and navy colors feel intentionally distributed across the entire navigation system.

## Why Incremental Color Balancing Was Rejected

Incremental balancing (46H approach) added green accents to a navy-dominant sidebar structure. The result was still approximately 90% blue/navy/sky family with green appearing only as decoration (thin lines, dots, split text, badges). This approach cannot create a sidebar that reads as "Real Capita blue-green-sky branded navigation" because the background, active states, section structure, and footer all remained blue-dominant. Green was decoration-only, not structurally present.

## From-Scratch Color System Redesign

The 46I redesign rebuilds the sidebar color composition so that blue, green, and sky are all structurally present — appearing in backgrounds, active states, section dividers, footer anchoring, and identity accents — not just as small overlays on a navy slab.

### E1. Entire sidebar background architecture

The sidebar background gradient was completely redesigned from the 46G/46H vertical navy→indigo gradient to a blue-to-green vertical transition:

- `--sidebar-gradient-mid` changed from `209 54% 28%` (navy-mid, same hue as navy) to `204 48% 28%` (brand-blue-influenced mid-tone, visible hue shift from navy toward blue)
- `--sidebar-gradient-end` changed from `226 52% 34%` (brand-indigo) to `135 42% 20%` (dark green depth — same hue family as brand-green but at sidebar depth)
- New `--sidebar-green-depth: 135 42% 20%` added as a standalone token for direct reference

Computed sidebar background: `linear-gradient(rgb(23,62,99) → rgb(37,78,106) → rgb(30,72,40))` — navy at top, blue-influenced mid, green-depth at bottom. The bottom ~60% of the sidebar has visible green influence in the background itself, not just in overlay decoration.

The left accent bar was redesigned from alternating sky/green stripes (46H) to a sky→blue→green→green flow:
- `.sidebar-brand-accent-bar` (renamed from `.sidebar-dual-accent-bar`) uses `border-image: linear-gradient(sky/0.65 → blue/0.50 → green/0.60 → green/0.45)` — matching the sidebar's blue-to-green background flow

The right border changed from `brand-sky/35` to `brand-green/25` — green presence on the right edge.

### E2. Top brand identity block

- "Real Capita" label: unified in `text-brand-sky` (the logo blue, recognizable brand identity), "ERP" softened in `text-primary-foreground/60`
- Title: "Internal workspace" in `text-primary-foreground/80` (slightly softer for hierarchy)
- Brand accent line: replaced thin 2px×4rem sky→green bar with stronger 3px×6rem CSS utility class `sidebar-brand-accent-line` using `from-brand-blue/85 via-brand-green/75 to-brand-sky/60` — blue→green→sky three-color gradient, visibly wider and thicker
- Top accent background: `.sidebar-top-accent` gradient updated to include brand-blue at 15% position and stronger brand-green at 18% at 35% position (vs 46H's green/12 at 30%)
- Top section border: changed from `border-brand-sky/30` to `border-brand-green/30` — green dividers in the identity area

### E3. Active company card

- Background: CSS utility class `sidebar-company-card-bg` using `from-brand-blue/20 via-brand-green/20 to-brand-navy/35` — blue leads (operational identity), green structurally present in the middle at equal strength (20%), navy anchors
- Border: `border-brand-blue/45` (primary operational blue, not sky)
- Shadow: `rgba(0,111,183,0.12)` (brand-blue shadow)
- "Active company" label: `text-brand-sky/85`

### E4. Search area

- Section divider: `border-brand-green/20` (green presence in search section separator)
- Input: `border-brand-sky/30 bg-brand-sky/12` with `focus:border-brand-sky/60 focus:bg-brand-sky/18 focus:ring-brand-sky/45`
- Placeholder: `text-primary-foreground/50`
- Search dropdown background: `bg-gradient-to-b from-brand-navy/80 to-brand-green/25` — green tint at dropdown bottom

### E5. Section labels and group separators

- Active section dividers: `border-brand-green/30` (green borders, not sky — green in the structural rhythm)
- Active section markers: `before:w-2.5 before:bg-gradient-to-r before:from-brand-green/75 before:to-brand-sky/55` — wider markers (2.5 vs 2), stronger green (75% vs 70%), `before:mr-2`
- Inactive section dividers: `border-brand-sky/15` (reduced from 20%, subtle)

### E6. Navigation items — full redesign

- **Active state**: CSS utility class `sidebar-active-nav-bg` using `from-brand-sky/20 via-brand-green/15 to-brand-navy/10` — green is structurally present in the active state background, not just as a thin left accent. The gradient flows sky→green→navy.
- **Active borders**: `border-y border-brand-sky/40 border-l-[3px] border-l-brand-green/50` — 3px green left accent (vs 2px in 46H), sky top/bottom borders
- **Hover state**: `hover:bg-brand-sky/12` (slightly less tinted than 46H's 15%, cleaner default)
- **Shadow**: `rgba(0,111,183,0.14)` (brand-blue shadow)

### E7. Icon tile treatment

- **Default icon**: `border-brand-blue/15 bg-brand-blue/[0.06]` — primary operational blue for default icons (not sky)
- **Hover icon**: `group-hover:border-brand-sky/35` (sky on hover, transitioning from blue default)
- **Active icon**: CSS utility class `sidebar-active-icon-bg` using `from-brand-blue/25 via-brand-sky/20 to-brand-green/15` — blue→sky→green three-color gradient, all three brand colors present
- **Active icon border**: `border-brand-green/50`

### E8. Footer/session context block

- Border: `border-brand-green/35` (green closure signal, stronger than 46H's 25%)
- Background: CSS utility class `sidebar-footer-bg` using `from-brand-green/15 via-brand-blue/10 to-brand-navy/25` — green leads the footer gradient, matching the sidebar's overall blue-to-green flow
- Title: split `<span className="text-brand-sky/80">Session</span> <span className="text-brand-green/70">context</span>` (preserved from 46H)

## CSS Token and Utility Changes

### global.css:
- `--sidebar-gradient-mid` changed to `204 48% 28%` (blue-influenced, visible hue shift from navy)
- `--sidebar-gradient-end` changed to `135 42% 20%` (dark green depth)
- `--sidebar-green-depth: 135 42% 20%` added
- `--sidebar-accent-bar` and `--sidebar-section-marker` removed (no longer needed)
- `.sidebar-gradient-bg` mid-point changed from 50% to 40% (more prominent green zone)
- `.sidebar-top-accent` redesigned with brand-blue at 15% and stronger brand-green at 35%
- `.sidebar-dual-accent-bar` renamed to `.sidebar-brand-accent-bar` with sky→blue→green→green flow
- `.sidebar-active-nav-bg` added — sky→green→navy gradient for active nav items
- `.sidebar-active-icon-bg` added — blue→sky→green gradient for active icon tiles
- `.sidebar-brand-accent-line` added — blue→green→sky gradient for brand accent line
- `.sidebar-company-card-bg` added — blue→green→navy gradient for company card
- `.sidebar-footer-bg` added — green→blue→navy gradient for footer

### tailwind.config.ts:
- All brand color definitions updated to include `<alpha-value>` placeholder for proper opacity modifier support in gradient utilities
- `brand.sidebarAccentBar` and `brand.sidebarSectionMarker` removed
- `brand.sidebarGreenDepth` added

## Files Changed

### Prompt 46I-specific files (3 primary, plus status doc):

- `apps/web/src/app/global.css` — new sidebar gradient tokens, 5 new CSS utility classes, redesigned top-accent and accent-bar
- `apps/web/src/features/shell/app-shell.tsx` — from-scratch sidebar color redesign across all 8 sections (E1–E8)
- `apps/web/tailwind.config.ts` — `<alpha-value>` placeholder added to all brand colors, removed sidebarAccentBar/sidebarSectionMarker, added sidebarGreenDepth

### Full modified file list (cumulative 46B–46I):
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
- `apps/web/src/features/shell/app-shell.tsx` (46B+46F+46G+46H+46I)
- `apps/web/tailwind.config.ts` (46B+46D+46F+46G+46I)
- `docs/handoffs/foundation-status.md` (46B–46F cumulative)

### Untracked handoff docs:
- `docs/handoffs/prompt-46-scope.md` through `docs/handoffs/prompt-46h-status.md`
- `docs/handoffs/prompt-46i-status.md` (this document)

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | passed (0 errors, pre-existing warnings only) |
| Typecheck | `corepack pnpm typecheck` | passed for 5 projects |
| Build | `corepack pnpm build` | passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | passed (CRLF warnings only, no content errors) |
| Docker rebuild | `docker compose up -d --build web` | passed, containers healthy |

## Visual QA Routes and Viewport Coverage

Routes checked:

1. `/dashboard` at 1440px, 1366px, 1024px: NO_OVERFLOW at all widths
2. `/accounting/chart-of-accounts` at 1440px: NO_OVERFLOW, active state gradient confirmed
3. `/accounting/reports/business-overview` at 1440px: NO_OVERFLOW

CSS token verification confirmed all 46I changes are served:

- Sidebar background: `linear-gradient(rgb(23,62,99) → rgb(37,78,106) → rgb(30,72,40))` — navy→blue→green-depth gradient
- Active nav bg: `linear-gradient(to right, rgba(40,136,200,0.2) → rgba(17,172,56,0.15) → rgba(23,62,99,0.1))` — sky→green→navy
- Active icon tile: `linear-gradient(to right bottom, rgba(0,110,184,0.25) → rgba(40,136,200,0.2) → rgba(17,172,56,0.15))` — blue→sky→green
- Brand accent line: `linear-gradient(to right, rgba(0,110,184,0.85) → rgba(17,172,56,0.75) → rgba(40,136,200,0.6))` — blue→green→sky
- Company card: `linear-gradient(to right bottom, rgba(0,110,184,0.2) → rgba(17,172,56,0.2) → rgba(23,62,99,0.35))` — blue→green→navy
- Active nav left border: `rgba(17,172,56,0.5)` brand-green/50 (3px)
- Section divider: `rgba(17,172,56,0.3)` brand-green/30 (green dividers)
- Footer border: `rgba(17,172,56,0.35)` brand-green/35
- Right border: `rgba(17,172,56,0.25)` brand-green/25

Screenshots captured under `.tmp/prompt-46i-review/`.

## Materially More Balanced Assessment

The 46I sidebar now reads as a deliberately Real Capita blue-green-sky branded navigation system:

1. **Background**: The sidebar gradient transitions from navy (corporate authority) through blue (operational trust) to dark green depth (growth identity) — green is structurally present in the background itself, not decoration-only.

2. **Active nav state**: The active row background uses a sky→green→navy gradient where green is visibly present at 15% opacity across the entire item width, not just as a thin left stripe. The 3px green left accent reinforces this but the gradient itself carries green identity.

3. **Active icon tile**: Uses blue→sky→green gradient — all three brand colors present in the icon surface, making the active item unmistakably Real Capita-branded.

4. **Section structure**: Green borders (brand-green/30) create visible green rhythm throughout the navigation section structure, not just tiny dot markers.

5. **Footer anchoring**: Green leads the footer gradient at 15% with a green border at 35% — the navigation closes with a green anchor, matching the sidebar's overall blue-to-green flow.

6. **Brand identity area**: The 3px×6rem blue→green→sky accent line establishes the mixed brand identity at the top, wider and stronger than 46H's thin 2px×4rem line.

7. **Company card**: Blue leads (operational identity), green is equal strength in the middle (20%), creating a deliberately mixed identity surface rather than a sky-dominant card.

8. **Default icon tiles**: Use brand-blue (primary operational identity) for default state, creating a clear hierarchy: blue = default, sky+green gradient = active.

The sidebar now reads as "Real Capita blue-green-sky branded navigation" rather than "navy sidebar with green accents."

## Key Design Principle

Green is no longer decoration-only. It appears:
- In the sidebar background gradient (bottom 60%)
- In the active nav item background gradient (structural presence)
- In the active icon tile gradient (structural presence)
- In section divider borders (structural rhythm)
- In the footer gradient and border (structural closure)
- In the brand accent line (identity marker)
- In the company card gradient (equal strength with blue)
- In the accent bar gradient (transition from sky→blue→green)
- In the right sidebar border (structural presence)

Blue and sky also have structural roles:
- Blue leads the company card and default icon tiles (operational identity)
- Sky is the primary search accent and active nav base color (interaction identity)
- Navy provides supporting depth in backgrounds and gradient anchors (depth role)

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
- Print/receipt templates and login layout were not modified by Prompt 46I.
- Prompt 46I changes are limited to sidebar/navigation color-system redesign only — no business logic, route, auth, schema, seed, or workflow changes.
- The `<alpha-value>` placeholder was added to all brand color definitions in tailwind.config.ts, which is a broader change than just sidebar colors but is necessary for proper Tailwind opacity modifier support and is a correctness fix for the existing 46B–46H code as well.
- The `.sidebar-brand-accent-bar` uses CSS `border-image` which is well-supported in all modern browsers used for ERP operation.
- Critical gradient backgrounds use CSS utility classes (defined in global.css) rather than Tailwind JIT gradient utilities to ensure reliable rendering across all Tailwind build configurations.
