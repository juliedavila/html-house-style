# Changelog

All notable changes to this kit. Versions follow semantic versioning.

## 1.3.0 (2026-10-22)

### Speed

Measured on three tasks (a report with a 126-row dataset, a decision brief, a runbook), each run by a fresh session with only the skill and no browser. Over the three tasks, Sonnet went from 354 seconds to between 217 and 268 (four runs across the two rounds of changes below), and Haiku from 302 to between 216 and 234, with every page at 0 FAIL and the same honesty about the data. Most of the gain came from the first round (page.mjs, SNIPPETS.md, the fast path); the second round (--rules, --snippet, includes) cut what a session reads without a measurable change in time. Before these changes a session spent most of its time assembling the page by hand, grepping the template for component markup, and reading for orientation. These close each gap without changing how a page looks or behaves.

- New `tools/page.mjs`: `--skeleton PATTERN` prints a pattern example's body with its meta, and `page.mjs body.html page.html --check` wraps an edited body into the complete page (`base.css` inlined, the template's head script, zoom dialog and closing script) and runs `check.mjs`, printing only FAIL and WARN lines. It rebuilds every example byte for byte.
- New `SNIPPETS.md`: the shortest correct markup for every component in `base.css`, each with its rule, taken from the template and the examples.
- `SKILL.md` opens with a fast path: the patterns in one table, the command sequence and the handover line, and what to read only when the page needs it.
- `tools/table.mjs --help` and `tools/bars.mjs --help` list every option. The table command line gains `--statuses`, `--filters`, `--digest`, the dataset's `--title`, `--how`, `--chart-title` and `--takeaway`, and reads `{ "rows", "columns", "statuses" }` files; `bars.mjs --small` is a bare flag.
- `check.mjs` fails a page whose `.with-toc` holds anything besides the opening, `nav.toc` and one `.prose`. A page that put its body straight into `.with-toc` passed with 0 FAIL, while on a wide screen nine of its blocks sat in the rail column. The message says to wrap the body in `<div class="prose">`.
- `base.css`: on wide screens every child of `.with-toc` other than the rail and the bottom line goes in the content column, so a page that misses the wrapper still lays out. Correct pages are unchanged: the template and every example render with identical element boxes and identical screenshots.
- `page.mjs --rules PATTERN` prints only that pattern's section of `PATTERNS.md`, plus "State and the URL" for the patterns that keep state (Look up, Monitor, Review, a dataset page). `--snippet NAME` prints one component from `SNIPPETS.md`; `--snippet list` prints every name with its rule. `SKILL.md` lists the names, so a session asks for exactly the markup it needs.
- Include markers: a line `<!-- include: table.html -->` in the body is replaced by that file when `page.mjs` assembles the page, so generated tables and charts go in without a splice script. A missing file stops the build.
- `--skeleton` adds a second line listing the skeleton's sections with their line numbers; `page.mjs` drops it when it assembles. A clean `--check` prints one line, `0 FAIL 0 WARN: page.html`.
- `tools/selftest.mjs` also builds a page from every snippet and one page per pattern, requires 0 FAIL from each, and proves `page.mjs` rebuilds every example exactly.

## 1.2.0 (2026-10-22)

A layer above the style guide: page patterns. Version 1.1 said how a page looks and was tuned for one reader job, deciding, so a runbook or a dashboard got bent into the shape of a brief. Version 1.2 adds the step that comes first: name what the reader is doing with the page, and let that job choose the structure, navigation, interaction, state and print behaviour.

### Page patterns

- New `PATTERNS.md`: six patterns (Decide, Understand, Look up, Monitor, Do, Review), each with the same fields in the same order: the reader's job and question, signals, opening, skeleton, navigation, density, interaction and state, when to split, print and PDF, and failure modes. Then how to choose (including mixed pages), structuring the knowledge, state and the URL, multi-page sets, print and PDF, and the script blocks.
- New `examples/`: one short working page per pattern, plus a contents page that is itself a small Look up page. All content is invented.
- Pages declare their pattern: `<body class="doc" data-pattern="decide">`.

### Stylesheet

- New section 16, "Page patterns": `.print-btn`, the `.filter` bar with chip groups, `.entry` and `nav.index` for Look up, `.finding` for Review, `.preconditions`, `ol.steps.do` with checkboxes and `.expect` lines, the sticky `.progress` line, `.bridge`, `dl.fields`, `.print-only` and `.snapshot-note`, and `th.long` / `td.long`. No new colour tokens.
- Phones: table cells keep at least 7em, so a comparison of three or four options scrolls in its frame instead of stacking single words.
- Print: external link addresses print after the link text (`.no-url` opts out), code blocks wrap instead of cutting off, Do checklists print with empty boxes unless the reader chooses to print their progress, a Look up list prints in full whatever the filter, and label and value lists stay whole on a page.

### Script

- The template's closing script gains three blocks: a filter whose state lives in the URL hash (rebuilt on load and on `hashchange`), step progress kept in `localStorage` per page with a reset button, and the Save as PDF button. Each does nothing on a page without its markup, and the page reads correctly with script off.

### Checker

- `check.mjs` reads `data-pattern`: a missing pattern is a warning, an unknown one fails. The opening must match the pattern. Monitor pages need an "as of" time before the first `h2`; Do pages need numbered steps, a rollback heading and a "done when" line; Look up entries need ids; Review findings need a severity. A `.print-btn` with no `window.print()` is a warning.
- Look up, Monitor and Do pages do not need the contents rail; their index, filters or progress line does that job. Look up and Do headings are labels, so the short-heading warning skips them.

### Datasets, sorting and linked charts

- `section.dataset`: one section of a reading page switches to tool density, with a header strip naming what is interactive, a search box and chips, a sentence saying what the table shows, a bar chart that filters the table, and a sortable table in a frame capped in height. It prints its chart, the sentence and the filtered table, or with `data-print="summary"` the chart and counts only.
- Sortable columns are shipped: `th > button.sort` styling with a shape indicator, and script that sorts by `data-sort` or text, numbers as numbers, stably, keeping filtered rows hidden, with the order in the address.
- A chart that filters its table: bars are keyboard buttons; each bar counts the records under every filter except its own, so the bars stay a way to switch.
- New example: `examples/report-with-dataset.html`, a review with 140 invented records. Monitor and Review now use sortable tables; Monitor's working table is a dataset.

### State in the address

- Filter, sort and chart changes push browser history, so Back undoes them. Typing pushes one entry per pause.
- In-page links keep the filter (`#at=finding-3&sev=high`); a deep link to an item the filter hides clears that filter and shows it. The view is rebuilt on load, `popstate` and `hashchange`.
- "Showing N of M" is replaced by a sentence built from the state: "5 of 140 services: expired, Payments". It prints. Chips take one value per key; that is a stated limit.
- Monitor's returning reader: a digest of what the reader last saw stays in `localStorage`, and a dismissible panel lists what changed since the last visit.

### Tools

- New `tools/bars.mjs` (a sorted bar chart figure from data, label column sized with the checker's own width estimate), `tools/table.mjs` (a table or a whole dataset section from records, every value escaped) and `tools/selftest.mjs` (builds a chart and a 140-row table and checks them). Each works as a module and as a command under node, bun or deno.

### Checker, continued

- An interactions line lists what the page offers. The markup offering sort, filter, a linked chart or a print button with no script to deliver it now fails.
- `--was old.html` compares a replacement with the page it replaces: it fails for each interaction dropped and lists table row counts.
- `--fragment` (also detected when there is no `html` or `body`) checks a figure or table on its own.
- A warning when a page has a filter and in-page links but no handler that keeps the filter.

### Guide and site

- `SKILL.md`: a new first step, "Name the reader's job". `STYLE-GUIDE.md` points to the patterns from sections 3, 8, 9.2 and 13; the recipes in section 13 are now grouped by pattern. `CHECKLIST.md` checks the declared pattern, the opening, shareable state in the hash and print behaviour.
- `template.html` declares the Decide pattern and its gallery shows the patterns and their components.
- `build-index.mjs` also builds the examples into `examples/` at the repo root for GitHub Pages.
- Precedence: a page generated by code is changed at its generator; a host's own tests and specs replace the checker and the structure rules; a multi-page app with routes is out of scope even as one file. The description adds single-file web apps generated by a build to what the skill is not for.
- Two notes: a page shown by screen share needs a present view sized for the share (decks stay out of scope); a generated graph past about 40 nodes uses semantic zoom and sits outside the 1:1 figure rule.
- Print is denser: tighter section spacing, table rows and stat tiles. A long table repeats its header row on each page. A small chart no longer grows to the full printed width. The Decide example prints in four pages.

### From field use

- Sorting was described but not shipped, so a sortable table silently became a static one. It is now styled, scripted and checked.
- A report with more than 100 records had no pattern, so the records were flattened into one long table and the report grew several times longer. Records now go in a dataset with a chart that filters them.
- A mostly narrative page could not mark one section as a dense, interactive tool. `section.dataset` is that seam.
- Replacing an interactive page could drop interactions without anyone noticing. The checker now lists interactions and compares old and new pages.
- A dense, explorable dataset inside a narrative report had no worked answer. The new mixed example is that answer.
- Generating charts and tables by hand was slow. The helpers in `tools/` build them from data.
- Checking a generated figure meant checking a whole page. Fragment mode checks a piece on its own.
- Sortable columns are confirmed end to end: stylesheet, template script, `table.mjs` output and a checker failure when the script is missing.

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
