# Temporary Live Demo

## Purpose

Use this workflow for a temporary PC-on public demo of the Real Capita ERP, such as MD or supervisor review from another location. It uses a Cloudflare Quick Tunnel to expose the already working local Docker Compose stack through a random HTTPS `trycloudflare.com` URL.

This is not the permanent VPS deployment path and does not create a Cloudflare named tunnel.

## Recommended Supervisor Command

From the repository root, the one-command supervisor workflow:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-and-start-live-demo.ps1
```

This wrapper script:

- checks git repository state (must be clean for safe pull)
- pulls latest code from `origin/main` (fast-forward only, never merge/rebase/force)
- stops any leftover known ERP dev-server process on port 3000
- normalizes `.env` to local-dev values if stale tunnel URLs are detected
- rebuilds the Docker Compose stack with the current `.env`
- verifies API health at `http://localhost:3333/api/v1/health`
- verifies demo data with `corepack pnpm seed:demo:verify`
- verifies local demo login against the API
- then calls `start-live-demo.ps1 -SkipInitialBuild` to launch the Cloudflare tunnel

Optional flags:

- `-RefreshDemoData` — reseed demo data before verification (default: verify only)
- `-DemoEmail` — override the demo login email (default: `demo.admin@demo.realcapita.test`)
- `-DemoPassword` — override the demo login password (default: `change-me-demo-uat-password`)

To reseed fresh demo data and launch:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-and-start-live-demo.ps1 -RefreshDemoData
```

## Standalone Tunnel Start (Without Update)

If the repo is already up-to-date and the runtime is known to be healthy, you can start the tunnel directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-live-demo.ps1
```

The standalone script:

- verifies Docker and Cloudflare Tunnel prerequisites
- starts the local Compose stack
- starts a temporary Caddy proxy on `http://localhost:8080`
- starts `cloudflared tunnel --url http://localhost:8080`
- captures the generated public URL
- protects against stale tunnel-URL `.env` restore baselines
- updates only the local `.env` URL/CORS values for the demo session
- rebuilds/recreates `api` and `web`
- verifies the public URL reaches the login page
- verifies demo login works through the public URL

## Stop

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1
```

By default this stops the tunnel process, removes the temporary Caddy proxy, restores `.env` from `.live-demo/env.restore.env`, and rebuilds/recreates `api` and `web` with the restored values while leaving the main ERP stack running. The stop script now also detects and repairs stale tunnel-URL restore backups.

To also stop the ERP stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1 -StopStack
```

## What Must Stay Running

Keep these running for the entire demo:

- the PC
- Docker Desktop
- the `web`, `api`, `postgres`, and `minio` containers
- the `real-capita-tunnel-caddy` container
- the `cloudflared` process started by the launcher

The Quick Tunnel URL changes after every fresh start.

## What Works Remotely

The proven remote path covers:

- login page
- demo admin login (verified by the start script)
- dashboard
- Business Overview
- Projects
- CRM Customers or Leads
- HR Employees
- Payroll Runs

Browser API traffic should stay on the public tunnel origin under `/api/*`.

## What the Wrapper Verifies

The `update-and-start-live-demo.ps1` wrapper performs these checks before launching the tunnel:

1. Git repository is clean (no tracked modifications)
2. Latest code is pulled from `origin/main` (fast-forward only)
3. No port 3000 conflict from a leftover dev server
4. `.env` is normalized to local-dev values (stale tunnel URLs are repaired)
5. Docker stack is rebuilt and healthy
6. API health endpoint responds
7. Demo data verification passes (`corepack pnpm seed:demo:verify`)
8. Local demo login succeeds against the API
9. Cloudflare tunnel is launched (delegated to `start-live-demo.ps1`)
10. Public URL login verification passes (delegated to `start-live-demo.ps1`)

If any check fails, the script stops with a clear error message and guidance.

## Demo Data Policy

- Default behavior: verify existing demo data only. If verification fails, the script stops and suggests rerunning with `-RefreshDemoData`.
- With `-RefreshDemoData`: reseed demo data (`corepack pnpm seed:demo`) then verify. Continue only if verification passes.
- Never reseed automatically without the explicit flag.

## Known Caveat

`S3_PUBLIC_ENDPOINT` remains local by default for this temporary workflow. MinIO-backed direct upload and secure download links may remain local-only through the public demo URL.

## Cloudflare Quick Tunnel Positioning

The Quick Tunnel is:

- suitable for temporary demo/UAT link generation
- the URL changes when restarted
- NOT the final production-access architecture
- NOT a persistent or stable public URL
- named tunnel with custom hostname remains future work if the organization needs permanent public access

Do not use Quick Tunnel as a permanent deployment path.

## Troubleshooting

Docker not running:

- Start Docker Desktop.
- Re-run the start script.

`cloudflared` missing:

- Install Cloudflare Tunnel or place `cloudflared.exe` at `C:\Program Files (x86)\cloudflared\cloudflared.exe`.
- Re-run the start script.

URL not detected:

- Check `.live-demo/cloudflared.stderr.log`.
- Stop with `.\scripts\stop-live-demo.ps1`, then start again.

Tunnel starts but the app does not open:

- Confirm `docker compose ps` shows `web`, `api`, `postgres`, and `minio` healthy.
- Confirm `http://localhost:8080/api/v1/health` works on the PC.
- Re-run the start script to generate a fresh tunnel URL and rebuild `web` with that URL.

Login fails at the public URL:

- The start script verifies demo login through the public URL before reporting success.
- If login fails, the script stops with an error. Run `stop-live-demo.ps1` to clean up and check the `.env` CORS/API URL configuration.

Stale `.env` or restore backup detected:

- The scripts now detect and repair stale tunnel URLs in `.env` before proceeding.
- If `.live-demo/env.restore.env` contains tunnel URLs, it is removed and replaced with a local-dev baseline before the tunnel starts.
- The stop script also guards against restoring from a tunnelized backup.

## Safety

Use this only for temporary presentation or review. Do not leave the public tunnel running after the demo. Do not commit `.env`, `.live-demo/`, tunnel URLs, logs, backups, or local Caddy runtime files.
