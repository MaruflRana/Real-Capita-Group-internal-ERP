# Real Capita ERP Agent Notes

## Locked Stack

- Monorepo: Nx + pnpm
- Frontend: Next.js App Router, frontend only
- Backend: NestJS, REST API only
- Database: Prisma + PostgreSQL 15
- Object storage: MinIO for S3-compatible storage
- Testing: Playwright
- CI: GitHub Actions
- Deployment baseline: Docker Compose for a single VM

## Architecture Rules

- Keep a strict REST-only boundary between `apps/web` and `apps/api`.
- Do not add Next.js server actions for business operations.
- NestJS owns backend REST endpoints and business-operation orchestration.
- Prisma is the default tool for normal CRUD, migrations, and generated types.
- Use raw SQL only for complex transactions and PL/pgSQL-triggered database flows.

## Coding Rules

- Do not make business assumptions that are not explicitly requested.
- Do not add fake ERP data, demo CRUD modules, or tutorial placeholders.
- Preserve module boundaries across apps and packages.
- Prefer clean, production-ready structure over fast scaffolding.
- Keep `apps/web` as an API consumer only.
- Keep `apps/api` as the only backend entry point.

## Verified Local URLs

- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- API health: `http://localhost:3333/api/v1/health`
- Swagger: `http://localhost:3333/api/docs`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Canonical Docker Strategy

- Canonical Dockerfiles:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
- Canonical orchestration file:
  - `docker-compose.yml`
- Compose baseline services:
  - `web`
  - `api`
  - `postgres`
  - `minio`
- Nx runtime state inside app containers is isolated with named volumes to avoid host/container lock contention.

## Prompt 3 Starting Point

- Prompt 3 begins the backend integration foundation.
- Prompt 3 must stay within its defined scope and must not introduce unrelated business modules beyond that scope.
