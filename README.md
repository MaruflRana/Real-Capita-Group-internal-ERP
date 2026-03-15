# Real Capita ERP Monorepo

Production-minded Nx monorepo foundation for the Real Capita Group internal ERP.

## Stack

- Monorepo: `pnpm` workspaces + `Nx`
- Frontend: Next.js App Router + TypeScript + Tailwind + shadcn/ui-style shared primitives + TanStack Query
- Backend: NestJS + TypeScript + REST + Swagger/OpenAPI
- Database: PostgreSQL 15
- ORM: Prisma
- Storage: S3-compatible object storage via MinIO in local development
- Testing: Playwright
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
  schema.prisma     Prisma initialization only, no models yet
tests/
  e2e/              Playwright smoke coverage
.devcontainer/
  devcontainer.json Developer container baseline
```

## Service Responsibilities

- `web`: Next.js UI shell. API consumer only.
- `api`: NestJS REST API, future auth owner, future business logic owner.
- `postgres`: relational persistence target for Prisma.
- `minio`: local S3-compatible object storage for development and test workflows.
- No Next.js API routes exist under `apps/web`; all backend operations belong in the NestJS API.

## What Is Intentionally Not Built Yet

- No ERP business domains or modules
- No auth screens or auth flow implementation
- No Prisma models, SQL DDL, or migrations
- No accounting, payroll, CRM, property, or workflow logic
- No fake CRUD modules or sample business data

## Environment Files

Root:

- `.env.example`: full-stack local defaults for direct runs and Docker Compose
- `.env`: your local working copy for Compose and shared defaults
- `NODE_ENV` is intentionally not stored in the root `.env`; Docker Compose and app processes set runtime mode explicitly per service

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

| Service       | URL / Port                            | Notes                         |
| ------------- | ------------------------------------- | ----------------------------- |
| Web           | `http://localhost:3000`               | Next.js app shell             |
| API           | `http://localhost:3333`               | NestJS REST API               |
| Swagger       | `http://localhost:3333/api/docs`      | OpenAPI UI                    |
| Health        | `http://localhost:3333/api/v1/health` | API health check              |
| PostgreSQL    | `localhost:5432`                      | Uses credentials from `.env`  |
| MinIO API     | `http://localhost:9000`               | S3-compatible endpoint        |
| MinIO Console | `http://localhost:9001`               | Local object storage admin UI |

## MinIO In Local Development

- MinIO exists only to emulate the intended S3-compatible storage boundary during development.
- Application containers should treat object storage as an external service, not as a local disk write target.
- Uploaded file strategies in later prompts should target the S3 API, not the app container filesystem.
- Create the default development bucket (`real-capita-erp-dev`) once through the MinIO Console before wiring upload flows.
- MinIO credentials come from the root `.env`; rotate them locally instead of keeping the example defaults.

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
- Playwright smoke test

## Operational Notes

- Docker Compose is the intended Phase 1 local and single-VM orchestration baseline.
- Secrets are not embedded in Compose; they come from `.env`.
- App containers keep Nx runtime state in container-specific named volumes so host Nx processes do not contend with Docker-based development runs.
- The API currently exposes only the health endpoint and Swagger bootstrap.
- The Prisma schema is intentionally empty beyond datasource/generator setup.
