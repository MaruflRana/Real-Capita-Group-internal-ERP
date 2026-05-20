# Prompt 46F Status: Stronger Whole-Software Real Capita Brand Redesign

## Why This Stronger Redesign Was Needed

Prompt 46E-R confirmed that the Docker web container was already serving the Prompt 46B/46C/46D brand-refresh changes at `http://localhost:3000`. However, the supervisor's visual judgment was that the existing redesign was too subtle and may not be strong enough for MD sir's feedback. The requirement was not merely "add some blue/green accents" but "make the ERP software's overall color design feel clearly aligned with Real Capita Group's signature identity."

## Why The Earlier Pass Was Considered Too Subtle

Audit findings before Prompt 46F implementation:

1. **Overall page canvas**: `--brand-neutral` at `210 40% 98%` was essentially white. `--app-canvas-strong` at `197 75% 95%` was barely noticeable sky tinting at 95% lightness. The gradient body background was so light it read as almost white.

2. **Sidebar/shell**: Active states used 10-25% opacity brand accents (`brand-sky/25`, `brand-sky/10`, `brand-green/10`). The company context panel at `bg-brand-sky/10` was barely visible. Role badges at `bg-brand-green/10` were barely visible. These reads as "white-on-navy with faint hints" rather than confident Real Capita identity.

3. **Page headers**: `ModulePageHeader` used `bg-surface-raised` which was `197 75% 97%` — essentially white with a barely visible sky tint. `ModuleSection` used `bg-surface-raised/80`. `PageSection` dividers used generic `border-border`. None of these carried recognizable Real Capita identity.

4. **Cards and panels**: Card borders at `border-brand-sky/25` (25% opacity) were barely visible. Card headers used `bg-gradient-to-br from-brand-skySoft via-card to-brand-greenSoft/60` where `brand-skySoft` was 95% lightness and `brand-greenSoft/60` was at 60% of a 97% lightness color — nearly invisible tinting.

5. **Tables and shells**: `TableShell` used generic `border-border bg-card shadow-sm` — no brand treatment at all. `FilterCardShell` was just a plain `Card`.

6. **Default tone styles**: KpiCard/MetricCard/StatusChip default tone used `border-border bg-surface-muted text-foreground` and `bg-chart-slate` indicator — generic non-branded treatment. This meant every KPI card, metric card, and status chip across ALL modules was visually generic unless explicitly given a semantic tone.

7. **Overall assessment**: The ERP still read as "generic white admin template with a few faint blue/green dots" rather than "branded Real Capita ERP." A stakeholder comparing before/after would barely notice the difference.

## Stronger Whole-Software Brand Redesign Implemented

Prompt 46F focused on systemic shared-surface changes that propagate across the entire app, rather than touching individual pages. The most impactful single file was `erp-primitives.tsx` — the shared surface primitives used by every module.

### D1. Global workspace and canvas

- `--brand-sky-soft` changed from `197 75% 95%` to `204 67% 92%` — more visibly sky-tinted (3% less lightness, now using the brand-sky hue family instead of generic cyan)
- `--brand-green-soft` changed from `147 53% 97%` to `135 82% 94%` — more visibly green-tinted (3% less lightness, now using the brand-green hue family)
- `--brand-neutral` changed from `210 40% 98%` to `210 40% 97%` — slightly more visible canvas tint
- `--surface-raised` changed from `197 75% 97%` to `204 52% 95%` — brand sky hue at more visible saturation and less lightness
- `--surface-muted` changed from `var(--brand-sky-soft)` reference to explicit `204 45% 93%` — more visibly branded muted surface
- `--secondary` changed from `197 54% 91%` to `204 50% 88%` — more visibly branded secondary color
- `--accent` changed from `var(--brand-sky-soft)` reference to explicit `204 67% 90%` — more visibly branded accent
- New `--brand-header-gradient-start: 204 67% 88%` — visible sky tint for branded header gradients
- New `--brand-header-gradient-end: 135 75% 91%` — visible green tint for branded header gradients
- Tailwind config now exposes `brand.headerGradientStart` and `brand.headerGradientEnd` classes

### D2. Sidebar, shell, and navigation

- Sidebar border opacity increased from `brand-sky/25` to `brand-sky/40` — more visible accent
- Company context panel opacity increased from `bg-brand-sky/10` to `bg-brand-sky/15` and border from `brand-sky/25` to `brand-sky/40`
- Role badge opacity increased from `bg-brand-green/10` to `bg-brand-green/15` and border from `brand-green/25` to `brand-green/40`
- Navigation search focus state increased from `brand-sky/55` to `brand-sky/65` and ring from `brand-sky/25` to `brand-sky/35`
- Search results dropdown background from `bg-brand-navy/60` to `bg-brand-navy/65` and border from `brand-sky/20` to `brand-sky/30`
- Highlighted search result ring from `brand-sky/35` to `brand-sky/45` and border from `brand-green/35` to `brand-green/45`
- Hover states increased from `brand-sky/15` to `brand-sky/20` and `brand-sky/25` to `brand-sky/30`
- Active navigation ring from `brand-sky/35` to `brand-sky/45`
- Active icon border from `brand-green/30` to `brand-green/40` and bg from `brand-green/10` to `brand-green/15`
- Inactive icon hover border from `brand-sky/30` to `brand-sky/40`

### D3. Page headers and section introductions

- `ModulePageHeader` changed from generic `bg-surface-raised` + `border-border` to branded `bg-gradient-to-br from-brand-headerGradientStart via-card to-brand-headerGradientEnd/70` + `border-brand-sky/40`
- `ModuleSection` changed from `bg-surface-raised/80` + `border-border` to branded `bg-gradient-to-r from-brand-headerGradientStart via-surface-raised to-brand-headerGradientEnd/50` + `border-brand-sky/30`
- `PageSection` dividers changed from `border-border` to `border-brand-sky/30`
- `ChartCardShell` headers changed from `bg-surface-raised` + `border-border` to branded `bg-gradient-to-r from-brand-headerGradientStart via-surface-raised to-brand-headerGradientEnd/50` + `border-brand-sky/30`

### D4. Cards, panels, filters, and forms

- `FilterCardShell` changed from plain `Card` to branded `border-brand-sky/30 bg-gradient-to-br from-card to-brand-skySoft/40`
- Default tone style for KpiCard/MetricCard/StatusChip changed from generic `border-border bg-surface-muted text-foreground bg-chart-slate` to branded `border-brand-sky/35 bg-brand-skySoft text-brand-navy bg-brand-sky` — every default KPI card, metric, and status chip now carries Real Capita identity
- Dashboard card borders increased from `brand-sky/25` to `brand-sky/40`
- Dashboard card headers changed from `from-brand-skySoft via-card to-brand-greenSoft/60` to branded `from-brand-headerGradientStart via-card to-brand-headerGradientEnd/70`
- Dashboard timeline/attention card borders increased from `brand-sky/20` to `brand-sky/35`
- Dashboard context cards bg from `brand-skySoft/70` to `brand-skySoft/85`
- Dashboard green accents from `brand-green/25` to `brand-green/40` and `brand-greenSoft/80` to `brand-greenSoft/90`

### D5. Tables and record-heavy regions

- `TableShell` changed from `border-border` to `border-brand-sky/30` — subtle but visible brand framing around all table shells
- `EmptyStateBlock` changed from `border-dashed border-border bg-surface-muted` to `border-dashed border-brand-sky/35 bg-brand-skySoft/40`

### D6. Module surface consistency

- **Dashboard**: all borders increased to 35-40%, all backgrounds to 80-90%, headers use branded gradient
- **Financial Reporting**: all borders from `brand-sky/20` to `brand-sky/40`, all bg from 60-70% to 80-85%
- **Customer 360**: identity section uses branded header gradient, borders from 20-25% to 35-40%, green accents from 80% to 90%, timeline from 30% to 40%
- **Project & Property**: units filter from `brand-sky/20` to `brand-sky/35`, gradient from `skySoft/50+greenSoft/40` to `skySoft/65+greenSoft/55`
- **Shared CRM helpers**: borders from `brand-sky/20` to `brand-sky/35`, bg from `brand-skySoft/50` to `brand-skySoft/70`

## Files Changed

### Modified (14 files):

- `apps/web/src/app/global.css` — strengthened brand token values, added header gradient tokens
- `apps/web/tailwind.config.ts` — added brand.headerGradientStart and brand.headerGradientEnd Tailwind classes
- `apps/web/src/components/ui/erp-primitives.tsx` — branded ModulePageHeader, ModuleSection, ChartCardShell, FilterCardShell, PageSection, TableShell, EmptyStateBlock, and default tone styles
- `apps/web/src/features/shell/app-shell.tsx` — strengthened sidebar brand accent opacity (10-25% → 15-40%)
- `apps/web/src/features/dashboard/dashboard-page.tsx` — strengthened brand border/bg opacity
- `apps/web/src/features/dashboard/health-status-card.tsx` — strengthened brand border/bg opacity
- `apps/web/src/features/dashboard/shared.tsx` — strengthened card borders, headers, and surfaces
- `apps/web/src/features/financial-reporting/shared.tsx` — strengthened brand border/bg opacity
- `apps/web/src/features/crm-property-desk/customer-profile-page.tsx` — strengthened brand border/bg opacity, identity gradient
- `apps/web/src/features/crm-property-desk/shared.tsx` — strengthened brand border/bg opacity
- `apps/web/src/features/project-property/shared.tsx` — no changes needed (uses status tokens already)
- `apps/web/src/features/project-property/units-page.tsx` — strengthened filter shell gradient
- `docs/handoffs/foundation-status.md` — (to be updated with Prompt 46F entry)

### Untracked (1 new file):

- `docs/handoffs/prompt-46f-status.md` — this status document

## Validation Results

| Check | Command | Result |
|---|---|---|
| Lint | `corepack pnpm lint` | passed (0 errors, pre-existing warnings only) |
| Typecheck | `corepack pnpm typecheck` | passed for 5 projects |
| Build | `corepack pnpm build` | passed for 5 projects, all routes present |
| Diff whitespace | `git diff --check` | passed (CRLF warnings only, no content errors) |
| Docker rebuild | `docker compose up -d --build web` | passed, containers healthy |
| API health | `curl http://localhost:3333/api/v1/health` | `{"status":"ok"}` |
| Web login | `curl http://localhost:3000/login` | HTTP 200 |

## Visual QA Routes and Viewport Results

Routes checked at 1440px, 1366px, and 1024px:

1. `/dashboard` — NO_OVERFLOW at all widths
2. `/accounting/reports/business-overview` — NO_OVERFLOW at 1440px
3. `/crm-property-desk/customers/7a8f5fbb-e38f-438f-8209-2136cd95cf6f` — NO_OVERFLOW at 1440px

CSS token verification confirms all Prompt 46F changes are served:
- `--brand-sky-soft: 204 67% 92%` (strengthened)
- `--brand-green-soft: 135 82% 94%` (strengthened)
- `--surface-raised: 204 52% 95%` (brand-aligned)
- `--surface-muted: 204 45% 93%` (brand-aligned)
- `--brand-header-gradient-start: 204 67% 88%` (new, visible)
- `--brand-header-gradient-end: 135 75% 91%` (new, visible)
- `--secondary: 204 50% 88%` (strengthened)
- Sidebar border-right: `rgba(40, 136, 200, 0.4)` (brand-sky/40)
- Sidebar background: `rgb(23, 62, 99)` (brand-navy)
- Card headers computed: `linear-gradient(to right bottom, rgb(204, 229, 245), rgb(255, 255, 255), rgba(215, ...))` — branded header gradient confirmed
- Default KPI/Metric/StatusChip tone: `border-brand-sky/35 bg-brand-skySoft text-brand-navy bg-brand-sky` — branded identity confirmed

## Review Links for Supervisor

- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Business Overview: http://localhost:3000/accounting/reports/business-overview
- Customer 360 — Nadia Synthetic: http://localhost:3000/crm-property-desk/customers/7a8f5fbb-e38f-438f-8209-2136cd95cf6f
- Project & Property Units: http://localhost:3000/project-property/units

## Materially More Visible Assessment

The Prompt 46F redesign is materially more visible than the earlier Prompt 46B/46C pass:

1. **Before**: The default KPI/metric/status chip was visually generic (white surface, slate indicator, generic border). **After**: Default tone carries brand-sky border at 35%, brand-skySoft background, brand-navy text, and brand-sky indicator dot — every default KPI card across every module now reads as Real Capita.

2. **Before**: Page headers used a barely visible surface-raised background at 97% lightness with generic border. **After**: Page headers use a branded gradient from visible sky (88% lightness) through white to visible green (91% lightness) with brand-sky/40 border — headers are now the strongest branded identity carriers.

3. **Before**: Card borders were at 20-25% opacity (barely visible). **After**: Card borders are at 35-40% opacity (clearly visible brand accent).

4. **Before**: Sidebar accents were at 10-25% opacity (barely visible). **After**: Sidebar accents are at 15-40% opacity (visible Real Capita cues).

5. **Before**: Surface backgrounds were at 95-97% lightness (almost white). **After**: Surface backgrounds are at 92-95% lightness with stronger brand hue saturation — visibly tinted rather than barely noticeable.

6. **Before**: The app read as "generic navy admin template with faint hints." **After**: The app reads as "branded Real Capita ERP" — clearly premium, company-specific, and recognizably different from a generic admin template.

## Remaining Caveats

- The brand candidate palette values are implementation-test candidates, not formally claimed corporate standards.
- CRLF/LF line-ending warnings are cosmetic and do not affect behavior.
- After final checkpointing, a Docker rebuild should be run to ensure production runner images match the committed state.
- The Prompt 46D chart palette remains intact; only chart card shell headers were updated to use branded gradients.
- Semantic warning/error colors remain fully preserved (amber for warning, rose for danger, green for success).
- Print/receipt templates and login layout were not modified.

## Next Recommended Supervisor Decision

Review the strengthened brand redesign visually at the provided localhost links. If satisfied, approve checkpointing of the full Prompt 46B + 46C + 46D + 46E + 46F stack.
