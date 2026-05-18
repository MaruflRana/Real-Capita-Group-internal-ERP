# Prompt 43 Scope: Login-Screen Logo Replacement And Visual Redesign

Prompt 43 is approved as the next management-feedback enhancement after the Customer 360 Profile from Prompt 42.

The selected direction is replacing the current login-screen logo with the official Real Capita Group logo, positioning it more professionally, and improving the overall login-screen visual design.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-42c-status.md`
- `docs/release/demo-readiness-guide.md`
- `docs/operations/phase-1-route-inventory.md`

## Approved Direction

Prompt 43B implements:

- logo asset replacement at the same committed path with the official transparent PNG
- login page redesign into a centered single-card layout
- logo moved inside the card header, centered above the heading
- removal of the generic left brand/info card and "SECURE ACCESS" overline
- concise heading, description, form fields, sign-in button, and muted footer
- no auth/session/backend changes

## Access Boundary

The login page remains unauthenticated; no access-role changes.

## Explicit Deferrals

- No auth logic changes
- No backend endpoint changes
- No Prisma schema changes or migrations
- No seed data changes
- No new routes
- No demo credential display on the login page
- No dark-mode toggle or theme switching
- No sidebar, shell, or authenticated-page redesign
