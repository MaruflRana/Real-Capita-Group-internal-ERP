# Foundation Status

## Current State

- Nx + pnpm monorepo foundation remains intact.
- `apps/web` remains a Next.js App Router frontend-only app.
- `apps/api` now includes the Prompt 3 backend integration foundation plus the Prompt 4 auth core:
  - validated runtime configuration
  - common request/error/logging infrastructure
  - Prisma module/service integration for PostgreSQL
  - S3-compatible storage module/service for MinIO
  - liveness, readiness, and dependency health endpoints
  - local auth module with access/refresh JWT flow
  - refresh-token rotation and family revocation
  - company-scoped RBAC guard baseline
  - explicit bootstrap CLI for the first company admin
  - scoped backend unit tests for config, health, auth, bootstrap, and guard behavior
- Prisma now contains only the minimal auth-owned org/security schema:
  - `companies`
  - `roles`
  - `users`
  - `user_roles`
  - `refresh_tokens`
- No ERP business module or Next.js backend behavior was introduced.

## Backend Structure Summary

```text
apps/api/src/app/
  auth/        local auth core, JWT, RBAC guards, bootstrap service, DTOs
  common/      request id, logging interceptor, exception filter, validation
  config/      validated environment parsing and typed config sections
  database/    Prisma module/service and future-safe raw SQL helpers
  health/      liveness, readiness, dependency endpoints and DTOs
  storage/     S3-compatible storage client wiring and connectivity check
```

## Verification Completed

- `corepack pnpm prisma:generate`
- `corepack pnpm prisma:migrate:dev --name prompt_4_auth_core`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`
- `corepack pnpm test`
- `docker compose down --volumes --remove-orphans`
- `docker compose build --no-cache`
- `docker compose up -d`
- `curl.exe -s -o - -w "\n%{http_code}" http://localhost:3333/api/v1/health`
- `curl.exe -s -o - -w "\n%{http_code}" http://localhost:3333/api/v1/health/ready`
- `curl.exe -s -o - -w "\n%{http_code}" http://localhost:3333/api/v1/health/dependencies`
- `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3333/api/docs`
- `corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"`
- login, `GET /api/v1/auth/me`, refresh, and logout verification against the running stack

## Verified Runtime Status

- Docker Compose reached healthy state for:
  - `postgres`
  - `minio`
  - `api`
  - `web`
- Verified live HTTP responses:
  - `GET /api/v1/health` returned `200`
  - `GET /api/v1/health/ready` returned `200`
  - `GET /api/v1/health/dependencies` returned `200`
  - `GET /api/docs` returned `200`
  - `POST /api/v1/auth/login` returned `201`
  - `GET /api/v1/auth/me` returned `200`
  - `POST /api/v1/auth/refresh` returned `201`
  - `POST /api/v1/auth/logout` returned `201`

## Current Local URLs

- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- API auth login: `http://localhost:3333/api/v1/auth/login`
- API auth refresh: `http://localhost:3333/api/v1/auth/refresh`
- API auth logout: `http://localhost:3333/api/v1/auth/logout`
- API current user: `http://localhost:3333/api/v1/auth/me`
- API liveness: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- API dependencies: `http://localhost:3333/api/v1/health/dependencies`
- Swagger: `http://localhost:3333/api/docs`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Final Status

Backend auth core and minimal org/security foundation are complete and ready for Prompt 5.
