# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install
npm run dev      # Vite dev server at http://localhost:5173 (React StrictMode: effects run twice)
npm run build    # production build into dist/
npm run preview  # serve dist/ to check the build
```

There is no test suite and no linter. Verify changes by running the app in a browser: the template grid, the editor and an export (single file and zip).

Requires Node.js ^20.19 or >=22.12 (Vite 8); CI uses Node 24.

## Commits

Commit messages are always in English and follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `ci:`, `chore:` …).

## Deployment

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main` (the repository's Pages source must be "GitHub Actions"). `base: './'` in `vite.config.js` keeps asset paths relative so the same build works under `/<repo>/` and on a custom domain; keep it relative.

## Architecture

Static single-page app with no backend: all image processing happens in the browser on `<canvas>`. The app started as a single-file Claude artifact; the first commits in the history hold that original `index.html`, which is the reference for the expected behavior and look.

Code comments are in Brazilian Portuguese. UI text lives in `src/locales/` (see Internationalization).

### Two layers

- `src/lib/`: framework-free canvas code (templates, color grade, textures, fonts, sample images, rendering, export). Keep React out of it.
- `src/App.jsx`, `src/state.js`, `src/components/`: the React UI. `GridView` is the home screen; `Editor` (+ `EditorPanels`) edits one template.

### Template model (`src/lib/templates.js`)

- `DEFS` lists the 12 default templates. `layout` is a recursive tree: `0` is a photo slot, `'x'` an empty spacer, `{ d: 'r' | 'c', s: [weights], k: [children] }` a row/column split. Slot indexes follow depth-first order.
- `makeTpl(def)` builds the editable template: `{ key, def, slots: [{ img, zoom, px, py, flip }], texts: [...], border: { outer, gap, radius, color, tex, amt, blend }, pick, edited }`. `key` is stable (`def.id` for defaults) and identifies a template everywhere (editor, undo history, archive, card keys); indexes shift when a saved template is deleted.
- Geometry is designed on a 1280×720 base (`BW`); sizes scale by `W / BW`, and text positions (`x`, `y`) are fractions of the canvas.

### My templates (`src/lib/userTemplates.js`)

- A saved template is `{ key: 'm-…', mine: true, name, def, slots, texts, border, pick, edited, saved }`. `def` is the default template it derives from (its layout); files and storage call it `base`. `saved` is the JSON of the last saved version, and `isDirty(t)` compares against it. Saving a default template in the editor creates a copy and switches the editor to it.
- Stills are not part of a template: in memory slots keep `img` for the session, but `saved`, localStorage (`tb-mine`) and exported files keep only `zoom`, `px`, `py` and `flip`. Renaming is stored right away; other edits only on save.
- Export/import file: `{ format: 'thumb-builder-template', version: 1, name, base, slots, texts, border }`. Everything read back (files and `tb-mine`) goes through `readTemplate`, which rejects unknown bases or a wrong slot count, keeps only known keys and clamps numbers to the editor's slider ranges; keep those ranges in sync with `EditorPanels`.

### Rendering (`src/lib/render.js`)

`renderTpl(t, ti, W, H, env, { canvas, hi })` paints border color → texture → photo layer → texts and returns `{ canvas, boxes }`, where `boxes` are the text bounding boxes (fractions) that the editor uses for hit testing.

- `env = { images, imgVer, grade }` carries everything outside the template that affects the drawing; pass it explicitly instead of reading globals.
- `ti` (template index) matters: a slot without an assigned image falls back to `images[(ti + si) % images.length]` (`imgFor`).
- The photo layer (with the per-pixel color grade) is cached per `ti:W`, keyed by JSON of the base template id, slots, border geometry, `imgVer`, `grade.key` and image count. Anything new that changes the photo layer must go into that key.
- `hi: true` (export) draws from full-resolution sources; otherwise previews capped at 1600 px are used.

### Internationalization (`src/lib/i18n.js`, `src/locales/`)

- `pt-BR.js` (the default) and `en.js` are flat dictionaries with the same keys. The chosen language is saved in localStorage (`tb-lang`) and set on `<html lang>`.
- `tr(key, params)` reads the current language at call time, so `src/lib` modules (toasts, export file names) call it directly. Components get it from `useTr()` in `state.js`, which re-renders them when the language changes; call it in every component that shows text.
- `{name}` placeholders come from `params`. With `params.n`, `key_one` / `key_other` is chosen by `Intl.PluralRules` (pt-BR treats 0 as singular).
- Lists in `src/lib` (`FILTERS`, `TEXTURES`, `FCATS`, `DEFS`) hold ids only; display names are the keys `filters.<id>`, `texture.<id>`, `fontCat.<id>` and `tpl.<id>` (`tplName(t)`). Sample stills are named with `imgName(im)`.

### Fonts (`src/lib/fonts.js`)

`loadFontStyles()` injects one Google Fonts stylesheet per family. `needFonts(texts)` returns `null` when the fonts are ready, or a promise: callers draw right away and redraw when it resolves. It waits for the family's stylesheet before `document.fonts.load`, because a load issued earlier resolves empty and the font would be marked ready without being downloaded.

### State and redraws

- `state.js` holds one immutable state object; `actions` is stable. `tpls` holds the 12 defaults followed by the saved templates. `archived` lists the keys of archived default templates (saved in localStorage `tb-archived`); bulk actions (select all, shuffle, apply borders to all) skip them, and archiving unselects the template. A template's index (`ti`) is always its position in the full `tpls` list, never in a filtered one.
- `editTpl` marks the template as edited, `setTpl` does not. Use `setIn` / `patchIn` from `util.js` with dotted paths such as `texts.0.shadow.blur`.
- Canvas effects depend on the identities of `slots`, `texts` and `border`, so updates must create new objects or nothing redraws.
- Grid cards draw through `lib/scheduler.js` (one job per macrotask; scheduling the same key replaces a pending job), and the grid uses a 90 ms debounced grade so slider drags stay responsive.

### Editor (`src/components/Editor.jsx`)

- `App` tracks the open template by `key` and mounts the editor with `key={key}`; the active tab and the per-template undo history (by key) live in `App`, so they survive closing and reopening the editor.
- History stores JSON snapshots of `{ slots, texts, border }`, committed after 350 ms without changes and never during a drag.
- The wheel (zoom) listener is attached manually as non-passive because React registers `onWheel` as passive.
- Photo-swap drag state is kept in a ref, since `pointerup` can arrive before the last `pointermove` re-render.

### Export (`src/lib/exporter.js`)

Renders each selected template at the chosen size with `hi: true` and downloads it through a temporary object URL; several templates go into one zip, with JSZip loaded by dynamic import.

### Styles

`src/styles.css` is the original CSS with light/dark tokens on `:root`. `#root` uses `display: contents` so the layout (including the sticky header) behaves as if the components were direct children of `<body>`.
