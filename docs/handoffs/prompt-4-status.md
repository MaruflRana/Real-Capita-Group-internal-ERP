# Prompt 4 Status

## Implemented

- Minimal auth-owned Prisma schema and migration:
  - `companies`
  - `roles`
  - `users`
  - `user_roles`
  - `refresh_tokens`
- Local auth module for `apps/api` with:
  - password verification via Argon2id
  - short-lived access tokens
  - rotating refresh tokens
  - family-wide refresh-token revocation
  - current-user endpoint
  - Swagger documentation for auth endpoints
- Company-scoped RBAC baseline:
  - authenticated-user decorator
  - access-token strategy and guard
  - role guard baseline
  - company-scope guard baseline
- Explicit bootstrap-admin CLI flow for first-time setup.
- Scoped backend tests for auth service flows, guards, controller protection, bootstrap behavior, and config validation updates.

## Auth Endpoints Added

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Bootstrap And Admin Creation

Run the bootstrap command explicitly after migrations:

```powershell
corepack pnpm prisma:migrate:deploy
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

Bootstrap behavior:

- no startup seeding
- no hardcoded credentials
- repeat-safe for an existing active company/admin pairing
- ensures `company_admin` and `company_member` roles exist
- attaches the admin role to the requested company context

## Refresh Token Storage And Revocation

- Refresh tokens are JWTs with a unique `jti`.
- The database stores only a SHA-256 token hash, never the raw refresh token.
- Each refresh token belongs to a token family for rotation tracking.
- A valid refresh rotates to a new token in the same family.
- Refresh-token reuse or mismatch revokes the active family.
- Logout revokes the active family.

## Environment Notes

- No new auth env variables were added beyond the Prompt 3 JWT settings.
- `JWT_ACCESS_TOKEN_SECRET` and `JWT_REFRESH_TOKEN_SECRET` now must each be at least 32 characters long.
- Existing `.env` files copied from the older Prompt 3 example must be refreshed or updated before the API will boot.
- Root workspace build scripts now force `NODE_ENV=production` for Next.js builds so the shared `.env` can remain development-oriented for local API work.

## Intentionally Out Of Scope

- Frontend auth screens
- Password reset, email verification, MFA, SSO, invites, or session UI
- Full org/company management APIs beyond auth needs
- Any ERP business module or fake domain data
- Next.js backend routes or server actions

## Verification Commands

```powershell
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:dev --name prompt_4_auth_core
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
docker compose down --volumes --remove-orphans
docker compose build --no-cache
docker compose up -d
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"

$loginBody = @{
  email = 'admin@example.com'
  password = 'change-me-secure-admin-password'
} | ConvertTo-Json

$session = Invoke-RestMethod -Method Post -Uri http://localhost:3333/api/v1/auth/login -ContentType 'application/json' -Body $loginBody
$accessToken = $session.accessToken
$refreshToken = $session.refreshToken

Invoke-RestMethod -Headers @{ Authorization = "Bearer $accessToken" } -Uri http://localhost:3333/api/v1/auth/me

$rotatedSession = Invoke-RestMethod -Method Post -Uri http://localhost:3333/api/v1/auth/refresh -ContentType 'application/json' -Body (@{
  refreshToken = $refreshToken
} | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri http://localhost:3333/api/v1/auth/logout -ContentType 'application/json' -Body (@{
  refreshToken = $rotatedSession.refreshToken
} | ConvertTo-Json)

Invoke-WebRequest http://localhost:3333/api/docs
```

## Ready State

Prompt 4 delivered Auth Core plus the minimal org/security database foundation required to support it. The repo is ready for Prompt 5.
