---
name: verification-qa-gate
description: Use when validating Real Capita ERP work, checking evidence, reporting pass/fail clearly, and avoiding premature success claims.
user-invocable: true
disable-model-invocation: false
---

# Verification QA Gate

Use this skill before calling Real Capita ERP work complete.

## Choose The Right Validation Level

- For docs or agent-infrastructure-only changes, run repository status and diff checks, and inspect the created or edited files.
- For focused API changes, prefer the relevant NestJS service/controller tests first, then broader `corepack pnpm typecheck`, `build`, or `test` if scope warrants.
- For focused web changes, prefer targeted Playwright or component-adjacent checks first, then broader typecheck/build/test as warranted.
- For UI-visible changes, verify the relevant route at 1440px, 1366px, and 1024px when runtime QA is in scope.
- For Docker/runtime changes, run `docker compose up -d --build`, `corepack pnpm seed:demo` when demo data matters, `corepack pnpm seed:demo:verify`, and `corepack pnpm docker:smoke`.
- For schema, migration, seed, or test changes, confirm the task explicitly approved that scope before validating it.

## Evidence Rules

- Never claim success without command output, runtime observation, or file inspection evidence.
- Report each validation item as exactly one of:
  - `passed`
  - `failed`
  - `deferred`
  - `not run`
- Include the command or check name and the observed result.
- If a command fails, stop treating the task as complete until the failure is fixed or explicitly deferred with a reason.
- Mention runtime QA, seed verification, Docker smoke, browser QA, manual checks, or responsive checks when they are relevant but were not run.

## Git And Artifact Safety

- Run `git status --short` before any staging guidance.
- Check `git diff --stat` and `git diff --name-only` when summarizing changes.
- Preserve local artifacts and avoid accidentally committing:
  - `.env` files and local env overrides
  - `.env.tunnel-backup*`
  - `Caddyfile.tunnel`
  - `backups/` and `*.dump`
  - `node_modules/`
  - `.next`
  - `dist`
  - `test-results`
  - screenshots
  - `playwright-report`
  - `.playwright-mcp`
  - `.live-demo`
  - `docs/diagrams` unless explicitly requested
  - `*.tsbuildinfo`
- Do not stage, commit, or push unless the user explicitly asks for that action.

## Completion Output

- Summarize validations with status, command, and result.
- Separate checks that passed from checks that were not run or deferred.
- Call out unsafe or unrelated modified/untracked files left untouched.
