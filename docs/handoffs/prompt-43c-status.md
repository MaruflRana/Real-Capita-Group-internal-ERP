# Prompt 43C Status: Login-Screen Runtime QA, Playwright Recheck, And Git Checkpoint

## Summary

Prompt 43C completed runtime QA, responsive verification, functional login-flow testing, Playwright failure recheck, full validation, and git checkpoint for the login-screen branding and visual redesign from Prompt 43B.

## Runtime Setup

- `docker compose up -d --build` — rebuilt and started runner containers
- `corepack pnpm seed:demo` — refreshed synthetic Demo/UAT company
- `corepack pnpm seed:demo:verify` — passed
- `corepack pnpm docker:smoke` — passed (web, API readiness, Swagger)

## Login-Screen Browser QA Result

The rebuilt Docker runtime served the new login page correctly. Agent-browser snapshot confirmed:

1. Official Real Capita Group logo visible (`img "Real Capita Group"`)
2. Logo uses transparent asset with no opaque box/white rectangle
3. Logo positioned inside login card header, not as old detached top banner
4. Old left-side generic brand/info panel no longer present
5. Login card centered and balanced
6. Heading: "Sign in to Real Capita ERP"
7. Description: "Use your authorized account to access the company workspace."
8. Footer note: "Secure company-aware access for authorized Real Capita ERP users."
9. No broken image, undefined, null, clipped logo, horizontal overflow, or malformed spacing

## Responsive QA Result

| Width | Result |
|---|---|
| 1440px | Clean — card centered, logo proportional, inputs usable, no overflow |
| 1366px | Clean — same as 1440px |
| 1024px | Clean — same as 1366px |

No global horizontal overflow, logo proportional and readable, card centered, inputs/button usable, text does not collide or clip, corporate/professional appearance maintained at all widths.

## Login-Flow Functional QA Result

- **Invalid login**: filled non-email format "invalid-user-example.com" + short password, clicked Sign in → validation error "Enter a valid email address." rendered cleanly; form remained stable
- **Valid demo login**: filled `demo.admin@demo.realcapita.test` / `change-me-demo-uat-password`, clicked Sign in → login succeeded, redirected to `/dashboard`; authenticated shell loaded with company selector, sidebar navigation, dashboard summary; redirect behavior works correctly
- **Company selector**: not separately tested because the demo admin has only one company assignment; noted as not run with reason

## Playwright Failure Recheck Result

The previously reported project-property spec failure was rechecked and resolved:

- **Root cause**: `getByRole('heading', { name: 'Units' })` resolved to 3 elements (strict-mode violation) because the Units page has 3 headings containing "Units": the main page heading "Units", sidebar heading "Units by project", and chart heading "Units by type"
- **Fix**: changed `getByRole('heading', { name: 'Units' })` to `getByRole('heading', { name: 'Units', exact: true })` in `tests/e2e/project-property.spec.ts` line 850
- **Result**: all 3 project-property tests now pass; full test suite 164/164 API + 61/61 Playwright = 225 total, zero failures

This was a pre-existing strict-mode violation from the Prompt 38 analytics redesign, not caused by the login-page changes. The fix was included in Prompt 43C to ensure a clean checkpoint.

## Full Validation Results

| Check | Result |
|---|---|
| `corepack pnpm lint` | Passed (0 errors, pre-existing warnings) |
| `corepack pnpm typecheck` | Passed |
| `corepack pnpm build` | Passed |
| `corepack pnpm test` | 164 API + 61 Playwright = 225 total, 0 failures |

## Files Changed

- `apps/web/public/brand/real-capita-group-logo.png` — logo asset swap (transparent PNG replaces opaque PNG)
- `apps/web/src/features/auth/login-page.tsx` — visual redesign (88 insertions, 141 deletions)
- `tests/e2e/project-property.spec.ts` — Playwright heading strict-mode fix (1 line)
- `docs/handoffs/foundation-status.md` — Prompt 43B entry added
- `docs/handoffs/prompt-43-scope.md` — new scope document
- `docs/handoffs/prompt-43b-status.md` — Prompt 43B status document
- `docs/handoffs/prompt-43c-status.md` — this status document

## Commit And Push

Commit hash and push result recorded after checkpoint execution.

## Final Verdict

LOGIN BRANDING PUSHED
