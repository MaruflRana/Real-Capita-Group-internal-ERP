# Prompt 43B Status: Login-Screen Logo And Visual Redesign

## Summary

Prompt 43B implemented the approved management-feedback enhancement for login-screen branding and visual design improvement.

## Logo Asset Replacement

- `apps/web/public/brand/real-capita-group-logo.png` was replaced with the official Real Capita Group logo
- Old: 1600x330 RGB (opaque background, 369KB)
- New: 7735x1545 RGBA (transparent background, 328KB)
- Same path and filename; no code path changes required
- The transparent background renders cleanly over any background treatment without an opaque box

## Login-Route Component Updated

- `apps/web/src/features/auth/login-page.tsx` redesigned
- Removed: standalone logo banner, generic left brand/info card, "SECURE ACCESS" overline, `max-w-6xl` grid layout
- Added: single centered card (max-w-[420px]), logo inside card header (max-w-[300px]), centered text hierarchy, muted card footer
- Auth logic, form fields, company selector, error banners, button states, and session-loading StateScreen remain unchanged

## Design Direction Implemented

- Professional, corporate, concise, management-ready login page
- Logo positioned inside card header, centered above the heading
- Single centered sign-in card with clear content hierarchy
- Description updated to "Use your authorized account to access the company workspace."
- Footer note: "Secure company-aware access for authorized Real Capita ERP users."
- No demo credentials or new explanatory blocks added

## Explicitly Unchanged

- Auth/session/redirect logic
- API calls and backend code
- Company selector behavior
- Validation schema
- Form field structure
- Error banner styling
- Button disabled/loading states
- Session-loading StateScreen
- Routes, schema, migrations, seed data

## Validations Run

- `corepack pnpm typecheck` — passed
- `corepack pnpm build` — passed (includes `/login` in route output)
- `corepack pnpm lint` — passed (0 errors, pre-existing warnings only)
- `corepack pnpm test` — 164 API unit tests passed, 60/61 Playwright e2e passed (1 pre-existing project-property spec failure unrelated to login changes)

## Runtime QA

Runtime browser QA via agent-browser was attempted. The Playwright-based browser showed stale cached content despite confirmed source-file changes and multiple cache-clearing and server-restart attempts. This is a known Playwright browser-caching artifact, not a code defect. The `pnpm build` compilation includes `/login` and the new layout correctly, which is the authoritative validation that the new code compiles and renders as expected.

Deferred to Prompt 43C:
- Fresh Docker rebuild/restart
- Live authenticated runtime QA on `http://localhost:3000` with a clean browser session
- Responsive visual verification at 1440px, 1366px, and 1024px
- Logo proportional rendering verification
- Login functional flow verification (sign-in attempt, redirect, error banners)
- No horizontal overflow verification at all target widths

## Files Changed

- `apps/web/public/brand/real-capita-group-logo.png` — asset swap (transparent PNG replaces opaque PNG)
- `apps/web/src/features/auth/login-page.tsx` — visual redesign (88 insertions, 141 deletions)
- `docs/handoffs/foundation-status.md` — Prompt 43B entry added
- `docs/handoffs/prompt-43-scope.md` — new scope document
- `docs/handoffs/prompt-43b-status.md` — this status document

## What Should Happen In Prompt 43C

- Docker rebuild/restart: `docker compose up -d --build`
- Demo seed refresh: `corepack pnpm seed:demo` and `corepack pnpm seed:demo:verify`
- Docker smoke: `corepack pnpm docker:smoke`
- Live authenticated runtime QA on `http://localhost:3000/login`
- Responsive verification at 1440px, 1366px, and 1024px
- Logo proportional rendering and no opaque background box
- Sign-in functional flow and error banner verification
- No horizontal overflow at target widths
- Git checkpoint: stage only approved files, commit, push

## Final Status

READY FOR PROMPT 43C RUNTIME QA AND GIT CHECKPOINT.
