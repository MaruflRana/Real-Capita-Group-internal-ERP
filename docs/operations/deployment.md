# Phase 1 Deployment And Operations

## Target

- Deployment target: single VM + Docker Compose
- Runtime services: `web`, `api`, `postgres`, `minio`
- Canonical local browser origin: `http://localhost:3000`
- Canonical local API origin: `http://localhost:3333`
- Canonical local object-storage origin for browser-facing presigned URLs: `http://localhost:9000`

## Origin And Cookie Rules

- Use `http://localhost:3000` as the canonical local browser origin.
- `http://127.0.0.1:3000` is redirected to `http://localhost:3000` and is not the documented origin for this repo.
- `WEB_APP_URL`, `API_BASE_URL`, and every `CORS_ORIGIN` entry must share the same scheme and hostname while browser auth stays cookie-backed.
- The current browser auth cookies are host-only and do not set a cookie domain.
- In `NODE_ENV=production`, auth cookies are `Secure`, so non-localhost browser sessions must use HTTPS.

## Required Runtime Environment

These variables must be set correctly before a real release run:

- App metadata and routing:
  - `APP_NAME`
  - `NODE_ENV`
  - `API_GLOBAL_PREFIX`
  - `API_VERSION`
  - `ENABLE_SWAGGER`
  - `SWAGGER_PATH`
- Public/browser origins:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
  - `WEB_APP_URL`
  - `API_BASE_URL`
  - `CORS_ORIGIN`
- Database:
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- Auth:
  - `JWT_ACCESS_TOKEN_SECRET`
  - `JWT_ACCESS_TOKEN_TTL`
  - `JWT_REFRESH_TOKEN_SECRET`
  - `JWT_REFRESH_TOKEN_TTL`
- Object storage:
  - `MINIO_ROOT_USER`
  - `MINIO_ROOT_PASSWORD`
  - `S3_BUCKET`
  - `S3_REGION`
  - `S3_FORCE_PATH_STYLE`
  - `S3_PUBLIC_ENDPOINT`
- Host port mapping:
  - `WEB_PORT`
  - `API_PORT`
  - `POSTGRES_PORT`
  - `MINIO_API_PORT`
  - `MINIO_CONSOLE_PORT`

Notes:

- `DATABASE_URL` in `.env` is used for direct host-side Prisma or bootstrap commands.
- The Compose `api` and `ops` services replace the database hostname internally with `postgres`.
- `S3_PUBLIC_ENDPOINT` must stay browser-resolvable. Local Compose defaults to `http://localhost:9000`, but a real VM must use a VM-visible host or DNS name instead.
- `ENABLE_SWAGGER=true` is acceptable for local verification, but production should disable Swagger unless it is intentionally exposed.

## Local Direct-Run Flow

Use this when you want to run `web` and `api` directly on the host:

```powershell
Copy-Item .env.example .env
corepack pnpm install
corepack pnpm docker:infra
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
corepack pnpm auth:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm dev
```

## Canonical Docker Compose Flow

Use this for release-like local verification and for the approved single-VM baseline:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
docker compose ps
```

Useful follow-up commands:

```powershell
docker compose logs -f
docker compose down
```

## Bootstrap Admin Flow

Preferred repo-root command:

```powershell
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
```

Raw Compose equivalent:

```powershell
docker compose --profile ops run --rm -e BOOTSTRAP_COMPANY_NAME="Real Capita" -e BOOTSTRAP_COMPANY_SLUG="real-capita" -e BOOTSTRAP_ADMIN_EMAIL="admin@example.com" -e BOOTSTRAP_ADMIN_PASSWORD="change-me-secure-admin-password" api-bootstrap
```

Notes:

- The bootstrap flow is explicit and never runs automatically during `docker compose up`.
- The helper is idempotent for an existing active admin and company pairing.
- If the same identity belongs to multiple companies, the browser login flow will require an explicit company selection after the first sign-in attempt.

## Single-VM Production Flow

1. Copy `.env.example` to `.env` and replace every placeholder secret before the first deployment.
2. Set `NODE_ENV=production`.
3. Set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL`, `WEB_APP_URL`, and `API_BASE_URL` to the real HTTPS origins you intend users to open.
4. Keep `CORS_ORIGIN` aligned with the same browser hostname as `WEB_APP_URL`.
5. Set `S3_PUBLIC_ENDPOINT` to the VM-visible or DNS-visible object-storage origin that browser uploads and downloads can reach.
6. Consider setting `ENABLE_SWAGGER=false` unless Swagger must remain exposed on the VM.
7. Bring the stack up with `docker compose up -d --build`.
8. Run `corepack pnpm docker:migrate`.
9. Run the explicit bootstrap helper once.
10. Verify the runtime on the final public origin before handing the VM over for real use.

## MinIO / S3 Public Endpoint Notes

- The API container always uses the internal MinIO service URL `http://minio:9000` for service-to-service object access inside Compose.
- Browser-facing upload and download links always rely on `S3_PUBLIC_ENDPOINT`.
- For local Compose, `S3_PUBLIC_ENDPOINT=http://localhost:9000` is correct.
- For a real VM, do not leave `S3_PUBLIC_ENDPOINT` on `localhost` or set it to the internal `minio` hostname.
- If the storage endpoint is not browser-resolvable, attachment upload and secure download flows will fail even if the API stays healthy.

## Validation Sequence

Repo validation:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

Runtime validation:

```powershell
docker compose up -d --build
corepack pnpm docker:migrate
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "change-me-secure-admin-password"
corepack pnpm docker:smoke
```

Expected local URLs:

- `http://localhost:3000`
- `http://localhost:3333/api/v1/health`
- `http://localhost:3333/api/v1/health/ready`
- `http://localhost:3333/api/docs`
- `http://localhost:9000`
- `http://localhost:9001`

## Known Operational Caveats

- `localhost` is the only canonical local browser origin. Do not document `127.0.0.1` as equivalent.
- Production browser sessions require HTTPS because the auth cookies become `Secure` outside localhost development.
- The API emits production warnings if Swagger is still enabled, if browser-facing app URLs still point at loopback hosts, or if `S3_PUBLIC_ENDPOINT` is not browser-resolvable.
- `pnpm lint` currently passes with warnings that pre-date Prompt 22; Prompt 22 did not widen those warnings into errors.
