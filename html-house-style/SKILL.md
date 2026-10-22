---
name: html-house-style
description: House style for standalone HTML documents and simple tools a person reads or uses in a browser, such as reports, briefs, explainers, dashboards, trackers, diagram and chart pages, and Markdown converted to HTML. Answer-first structure, a restrained editorial look, legible zoomable diagrams, phone-safe layout, one self-contained file with no external libraries, and a static checker for machines with no browser. USE WHEN creating or restyling a standalone HTML page, report, brief, dashboard, diagram or chart meant for a browser, or converting Markdown to HTML. NOT FOR HTML email, marketing or landing pages, games, framework apps (React, Vue and similar), pages inside a codebase that has its own design system, slide decks, Word documents, or code that is not a page.
---

# HTML house style

Build every standalone HTML page with this skill. Generated pages tend to share one look (gradient heroes, emoji cards, tiny diagrams), and readers of serious documents find that look untrustworthy. This kit replaces it.

## Order of precedence

1. The reader's explicit request.
2. The host project's existing design system or framework. Inside a codebase that already has its own CSS and components, apply the writing and structure rules here and leave its styling alone unless asked.
3. This guide.

If the reader asks for a different palette, font or layout, do it and keep the rest of the rules. If they say a page is only for a desktop tool, the phone layout can be rough, but it must not break.

## Files in this skill

- `STYLE-GUIDE.md`: the full guide, with the reason behind each rule. Read sections 1 to 3 and 11 the first time you use this skill in a session, then the section for what you are building (diagrams and charts: 7; tools and dashboards: 13).
- `base.css`: the stylesheet. Inline the whole file into a `<style>` tag in every page.
- `template.html`: a decision brief, followed by a component gallery that shows every component in `base.css` once. Start from its structure.
- `CHECKLIST.md`: run it before you hand anything over.
- `check.mjs`: a static checker with no dependencies. `node check.mjs page.html` (or `bun`, or `deno run --allow-read`). It needs no browser.

## How to build a page

1. **Pick the recipe and the density** (STYLE-GUIDE section 13). Use `body class="tool"` when the reader mainly scans, filters or operates the page and reads fewer than about 300 words of prose; otherwise `body class="doc"`. If no recipe fits, use the research report recipe and drop sections that have nothing to say. Palette: `paper` for anything read at length, `slate` for the most conservative audience, `graphite` for dense tools.
2. **Write the opening first.** A page that argues for something or reports a finding opens with `.bluf`: three to five lines with the answer, why now, the cost and what would change the answer. A reference, tool or log page opens with one `.purpose` sentence saying what the page is for. A dashboard puts one computed status sentence in `.bluf`, with no list. Then write every argument `h2` as a claim a reader could disagree with. Navigation sections (Glossary, Sources, Method, Appendix, Detail) keep plain labels, go last, and carry `class="annex"`.
3. **Copy `template.html`.** Replace the `<link rel="stylesheet" href="base.css">` with the full contents of `base.css` inside `<style>`. Delete the component gallery. Keep the masthead, the `.bluf`, the head script and the closing script block. Keep the contents rail when the page has four or more `h2`s or about 1,200 words or more, and write its list into the HTML yourself, with the `.bluf` before `nav.toc`. Delete the palette toolbar unless the page is a tool the reader will live in.
4. **Fill the body** with the components in STYLE-GUIDE section 6. Use tokens for every colour. Wrap every table in `.table-wrap` and put its source in a `.table-note` after the wrapper. Put every figure in `figure`, with the Enlarge button first, then `.figure-frame`, then a caption whose first sentence is a `<strong>` takeaway.
5. **Draw diagrams and charts as inline SVG** with the `.d-*` and `.c-*` classes so they follow light and dark. Give every figure SVG `style="--fig-min: Wpx"`, where W is its viewBox width; it then never draws below 1:1, so the 13 and 12 unit label classes show at 13px and 12px. Compute chart coordinates from the data and write the scale in a comment. Use `--cat-1` to `--cat-6` through `.d-cat-N`, `.c-cat-N` and `.key.cat-N` for categories, never a colour in an SVG attribute. Keep any Mermaid source in `<script type="text/plain" class="diagram-source">`, never in an HTML comment (its `-->` arrows end the comment early). Never load a library.
6. **Write plainly.** Define each specialist term on first use with `.term` and `data-def`, and list every term in the glossary. Spell out acronyms on first use. Every measured or external figure names its source and date; your own estimates say they are estimates. No internal codes as names. No em dashes.
7. **Verify, at the highest tier you have.**
   - **Tier 1, a browser is available:** run `check.mjs` if you have a shell, then everything in CHECKLIST "Verified by looking".
   - **Tier 2, no browser:** run `check.mjs` if you have a shell. With no shell, do the same checks by reading the file (CHECKLIST "Verified by reading"), and write the label-size arithmetic for each figure into your handover. Fix what fails. Hand over with: "Not rendered. Checked by reading: [list]. Please look at: [the two or three things only a render can confirm, such as the figure on a phone, dark mode, print]."
   - Never write "I looked at it" or "it renders correctly" at Tier 2.

## Non-negotiables

- One self-contained `.html` file. No CDNs, frameworks, web fonts, charting libraries or network requests. Vanilla JavaScript only, and the page reads correctly with it off.
- Answer first; claim headings for the argument; sequential plans as numbered steps.
- Serif for reading text, system sans for interface, monospace for data. Restrained colour: one accent, a second used rarely, status always a shape plus a word.
- Space and hairlines before boxes. Cards only for real groups, never touching.
- Every figure label is at least 12px at its displayed size, and every figure can be enlarged.
- The page never scrolls sideways on a phone.
- You say what you checked and how. You never claim to have looked at a page you did not render.
