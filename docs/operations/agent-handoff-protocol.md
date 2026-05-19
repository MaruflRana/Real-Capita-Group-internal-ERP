# Agent Handoff Protocol

## 1. Purpose

The Real Capita ERP project uses one supervisor brain and two implementation lanes:

- ChatGPT supervisor chat remains the project brain, architecture guardian, prompt writer, and output reviewer.
- Codex App / GPT-5.5 xhigh remains the primary high-trust implementation lane.
- Droid CLI + AgentRouter + GLM-5.1 is a verified reserve implementation lane for bounded work, continuation, and QA support.

The goal is continuity, speed, safety, and flexibility when Codex quota, runtime access, or task shape makes a lane switch useful. This protocol defines how to switch lanes without losing task state, duplicating work, or making overlapping edits in the same dirty worktree.

This document does not replace `AGENTS.md` or `docs/handoffs/`. It only defines the switching logic between implementation lanes.

## 2. Roles

### Supervisor Chat

- Owns architecture continuity, task scope, prompt writing, and final review.
- Decides which implementation lane should execute each prompt.
- Provides exact continuation state when switching lanes.
- Verifies whether a task is complete, needs audit, or needs another scoped prompt.

### Codex App / GPT-5.5 xhigh

- Primary implementation lane for high-risk or architecture-sensitive work.
- Best suited for complex reasoning, final implementation, deep audits, and tasks where subtle cross-module behavior matters.
- Must preserve existing dirty work and avoid staging, committing, or pushing unless explicitly instructed.

### Droid CLI + AgentRouter + GLM-5.1

- Reserve and continuation lane for bounded implementation, documentation, operational scripts, UI work after direction is locked, and verification tasks.
- Uses repository-local skills under `.factory/skills/` and the project Droid definition under `.factory/droids/`.
- Must follow `AGENTS.md`, task-specific source docs, and the latest handoff/status docs before editing.

Codex and Droid are not run in parallel on the same task or the same dirty worktree unless the supervisor explicitly creates a controlled split with non-overlapping files and clear ownership. The default rule is one active implementer at a time.

## 3. Agent Selection Guide

| Situation | Preferred lane | Notes |
| --- | --- | --- |
| Architecture-sensitive backend work | Codex | Includes module boundaries, API orchestration, guards, cross-module contracts, and data consistency. |
| Auth, security, role access, or accounting logic | Codex | These are high-blast-radius areas and need the highest-trust lane by default. |
| Prisma schema changes or migrations | Codex | Only when explicitly scoped and approved. |
| Complex cross-module refactors | Codex | Use when behavior spans multiple apps, packages, or domains. |
| First-pass design-system direction | Codex | Use for initial token strategy, visual system decisions, and high-risk UI foundations. |
| High-trust final implementation when risk is high | Codex | Especially before supervisor review, checkpoint, or production-adjacent work. |
| Bounded frontend/UI work after direction is locked | Droid | Appropriate when component scope, files, and visual direction are already clear. |
| Medium-risk implementation | Droid | Use when blast radius is bounded and source docs are explicit. |
| QA/browser verification | Droid | Useful for route sweeps, Playwright checks, screenshots, and validation evidence. |
| Operational scripts/docs updates | Droid | Good fit for scoped scripts, runbooks, and documentation hardening. |
| Targeted bug fixes | Droid | Appropriate when the bug, files, and expected behavior are explicit. |
| Continuation after Codex quota is reached | Droid | Only with a precise dirty-worktree or checkpoint handoff. |

The supervisor may intentionally override this guide based on urgency, context, quota, runtime access, or risk.

## 4. Clean Handoff Principles

- Keep one active implementer at a time.
- Do not run Codex and Droid concurrently against the same dirty tree.
- Preserve uncommitted work exactly unless the supervisor explicitly approves a revert or cleanup.
- Never assume a commit, push, or stage happened unless `git status`, `git log`, or remote evidence proves it.
- State the handoff type before the next agent starts:
  - Clean checkpoint handoff: work is committed, and the next agent starts from a known commit.
  - Dirty worktree continuation handoff: work is uncommitted, and the next agent must continue from exact changed files.
  - Audit-only handoff: the next agent inspects, verifies, or reports without editing.
- The next agent must run read-only status checks before editing.
- The next agent must continue the approved scope, not restart the task or invent a new roadmap item.

## 5. Codex To Droid Transfer Protocol

Recommended sequence:

1. Supervisor decides Codex will stop.
2. Capture the current Codex output and task status.
3. Record whether the work is committed, pushed, staged, or uncommitted.
4. If uncommitted, list exact changed files and the approved continuation point.
5. Identify unsafe or generated local artifacts that must remain untouched.
6. Write the Droid initial prompt with:
   - current task
   - previous prompt result
   - exact modified files if the worktree is dirty
   - explicit instruction to continue, not restart
   - files to read first
   - allowed scope and forbidden scope
   - required validation and final reporting format
7. Droid starts with read-only status checks before editing:
   - `git status --short`
   - `git branch --show-current`
   - `git diff --stat`
   - `git diff --name-only`
8. Droid confirms the dirty worktree matches the supervisor's expected file list before changing anything.

## 6. Droid To Codex Transfer Protocol

Recommended sequence:

1. Preserve Droid's final output, command results, and validation evidence.
2. Capture commit, push, and staging state explicitly.
3. Identify any uncommitted work and list exact changed or untracked files.
4. Note which work must be verified rather than redone.
5. Write the fresh Codex prompt with:
   - Droid's completed work
   - exact pending state
   - whether the worktree is clean or dirty
   - exact files changed if dirty
   - source docs to read first
   - what Codex should audit before changing
   - allowed scope and forbidden scope
   - required validation and final reporting format
6. Codex starts with read-only status checks and audits the Droid output before editing.
7. Codex must not restart a completed bounded task unless the supervisor explicitly asks for a redo.

## 7. Dirty Worktree Continuation Checklist

Use this checklist when the next agent must continue from uncommitted work, such as the Prompt 46B/46C brand refresh state.

- Run `git status --short`.
- Run `git diff --stat`.
- Run `git diff --name-only`.
- Confirm the expected modified and untracked files only.
- Confirm generated/local artifacts are excluded:
  - `.env`
  - `.env.tunnel-backup*`
  - `Caddyfile.tunnel`
  - `backups/`
  - `*.dump`
  - `node_modules/`
  - `dist/`
  - `.next/`
  - `test-results/`
  - `playwright-report/`
  - `.playwright-mcp/`
  - `.live-demo/`
  - `*.tsbuildinfo`
- State whether the next agent is continuing from the dirty state or must checkpoint first.
- State which files are off-limits because they belong to the prior prompt and must not be disturbed.
- Never run broad cleanup commands against a dirty worktree unless the supervisor explicitly approves them.

## 8. Clean Checkpoint Handoff Checklist

Use this checklist when the previous work was committed before switching lanes.

- Record the commit hash.
- Record the branch name.
- Record push state, including whether the commit is on the remote.
- Record the latest relevant handoff/status docs.
- Record validation that was run and its result.
- Record runtime/demo state if relevant:
  - Docker stack state
  - local URL/CORS mode
  - tunnel URL state
  - seeded Demo/UAT state
  - temporary processes that should not be assumed elsewhere
- Record local artifacts that should not be assumed on another machine, such as `.env`, `.live-demo/`, screenshots, `.next/`, or local logs.

## 9. Required Structure For Agent-Switch Initial Prompts

### Fresh Droid After Codex

```text
Read these files first and treat them as source of truth:
- AGENTS.md
- docs/handoffs/foundation-status.md
- [latest prompt scope/status docs]
- [task-specific docs]
- .factory/skills/safe-erp-implementation/SKILL.md
- .factory/skills/verification-qa-gate/SKILL.md
- .factory/skills/supervisor-handoff-completion/SKILL.md
- .factory/droids/real-capita-erp-implementer.md

You are continuing [task/prompt name].

Previous Codex result:
- [summary]

Repository state:
- Branch: [branch]
- Commit/push state: [committed/pushed/uncommitted]
- Dirty worktree files: [exact list or none]

Continue from the current state. Do not restart the task.

Allowed scope:
- [specific allowed work]

Forbidden scope:
- [specific forbidden files/domains/actions]

First run read-only checks:
- git status --short
- git branch --show-current
- git diff --stat
- git diff --name-only

Validation required:
- [commands/checks]

Final response format:
- [required report shape]
```

### Fresh Codex After Droid

```text
Read these files first and treat them as source of truth:
- AGENTS.md
- docs/handoffs/foundation-status.md
- [latest prompt scope/status docs]
- [task-specific docs]

You are continuing after Droid CLI + AgentRouter + GLM-5.1.

Droid completed:
- [summary]

Repository state:
- Branch: [branch]
- Commit/push state: [committed/pushed/uncommitted]
- Dirty worktree files: [exact list or none]

Do not redo completed Droid work unless audit evidence shows a problem.
Audit before changing.

Allowed scope:
- [specific allowed work]

Forbidden scope:
- [specific forbidden files/domains/actions]

First run read-only checks:
- git status --short
- git branch --show-current
- git diff --stat
- git diff --name-only

Validation required:
- [commands/checks]

Final response format:
- [required report shape]
```

## 10. Relationship To Existing Repo Memory System

- `AGENTS.md` is the enduring agent operating guide and architecture rulebook.
- `docs/handoffs/` is the prompt/task continuity system.
- `.factory/skills/` and `.factory/droids/` are Droid behavior scaffolding.
- `docs/operations/agent-handoff-protocol.md` defines switching logic between Codex and Droid lanes.
- This protocol is not a second memory system and must not replace the Markdown handoff/status docs.

## 11. Examples From Current ERP Workflow

### Codex To Droid During Prompt 46 Brand Refresh

If Codex quota becomes low during a brand refresh, the supervisor should stop Codex only after capturing the current Prompt 46 state. The Droid prompt must list the uncommitted Prompt 46B/46C files, state that Droid continues from the dirty worktree, and forbid changes to backend, schema, seed data, charts, print templates, receipt templates, and unrelated app code.

### Droid To Codex During Prompt 46D Chart Palette Work

If Droid implements a bounded chart palette pass but discovers a deeper design-system concern, the supervisor should transfer back to Codex with the exact Droid changes and evidence. Codex should audit the chart/token relationship before editing and avoid redoing already validated Droid work unless the audit finds a defect.

### Recovery After Lost Session Output

If a session output is lost, use an audit/recovery prompt similar to the Prompt 44C recovery pattern. The next agent should start from `git status --short`, `git log --oneline`, and relevant docs, then reconstruct what actually changed from git evidence and command outputs. It must not assume success from memory alone.

## 12. Anti-Patterns To Avoid

- Saying "continue from there" without stating exact task state.
- Running two agents against the same dirty worktree in parallel.
- Assuming a commit or push happened without git evidence.
- Restarting a scoped task from scratch when only continuation is needed.
- Letting an agent invent roadmap scope after a handoff.
- Omitting the changed-file list during a dirty worktree transfer.
- Asking the next agent to "clean up" without naming exactly what may be reverted or removed.
- Treating `.factory/skills/` or this protocol as a replacement for `AGENTS.md` and `docs/handoffs/`.
