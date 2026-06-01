# Phase 2 Overlay Usage

## Scope

Phase 2 adds a read-only, route-aware Defense Trace overlay to the Next.js web
app. It consumes the existing trace registry and does not change ERP business
behavior, backend endpoints, Prisma schema, migrations, or packages.

The overlay is hidden during normal demos unless explicitly enabled.

## Enable And Disable

Enable or disable from any page:

```text
Ctrl + Alt + T
```

If a browser or system shortcut conflicts, open the page with `?trace=1`.

Enable from a URL for the current browser session:

```text
?trace=1
```

The enabled/disabled state is stored in browser `localStorage` under:

```text
real-capita:defense-trace:enabled
```

Closing the overlay stores the disabled state. Refreshing the page preserves the
stored state.

## Presenter-Safe Default View

The default panel is designed for projector display. It shows:

- current route
- matched trace entry
- route patterns
- frontend route files
- frontend feature files
- frontend API files
- backend files
- Prisma models
- search commands
- presenter summary
- stack context
- edit impact

Preparation-only details are collapsed under `Study Notes`:

- beginner explanation
- implementation notes
- study notes
- risk notes

## Workspace Root

Open/copy actions use relative registry paths plus a local workspace root. Set
the workspace root in the overlay settings panel:

```text
Set this once per machine. Example: your local repository root.
```

The workspace root is stored only in browser `localStorage` under:

```text
real-capita:defense-trace:workspace-root
```

No absolute desktop or laptop path is committed to Git.

## File Actions

Every file reference supports:

- copy relative path
- copy absolute path when workspace root is set
- copy VS Code command using `code -g`
- copy a ripgrep command
- request open in VS Code using a `vscode://file/` URI when workspace root is
  set

If the browser or operating system blocks `vscode://` links, use the copied
`code -g` command or the relative path fallback.

## No Match Fallback

If the current route has no route-specific registry match, the overlay shows a
professional fallback:

- search the repository by visible page text
- use the browser Network tab to identify the API helper path
- manually select a trace topic from the overlay dropdown

## Phase 2 Boundaries

This phase intentionally does not include:

- click-to-trace page anchors
- API/network capture
- backend changes
- database changes
- package additions
- sensitive session, environment, or credential display

Recommended next work is a Phase 3 polish pass for manual topic search,
position preference, and laptop/projector verification.
