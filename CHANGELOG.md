# Changelog

All notable changes to this kit. Versions follow semantic versioning.

## 1.1.0 (2026-10-22)

From an adversarial review: a technical audit, a doctrine review, an adopter test and a release check.

### Works without a browser

- New `check.mjs`: a static checker with no dependencies (Node 18+, Bun or Deno). It checks comment balance and Mermaid leaks, label size at phone, tablet and desktop widths, label fit and overlap, hard-coded colours, dark rules outside `@media screen`, figure and document structure, the contents rail, self-containment, scripts, dashes, acronyms and the glossary.
- Verification has two tiers. With a browser, render and look. Without one, run the static checks and hand over with "Not rendered. Checked by reading: ... Please look at: ...". The checklist is split into "Verified by reading" and "Verified by looking".

### Figures

- Figures draw at 1:1 or larger, never smaller. Every figure SVG sets `style="--fig-min: Wpx"` (its viewBox width) and scrolls inside its frame on narrow screens. Figures grow to at most 1.25 times their size, and `.small-ok` charts keep exactly their own size.
- One label floor everywhere: 12px. `.d-small` is now 12 units.
- The Enlarge button sits above the frame and no longer covers the figure.
- New category tokens `--cat-1` to `--cat-6` (light and dark, checked for contrast and colour-vision separation) with `.d-cat-N`, `.c-cat-N` and `.key.cat-N`; `.d-zone` for group outlines; chart classes `.c-bar`, `.c-line`, `.c-axis`, `.c-grid`, `.c-tick`, `.c-value`; `text.d-mark` for an "Illustrative" mark inside an SVG.
- Arrowhead colour comes from CSS with a fallback, so engines without `context-stroke` show the edge colour instead of black.
- Mermaid source goes in `<script type="text/plain" class="diagram-source">`. An HTML comment breaks on Mermaid's `-->`.

### Layout and components

- The bottom line comes before the contents rail in the markup. On phones it is on the first screen and the rail is a collapsed box under it.
- The contents rail is written into the HTML. Script only marks the current section (by position, so it is right when scrolling up and at the end) and builds links with `textContent`.
- The `.term` definition no longer pushes the page sideways on phones: it is pinned to the bottom of the screen there. Keyboard focus shows a ring.
- Long tables use `.table-wrap.scroll-y`, which keeps the header in view. Table sources go in `.table-note` after the wrapper. Row headers (`th scope="row"`) and a recommended column (`.rec`) are styled.
- New: `ol.timeline`, form controls (`.field`, inputs, `select`, `textarea`, `fieldset`, `.check`), `.purpose`, code highlighting spans, `.visually-hidden`.
- Long values no longer widen the page in `.stats` and `.meta`; grid children have `min-width: 0`.
- Type scale anchored on the 18px body, so `h3` is always larger than body text and `h4` never smaller. Stat tiles are 16px apart. `body.tool` tables are denser.

### Script

- Zoom dialog fits both axes, sizes the figure with width and height, ignores figures with no size, strips duplicate ids from the copy, closes on a backdrop click, and labels its buttons.
- Palette and theme choices are stored per page and never override a `data-theme` written in the markup. The theme switch cycles auto, light and dark and shows its state.
- Tabs have one tab stop and arrow, Home and End keys. Panels show with script off.
- `class="no-js"` on `html` hides script-only controls when script does not run.

### Print

- Print colours apply on pages that set `data-palette` (the print rule was losing on specificity).
- Collapsed sections and inactive tab panels print open, also with script off in engines that support `::details-content`.
- Glossary terms stay with their definitions.

### Guide

- `.bluf` only for pages that argue or report a finding; reference and tool pages open with one `.purpose` sentence; dashboards use one status sentence.
- Navigation sections use plain labels with `h2.annex`, after the argument.
- Order of precedence: the reader's request, then the host project's design system, then this guide. Narrower trigger in `SKILL.md`.
- Rules for numbers (measured, estimated, plan parameters), rounding that does not flatter the recommendation, a countable rail threshold, a doc or tool test, maps, image budgets, timelines, code, multi-page sites and forms.
- Honest font claims for Linux and ChromeOS, Shneiderman credited for "overview first", the headless window-size note corrected, and the reader described as a persona.

### Repository

- `template.html` is a decision brief followed by a gallery of every component. `index.html` is generated from it by `build-index.mjs`.
- README: screenshot, an exact install command for one repository, updated claude.ai steps, and the two verification tiers.
- `.nojekyll`, so GitHub Pages serves the files as they are.

## 1.0.0 (2026-10-22)

Initial release: `SKILL.md`, `STYLE-GUIDE.md`, `base.css` with three palettes in light and dark, `template.html`, `CHECKLIST.md`, and the sample page.
