# Pre-handover checklist

Run every item that applies. When you hand the page over, say which tier you reached and what you checked.

If you have a shell, start with `node check.mjs page.html` (or `bun check.mjs page.html`, or `deno run --allow-read check.mjs page.html`). It covers the items marked (script) and prints the label arithmetic for every figure. Fix every FAIL, or say why it stays.

## Verified by reading (every page, browser or not)

### Structure

- [ ] The masthead has the kicker, a title that states the main claim, the dek and the meta line.
- [ ] A page that argues or reports opens with one `.bluf`; a reference or tool page opens with one `.purpose` sentence; a dashboard's `.bluf` is one status sentence. (script: count)
- [ ] Every argument `h2` is a claim. Navigation sections (Glossary, Sources, Method, Appendix, Detail) are `h2.annex` and come last. (script: order, short-heading warning)
- [ ] Every `h2` has a unique `id`. (script)
- [ ] Pages with four or more `h2`s or about 1,200 words have the contents rail, with its list written in the HTML, and the `.bluf` comes before `nav.toc`. (script)
- [ ] Plans and processes are numbered steps; dated events are a timeline.

### Writing

- [ ] Every `.term` is in `dl.glossary`, and every glossary entry is marked as a `.term` where it first appears. (script)
- [ ] Acronyms are spelled out on first use. (script: warning)
- [ ] Every measured or external figure names its source and date. Estimates say "estimate". Measured and assumed are kept apart in the wording.
- [ ] No em or en dashes, no rhetorical questions, no filler closers. (script: dashes)
- [ ] No internal codes stand in for names in prose.

### Look, by reading the code

- [ ] `base.css` is inlined in full; page CSS after it uses tokens only. No colour values in page CSS, `style` attributes or SVG attributes. (script)
- [ ] Every dark rule sits under `@media screen`. (script)
- [ ] Status uses `.status` (shape and word); categories use `--cat-N` classes with a legend.
- [ ] No gradients, emoji, stock images, icon-per-bullet or ALL CAPS headings.
- [ ] Cards only for real groups.

### Figures, by arithmetic

- [ ] Each figure would be missed if removed.
- [ ] Each sits in `figure`: Enlarge button, then `.figure-frame`, then a caption that opens with a `<strong>` takeaway. (script)
- [ ] Each SVG has `viewBox`, `role="img"`, `<title>`, `<desc>`, `aria-labelledby`, and `style="--fig-min: Wpx"` with W its viewBox width. (script)
- [ ] Label size: every label class is 12 units or more, so with `--fig-min` set it shows at 12px or more. Written out for each figure in the handover if no script ran. (script)
- [ ] Label fit: each label's estimated width (characters x size x 0.55, or 0.6 for bold or uppercase) fits its box with 4 units to spare and stays inside the viewBox; no label sits on a line or another label. (script, for straight lines)
- [ ] Data figures name source and date; figures with rough values say "Illustrative" and "estimated"; chart coordinates come from a stated scale.
- [ ] Mermaid source, if any, is in `<script type="text/plain" class="diagram-source">`, never an HTML comment. (script: stray `-->`)
- [ ] Marker ids are unique across the page; every `img` has `alt`. (script)

### Phone safety, by reading

- [ ] Every table is inside `.table-wrap`; its source line is in a `.table-note` after the wrapper. (script)
- [ ] No fixed width over 358px outside a scrolling frame; no long unbroken strings outside `code`. (script)

### Technical

- [ ] Single file. No external scripts, styles, fonts or media. Under 2MB. (script)
- [ ] `localStorage` calls are inside `try`/`catch`; the inline script parses. (script)
- [ ] `html` has `class="no-js"`; tab panels are not authored `hidden`; the page reads with JavaScript off. (script)

## Verified by looking (Tier 1 only: a browser is available)

- [ ] Desktop render (1280 to 1440px) checked region by region at full size.
- [ ] True phone viewport (390px, via DevTools device metrics) checked; `scrollWidth <= innerWidth`, also with a `.term` focused.
- [ ] Dark mode checked.
- [ ] Print preview checked: light colours, collapsed sections open, nothing split badly.
- [ ] Every figure opened in the Enlarge dialog and read at zoom.
- [ ] Contents rail, tabs, collapsibles and enlarge buttons clicked.
- [ ] No heading leaves a single word alone on its last line; nothing sits flush against the block above it.

## Handover line at Tier 2

"Not rendered. Checked by reading: [the items above]. Please look at: [the two or three things only a render can confirm]."
