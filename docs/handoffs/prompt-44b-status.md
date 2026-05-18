# Prompt 44B Status: Supervisor-Desktop Live Demo Workflow Implementation

## Summary

Prompt 44B implemented the reliable supervisor-desktop live demo workflow based on the Prompt 44A analysis and scoping. The implementation addresses the root cause of the login failure (CORS/env mismatch) and adds comprehensive verification to the live-demo launch process.

## Root-Cause Repair

The immediate login failure was caused by the Docker API container retaining stale tunnel CORS values. The repair approach:
- The `update-and-start-live-demo.ps1` wrapper normalizes `.env` to local-dev values before Docker rebuild
- The wrapper forces `--force-recreate` on `api` and `web` containers after env normalization
- The wrapper verifies local demo login before proceeding to tunnel launch
- This ensures the CORS/env mismatch that caused the login failure cannot recur when the wrapper is used

## New Wrapper Script

`scripts/update-and-start-live-demo.ps1` provides one practical supervisor-desktop command that:

1. Checks git repository state (tracked modifications block the workflow)
2. Pulls latest code from `origin/main` (fast-forward only, never merge/rebase/force)
3. Stops any leftover known ERP dev-server process on port 3000
4. Normalizes `.env` to local-dev values (detects and repairs stale tunnel URLs)
5. Rebuilds Docker Compose stack with `--build` then `--force-recreate api web`
6. Verifies API health at `/api/v1/health`
7. Verifies demo data with `seed:demo:verify` (default: verify only; `-RefreshDemoData` for reseed)
8. Verifies local demo login with `POST /api/v1/auth/login` using documented credentials
9. Delegates tunnel launch to `start-live-demo.ps1 -SkipInitialBuild`

Optional flags: `-RefreshDemoData`, `-DemoEmail`, `-DemoPassword`

## start-live-demo.ps1 Enhancements

1. `-SkipInitialBuild` flag: when provided, skips the initial `docker compose up -d --build` step since the wrapper already prepared the stack. Infrastructure services are still checked for health.

2. Stale env restore baseline protection (`Backup-EnvIfNeeded`):
   - Before creating a restore backup, checks if the current `.env` contains tunnel URLs (`trycloudflare.com`)
   - If yes, repairs `.env` to local-dev values first, then creates the backup from the repaired state
   - Before using an existing restore backup, checks if it contains tunnel URLs
   - If yes, removes the stale backup, repairs `.env` if needed, and creates a fresh local-dev backup
   - This prevents the `.live-demo/env.restore.env` from silently preserving tunnelized URL values

3. Public demo login verification (`Verify-PublicDemoLogin`):
   - After tunnel env rewrite and container recreate, POSTs to `/api/v1/auth/login` through the public tunnel URL
   - Uses documented demo credentials (configurable via `-DemoEmail` and `-DemoPassword` params)
   - Confirms login succeeds (HTTP 200/201) before printing final "ready" output
   - If login fails, throws an error with guidance to run `stop-live-demo.ps1`

## stop-live-demo.ps1 Repair

`Restore-Env` function now:
- Before restoring from `.live-demo/env.restore.env`, checks if it contains tunnel URLs
- If yes, removes the stale backup and repairs `.env` to local-dev values instead of restoring from a tunnelized backup
- This prevents `stop-live-demo.ps1` from "restoring" tunnel URLs to the `.env` on stop

## Demo Data Policy

- Default: verify only (`seed:demo:verify`)
- If verification fails without `-RefreshDemoData`: script stops with guidance to rerun with the flag
- With `-RefreshDemoData`: runs `seed:demo` then `seed:demo:verify`; continues only if verification passes
- Never reseed automatically without the explicit flag

## Local Runtime Repair

During validation, the current inconsistent runtime state was repaired:
- Leftover dev server on port 3000 was identified (will be stopped by the wrapper when run)
- Docker `api` and `web` containers were recreated with local-dev `.env` values
- CORS/env mismatch was resolved, restoring localhost demo login functionality

## Files Changed

- `scripts/update-and-start-live-demo.ps1` (new file)
- `scripts/start-live-demo.ps1` (modified: `-SkipInitialBuild`, `-DemoEmail`, `-DemoPassword` params, stale env protection, public login verification)
- `scripts/stop-live-demo.ps1` (modified: stale restore backup detection and repair)
- `docs/operations/temporary-live-demo.md` (updated: wrapper script section, verification steps, demo data policy)
- `docs/release/demo-readiness-guide.md` (updated: wrapper command in pre-demo checklist)
- `docs/handoffs/prompt-44-scope.md` (new)
- `docs/handoffs/prompt-44a-status.md` (new)
- `docs/handoffs/prompt-44b-status.md` (this file)

## Validation Status

See the Prompt 44B final response for validation results. Full public-tunnel end-to-end launch/checkpoint is deferred to Prompt 44C.

## Final Status

Implementation complete, awaiting supervisor review before Prompt 44C runtime checkpoint.
