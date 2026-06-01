# Portable VS Code Opening Design

## Problem

Defense Trace must work on two machines:

- the personal desktop during preparation
- the laptop during the practicum defense

Absolute paths cannot be committed because each machine can have a different
drive letter, user folder, clone location, and workspace name. A committed
absolute path would work on one machine and fail on the other.

The registry therefore stores only relative project paths, for example:

```text
apps/web/src/features/dashboard/dashboard-page.tsx
apps/api/src/app/auth/auth.controller.ts
prisma/schema.prisma
```

## Relative Paths Plus Workspace Root

The portable design separates stable repository paths from machine-specific
workspace roots:

- Git-tracked registry value: `<relativePath>`
- locally stored machine value: `<workspaceRoot>`
- resolved local file target: `<workspaceRoot>/<relativePath>`

The same registry can travel from desktop to GitHub to laptop because only the
workspace root changes per machine.

## Local Workspace Root Storage

Future Phase 3 UI should store the workspace root in browser `localStorage`.
This keeps the setting local to each machine and avoids adding personal paths to
Git.

Suggested localStorage key:

```text
real-capita:defense-trace:workspace-root
```

Suggested stored shape:

```json
{
  "workspaceRoot": "<workspaceRoot>",
  "storedAtIso": "2026-06-01T00:00:00.000Z"
}
```

The overlay should let the presenter set or update the workspace root from the
UI. It should also allow clearing the value before handing the machine to
someone else.

## VS Code URI Format

Future clickable open logic should build:

```text
vscode://file/<workspaceRoot>/<relativePath>
```

If a line is available, the target can append the line number:

```text
vscode://file/<workspaceRoot>/<relativePath>:<line>
```

Implementation notes for Phase 3:

- normalize path separators before building a URI
- encode URI components safely
- keep the original relative path available for copying
- never write the workspace root into tracked source files

## Fallback Actions

Browsers, OS settings, or VS Code configuration can block custom `vscode://`
links. Every file reference should therefore expose copy fallbacks:

- Copy relative path:

```text
apps/web/src/features/dashboard/dashboard-page.tsx
```

- Copy absolute path built from workspace root:

```text
<workspaceRoot>/<relativePath>
```

- Copy VS Code CLI command:

```text
code -g "<absolutePath>:<line>"
```

- Copy ripgrep command:

```text
rg "<symbolName-or-search-text>" "<relativePath>"
```

These options make the feature usable even when direct opening is unavailable.

## Desktop To GitHub To Laptop Workflow

1. On the desktop, commit only relative-path registry and documentation files.
2. Push the branch to GitHub after normal verification.
3. On the laptop, pull the branch into the local clone.
4. Start the app normally.
5. Open the future Defense Trace settings panel.
6. Set the laptop workspace root through the UI.
7. Test one route file, one API helper, one backend controller, and
   `prisma/schema.prisma`.

No personal desktop path should be needed on the laptop.

## Laptop Verification Checklist

When Phase 3 exists, verify:

- The registry still contains only relative paths.
- The workspace root is present only in `localStorage`.
- A dashboard route file opens through `vscode://file`.
- A backend controller opens through `vscode://file`.
- `prisma/schema.prisma` opens through `vscode://file`.
- Copy relative path works.
- Copy absolute path uses the laptop workspace root.
- Copy `code -g` command includes the correct absolute path and line when a
  line is available.
- Copy `rg` command uses a relative path or safe search scope.
- Clearing the workspace root disables open actions but keeps copy-relative and
  `rg` fallback actions available.

## Current Phase Boundary

Phase 0 and Phase 1 only create the typed foundation, registry, and design
documentation. They do not add the overlay UI, do not open VS Code, and do not
write any machine-specific workspace root setting.
