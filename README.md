# Real Capita ERP Monorepo

Production-minded Nx monorepo foundation for the Real Capita Group internal ERP.

## Stack

- Monorepo: `pnpm` workspaces + `Nx`
- Frontend: Next.js App Router + TypeScript + Tailwind + shadcn/ui-style shared primitives + TanStack Query
- Backend: NestJS + TypeScript + REST + Swagger/OpenAPI
- Database: PostgreSQL 15
- ORM: Prisma
- Storage: S3-compatible object storage via MinIO in local development
- Testing: Playwright + Node test runner for backend integration units
- Local orchestration: Docker Compose
- Developer environment: VS Code devcontainer

## Repository Layout

```text
apps/
  api/              NestJS REST API and Dockerfile
  web/              Next.js frontend and Dockerfile
packages/
  config/           Shared runtime constants and env helpers
  eslint-config/    Shared flat ESLint config
  tsconfig/         Shared TypeScript base configs
  types/            Shared TypeScript contracts
  ui/               Shared non-business UI primitives
prisma/
  schema.prisma     Auth/org-security foundation schema and migrations
tests/
  e2e/              Playwright smoke coverage
.devcontainer/
  devcontainer.json Developer container baseline
```

## Service Responsibilities

- `web`: Next.js UI shell. API consumer only.
- `api`: NestJS REST API, auth owner, and future business logic owner.
- `postgres`: relational persistence target for Prisma.
- `minio`: local S3-compatible object storage for development and test workflows.
- No Next.js API routes exist under `apps/web`; all backend operations belong in the NestJS API.

## What Is Intentionally Not Built Yet

- No ERP business domains or modules
- No frontend auth screens
- No password-reset, MFA, invite, SSO, or broader org-management flows
- No accounting, payroll, CRM, property, or workflow logic
- No fake CRUD modules or sample business data
- No file upload or document business flows on top of S3 yet

## Environment Files

Root:

- `.env.example`: full-stack local defaults for direct runs and Docker Compose
- `.env`: your local working copy for Compose and shared defaults
- `NODE_ENV=development` is included in the root example so the API runtime validation can fail fast during direct local runs
- In Docker Compose, `WEB_PORT`, `API_PORT`, `POSTGRES_PORT`, `MINIO_API_PORT`, and `MINIO_CONSOLE_PORT` are host-exposed ports; app containers keep stable internal ports
- `WEB_APP_URL` and `API_BASE_URL` are backend-facing URLs consumed by `apps/api`; do not point the API at `NEXT_PUBLIC_*` variables
- `CORS_ORIGIN` defaults to `WEB_APP_URL` if omitted, but keeping it explicit is recommended
- `JWT_ACCESS_TOKEN_SECRET` and `JWT_REFRESH_TOKEN_SECRET` must each be at least 32 characters long
- The root `build` scripts force `NODE_ENV=production` for Next.js builds so the shared local `.env` can stay on development settings for API work

App-level examples:

- `apps/api/.env.example`: backend-only variables
- `apps/web/.env.example`: frontend public variables

Recommended pattern:

- Copy `.env.example` to `.env` at the repository root
- Use `apps/api/.env.local` or `apps/web/.env.local` only when you need app-specific overrides during direct non-Docker development

## Local Setup Without Docker

Install dependencies:

```powershell
corepack pnpm install
```

Create the root env file:

```powershell
Copy-Item .env.example .env
```

Start only infrastructure with Docker if you want PostgreSQL and MinIO locally:

```powershell
corepack pnpm docker:infra
```

Start the apps directly:

```powershell
corepack pnpm dev:web
corepack pnpm dev:api
```

Or run both app processes together:

```powershell
corepack pnpm dev
```

Apply the auth schema locally:

```powershell
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:dev --name prompt_4_auth_core
```

Create the first company admin explicitly:

```powershell
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

## Local Setup With Docker Compose

Create the root env file:

```powershell
Copy-Item .env.example .env
```

Start the full stack:

```powershell
docker compose up --build
```

Run detached:

```powershell
docker compose up --build -d
```

Stop the stack:

```powershell
docker compose down
```

Follow logs:

```powershell
docker compose logs -f
```

## Developer URLs and Ports

| Service       | URL / Port                                         | Notes                           |
| ------------- | -------------------------------------------------- | ------------------------------- |
| Web           | `http://localhost:3000`                            | Next.js app shell               |
| API           | `http://localhost:3333`                            | NestJS REST API                 |
| Swagger       | `http://localhost:3333/api/docs`                   | OpenAPI UI                      |
| Auth Me       | `http://localhost:3333/api/v1/auth/me`             | Bearer-protected current user   |
| Liveness      | `http://localhost:3333/api/v1/health`              | API runtime probe               |
| Readiness     | `http://localhost:3333/api/v1/health/ready`        | Runtime + PostgreSQL + S3 check |
| Dependencies  | `http://localhost:3333/api/v1/health/dependencies` | Structured dependency report    |
| PostgreSQL    | `localhost:5432`                                   | Uses credentials from `.env`    |
| MinIO API     | `http://localhost:9000`                            | S3-compatible endpoint          |
| MinIO Console | `http://localhost:9001`                            | Local object storage admin UI   |

## MinIO In Local Development

- MinIO exists only to emulate the intended S3-compatible storage boundary during development.
- Application containers should treat object storage as an external service, not as a local disk write target.
- Uploaded file strategies in later prompts should target the S3 API, not the app container filesystem.
- The API readiness check verifies S3-compatible connectivity, not upload flows.
- In Docker Compose, the API container uses the MinIO root credential pair from `.env`.
- For direct non-Docker API runs, keep `S3_ACCESS_KEY` and `S3_SECRET_KEY` aligned with an actual MinIO access key pair.
- The configured bucket (`real-capita-erp-dev` by default) remains the target bucket for future document features.

## Auth Core Verification

After `docker compose up -d`, verify the runtime and auth core:

```powershell
Invoke-WebRequest http://localhost:3333/api/v1/health
Invoke-WebRequest http://localhost:3333/api/v1/health/ready
Invoke-WebRequest http://localhost:3333/api/v1/health/dependencies
Invoke-WebRequest http://localhost:3333/api/docs

corepack pnpm prisma:migrate:deploy
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
```

If the same user later belongs to multiple companies, include `companyId` in the login request body to choose the company-scoped session context.

## Docker Baseline

- `apps/api/Dockerfile`: multi-stage local-first API image with `development`, `builder`, and `runner` stages
- `apps/web/Dockerfile`: multi-stage web image with `development`, `builder`, and standalone `runner` stages
- `docker-compose.yml`: full local stack with named volumes, healthchecks, env-driven configuration, official `postgres:15-alpine`, and a pinned official MinIO image
- The only canonical Dockerfiles in this repository are `apps/api/Dockerfile` and `apps/web/Dockerfile`

## Devcontainer

The repository includes `.devcontainer/devcontainer.json` with:

- Node 22
- `pnpm`/Nx workflow support
- Docker-outside-of-Docker
- VS Code extensions for TypeScript, Prisma, ESLint, Prettier, Docker, Playwright, Tailwind, and PostgreSQL

Open the repository in a devcontainer, then run the same root commands documented here.

## Quality Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
corepack pnpm format
corepack pnpm prisma:format
corepack pnpm prisma:generate
```

## CI Baseline

GitHub Actions currently validates:

- dependency installation
- Docker Compose config rendering
- lint
- typecheck
- build
- API unit tests plus Playwright smoke coverage

## Operational Notes

- Docker Compose is the intended Phase 1 local and single-VM orchestration baseline.
- Secrets are not embedded in Compose; they come from `.env`.
- App containers keep Nx runtime state in container-specific named volumes so host Nx processes do not contend with Docker-based development runs.
- The API now exposes auth, liveness, readiness, dependency, and Swagger endpoints for backend verification.
- Refresh tokens are stored as SHA-256 hashes with rotation and family-wide revocation support.
- The bootstrap admin path is explicit only; no auth seed runs automatically during app startup.
