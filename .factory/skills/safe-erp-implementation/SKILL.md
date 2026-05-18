---
name: safe-erp-implementation
description: Use when implementing bounded Real Capita ERP changes while preserving architecture, docs, workflows, and task scope.
user-invocable: true
disable-model-invocation: false
---

# Safe ERP Implementation

Use this skill when making a scoped Real Capita ERP implementation change.

## Start From Source Of Truth

- Read `AGENTS.md` first.
- Read every task-specified source document before editing.
- If the task involves continuation scope, read the latest relevant files under `docs/handoffs/`.
- Treat `AGENTS.md` plus the Markdown handoff/status docs as the continuity system. Do not create a competing memory convention.

## Preserve Locked Architecture

- Keep the Nx + pnpm monorepo shape intact.
- Keep `apps/web` as a Next.js App Router frontend-only REST API consumer.
- Do not add Next.js server actions or API routes for ERP business operations.
- Keep `apps/api` as the NestJS REST API and sole backend source of truth for business logic, orchestration, and data access.
- Keep Prisma + PostgreSQL 15 as the persistence boundary.
- Do not make schema or migration changes unless the task explicitly scopes and approves them.
- Preserve MinIO/S3-compatible direct browser upload/download flows; do not proxy file bytes through the web app.
- Preserve canonical Dockerfiles and `docker-compose.yml` unless the task is explicitly infrastructure-related.

## Work In One Bounded Objective

- Restate the approved objective and explicit deferrals before choosing files.
- Make only changes needed for that objective.
- Avoid unrelated edits, opportunistic refactors, formatting churn, and module rewiring.
- Preserve existing module boundaries, route contracts, workflows, role access, and permissions.
- Use established local helpers, API clients, hooks, DTO patterns, guards, and UI primitives before adding new abstractions.
- Do not invent data, outputs, screenshots, validation results, or business behavior.

## Before Editing

- Inspect `git status --short` and note existing modified or untracked files.
- Leave unsafe or generated paths alone unless the user explicitly asks otherwise, including `.env`, `.env.tunnel-backup*`, `Caddyfile.tunnel`, `backups/`, `*.dump`, `node_modules/`, `dist/`, `.next/`, `test-results/`, `playwright-report/`, `.playwright-mcp/`, `.live-demo/`, `docs/diagrams/`, and `*.tsbuildinfo`.
- Identify whether the change belongs in web, API, packages, Prisma, docs, or tests before editing.

## Completion Expectations

- List the files changed.
- List validation run and the observed result.
- State blockers, deferred checks, or assumptions clearly.
- If staging guidance is requested, stage only intentional reviewed files and never stage unsafe/generated paths unless explicitly instructed.
