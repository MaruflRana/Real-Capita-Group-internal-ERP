# Live Demo VPS Deployment

This runbook prepares the Real Capita ERP for a remote HTTPS demo that keeps running when a local workstation is off. It uses the locked single-VM Docker Compose architecture with Caddy in front of the stack.

## Target Architecture

- `caddy` is the only public entry point on ports `80` and `443`.
- `web` serves the Next.js app behind Caddy.
- `api` serves the NestJS REST API behind the same public app host at `/api/*`.
- `postgres` uses the persistent `postgres-data` Docker volume and is bound only to `127.0.0.1` for server-local maintenance.
- `minio` uses the persistent `minio-data` Docker volume. The MinIO API is exposed only through the configured HTTPS storage host for browser upload/download links; the MinIO console is not published.
- `api-migrate` and `api-bootstrap` are ops-profile services for migrations and initial admin creation.

## Server Requirements

- Ubuntu or Debian-style VPS with a public IPv4 address.
- DNS records:
  - `PUBLIC_APP_HOST`, for example `erp.example.com`, pointing to the VPS.
  - `PUBLIC_STORAGE_HOST`, for example `files.erp.example.com`, pointing to the same VPS.
- Open firewall ports: `22`, `80`, and `443`.
- Closed to the public internet: PostgreSQL, MinIO console, app container ports, and API container ports.
- Docker Engine with the Docker Compose plugin.
- Git.
- Node.js 22 with Corepack enabled, used for repo validation and optional demo-data scripts.

## Server Bootstrap

Run as a sudo-capable user on the VPS:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git ufw
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Install Node.js 22 if the VPS does not already provide it:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
corepack enable
```

Log out and back in after adding the user to the `docker` group.

## First Deployment

```bash
git clone git@github.com:MaruflRana/Real-Capita-Group-internal-ERP.git real-capita-erp
cd real-capita-erp
cp .env.production.example .env
nano .env
```

Before continuing, replace every placeholder in `.env`:

- Set `PUBLIC_APP_HOST`, `PUBLIC_STORAGE_HOST`, and `ACME_EMAIL`.
- Set all public URLs to `https://PUBLIC_APP_HOST`, except `S3_PUBLIC_ENDPOINT`, which must be `https://PUBLIC_STORAGE_HOST`.
- Use strong unique values for `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `JWT_ACCESS_TOKEN_SECRET`, and `JWT_REFRESH_TOKEN_SECRET`.
- Keep `ENABLE_SWAGGER=false` unless API docs are intentionally exposed.
- Keep `COMPOSE_FILE=compose.production.yaml`.

Validate the environment:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm ops:env-check -- --strict
docker compose config
```

Build and start the stack:

```bash
docker compose up -d --build
corepack pnpm docker:migrate
```

Create the first company admin:

```bash
corepack pnpm docker:bootstrap -- \
  --company-name "Real Capita Group" \
  --company-slug "real-capita-group" \
  --admin-email "admin@example.com" \
  --admin-password "replace-with-a-strong-temporary-password"
```

For a populated practicum/UAT presentation workspace, seed only the explicit realistic UAT data and verify it:

```bash
corepack pnpm seed:realistic:uat -- --confirm-production-realistic-data
corepack pnpm seed:realistic:verify -- --confirm-production-realistic-data
```

The seed command is intentionally guarded in `NODE_ENV=production`. Use it only for a practicum/UAT workspace and do not present seeded records as live production records. Public README UAT credentials are for local/dev/UAT walkthroughs only; replace them before any real production deployment.

## Runtime Verification

```bash
RUNTIME_WEB_URL=https://erp.example.com \
RUNTIME_API_HEALTH_URL=https://erp.example.com/api/v1/health/ready \
RUNTIME_SWAGGER_URL=https://erp.example.com/api/v1/health \
corepack pnpm docker:smoke

docker compose ps
```

Manual verification:

- Open `https://erp.example.com/login`.
- Sign in with the bootstrapped admin or seeded UAT account.
- Confirm the dashboard loads.
- Confirm financial reports load and printable report controls still work.
- Confirm sidebar navigation search still works.
- Confirm attachment upload/download only after `S3_PUBLIC_ENDPOINT` resolves to the storage HTTPS host.

## Update Procedure

```bash
git pull
corepack pnpm install --frozen-lockfile
corepack pnpm ops:env-check -- --strict
corepack pnpm backup:db
docker compose up -d --build
corepack pnpm docker:migrate
RUNTIME_WEB_URL=https://erp.example.com \
RUNTIME_API_HEALTH_URL=https://erp.example.com/api/v1/health/ready \
RUNTIME_SWAGGER_URL=https://erp.example.com/api/v1/health \
corepack pnpm docker:smoke
docker compose ps
```

Do not run `docker compose down -v` during normal maintenance because it removes the persistent PostgreSQL, MinIO, and Caddy volumes.

## Backup Notes

PostgreSQL backup:

```bash
corepack pnpm backup:db
corepack pnpm verify:backup -- --file backups/postgres/real_capita_erp-YYYYMMDDTHHMMSSZ.dump
```

Object storage backup remains operator-managed. Back up the `minio-data` Docker volume or mirror the configured `S3_BUCKET` with MinIO Client on the same cadence as database backups.

## Security Checklist

- Real DNS points to the VPS before starting Caddy.
- Only ports `22`, `80`, and `443` are reachable publicly.
- `.env` is never committed.
- Swagger remains disabled unless there is a deliberate reason to expose it.
- Public local/dev/UAT credentials are changed before any real production or externally hosted review.
- The seeded realistic UAT workspace is treated as presentation data, not production data.
- Backups are copied off the VPS or to separately managed durable storage.

## When Credentials Are Not Available

If SSH access, DNS control, or production secrets are unavailable, stop after preparing this package. Deployment is ready to execute when the server IP, DNS names, SSH access, and production secrets are provided.
