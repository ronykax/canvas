# canvas

infinite canvas app. all your canvases are local .canvas files so you can sync them however you want. it follows the [jsoncanvas.org](https://jsoncanvas.org) schema so your canvases open in obsidian just fine.

## todo

[json canvas 1.0](https://jsoncanvas.org/spec/1.0/)

top level

- [ ] `nodes`
- [ ] `edges`

nodes (z-index = array order)

- [ ] generic: `id`, `type`, `x`, `y`, `width`, `height`, optional `color`
- [ ] `text` — `text` (markdown)
- [ ] `file` — `file`, optional `subpath`
- [ ] `link` — `url`
- [ ] `group` — optional `label`, `background`, `backgroundStyle` (`cover` / `ratio` / `repeat`)

edges

- [ ] `id`, `fromNode`, `toNode`
- [ ] `fromSide` / `toSide`: `top`, `right`, `bottom`, `left`
- [ ] `fromEnd` / `toEnd`: `none`, `arrow` (defaults `none` / `arrow`)
- [ ] optional `color`, `label`

color

- [ ] hex, e.g. `#FF0000`
- [ ] presets `"1"` red, `"2"` orange, `"3"` yellow, `"4"` green, `"5"` cyan, `"6"` purple

