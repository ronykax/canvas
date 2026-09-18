# AGENTS.md

## Communication

- Keep replies short, digestible, and very clear.
- Lead with the answer. No preamble.
- Prefer a few sentences or bullets over essays.
- Skip recaps, extra background, and “here’s everything I found.”
- Explain only what the user asked. Expand only if they ask.

## Verification

- Never take screenshots, start screen recording, or open the app to verify work.
- The user does that themselves.
- Only do any of this when they explicitly ask.

## This repo

- Electron + React + TypeScript (electron-vite). Keep it simple.
- Renderer files live next to `index.html` at `src/renderer/` — not `src/renderer/src/`.
- `npm run check` / `npm run fix` = ultracite (oxlint + oxfmt).

## Canvas

- Infinite canvas. User documents are `.canvas` files. App source (`.ts`, `.tsx`, etc.) is fine.
- Format is JSON Canvas 1.0, including `file` nodes. Spec: https://jsoncanvas.org/spec/1.0/
- Read `docs/canvas.md` before canvas product or format work.

## UI

- Design tokens live in `src/renderer/index.css`. Use those classes (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, …). Do not add or overwrite `@theme` / `:root` tokens (no `token-*` overrides).
- Merge classes with `cn()` from `cn`.

## Docs

`docs/` is not auto-loaded. Read the relevant file before work:

- `docs/canvas.md` — product and `.canvas` format
