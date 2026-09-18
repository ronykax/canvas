# AGENTS.md

## Communication

- Keep replies short, digestible, and very clear.
- Lead with the answer. No preamble.
- Prefer a few sentences or bullets over essays.
- Skip recaps, extra background, and “here’s everything I found.”
- Explain only what the user asked. Expand only if they ask.

## This repo

- Electron + React + TypeScript (electron-vite). Keep it simple.
- Renderer files live next to `index.html` at `src/renderer/` — not `src/renderer/src/`.
- `npm run check` / `npm run fix` = ultracite (oxlint + oxfmt).

## Canvas

- Infinite canvas. User documents are `.canvas` files. App source (`.ts`, `.tsx`, etc.) is fine.
- Format is JSON Canvas 1.0, including `file` nodes. Spec: https://jsoncanvas.org/spec/1.0/
- Read `docs/canvas.md` before canvas product or format work.

## Docs

`docs/` is not auto-loaded. Read the relevant file before work:

- `docs/canvas.md` — product and `.canvas` format
