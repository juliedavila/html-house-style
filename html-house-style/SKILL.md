---
name: html-house-style
description: The reader's house style for any HTML page, report, brief, explainer, dashboard, diagram page or artifact. Answer-first structure, restrained editorial look, legible zoomable diagrams, phone-safe layout, one self-contained file with no external libraries. USE WHEN creating or restyling any HTML output, an HTML report or brief, a web page, a dashboard, a diagram or chart meant for a browser, or when converting Markdown to HTML. NOT FOR slide decks in PowerPoint or Google Slides, Word documents, or code that is not a page.
---

# HTML house style

Every HTML page you make for this reader follows this skill. The reader has a strong, specific sense of what reads well, and the default look of generated pages (gradient heroes, emoji cards, tiny diagrams) reads badly to them.

## Files in this skill

- `STYLE-GUIDE.md`: the full guide and the reasons behind each rule. Read sections 1 to 3 and 11 the first time you use this skill in a session. Read the section for whatever you are building (diagrams: section 7; dashboards: section 13).
- `base.css`: the stylesheet. Inline the whole file into a `<style>` tag in every page.
- `template.html`: a complete decision brief using every common component. Start from its structure.
- `CHECKLIST.md`: run it before you hand anything over.

## How to build a page

1. **Pick the recipe** (STYLE-GUIDE section 13): decision brief, research report, explainer, status or dashboard, comparison, or field guide. Pick the palette: `paper` for anything read at length, `slate` for the most conservative audience, `graphite` for dense tools. Use `body class="doc"` for reading pages and `body class="tool"` for dashboards.
2. **Write the bottom line first.** Three to five lines: the answer, why now, the cost, what would change the answer. Then write every `h2` as a claim a reader could disagree with. If the headings alone do not tell the story, fix them before writing the body.
3. **Copy `template.html`.** Replace the `<link rel="stylesheet" href="base.css">` with the full contents of `base.css` inside `<style>`. Keep the masthead, the `.bluf`, the contents rail and the script block. Delete the palette toolbar unless the page is a tool the reader will live in.
4. **Fill the body** with the components in STYLE-GUIDE section 6. Use tokens for every colour. Wrap every table in `.table-wrap` and every figure in `figure > .figure-frame` with an Enlarge button and a caption whose first sentence states the takeaway.
5. **Draw diagrams as inline SVG** with the `.d-*` classes so they follow light and dark. Labels at least 12px at reading size. Keep any Mermaid source in a comment or a collapsed "Diagram source" block, but never load Mermaid or any library from a CDN.
6. **Write plainly.** Define each specialist term on first use with `.term` and a `data-def`, and list them in a closing glossary. No internal codes as names. No em dashes. Every number names its source and date.
7. **Verify** with `CHECKLIST.md`: render at desktop, at a true 390px phone viewport, in dark mode and in print preview; zoom into every figure; confirm no sideways scroll; click every control. Fix what you find and look again.

## Non-negotiables

- One self-contained `.html` file. No CDNs, frameworks, web fonts, charting libraries or network requests. Vanilla JavaScript only.
- Answer first; assertion headings; sequential plans as numbered steps.
- Serif for reading text, system sans for interface, monospace for data. Restrained colour: one accent, a second used rarely, status always icon plus word.
- Space and hairlines before boxes. Cards only for real groups, never touching.
- No diagram the reader cannot read at its displayed size or enlarge.
- The page never scrolls sideways on a phone.
- You looked at it before you said it was done, and you say what you checked.

## When the reader asks for something different

The reader's explicit request wins over this guide. If they ask for a different palette, font or layout, do it and keep the rest of the rules. If they say a page is only for a desktop tool, phone layout can be rough, but it must not break.
