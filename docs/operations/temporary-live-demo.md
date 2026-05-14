# Temporary Live Demo

## Purpose

Use this workflow for a temporary PC-on public demo of the Real Capita ERP, such as MD or supervisor review from another location. It uses a Cloudflare Quick Tunnel to expose the already working local Docker Compose stack through a random HTTPS `trycloudflare.com` URL.

This is not the permanent VPS deployment path and does not create a Cloudflare named tunnel.

## Start

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-live-demo.ps1
```

The script:

- verifies Docker and Cloudflare Tunnel prerequisites
- starts the local Compose stack
- starts a temporary Caddy proxy on `http://localhost:8080`
- starts `cloudflared tunnel --url http://localhost:8080`
- captures the generated public URL
- updates only the local `.env` URL/CORS values for the demo session
- rebuilds/recreates `api` and `web`
- verifies the public URL reaches the login page without redirecting to localhost

## Stop

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-live-demo.ps1
```

By default this stops the tunnel process, removes the temporary Caddy proxy, restores `.env` from `.live-demo/env.restore.env`, and rebuilds/recreates `api` and `web` with the restored values while leaving the main ERP stack running.

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
- demo admin login
- dashboard
- Business Overview
- Projects
- CRM Customers or Leads
- HR Employees
- Payroll Runs

Browser API traffic should stay on the public tunnel origin under `/api/*`.

## Known Caveat

`S3_PUBLIC_ENDPOINT` remains local by default for this temporary workflow. MinIO-backed direct upload and secure download links may remain local-only through the public demo URL.

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

## Safety

Use this only for temporary presentation or review. Do not leave the public tunnel running after the demo. Do not commit `.env`, `.live-demo/`, tunnel URLs, logs, backups, or local Caddy runtime files.
