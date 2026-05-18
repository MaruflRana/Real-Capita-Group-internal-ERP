---
name: supervisor-handoff-completion
description: Use when finishing Real Capita ERP tasks so the result is easy for the supervisor chat to review, validate, and continue safely.
user-invocable: true
disable-model-invocation: false
---

# Supervisor Handoff Completion

Use this skill when finishing a Real Capita ERP task for supervisor review.

## Completion Report Shape

Produce a structured completion report with these sections:

1. Objective completed
2. Files changed
3. Docs updated
4. Validation results
5. Unsafe/untracked files left untouched
6. Blockers or caveats
7. Next recommended supervisor decision

Keep each section factual and evidence-based.

## Handoff Discipline

- Do not invent next scope.
- Do not self-authorize architecture changes, schema changes, migrations, seed changes, or access-model changes.
- Do not commit or push unless explicitly instructed.
- Keep `docs/handoffs/` as the source of continuity for prompt status and continuation notes.
- Do not create a new memory or handoff convention that competes with `AGENTS.md` and the existing Markdown handoff docs.

## What To Include

- State the exact objective that was completed.
- List changed files, grouped by area when useful.
- Identify docs updated, or state `none` if no docs changed.
- Report validation as `passed`, `failed`, `deferred`, or `not run`, with commands or checks.
- Identify unsafe or unrelated modified/untracked files that were intentionally left untouched.
- State blockers or caveats plainly; use `none` only when there are none.
- Recommend one concrete supervisor decision, such as review only, run broader validation, approve checkpoint, or define the next scoped prompt.
