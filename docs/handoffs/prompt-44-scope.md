# Prompt 44 Scope: Reliable Supervisor-Desktop Live Demo Workflow

Prompt 44 addresses the operations-critical need for a practical supervisor-desktop workflow that can pull the latest ERP changes and launch a verified live Cloudflare demo link through a safe script.

## Source Of Truth

- `AGENTS.md`
- `docs/handoffs/foundation-status.md`
- `docs/handoffs/prompt-43e-status.md`
- `docs/operations/demo-data.md`
- `docs/operations/temporary-live-demo.md`
- `docs/release/demo-readiness-guide.md`

## Approved Direction

Prompt 44A diagnosed the root cause of the current localhost login failure: the API Docker container retained stale tunnel CORS values while the host `.env` had been restored to local-dev mode. Prompt 44A also identified that the existing live-demo scripts lacked git pull, demo data verification, login verification, and stale-env protection.

Prompt 44B implements:

1. A new wrapper script `scripts/update-and-start-live-demo.ps1` that:
   - checks git repository cleanliness
   - pulls latest code (fast-forward only)
   - stops leftover dev-server processes on port 3000
   - normalizes `.env` to local-dev values (detects and repairs stale tunnel URLs)
   - rebuilds the Docker stack
   - verifies API health
   - verifies demo data (default: verify only; optional `-RefreshDemoData` for reseed)
   - verifies local demo login
   - delegates tunnel launch to `start-live-demo.ps1 -SkipInitialBuild`

2. Enhancements to `scripts/start-live-demo.ps1`:
   - `-SkipInitialBuild` flag so the wrapper can skip redundant initial build
   - stale env restore baseline protection (detects and removes tunnelized `.live-demo/env.restore.env`)
   - public demo login verification after tunnel env rewrite and container recreate

3. `scripts/stop-live-demo.ps1` repair:
   - stale restore backup detection (removes tunnelized `.live-demo/env.restore.env` before restoring)

4. Documentation updates:
   - `docs/operations/temporary-live-demo.md` — comprehensive wrapper script guidance
   - `docs/release/demo-readiness-guide.md` — wrapper command in pre-demo checklist

## Access Boundary

No auth, backend, schema, migration, seed data, or ERP business logic changes. Scripts-only and docs-only.

## Explicit Deferrals

- No production hosting
- No named tunnel setup
- No permanent cloud deployment
- No auth redesign
- No schema/migration changes
- No seed data redesign
- No new ERP business features
- No CI/CD pipeline changes
