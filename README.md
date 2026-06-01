# Real Capita Group Internal ERP

Production-minded internal ERP for Real Capita Group, built as an Nx + pnpm monorepo with a Next.js frontend, NestJS REST API, PostgreSQL, Prisma, MinIO, and Docker Compose.

## Project Overview

Real Capita Group Internal ERP is a company-scoped operations platform for authenticated Real Capita users. It supports role-aware access across finance, property, CRM, HR, payroll, audit, document, and realistic UAT workflows while preserving a strict REST boundary: the web app consumes the NestJS API, and the API remains the only backend source of truth for ERP business operations.

## Current Implemented Scope

- **Dashboard**: company-aware operational dashboard with role-filtered widgets, recent activity, pending work, quick actions, and analytics summaries.
- **Org & Security**: companies, locations, departments, users, and company-scoped role assignments.
- **Accounting**: chart of accounts, vouchers, voucher lines, draft editing, balanced posting, and voucher detail output.
- **Financial Reports**: business overview, daily, weekly, monthly, yearly, trial balance, general ledger, profit and loss, and balance sheet reporting.
- **Project & Property Master**: projects, cost centers, phases, blocks, zones, unit types, unit statuses, and units.
- **CRM & Property Desk**: customers, Customer 360 profiles, leads, bookings, sale contracts, installment schedules, collections, and customer collection receipts.
- **HR**: employees, attendance devices, device mappings, attendance logs, leave types, and leave requests.
- **Payroll**: salary structures, payroll runs, payroll run detail/line editing, finalization/cancellation, and payroll posting.
- **Audit & Documents**: attachments, direct browser-to-storage upload/finalize/download flows, attachment links, archive actions, and audit event browsing.

## Highlighted Current Capabilities

- Printable financial reports for Business Overview, Daily, Weekly, Monthly, Yearly, Trial Balance, General Ledger, Profit & Loss, and Balance Sheet.
- Browser print and CSV output for documented finance surfaces and voucher detail.
- Printable CRM customer collection receipt at `/crm-property-desk/collections/[collectionId]/receipt`.
- Customer 360 Profile + Transaction History at `/crm-property-desk/customers/[customerId]`, backed by `GET /companies/:companyId/customers/:customerId/profile`.
- Polished Real Capita branded login screen using the official logo asset.
- Realistic UAT data workflow with explicit seed, verify, and reset commands (`seed:realistic:uat`, `seed:realistic:verify`, `seed:realistic:uat:reset`).
- Verified supervisor/office-desktop live-demo workflow using `scripts/update-and-start-live-demo.ps1`.

## Architecture Boundaries

- `apps/web` is a Next.js App Router frontend and REST API consumer only.
- `apps/api` is the NestJS REST API and sole backend/business-logic owner.
- ERP business operations must not be implemented as Next.js server actions or Next.js API routes.
- Prisma + PostgreSQL 15 own persistence, migrations, and generated types.
- Raw SQL is reserved for justified reporting and transaction-enforcement paths already established in the design.
- MinIO provides S3-compatible local object storage; browser upload/download flows use presigned URLs and are not proxied through Next.js.
- Docker Compose is the canonical local and single-VM orchestration baseline.
- Canonical Dockerfiles are `apps/api/Dockerfile` and `apps/web/Dockerfile`; canonical orchestration is `docker-compose.yml`.

## Technology Stack

| Area | Technology |
| --- | --- |
| Monorepo | pnpm workspaces, Nx |
| Frontend | Next.js App Router, React, TypeScript, Tailwind, shared UI primitives, TanStack Query |
| Backend | NestJS, TypeScript, REST, Swagger/OpenAPI |
| Database | PostgreSQL 15, Prisma |
| Object storage | MinIO / S3-compatible storage |
| Testing | NestJS/API tests, Playwright e2e |
| Runtime | Docker Compose with runner-style `web` and `api` containers |
| Tooling | Node 22+, Corepack, pnpm 10.32.1+ |

## Repository Layout

```text
apps/
  api/              NestJS REST API, business logic, Swagger, API Dockerfile
  web/              Next.js frontend, app shell, routes, web Dockerfile
packages/
  config/           Shared access matrix, constants, and env helpers
  eslint-config/    Shared flat ESLint config
  tsconfig/         Shared TypeScript base configs
  types/            Shared TypeScript contracts
  ui/               Shared non-business UI primitives
prisma/
  schema.prisma     Database schema and migrations
scripts/
  *.mjs             Docker, backup/restore, realistic seed, smoke, env helpers
  *.ps1             Windows live-demo start/stop/update scripts
docs/
  architecture/     Architecture baseline and design references
  operations/       Runtime, route inventory, demo data, live-demo operations
  release/          Demo readiness, release, and operator references
  uat/              UAT walkthrough, known limitations, sign-off material
  handoffs/         Prompt continuity and implementation history
tests/
  e2e/              Playwright end-to-end coverage
```

## Prerequisites

- Git.
- Node.js 22 or newer.
- Corepack with pnpm 10.32.1 or newer.
- Docker Desktop with Docker Compose.
- PowerShell for Windows operator scripts.
- `cloudflared` for the temporary public live-demo workflow. The live-demo guide documents the expected Windows install/location if it is missing.

## Fresh Local Setup

The Docker Compose path is the recommended first-run route because it mirrors the local/single-VM runtime baseline. Use this path on a new development or practicum/UAT machine.

```powershell
git clone git@github.com:MaruflRana/Real-Capita-Group-internal-ERP.git
Set-Location Real-Capita-Group-internal-ERP
corepack enable
Copy-Item .env.example .env
corepack pnpm install
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm seed:realistic:uat
corepack pnpm seed:realistic:verify
corepack pnpm docker:smoke
```

Open the app at:

```text
http://localhost:3000
```

Environment notes:

- `.env.example` is the repository template; `.env` is the local machine copy used by Compose and local tooling.
- The checked-in `.env.example` uses local/dev/UAT placeholders only. Do not copy values from production or private machines into git.
- `UAT_PASSWORD` in `.env.example` is the public practicum UAT walkthrough password documented below.
- `WEB_APP_URL`, `API_BASE_URL`, and `CORS_ORIGIN` should stay aligned for the current browser origin.
- `S3_PUBLIC_ENDPOINT` must stay browser-resolvable for presigned document upload/download flows; local Docker defaults use `http://localhost:9000`.
- Do not commit `.env` or local tunnel/env backup files.

If you need a blank company instead of the realistic UAT company, bootstrap an admin explicitly:

```powershell
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

For direct app development without runner containers, keep PostgreSQL and MinIO running and start the apps directly:

```powershell
corepack pnpm docker:infra
corepack pnpm dev
```

You can also run only one app while developing:

```powershell
corepack pnpm dev:web
corepack pnpm dev:api
```

## Existing Machine Update

Use this when a development or office machine already has the repository and local runtime configured.

```powershell
git pull --ff-only origin main
corepack pnpm install
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm seed:realistic:verify
corepack pnpm docker:smoke
```

If UAT verification fails and the database is intended to be refreshed, reseed explicitly:

```powershell
corepack pnpm seed:realistic:uat
corepack pnpm seed:realistic:verify
```

## Public UAT Login Credentials

These credentials are only for local development, practicum walkthroughs, and UAT/demo review of this private/internal repository. They are intentionally public here to reduce setup friction. Do not reuse them for production, hosted customer data, real cloud services, or private infrastructure.

The repository includes an explicit, resettable realistic UAT seed for the Real Capita Group company:

```text
Real Capita Group
real-capita-group
```

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@realcapita.com.bd` | `rcg-uat-2026-password` |
| Accountant | `accountant@realcapita.com.bd` | `rcg-uat-2026-password` |
| HR | `hr@realcapita.com.bd` | `rcg-uat-2026-password` |
| Payroll | `payroll@realcapita.com.bd` | `rcg-uat-2026-password` |
| Sales | `sales@realcapita.com.bd` | `rcg-uat-2026-password` |
| Member | `member@realcapita.com.bd` | `rcg-uat-2026-password` |

> Use this password only in controlled local/UAT environments. Never in production.

## Realistic UAT Data

Realistic UAT data rules:

- Realistic UAT data is never seeded automatically during app startup, Docker startup, migrations, or admin bootstrap.
- `corepack pnpm seed:realistic:verify` is the default safety check before demos.
- `corepack pnpm seed:realistic:uat` refreshes the Real Capita Group company and should be run only when that refresh is intentional.
- `corepack pnpm seed:realistic:uat:reset` is guarded and should not be used against non-UAT company data.
- All seeded data uses Bangladesh-facing names, BDT/৳ currency, and realistic operational history spanning 2022–2026.
- No "Demo", "UAT", "Synthetic", "Test", "Sample", or "Mock" strings appear in any business-facing seeded field.

### Realistic Dataset Summary

The realistic UAT seed produces a large, coherent multi-year operational dataset:

- 890 units across 13 RCG projects, 600 customers, 400 leads, 350 bookings, 250 sale contracts, 2,597 installment schedule rows, 2,142 collections.
- 4,177 vouchers (receipt, payment, journal, contra) with balanced posted books, 95 employees, 46 payroll runs, 24,000 attendance logs, 500 leave requests, 500 audit events.
- Operational history spans 2022–2026 with realistic Bangladesh names, BDT/৳ amounts, and monthly variation including occasional loss periods.
- Supports meaningful Business Overview trend charts, Customer 360 profiles, financial reports, and dashboard KPIs.

### Deprecated Seed Aliases

`seed:demo`, `seed:demo:reset`, and `seed:demo:verify` still exist as compatibility aliases that delegate to the realistic seed commands with a deprecation warning. They are not the primary documented path. Use `seed:realistic:uat`, `seed:realistic:verify`, and `seed:realistic:uat:reset` instead.

### Reseeding Note

Realistic reseeding rebuilds the full multi-year dataset and may take several minutes. It is intended for deliberate refresh/reset workflows, not for routine local startup. Run `seed:realistic:verify` to confirm data health without reseeding.

## Supervisor Desktop Live Demo

For a supervisor or office desktop that needs to pull the latest ERP changes, restore a healthy runtime, verify demo readiness, and create a fresh public demo link, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-and-start-live-demo.ps1
```

Run the fresh local setup once on that machine before relying on this wrapper; the script assumes Git, Docker, PowerShell, cloudflared, and local Node dependencies are already available.

The wrapper:

- checks the Git worktree before pulling,
- pulls `origin/main` with fast-forward only,
- repairs stale tunnel URL values in `.env` when needed,
- rebuilds and recreates the Docker runtime,
- verifies API health,
- verifies realistic UAT data by default,
- verifies local UAT login,
- launches a Cloudflare Quick Tunnel,
- verifies the public login page and public UAT login before printing the final URL.

Local and live URLs are different. Normal development uses `http://localhost:3000` on the machine running Docker. The live-demo workflow exposes that local machine through a temporary public Cloudflare Quick Tunnel URL; the public URL changes after each fresh tunnel start and stops working when the machine, Docker stack, or tunnel process stops.

To intentionally refresh realistic UAT data before launching the public link:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-and-start-live-demo.ps1 -RefreshDemoData
```

This workflow is for temporary UAT link generation only. Cloudflare Quick Tunnel URLs change on every fresh start and are not permanent hosting.

## Stop Or Restore Live Demo

Stop the temporary tunnel and restore local `.env` URL/CORS values:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1
```

Stop the tunnel and also stop the main Docker Compose stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1 -StopStack
```

If a tunnel dies after a machine/session ends, run the stop script first to restore local mode, then run `update-and-start-live-demo.ps1` again to generate a fresh public URL.

## Local URLs

| Service | URL / Port | Notes |
| --- | --- | --- |
| Web | `http://localhost:3000` | Canonical browser origin |
| API | `http://localhost:3333` | NestJS REST API |
| Swagger | `http://localhost:3333/api/docs` | OpenAPI UI |
| API liveness | `http://localhost:3333/api/v1/health` | Runtime probe |
| API readiness | `http://localhost:3333/api/v1/health/ready` | Runtime + PostgreSQL + S3 check |
| API dependencies | `http://localhost:3333/api/v1/health/dependencies` | Structured dependency report |
| PostgreSQL | `localhost:5432` | Uses credentials from `.env` |
| MinIO API | `http://localhost:9000` | S3-compatible endpoint |
| MinIO Console | `http://localhost:9001` | Local object-storage admin UI |

Use `http://localhost:3000` in browsers, docs, and tests. `http://127.0.0.1:3000` redirects to the canonical localhost origin.

## Validation Commands

Core validation:

```powershell
corepack pnpm verify
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

Docker/runtime validation:

```powershell
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm seed:realistic:verify
corepack pnpm docker:smoke
```

Realistic UAT data:

```powershell
corepack pnpm seed:realistic:uat -- --dry-run
corepack pnpm seed:realistic:uat
corepack pnpm seed:realistic:verify
corepack pnpm seed:realistic:uat:reset -- --dry-run
corepack pnpm seed:realistic:uat:reset
```

Backup, restore, and environment checks:

```powershell
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump
corepack pnpm restore:db -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump --dry-run
corepack pnpm ops:env-check -- --strict
```

## Documentation Map

- Architecture baseline: [docs/architecture/phase-1-architecture-baseline.md](docs/architecture/phase-1-architecture-baseline.md)
- Route, module, role, and output inventory: [docs/operations/phase-1-route-inventory.md](docs/operations/phase-1-route-inventory.md)
- Realistic UAT seed data guide: [docs/operations/demo-data.md](docs/operations/demo-data.md)
- Temporary live-demo operations: [docs/operations/temporary-live-demo.md](docs/operations/temporary-live-demo.md)
- Agent handoff protocol: [docs/operations/agent-handoff-protocol.md](docs/operations/agent-handoff-protocol.md)
- Demo readiness guide: [docs/release/demo-readiness-guide.md](docs/release/demo-readiness-guide.md)
- UAT demo walkthrough: [docs/uat/phase-1-demo-walkthrough.md](docs/uat/phase-1-demo-walkthrough.md)
- Deployment operations: [docs/operations/deployment.md](docs/operations/deployment.md)
- Backup and restore operations: [docs/operations/backup-restore.md](docs/operations/backup-restore.md)
- Phase 1 UAT package: [docs/uat/README.md](docs/uat/README.md)
- Agent continuity and prompt history: [docs/handoffs/foundation-status.md](docs/handoffs/foundation-status.md)

## Operational Notes And Known Limitations

- CSV is the only structured export format currently implemented.
- Browser print is the print/PDF-from-browser path; there is no server-side PDF pipeline.
- Supported print surfaces are documented in the route inventory and demo readiness guide.
- PostgreSQL backup helpers do not back up MinIO/S3 object bytes.
- Automated scheduled backups and point-in-time recovery are not implemented in this repository.
- Password reset, MFA, SSO, invites, public portals, imports, notifications, approval engines, e-signature, OCR, and virus scanning are outside the current scope.
- Freshly bootstrapped companies can show empty lists and reports until real records or the realistic UAT seed are added.
- Non-localhost production-style browser sessions require HTTPS-compatible origins and real secrets.
- Swagger should not be exposed publicly in production unless intentionally enabled.
- Do not commit `.env`, `.env.tunnel-backup*`, `Caddyfile.tunnel`, `.live-demo/`, `backups/`, database dumps, object-storage backups, `node_modules/`, build outputs, Playwright reports, or `*.tsbuildinfo`.
