# Canvas

Infinite canvas app. Open and save `.canvas` files. The sidebar lists those canvases (and folders that contain them); other files are ignored, and titles omit the `.canvas` suffix.

## Format

[JSON Canvas 1.0](https://jsoncanvas.org/spec/1.0/) is the schema. Follow it as written — including `text`, `file`, `link`, and `group` nodes, edges, and colors.

Do not invent a parallel format, omit spec fields, or treat `.canvas` as a generic JSON/notes document. The spec is the source of truth; read it before format work.

`file` nodes are paths (and optional `#` subpaths) _inside_ a canvas. They are not a second app document type. The thing the app opens and saves is still `.canvas`.
