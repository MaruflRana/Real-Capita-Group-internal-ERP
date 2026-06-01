# Prompt 53A Status

## Prompt 53A: Public UAT Credentials and Reliable README Run Guide Update

**Status**: COMPLETE
**Date**: 2026-06-01
**Branch**: main
**Baseline checkpoint**: `92bc5a357 feat: replace demo seed with realistic Real Capita dataset`

## Scope Completed

- README fresh-machine setup now includes clone, Corepack enable, `.env.example` copy, Docker build, migration, realistic UAT seed, realistic UAT verify, smoke, and login steps.
- Public local/dev/UAT walkthrough credentials are documented in README for the seeded Real Capita Group workspace.
- README now clearly separates normal local access at `http://localhost:3000` from temporary Cloudflare live-demo URLs.
- `.env.example` now uses the documented public local/dev/UAT seed password so fresh-machine reseeding and README login instructions match.
- Live-demo scripts now default login verification to `admin@realcapita.com.bd` / `rcg-uat-2026-password` while preserving the existing `-DemoEmail` and `-DemoPassword` parameter names.
- Live-demo wrapper now uses canonical `seed:realistic:uat` and `seed:realistic:verify` commands instead of deprecated `seed:demo*` aliases.
- Live-demo and readiness docs were aligned away from old `demo.realcapita.test` users and old seeded `DEMO-*` walkthrough references.

## Public UAT Credentials

These credentials are documented only for local/dev/UAT/practicum walkthrough use in this private/internal repository:

```text
admin@realcapita.com.bd
rcg-uat-2026-password
```

The same documented local/UAT password applies to the verified walkthrough users:

```text
accountant@realcapita.com.bd
hr@realcapita.com.bd
payroll@realcapita.com.bd
sales@realcapita.com.bd
member@realcapita.com.bd
```

## Safety Notes

- No production secrets, real API keys, tunnel tokens, private keys, database service passwords from `.env`, OAuth secrets, or cloud credentials were added.
- The public password is labeled as local/dev/UAT/practicum-only and must not be reused for production.
- No UI redesign, business logic redesign, Prisma schema change, migration, or endpoint contract change was made.

## Validation

- `git diff --check`
- `corepack pnpm seed:realistic:verify`
- PowerShell parser checks for modified live-demo scripts

## Existing Local State Not Included

The workspace already had modified realistic-data source files and an untracked `.tmp/` directory before Prompt 53A edits began. They were not part of this prompt's staged checkpoint.
