# Prompt 22 Status

## Scope Delivered

Prompt 22 delivered production hardening and release-readiness only:

- hardened the Docker and Compose runtime for the approved single-VM target
- fixed canonical-origin and cookie/session reliability issues
- improved repo-root command reliability for Compose migrations, bootstrap, and runtime smoke
- aligned Playwright and CI with the actual standalone Next.js runtime path
- updated release and deployment documentation
- preserved the locked stack and all Prompt 12 through Prompt 21 business behavior

No new ERP business modules were added.

## Runtime And Deployment Hardening Added

### Docker And Compose

- `docker-compose.yml` now starts `api` and `web` from their `runner` stages instead of bind-mounted dev containers
- Compose startup no longer depends on in-container `pnpm install`, mounted source trees, or mounted `.next` artifacts
- `api` now waits on healthy `postgres` and `minio`
- `web` now waits on a healthy `api`
- `postgres`, `minio`, `api`, and `web` now use `init: true`
- healthchecks remain explicit and use container-local HTTP probes for `api` and `web`
- `api-migrate` and `api-bootstrap` now exist under the `ops` profile for containerized maintenance work

### API Runtime

- `apps/api/Dockerfile` now copies the built API output plus installed dependencies into the runtime image and starts `node dist/apps/api/main.js`
- the API runner now uses the non-root `node` user
- startup now emits production warnings when:
  - Swagger stays enabled
  - browser-facing app URLs still point at loopback hosts
  - non-localhost production URLs are not HTTPS even though auth cookies are `Secure`
  - `S3_PUBLIC_ENDPOINT` is not browser-resolvable

### Web Runtime

- `apps/web/Dockerfile` now runs the standalone Next.js server as the non-root `node` user
- the web runner now sets explicit `HOSTNAME=0.0.0.0` and `PORT=3000`
- local Playwright startup now assembles the standalone output together with `.next/static` and `public` so test runtime matches the real runner image

## Origin, Cookie, And Session Hardening

- `apps/api/src/app/config/env.validation.ts` now enforces same-host browser origin rules:
  - `WEB_APP_URL` and `API_BASE_URL` must share the same scheme and hostname
  - `CORS_ORIGIN` must include `WEB_APP_URL` exactly
  - every `CORS_ORIGIN` entry must use the same scheme and hostname as `WEB_APP_URL`
- `apps/web/src/proxy.ts` now redirects non-canonical requests onto `NEXT_PUBLIC_APP_URL`
- canonical local browser origin is now explicitly `http://localhost:3000`
- `http://127.0.0.1:3000` is supported only as a redirect target and is not the canonical documented origin
- multi-company login and session selection behavior remains intact

## Local Command And CI Reliability Changes

### Repo-Root Commands

- added `corepack pnpm verify`
- added `corepack pnpm docker:migrate`
- added `corepack pnpm docker:bootstrap -- --company-name ...`
- added `corepack pnpm docker:smoke`

### Bootstrap Helper Reliability

- fixed `api-bootstrap` so `BOOTSTRAP_*` values are expanded inside the container instead of being interpolated on the host
- added `scripts/docker-bootstrap.mjs` so the containerized bootstrap flow is reproducible from repo root on Windows without ad hoc shell gymnastics

### Playwright

- canonical e2e base URL is now `http://localhost:3100`
- Playwright now uses `scripts/start-playwright-web.mjs` to:
  - clear stale Next build locks
  - build the standalone web artifact
  - copy static/public assets into the standalone tree
  - start the standalone server directly
- added smoke coverage for `127.0.0.1` redirecting onto the canonical localhost origin
- fixed one CRM locator ambiguity so the suite stays deterministic

### GitHub Actions

- `.github/workflows/ci.yml` now validates:
  - install
  - Compose config rendering
  - lint
  - typecheck
  - build
  - test
  - `docker compose up -d --build`
  - runtime smoke
  - Compose status/log capture on failure
  - Compose shutdown in `always()`

## Canonical Command Paths

### Local Host-Side Validation

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

### Canonical Compose Flow

```powershell
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
```

## Canonical Local URLs

- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- API liveness: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- Swagger: `http://localhost:3333/api/docs`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Verification Completed

Prompt 22 verification completed successfully with:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`
- `corepack pnpm test`
- `docker compose up -d --build`
- `corepack pnpm docker:migrate`
- `corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"`
- `corepack pnpm docker:smoke`

Live Compose-stack verification succeeded for:

- canonical browser load on `http://localhost:3000`
- redirect from `http://127.0.0.1:3000` onto the canonical localhost origin
- API liveness and readiness
- Swagger
- login plus multi-company company-selection flow
- `/dashboard`
- `/accounting/chart-of-accounts`
- `/crm-property-desk/customers`
- `/hr/employees`
- `/audit-documents/attachments`

## Documentation Updated

- `README.md`
- `docs/operations/deployment.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-22-status.md`
- `docs/handoffs/prompt-23-scope.md`

## Out Of Scope And Still Not Built

- new ERP business modules
- new finance, CRM, HR, payroll, or document workflows
- reporting/export builders
- notifications
- Kubernetes
- public-site features
- observability platforms or third-party SaaS runtime dependencies

## Prompt 23 Readiness

Prompt 22 is complete. The repo is materially more release-ready for the approved single-VM Compose target, and Prompt 23 can proceed as long as it preserves the Prompt 22 runtime, origin, and deployment rules.
