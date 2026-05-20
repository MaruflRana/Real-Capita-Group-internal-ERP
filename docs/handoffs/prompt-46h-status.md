# Prompt 46H Status: Sidebar Brand-Color Balance Refinement

## Why Prompt 46H Was Needed After 46G

Prompt 46G successfully redesigned the sidebar structure and made it significantly more premium and intentional than the 46F state. However, supervisor visual review after 46G concluded:

- The redesign is good.
- The sidebar is much better than before.
- However, it still feels too blue/navy-dominant.
- Real Capita's identity should come through as a more balanced mixture of blue, green, and sky/light blue.
- The sidebar should visibly reflect the company's mixed signature colors, not just look like a polished blue enterprise sidebar.

## Brand-Color Imbalance Identified

A detailed audit of every 46G sidebar element revealed that green appeared ONLY in role badges (`border-brand-green/55 bg-brand-green/20 text-brand-greenSoft`) — a tiny, isolated area. Every other sidebar element used sky/blue/navy/indigo exclusively:

1. Left accent bar: `border-l-brand-sky/70` — pure sky, no green
2. Top accent gradient: `from-brand-sky/18 via-brand-navy/95 to-brand-indigo/35` — all blue family
3. "Real Capita ERP" label: `text-brand-sky` — pure sky
4. Company card: `from-brand-sky/25 via-brand-indigo/20 to-brand-navy/40 border-brand-sky/50` — all blue family
5. Search: `border-brand-sky/35 bg-brand-sky/15 focus:ring-brand-sky/50` — all sky
6. Section labels: `text-brand-sky border-b border-brand-sky/30` — all sky
7. Active nav row: `bg-brand-sky/25 border-brand-sky/45` — all sky
8. Active icon tile: `border-brand-sky/55 bg-brand-sky/35 text-brand-sky` — all sky
9. Default icon tile: `border-brand-sky/15 bg-brand-sky/[0.08]` — all sky
10. Footer: `from-brand-navy/30 via-brand-indigo/20 text-brand-sky/80 border-brand-sky/25` — all blue family

The sidebar read as approximately 95% blue/sky/navy family with a tiny green badge. This confirmed the supervisor's feedback that it still felt blue-dominant rather than clearly Real Capita-branded.

## Blue-Green-Sky Distribution Improvements

### E1. Sidebar base accent mix — dual sky+green left accent bar
- Changed from single `border-l-brand-sky/70` to a dual-tone `sidebar-dual-accent-bar` CSS utility class
- The new class uses `border-image: linear-gradient(to bottom, brand-sky/70 → brand-green/55 → brand-sky/60 → brand-green/40)` — a sky-to-green gradient that alternates both brand tones along the full sidebar height
- This creates a visibly mixed Real Capita signature on the left edge rather than a pure blue stripe

### E2. Top identity area — mixed brand treatment
- "Real Capita ERP" label changed from uniform `text-brand-sky` to split coloring: `Real<span className="text-brand-green"> Capita</span> ERP` — "Real" in sky, "Capita" in green, immediately suggesting the mixed blue-green-sky identity
- Added a branded underline accent below the title: `h-[2px] w-16 rounded-full bg-gradient-to-r from-brand-sky/80 to-brand-green/70` — a visible sky-to-green gradient bar that establishes the mixed brand identity at the top
- `sidebar-top-accent` CSS gradient updated from sky→navy→indigo to sky/16→green/12→navy/95→indigo/28 — a green component now appears at 30% of the gradient

### E3. Active company card — mixed sky+green gradient
- Changed from `bg-gradient-to-br from-brand-sky/25 via-brand-indigo/20 to-brand-navy/40 border-brand-sky/50` to `bg-gradient-to-br from-brand-sky/22 via-brand-green/18 to-brand-navy/40 border-brand-sky/45`
- The via-color now uses `brand-green/18` instead of `brand-indigo/20` — green visibly appears in the card gradient alongside sky
- Border slightly adjusted from `brand-sky/50` to `brand-sky/45` for balanced emphasis

### E4. Search shell — sky remains primary (no change needed)
- Sky remains the primary search accent for usability and visual clarity
- Green accent would be distracting here; the dual-tone left accent bar and other mixed treatments already provide sufficient green presence

### E5. Section labels — green marker dots
- Active section labels now include a `before:inline-block before:h-[3px] before:w-2 before:rounded-full before:bg-gradient-to-r before:from-brand-green/70 before:to-brand-sky/60 before:mr-1.5 before:align-middle` pseudo-element — a small gradient dot (green to sky) before each active section title
- This introduces green into the section structure in a tasteful, restrained way
- Inactive sections remain at `border-brand-sky/20 text-primary-foreground/52` without the green dot marker

### E6. Navigation rows and active item — green accent stripe
- **Active nav row**: Changed from `bg-brand-sky/25 border border-brand-sky/45` to `bg-brand-sky/25 border-y border-brand-sky/40 border-l-[2px] border-l-brand-green/50` — the active row now has a 2px green left accent stripe alongside the sky background and sky top/bottom borders
- **Active icon tile**: Changed from `border-brand-sky/55 bg-brand-sky/35 text-brand-sky` to `border-brand-green/50 bg-gradient-to-br from-brand-sky/30 to-brand-green/15 text-brand-sky` — the active icon now has a green border and a sky-to-green gradient background, while keeping sky as the icon text color for consistency
- This creates a deliberate blue-green-sky hierarchy: sky base + green accent edge on the active row, reinforcing the mixed Real Capita identity

### E7. Footer/session context — mixed brand title
- Changed footer heading from `text-brand-sky/80 "Session context"` to split `<span className="text-brand-sky/80">Session</span> <span className="text-brand-green/70">context</span>` — dual sky+green treatment in the footer title
- Footer gradient changed from `bg-gradient-to-r from-brand-navy/30 via-brand-indigo/20 to-transparent` to `bg-gradient-to-r from-brand-green/12 via-brand-navy/30 to-brand-indigo/15` — green now appears at the start of the footer gradient

## CSS Token and Utility Changes

### global.css updates:
- `.sidebar-top-accent` gradient now includes `brand-green/12` at 30% position
- `.sidebar-dual-accent-bar` new CSS utility class added — `border-image` gradient alternating sky and green tones along the full sidebar height

### No tailwind.config.ts changes needed for 46H
- All color values use existing `brand-*` tokens already exposed in Tailwind

## Files Changed

### Modified (2 Prompt 46H-specific files, on top of existing 46B–46G changes):

- `apps/web/src/app/global.css` — updated `.sidebar-top-accent` gradient + added `.sidebar-dual-accent-bar` utility class
- `apps/web/src/features/shell/app-shell.tsx` — targeted color-balance refinements across sidebar elements

### Full modified file list (cumulative 46B–46H):
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
- `apps/web/src/features/shell/app-shell.tsx` (46B+46F+46G+46H)
- `apps/web/tailwind.config.ts` (46B+46D+46F+46G)
- `docs/handoffs/foundation-status.md` (46B–46F cumulative)

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

1. `/dashboard` at 1440px, 1366px, 1024px: NO_OVERFLOW, dual sky+green accent bar confirmed, mixed label colors confirmed
2. `/accounting/chart-of-accounts` at 1440px: NO_OVERFLOW, green left accent stripe on active row confirmed (`borderLeftColor: rgba(17,172,56,0.5)`)
3. `/accounting/reports/business-overview` at 1440px: NO_OVERFLOW, green left accent stripe confirmed

CSS token verification confirmed all 46H changes are served:
- Left accent bar: `border-image: linear-gradient(rgba(40,136,200,0.7) → rgba(17,172,56,0.55) → rgba(40,136,200,0.6) → rgba(17,172,56,0.4))` — dual sky+green gradient
- Active nav row: `borderLeftColor: rgba(17,172,56,0.5)` — green left accent stripe on active row
- Active icon tile: `borderTopColor: rgba(17,172,56,0.5)` — green border
- Sidebar gradient: `linear-gradient(rgb(23,62,99) → rgb(33,73,110) → rgb(42,63,132))` — preserved from 46G
- No overflow at any viewport width

## Materially More Balanced Assessment

The 46H sidebar now reads as a visibly more balanced Real Capita blue-green-sky identity:

1. **Left accent bar**: Dual sky+green gradient that alternates both brand tones — no longer a single blue stripe
2. **"Real Capita ERP" label**: "Real" in sky, "Capita" in green — immediately suggesting mixed identity
3. **Brand underline**: 2px sky-to-green gradient bar below the title — branded mixed identity marker
4. **Company card**: Sky-to-green gradient (`from-brand-sky/22 via-brand-green/18`) — green visibly represented alongside sky
5. **Active nav row**: Green left accent stripe (`border-l-brand-green/50`) alongside sky base — mixed brand hierarchy
6. **Active icon tile**: Green border + sky-to-green gradient background — mixed color treatment
7. **Active section labels**: Green-to-sky gradient dot markers — green distributed into section structure
8. **Footer**: Split sky+green title (`Session` sky, `context` green) + green in gradient start — mixed closure
9. **Role badges**: Green, but now better integrated because green appears across the entire sidebar

The sidebar now reads as "Real Capita blue-green-sky branded navigation" rather than "polished blue enterprise sidebar."

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
- Print/receipt templates and login layout were not modified by Prompt 46H.
- Prompt 46H changes are limited to sidebar/navigation color-balance refinements only — no business logic, route, auth, schema, seed, or workflow changes.
- The `.sidebar-dual-accent-bar` uses CSS `border-image` which has limited browser compatibility caveats but is well-supported in all modern browsers used for ERP operation.
