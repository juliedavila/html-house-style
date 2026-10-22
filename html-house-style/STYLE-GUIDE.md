# House style for HTML pages

This is how to build an HTML page for this reader so it does not look bad to them. It is opinionated on purpose. Where it says "never", it means never unless the reader asks. Where it gives a number, use the number.

The rules come from a long record of this reader's reactions to pages, diagrams, decks and dashboards: what they kept, what they sent back, and why. Each section says what to do first and the reason after it, so you can judge cases this guide does not cover.

Use it with the two files beside it:

- `base.css`: the stylesheet. Inline all of it into every page you generate.
- `template.html`: a worked example of a decision brief that uses every common component. Copy its structure.

`CHECKLIST.md` is the short version to run before you hand anything over.

---

## 1. The reader

Write for a senior technical leader who is short on time and long on context.

- **They read for the decision first.** They want the answer, the cost and the reason to stop on the first screen, then the evidence in order below it. Background research and method are useful but secondary. Treat them like footnotes or an annex, never the opening.
- **They come back.** Most pages they ask for are read more than once: before a meeting, during it, a week later. Design for the sixth visit as much as the first. Stable section names, a contents rail and deep links are what make the return visits fast.
- **They think in structure.** Named frameworks, layered decomposition, sequences ("first this, then this"), and where something came from before where it is going. A page that is a pile of facts with no shape reads as unfinished to them.
- **They are a visual learner who distrusts decoration.** A good diagram, a map, a photo or a timeline that helps them see the thing at a glance is welcome. Anything that is only there to look nice is noise.
- **They notice craft.** Misaligned boxes, cards that touch, labels overlapping lines, text that wraps one word onto a new line, a diagram they cannot zoom: they see all of it and it costs the page its credibility.
- **They are not a specialist in every field the page covers.** Assume a capable engineer or executive from outside the topic. Every term of art gets a plain definition the first time it appears.
- **Mostly laptop, sometimes phone.** Documents they read over must work on a phone with no sideways scrolling. Working tools and dashboards can be desktop-first and only need to hold together on a phone.

## 2. The ten rules

If you remember nothing else:

1. **Answer first.** One bottom-line block at the top: the recommendation or finding, why now, what it costs, what would change the answer.
2. **Headings are claims.** "CI time is now the bottleneck", never "Background". A reader skimming only headings should get the argument.
3. **Restraint.** Warm neutral ground, near-black text, one accent colour, a second accent used rarely. Colour carries meaning, never decoration.
4. **Serif for reading, sans for interface, mono for data.** Body 18px at 1.6 line height, lines no longer than about 64 characters.
5. **Space instead of boxes.** Separate sections with whitespace and hairlines. Use a card only for things that form a group.
6. **Every visual earns its place.** If removing it would not hurt understanding, remove it.
7. **Diagrams are legible at the size they are read, and can be enlarged.** No 6px labels. Ever.
8. **Plain words.** Define terms where they first appear, spell out acronyms, never use internal codes as names in prose.
9. **One self-contained file.** Inline CSS and vanilla JavaScript. No CDNs, frameworks, web fonts or external requests.
10. **Look at it before you say it is done.** Render it at desktop and phone width, in light and dark, and zoom into every diagram.

---

## 3. Information architecture

### 3.1 Open with the bottom line

The first screen holds, in this order: a small kicker naming the document type, a title that states the main claim, a one or two sentence dek, a meta line (version, date, reading time), then the bottom-line block (`.bluf`).

The bottom-line block is three to five lines. For a decision: what to approve, why now, cost, stop conditions. For research: the finding, how confident, what it means for the reader. For status: on track or not, the one thing that needs attention, what happens next.

Reason: the reader decides in the first thirty seconds whether to keep reading, and they want to know where the page lands before they spend time on how it got there. This is Minto's answer-first pyramid and Few's "overview, then what needs attention, then detail".

### 3.2 Order the body as an argument

After the bottom line, the body runs: the situation (what is true now, with numbers), the complication or insight (what changed), the recommendation or model (what we do or how it works), the options considered (with the recommended one marked), the plan (as sequential steps), the risks and stop conditions, then detail for the people doing the work. Sources, method and glossary go last.

When the page explains something rather than recommends something, use: where it came from, where it is now, where it is going. Historical grounding before forward claims.

### 3.3 Headings state assertions

Every `h2` is a full sentence a reader could disagree with: "One cache service sits between runners and storage", "We compared three ways to get there". Topic labels ("Architecture", "Options", "Next steps") are not allowed for `h2`. `h3` may be shorter but still says something.

Reason: the contents rail is built from the `h2`s. A rail of assertions is a summary of the whole page. A rail of topic labels is a filing system.

### 3.4 Three depths, one argument

Long material serves three readers at once: the person who decides, the people who back and staff the work, and the people who build it. Give each a depth.

- The **top** of the page (or a separate short brief) carries the whole argument in two pages or less.
- The **body** carries the reasoning, the options, the plan.
- **Collapsible detail and appendices** carry the evidence, the method, the tables and the edge cases.

Each depth tells the reader where the next one down is. Never make the decider wade through builder detail to find the ask.

### 3.5 Progressive disclosure

Put detail behind `<details>` blocks with a summary line that says what is inside ("How cache keys are computed", "Cost breakdown"). Use tabs only when the reader picks one of several parallel views (for example, the same plan by quarter or by team). Never hide the main argument, the ask or the risks behind a click.

Collapsed sections open automatically for printing; the template does this.

### 3.6 Sequences look like sequences

Anything ordered in time (a plan, a process, a migration) uses numbered steps (`ol.steps`), each with a bold first line saying what happens and when, then one or two sentences. The reader has asked for things "framed in a sequential way" more than once. A bulleted list of phases loses the order.

### 3.7 Terms get a definition the reader can reach without leaving

Wrap each specialist term in `<span class="term" tabindex="0" data-def="...">` on first use, so hovering or focusing shows the definition. Also collect all terms in a glossary at the end (`dl.glossary`). For a dense technical page with many terms, a glossary in a side rail is better still.

Reason: the reader asked for exactly this, a way to see what a term means "without it taking you from what you're reading".

### 3.8 Navigation and way back

- Pages longer than about three screens get the contents rail (`.with-toc` with `nav.toc`). The template builds it from the `h2`s and marks the current section.
- Every `h2` has an `id`, so any section can be linked directly.
- In multi-view tools, every object (a component, a finding, a person, a work item) has the same shape everywhere it appears: same card, same fields in the same order, same link to its detail, same way back. Drilling down changes the level of detail, never the rules. This is what makes large tools feel easy to explore.

### 3.9 Research and method are an annex

Brainstorming, the full research trail, rejected drafts and council-style deliberation are valuable context. Put them last, as an appendix or a collapsed section, polished into a readable form. The main body carries the thesis, the plan and the plan in practice.

---

## 4. Writing on the page

The page's prose matters as much as its styling. A beautiful page full of jargon still fails.

- **Plain words.** Use the vocabulary the reader's engineers already use (DevOps, SRE, CI/CD, DORA terms). Avoid process-improvement jargon and team-internal shorthand.
- **Define on first use, in a clause:** "a cold runner, one that starts with an empty cache".
- **Spell out acronyms on first use;** drop an acronym that appears only once.
- **Name things by what they are.** Internal codes (ticket numbers, rule numbers, claim ids, phase codes) never stand in for the thing in prose. Write "the rollback rule (R2)" at most, with the code in parentheses. Codes are fine in tables and appendices.
- **One idea per sentence when the idea is hard.** Subject and verb early. If a sentence needs a second read, restructure it rather than swapping words.
- **Concrete beats abstract.** One real example earns more trust than a paragraph of principle.
- **No filler patterns:** no "not X, but Y" constructions stacked for effect, no rhetorical questions, no lists of three when there are two real items, no closing sentence that restates the paragraph, no "it's worth noting".
- **No em dashes.** Use commas, colons, parentheses or a new sentence.
- **Every number names its source and date,** in the text, the caption or the stat tile's source line. Round down ("over six", not "nearly seven").
- **Separate measured from assumed** in the sentence itself: "the logs show" against "we expect".
- **Write for someone outside the program.** Before you finish, reread each paragraph as a capable outsider would.

---

## 5. Visual language

### 5.1 The feel

Calm, warm, editorial, precise. Think of a well-made book or a serious magazine's long read, crossed with the clarity of a good engineering tool. Large planes of quiet colour, generous whitespace, strong typographic hierarchy, almost no ornament. Professional enough for a board, warm enough not to feel like a bank statement.

**Restraint is the style.** When unsure whether to add something, leave it out.

### 5.2 Colour

Colour comes from tokens in `base.css`. Never hard-code a hex value in a component; use the role tokens (`--fg`, `--accent`, `--hairline` and so on).

- **Ground:** warm off-white page (`--bg`), slightly lighter surfaces for cards and figures (`--surface`), slightly darker sunken areas for code and table headers (`--sunken`).
- **Text:** near-black (`--fg`), a muted grey for secondary text (`--fg-muted`), a lighter grey only for metadata (`--fg-subtle`). All three pass WCAG AA on every ground.
- **One accent** (`--accent`, deep blue in the default palette) for links, the active contents item, the recommended option, the focus of a diagram and the bottom-line rule.
- **A second accent** (`--accent-2`, a warm clay) used rarely: the kicker, the one ornament, a decision callout. If it shows up more than three or four times on a screen, it is overused.
- **Status colours** (ok, warn, danger) only mean status. Status is always an icon shape plus a word (`.status.ok`, `.status.warn`, `.status.danger`), because red and amber look alike to many readers. Colour reinforces the word; it never replaces it.
- **Categories** (zones, teams, actor types in a diagram) get a small fixed set of hues, the same hue for the same thing everywhere on the page, always with a legend or a label. Six is the most a reader can tell apart reliably. Past six, reuse hues with a pattern.
- **Never:** gradients as decoration, neon, purple-to-blue "AI" gradients, rainbow category palettes, coloured section backgrounds behind body text, more than two accents.

**Palettes.** `base.css` ships three. Set one on the `html` element with `data-palette`:

| Palette | Feel | Use for |
|---|---|---|
| `paper` (default) | Warm editorial: paper ground, ink text, deep blue, clay | Briefs, reports, explainers, anything read at length |
| `slate` | Cool neutral, blue accent | The most conservative corporate audience |
| `graphite` | Near-monochrome, teal accent | Dense tools and dashboards; austere pages |

To make a new palette, copy one `:root[data-palette=...]` block and change three things: the ground (`--p-bg`, `--p-surface`, `--p-sunken`), the accent pair (`--p-accent`, `--p-accent2`) and their tints. Keep text and border values unless you re-check contrast: body text at least 4.5:1 against every ground (aim for 7:1 or more), borders on controls at least 3:1. Add a matching dark-theme accent.

**Dark mode.** Every page follows the reader's system setting by default and also works when forced with `data-theme="light"` or `"dark"`. Test both. Dark mode is the same layout on a dark neutral ground with lightened accents; it is not a different design. Printing always uses the light values.

### 5.3 Typography

Use the stacks in `base.css`; they resolve to good local fonts on macOS, Windows and Linux with no network request.

- **Reading text:** a warm serif (`--font-read`: Iowan Old Style, Charter, Source Serif, Georgia). 18px, line height 1.62, measure about 64 characters. On phones, 17px.
- **Headings:** a serif display face (`--font-display`) at weight 600, sentence case. Hierarchy comes from size and weight, never from ALL CAPS headings or underlines.
- **Interface text:** labels, captions, tables, buttons, metadata, the contents rail all use the system sans (`--font-ui`) at 14px. The contrast between serif prose and sans interface is part of the look.
- **Data and code:** the system monospace (`--font-mono`). Numbers in tables and stat tiles use tabular figures so columns line up.
- **Small caps labels:** uppercase with wide tracking, at 12 to 13px, only for kickers and block labels ("BOTTOM LINE", "CONTENTS"). Never for headings or sentences.
- **Scale:** 1.2 ratio. Do not invent sizes in between.
- **Emphasis:** bold (650) for the lead-in of a list item or a key phrase, italic for titles and quotes. Never underline for emphasis; underlines are links.
- **Tools and dashboards** (`body.tool`) switch the whole page to the sans at 14px, because dense interfaces read better that way. Keep the serif for any long explanatory text inside them.

If the environment allows hosted fonts and the reader asks, good pairings are a humanist display serif for headings (Cardo, Fraunces) with Source Serif 4 for body and JetBrains Mono for code. The local stacks are the default because they always load.

### 5.4 Space and density

- **4px grid.** All spacing uses the `--s1` to `--s9` tokens (4, 8, 12, 16, 24, 32, 48, 64, 96px).
- **Sections breathe.** 64px above each `h2` in documents, 48px in tools. Never let a block of tiles or a table sit flush against the paragraph above it.
- **Measure.** Prose never runs wider than about 64 characters. Figures, tables, tile rows and comparisons may run the full content width.
- **Page width.** Documents max out around 1180px including the contents rail; tools around 1440px.
- **Documents** are spacious. **Tools** are denser (14px text, 32px table rows, 8px list gaps) but still aligned to the same grid.

### 5.5 Surfaces, borders, corners, shadows

- Prefer whitespace and a 1px hairline to a box.
- Cards (`.card`) only for real groups: a set of options, a set of people, a set of linked pages. Never card-wrap ordinary paragraphs. **Never let two cards touch**; the gap is at least 16px.
- Corner radius 6px (4px for small chips and buttons). Large radii (12px and up) read as consumer app styling.
- Shadows are barely there (`--shadow`). No floating, glowing or heavily layered elevation.
- Borders that only decorate use `--hairline`. Borders that outline a control use `--border` (3:1 or better).

### 5.6 Ornament

One small recurring ornament per page at most, used no more than three times (the template's `hr.mark` divider is the example). No clip art, no icon per bullet, no emoji in headings or labels, no stock illustration.

---

## 6. Components and when to use them

All of these are in `base.css` and demonstrated in `template.html`.

| Component | Use it for | Do not use it for |
|---|---|---|
| `.masthead` with `.kicker`, `h1`, `.dek`, `.meta` | Every page's opening | |
| `.bluf` | The bottom line, once per page, right after the masthead | Repeating content from below |
| `.stats` / `.stat` | Three to six headline numbers, each with what it is and its source | Numbers without a source; more than eight tiles |
| `.callout` (`.decision`, `.risk`, `.stop`) | One important aside per section at most | Ordinary paragraphs dressed up |
| `.status` | Any status (on track, at risk, blocked, idle) | Decoration |
| `.compare` / `.option.recommended` | Two to four options side by side, recommended one marked | Long prose per option (use sections) |
| `ol.steps` | Plans, processes, anything ordered in time | Unordered points |
| `.cards` / `.card` | Real groups of peers, link hubs | Wrapping prose |
| `.table-wrap` + `table` | Anything with rows and columns, including most comparisons | Layout |
| `figure` + `.figure-frame` + `figcaption` | Every diagram, chart or image | Images with no caption |
| `.term` + `dl.glossary` | Specialist terms | Common words |
| `details` | Detail some readers need and most do not | The ask, the risks, the main argument |
| `.tabs` | Parallel views of the same thing | Sequential content |
| `nav.toc` in `.with-toc` | Any page longer than about three screens | Short pages |
| `.chip` | Small tags (Recommended, Draft, a team name) | Status (use `.status`) |
| `.sources` | Sources list at the end | |

**Tables.** Always wrap a table in `.table-wrap` so a wide table scrolls inside its own frame and never makes the page scroll sideways. Right-align numbers (`td.num`). Header row sticky. Put the source in a `caption`. When the content is a grid, use a table, not a diagram.

**Stat tiles.** The value large, then one line saying what it is, then the source and date in small grey. If a tile's value is a status rather than a number, use a `.status` chip as the value.

---

## 7. Diagrams, figures and images

This is where pages most often go wrong for this reader. Take it seriously.

### 7.1 Every figure must earn its place

A figure belongs on the page only if removing it would make the page harder to understand. Decorative diagrams, generic "architecture" boxes that restate the paragraph, and icons standing in for ideas all fail this test.

Good reasons for a figure: showing a flow or sequence, showing what talks to what, showing where something sits in a larger whole, showing change over time, putting places on a map, showing a real thing (a photo of the site, a screenshot of the screen being discussed).

The reader likes richer imagery when it helps them grasp something at a glance (for example, photos beside each location on a map). They dislike panels that are only text pretending to be a visual.

### 7.2 Legible at the size it is read

- Diagram labels are at least 12px at the size the reader sees them. Secondary labels at least 11px.
- A figure never shrinks below legible to fit a narrow screen. Give the SVG a minimum width (`base.css` sets 560px) and let it scroll inside `.figure-frame`. The page itself never scrolls sideways.
- **Every figure can be enlarged.** The template's "Enlarge" button opens the figure in a full-screen dialog with zoom in, zoom out and fit. Include it on every diagram. A diagram the reader cannot zoom into is a defect; they have flagged exactly this on detailed Mermaid figures that "stay small even if I click actual size".
- No label overlaps a line, a box or another label. No text runs past the edge of its box or the viewBox. Check each region at full size; a thumbnail hides exactly these defects.

### 7.3 Prefer inline SVG; keep a machine-readable source

- Draw diagrams as **inline SVG** you write yourself, using the diagram classes in `base.css` (`.d-box`, `.d-focus`, `.d-edge`, `.d-label`, `.d-small`) so they follow the theme in light and dark. Give the SVG a `viewBox`, a `<title>` and a `<desc>` that says in words what it shows.
- If you use Mermaid syntax as the source, render it to SVG yourself and inline the SVG; do not load the Mermaid library from a CDN. Keep the Mermaid text in an HTML comment or a collapsed "Diagram source" block next to the figure, so an agent reading the page can understand the diagram programmatically.
- Mermaid's automatic layout suits small flows (under about a dozen nodes). Wide flowcharts, highlighted paths across zones, ladders and rings come out cramped or tiny. Draw those as hand-placed SVG, or break them into several smaller figures.
- When several SVGs share a page, give each its own marker and gradient ids so they do not clash. Use `markerUnits="userSpaceOnUse"` so arrowheads stay the same size on thick and thin lines.

### 7.4 One idea per figure, and the caption says the idea

- Each figure makes one point. If it needs two, make two figures.
- The caption starts with a bold sentence stating the takeaway ("Every build checks the cache first; only misses do real work."), then explains the encoding (what solid and dashed lines mean, what the colours are).
- Give figures stable ids (`FIG-1`, or a descriptive `FIG-CACHE-PATH`) and refer to them by id in the text when the page is long.

### 7.5 Encoding rules

- **The focus is highlighted, the context is quiet.** The thing the figure is about uses `.d-focus` (accent outline, tinted fill); everything else uses neutral boxes.
- **Edge types by line style, not colour:** solid for data or the main flow, long dash for control or fallback, dotted for evidence or reference. Number the steps of a flow on the edges.
- **The same actor or category gets the same colour in every figure on the page,** with a legend. Never more than six category colours.
- **Mark illustrative figures.** A figure that shows the shape of an idea with no real data behind it says "Illustrative" on its face and in its caption, and carries no numbers or axis values. A figure with real data names its source and date in the caption.

### 7.6 Annotating a figure or a screen

When explaining parts of something (how to read a report, what each part of a screen does):

- Show the subject large, nearly the full width.
- **Dim everything except the part being explained** (`.annotate .context` at low opacity) so the highlighted part stands out at full contrast. Do not run the annotations and the subject at the same contrast; it reads as busy.
- Use **pointer callouts** (`.pointer-note` with `.up`, `.down`, `.left` or `.right`), boxes with a small pointed side aimed at the exact spot, numbered to match the explanation.
- One number per thing. Do not number something that already explains itself.

### 7.7 Charts

- Pick the form by the question: change over time is a line, comparison across categories is a sorted bar, part of a whole with two or three parts is a single stacked bar, distribution is a histogram. Avoid pies with more than three slices, 3D, dual axes and donut charts with a number in the middle.
- Erase what carries no data: heavy gridlines, borders, backgrounds, legends that could be direct labels. Label lines and bars directly where possible.
- Hand-write charts as SVG. Do not pull in a charting library.

### 7.8 Photos and generated images

Use real photos when they show the real thing. If an image is AI-generated, say so subtly but clearly in the caption. Never use stock imagery or generic illustrations as decoration.

---

## 8. Interaction

Everything interactive is a few lines of vanilla JavaScript in the page. No frameworks, no libraries, no build step, no network.

Worth having:

- The contents rail with the current section marked (template).
- Figure enlarge with zoom (template).
- Collapsible detail (`<details>`, no JavaScript needed).
- Hover or focus definitions for terms (CSS only).
- Tabs for parallel views (template).
- Click-to-reveal for self-test or drill content (a `details` block works).
- A light and dark toggle and palette switch for tools the reader will live in.
- Deep links to every section and every object.
- Keyboard: Escape closes dialogs, arrow keys step through a tour if there is one.

Rules:

- Motion is short (150 to 200ms), purposeful (it shows where something went), and off when the reader's system asks for reduced motion.
- No auto-playing anything, no parallax, no scroll-jacking, no animated counters, no confetti.
- Interactions never hide the main argument; the page reads correctly with every section closed and with JavaScript off.
- Wrap every `localStorage` read and write in `try`/`catch`, and make the page work without it. Use storage only for conveniences like the last theme.

For a walkthrough or demo, consider a guided tour: a short list of steps, each pointing at a part of the live page with a title and one or two sentences, stepped with the arrow keys, with Escape dropping into the free page.

---

## 9. Responsive and print

### 9.1 Phones

- **The page never scrolls sideways.** At 390px wide, `document.documentElement.scrollWidth` must equal the window width. Wide tables and figures scroll inside their own frames, with a shadow at the edge that has more content.
- 16px side gutter on phones, 32px from 720px up.
- Grids collapse with `minmax(min(100%, Npx), 1fr)` so nothing overflows; stat tiles go two to a row.
- Headings scale down on phones (the stylesheet does this).
- The contents rail becomes a box at the top.
- Documents meant to be read over must be fully comfortable on a phone. Working tools may be desktop-first, but they must not break.

### 9.2 Print

- Printing uses the light palette regardless of the screen theme, white background, 11pt text. Scope every dark-theme rule to `@media screen`; a dark rule left unscoped wins over the print rules and prints pale text on dark boxes from any machine set to dark mode.
- The contents rail, toolbar and enlarge buttons hide. Collapsed sections open.
- Headings never sit alone at the bottom of a page; figures, cards, callouts and table rows do not split across pages.
- Never use `position: fixed` headers or footers for print; they overlap body text. If page furniture is needed, use the browser's print header and footer settings.
- Check that wide figures are still legible at printed size; split them if not.

---

## 10. Technical constraints

- **One file.** The page is a single `.html` file with all CSS in a `<style>` tag and all JavaScript in a `<script>` tag. Images are inline SVG or `data:` URIs. It must open correctly from the file system with no network.
- **No external anything:** no CDNs, no web fonts, no analytics, no icon fonts, no Mermaid, Chart.js, D3, Tailwind, React or jQuery. Assume they are blocked.
- **Inline `base.css` in full,** then add page-specific CSS after it, using the tokens.
- Semantic HTML: `header`, `nav`, `main`, `section`, `figure`, `figcaption`, `table` with `thead`, real `button`s for actions.
- Keep it reasonably small. A long report should still be well under 2MB including images.
- Accessibility floor: WCAG AA contrast, visible keyboard focus, alt text or `title`/`desc` on every figure, headings in order. A deep assistive-technology audit is not required for pages only the reader uses, but anything shared with others keeps the full floor.

---

## 11. What makes a page look bad to this reader

Avoid all of these. Most are the default look of machine-generated pages, which is the look to get away from.

- A centred hero with a big gradient headline and a subtitle, then a grid of identical feature cards with an emoji or icon each.
- Purple, violet or blue-to-pink gradients; glassmorphism; glowing shadows; neon accents.
- Everything wrapped in a rounded card with a shadow, cards nested inside cards, cards touching.
- Inter or another default sans for long reading text. Long reading text is serif.
- ALL CAPS headings, or tiny uppercase labels on everything.
- Emoji in headings, labels or bullets.
- A different colour for every section, badge and button.
- Walls of bullets, or bullets three levels deep. Paragraphs carry reasoning; bullets carry lists.
- Topic-label headings ("Overview", "Key Insights", "Conclusion").
- A summary at the end that repeats the page, instead of the answer at the start.
- Tiny diagrams, especially auto-laid-out Mermaid shrunk to fit, with labels too small to read and no way to zoom.
- Diagrams with overlapping labels, text running out of boxes, or a legend listing distinctions the drawing never shows.
- Decorative images and stock illustrations.
- Horizontal scrolling on a phone.
- A dark-only design, or a light design that breaks in dark mode.
- Jargon and internal codes used as names without definition.
- Numbers with no source.
- Text-only "visual" panels: a box of prose labelled as a diagram.
- Busy annotation where the callouts and the thing they explain compete at the same contrast.
- Animations, counters, auto-advancing carousels.

---

## 12. Verify before you hand it over

Never say a page is done until you have looked at it. "It should look fine" is not evidence.

1. **Render it** in a real browser. If you can only use headless Chrome, note that `--window-size` does not set the layout viewport. Use the DevTools protocol (`Emulation.setDeviceMetricsOverride` with `mobile: true`) for a true phone width, or the page will look clipped when it is not.
2. **Capture four views:** desktop around 1280 to 1440px, phone at 390px, dark mode, and print preview.
3. **Look at each region at full size,** never only a scaled-down full-page shot. Zoom into every figure. Check for overlapping labels, clipped text, cards touching, single words wrapping onto their own line in headings, and anything sitting flush against something else.
4. **Measure sideways scroll** at 390px: `document.documentElement.scrollWidth <= innerWidth`.
5. **Click through** the contents rail, every enlarge button, every tab, every collapsible.
6. **Check contrast** of any colour you added beyond the tokens: 4.5:1 for text, 3:1 for control borders and meaningful graphics.
7. **Cold read.** Read the bottom line and the headings only. Do they tell the whole story? Then read the page as an outsider: any sentence you would need to read twice gets rewritten. Any undefined term gets defined.
8. **Fix, then look again.** Report what you checked when you hand it over.

---

## 13. Page recipes

**Decision brief.** Masthead, bottom line (ask, why now, cost, stop conditions), situation with stat tiles, the model or design with one figure, options compared with the recommendation marked, the plan as steps, main risk callout, detail in collapsibles, glossary, sources. Two printed pages for the top part. `template.html` is this recipe.

**Research report.** Masthead, bottom line (finding, confidence, implication), the key findings as assertion headings each with its evidence, a comparison table if there are alternatives, what is still unknown, method and full sources in an annex.

**Explainer or learning guide.** Masthead, a one-paragraph "what you will understand by the end", the big picture figure first, then sections that go from origin to present to future, each with one figure and a short worked example, a self-check with click-to-reveal answers, glossary.

**Status or dashboard.** `body.tool`, `graphite` or `slate` palette. A one-sentence computed summary at top ("On track: 2 of 3 milestones met; the API migration is blocked on access approval"), four tiles each answering one question, then the working list sorted by what needs attention, then detail. Status chips everywhere, never colour alone.

**Comparison.** Bottom line with the recommendation, a single comparison table (options as columns, criteria as rows, the deciding rows first), then a short section per option on what the table cannot show.

**Field guide for use on the move** (travel, an event, a site visit). Phone-first. Bottom line with the plan for the day, then one card per place or stop with a photo, the address as a link to maps, the time, and what to do there. Large tap targets, nothing that needs a laptop.
