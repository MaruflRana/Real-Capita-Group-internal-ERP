# Operator Quick Start

## Start The Stack

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
corepack pnpm docker:migrate
```

Bootstrap a company admin only when needed:

```powershell
corepack pnpm docker:bootstrap -- --company-name "Real Capita" --company-slug "real-capita" --admin-email "admin@example.com" --admin-password "<replace-with-strong-password>"
```

## Open The App

- Web app: `http://localhost:3000`
- API health: `http://localhost:3333/api/v1/health`
- API readiness: `http://localhost:3333/api/v1/health/ready`
- Swagger, if enabled: `http://localhost:3333/api/docs`

Use `http://localhost:3000` for browser testing. Do not use `127.0.0.1` as the documented local browser URL.

## Login And Company Context

1. Open `http://localhost:3000/login`.
2. Sign in with the admin or assigned UAT user.
3. If the user belongs to more than one active company, choose the intended company and sign in again.
4. Confirm `/dashboard` loads.
5. Confirm the session menu shows the expected email, company, and role labels.

## Verify The Runtime

Run:

```powershell
corepack pnpm docker:smoke
docker compose ps
```

Manual checks:

- `/dashboard` loads after login.
- API health and readiness return success.
- One representative module route loads for the role being tested.
- Unauthorized direct-route access shows a forbidden state.

## UAT And Backup References

- UAT package: [../uat/README.md](../uat/README.md)
- Module scenarios: [../uat/module-wise-uat-scenarios.md](../uat/module-wise-uat-scenarios.md)
- Sign-off checklist: [../uat/phase-1-signoff-checklist.md](../uat/phase-1-signoff-checklist.md)
- Deployment guide: [../operations/deployment.md](../operations/deployment.md)
- Release checklist: [../operations/phase-1-release-checklist.md](../operations/phase-1-release-checklist.md)
- Backup/restore runbook: [../operations/backup-restore.md](../operations/backup-restore.md)

## Stop Or Inspect

```powershell
docker compose logs -f
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to remove named volumes.
