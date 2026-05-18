# Prompt 44A Status: Analysis and Scoping

## Summary

Prompt 44A diagnosed the current localhost login failure and scoped the implementation direction for a reliable supervisor-desktop live demo workflow.

## Root Cause

The demo login failure at `http://localhost:3000/login` was caused by a CORS/env mismatch:
- The browser sends `Origin: http://localhost:3000` to the API at `http://localhost:3333`
- The Docker API container had `CORS_ORIGIN=https://noticed-thermal-guys-rhythm.trycloudflare.com` from a prior tunnel session
- The host `.env` had been restored to `CORS_ORIGIN=http://localhost:3000`, but the Docker container was never recreated with the restored values
- The API rejected the browser's CORS origin, causing all fetch requests to fail with CORS policy errors

The login failure was NOT caused by:
- Missing demo seed data (seed verification passed)
- Wrong credentials (direct API login returned 201)
- Backend bugs
- Database state issues

## Current Live-Demo Script Audit

- `start-live-demo.ps1`: handles Docker stack start, Caddy proxy, cloudflared tunnel, env rewrite, container rebuild, and `/login` page verification. Does NOT: pull code, verify demo data, verify actual login, or protect against stale env restore backups.
- `stop-live-demo.ps1`: handles cloudflared stop, Caddy removal, env restore from `.live-demo/env.restore.env`, and container rebuild. Does NOT: detect stale tunnelized restore backups.

## Selected Implementation Direction

Option B: Create a new `scripts/update-and-start-live-demo.ps1` wrapper that orchestrates the full workflow while delegating tunnel operations to the existing `start-live-demo.ps1`.

## Final Status

Analysis completed. Implementation scoped and ready for Prompt 44B.
