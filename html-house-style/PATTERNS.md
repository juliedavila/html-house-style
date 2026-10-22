# Page patterns

A page pattern names what the reader is doing with the page. It is a reader's job, and the content type does not decide it. "A document about Kubernetes" says nothing about how to build the page. "The reader is restoring a cluster at 2am" says almost everything: numbered steps, the command in full, what they should see after each one, and a way back.

Before choosing a single component, ask one question: **what will the reader do in the minute after they open this?** The answer picks one of six patterns. The pattern then sets the opening, the order of sections, the navigation, what is interactive, what is remembered and how the page prints. Components follow from the pattern.

This file sits above `STYLE-GUIDE.md`. The guide says how a page looks and reads; this file says which shape to give it. Each pattern has a short working page in `examples/`. Every rule here can be checked by reading the file, and `check.mjs` checks the opening against the declared pattern, so the layer works on a machine with no browser.

---

## 1. Choosing a pattern

Pick by what the reader does first. The request words are the quickest signal.

| The reader will | Pattern | Request words |
|---|---|---|
| Approve, reject or choose | **Decide** | "should we", "recommend", "proposal", "options for" |
| Build a mental model | **Understand** | "explain", "primer", "how does", "walk me through" |
| Find one fact and leave | **Look up** | "reference", "cheat sheet", "list of", "glossary" |
| See whether anything needs them | **Monitor** | "status", "tracker", "dashboard", "where are we on" |
| Carry out a procedure | **Do** | "runbook", "checklist", "steps to", "packing list", "how to set up" |
| Learn what was found and what to fix | **Review** | "audit", "findings", "review of", "assessment" |

Declare the choice on the body, so a reader of the source and `check.mjs` both know it:

```html
<body class="doc" data-pattern="decide">
```

**Mixed pages.** Most requests mix jobs. Pick the dominant one, the job the reader does first, and build that skeleton. Then borrow at most one section shape from one other pattern. A Decide page may carry a Do checklist as its plan. A Review page may end with a Decide block that asks for approval of the fixes. If two jobs are equally strong (a runbook and the case for changing it), make two pages that link to each other. Each reader then gets a page built for their job.

**Records inside a reading page.** The most common mix is a report that argues from a set of records: 140 services, 300 findings, a year of incidents. Borrow a Look up or Monitor section into the reading page by wrapping it in `section.dataset` (section 10). Once the records pass about 25, show an aggregate chart and the records table it filters. Never turn the records into prose, and never paste them into a reading page as one long static table: the first makes a 14-minute report into an hour, the second makes the reader scroll past 40 screens to reach the conclusion. The prose cites the dataset ("12 of the 140 services are still on the old cluster; see the dataset") instead of restating it. Example: `examples/report-with-dataset.html`.

**Shown on a shared screen.** A page that will be presented by screen share needs a present view sized for the shared screen: large type, one idea per screen, and no ids or counts the room cannot read. A print view does not do that job. Slide decks stay out of scope.

**Never invent a seventh pattern on the fly.** The nearest of the six plus one borrowed section covers it. A new shape costs the reader a new way of reading, and it costs the next writer a page with no example to copy.

---

## 2. Decide

- **Reader's job:** approve, reject or choose between options.
- **Their question:** what are you asking me to agree to, and what happens if I do?
- **Signals:** "should we", "recommend", "proposal", "business case", a budget or headcount ask.
- **Opens with:** `.bluf` holding one answer sentence and a list: the ask, why now, the cost, the stop conditions.
- **Skeleton:**
  1. Situation, with numbers (`.stats`, each with a source).
  2. Complication: what changed.
  3. Recommendation, with one model figure that shows why it works.
  4. Options compared, the recommended one marked (`.compare`, or a table with `.rec`), including the cost of doing nothing.
  5. Plan as numbered steps with an owner and a date in each (`ol.steps`).
  6. Risks and stop conditions (`.callout.stop`).
  7. Annex: detail in collapsibles, data tables, glossary, sources (`h2.annex`).
- **Navigation:** the contents rail at the usual threshold (four or more `h2`s or about 1,200 words).
- **Density:** `body.doc`, `paper` palette.
- **Interaction and state:** none beyond collapsible detail and figure zoom. Nothing is stored.
- **When to split:** the bottom line and the claim headings carry the whole argument (STYLE-GUIDE 3.4). When the evidence pushes the plan and the risks past about four printed pages, move the evidence to a linked annex page.
- **Print and PDF:** the printed copy is the one that gets forwarded and signed off, so it must stand alone. Date and version sit in the masthead's meta line, every collapsed detail prints open, and a Save as PDF button (`.print-btn`) sits in the masthead.
- **Failure modes:**
  - The recommendation comes after the options, so the reader has to work out the answer.
  - The options leave out the cost of doing nothing, which makes every option look expensive.
  - "Next steps" is a bullet list with no owners or dates, so nobody can be held to it.
- **Example:** `examples/decide.html`, a memo to move a team to a one-week on-call rotation.

---

## 3. Understand

- **Reader's job:** build a mental model they can explain to someone else.
- **Their question:** how does this work, and how do the parts fit?
- **Signals:** "explain", "primer", "how does", "learning guide", "onboarding".
- **Opens with:** `.purpose`, stating what the reader will be able to explain by the end.
- **Skeleton:**
  1. The big-picture figure first: all the parts and how they connect.
  2. Sections in dependency order. Never use a concept before it is introduced. Each section has a worked example, and a figure where one earns its place.
  3. A "common misreadings" section: the wrong models people bring, each with what is true instead.
  4. A self-check with click-to-reveal answers (`details`).
  5. Glossary (`dl.glossary`), then sources.
- **Navigation:** the contents rail. Each section ends with a `.bridge` line, "You now know X. Next: Y.", so a reader who jumps in knows what the section assumes.
- **Density:** `body.doc`, `paper` palette.
- **Interaction and state:** none required. Self-check answers are `details`, so they work with script off.
- **When to split:** past about 3,000 words, make one page per concept, with a contents page and previous and next links on each.
- **Print and PDF:** prints as a handout. The self-check answers print open, through the kit's existing print rule for `details`.
- **Failure modes:**
  - History before the model: three paragraphs on where it came from before the reader knows what it is.
  - A term used before it is defined, so the reader carries a gap through the rest of the page.
  - Decorative figures that restate a paragraph instead of showing the mechanism.
- **Example:** `examples/understand.html`, how a name lookup finds a server.

---

## 4. Look up

- **Reader's job:** find one fact fast and leave.
- **Their question:** what does this one thing mean, and what do I do about it?
- **Signals:** "reference", "cheat sheet", "list of", "glossary", "lookup table".
- **Opens with:** `.purpose`, then a filter box (`.filter`) once there are more than about 15 entries.
- **Skeleton:**
  1. An index of jump links (`nav.index`), grouped the way the reader thinks: by task when they arrive with a problem, A to Z when they arrive with a name.
  2. Entries, every one with the identical shape (`.entry`): the term as `h3`, a one-line answer (`.answer`), the detail (`.detail`), related links (`.related`).
  3. Sources as an annex.
  No narrative and no `.bluf`. A reference has no conclusion, and inventing one wastes the reader's first screen.
- **Navigation:** the filter hides non-matching entries as the reader types. Every entry has an `id`, so it can be linked from a chat or a ticket. The filter value lives in the URL hash (`#q=timeout`), so a filtered view can be sent. With script off the filter box hides and the page is a plain list with a working index. No rail: the index does that job.
- **Density:** `body.tool`, `graphite` or `slate` palette.
- **Interaction and state:** the hash only.
- **When to split:** by domain once there are more than about 150 entries.
- **Print and PDF:** prints the full list whatever the filter (put `.print-all` on the container), compact, each entry kept whole. The filter and the index hide.
- **Failure modes:**
  - Entries with different fields, so the reader cannot scan down one column of the shape.
  - A prose introduction the reader has to read past to reach the first entry.
  - Grouped alphabetically when the reader thinks by task, or the reverse.
- **Example:** `examples/look-up.html`, the status codes our services return. The examples contents page, `examples/index.html`, is a small Look up page with no filter.

---

## 5. Monitor

- **Reader's job:** see whether anything needs them, then act or leave.
- **Their question:** is anything wrong, and is it mine?
- **Signals:** "status", "tracker", "dashboard", "where are we on", "weekly update".
- **Opens with:** `.bluf` holding one computed status sentence and no list, with a `.status`. An "as of" time (`<time>`) sits in the masthead meta, before the first `h2`.
- **Skeleton:**
  1. Up to four stat tiles, each answering one question ("Are we on pace?", "Is anything stuck?").
  2. The exceptions: what needs attention, sorted by urgency, before anything that is fine.
  3. The full working table in a `section.dataset`: filters, a chart that filters it, sortable columns, sorted by urgency to start.
  4. History or trend, as a small chart.
  5. Sources as an annex.
- **Navigation:** filters (status, owner, area) above the working table. Their state lives in the URL hash, so a link reproduces the view, and a sentence above the table says what it shows ("2 of 24 services: Blocked"). No rail.
- **The returning reader:** most Monitor pages are opened again and again. Keep a digest of what the reader last saw (each item's id and status) in `localStorage` for this page, and on return show a dismissible "Changed since your last visit: 3 items" panel (`.since`) listing what moved. The page works the same when storage is unavailable; the panel simply never appears.
- **Density:** `body.tool`, `graphite` palette.
- **Interaction and state:** the hash for filters. Never `localStorage` for filters: a sent link must show what the sender saw, and a stored filter would silently hide rows from the person who set it last week.
- **When to split:** one page per audience when the executive and the operator need different first screens. Link them both ways.
- **Print and PDF:** prints as a dated snapshot. A `.snapshot-note.print-only` line reads "Snapshot as of ...", and the sentence above the table states the filter in use. Table rows never split.
- **Failure modes:**
  - Everything green shown at the same weight as the one red item.
  - Tiles that answer no question: a count with no comparison is decoration.
  - Colour as the only status signal. Use `.status`, a shape and a word.
  - Stale data with no timestamp.
- **Example:** `examples/monitor.html`, a service migration to a new cluster.

---

## 6. Do

- **Reader's job:** carry out a procedure correctly, often under pressure.
- **Their question:** what do I do next, and did the last step work?
- **Signals:** "runbook", "checklist", "steps to", "how to set up", "packing list", "procedure".
- **Opens with:** `.purpose`, then a `.preconditions` block: who can do it, the access needed, how long it takes, what to have open.
- **Skeleton:**
  1. Numbered steps (`ol.steps.do`), one action per step. Each step has a checkbox and its title in `label.step-check`, the command or exact click in a code block, and the expected result after it (`.expect`, "You should see: ...").
  2. Decision points as explicit branches inside the step they belong to (`.callout.decision`, labelled "If you see ..."). A stop point uses `.callout.stop`.
  3. A "Done when" line after the last step.
  4. A rollback section with its own heading ("Roll back"), after the steps, matched to the step the reader reached.
- **Navigation:** a progress line (`.progress`) stays in view while the steps scroll: "Next: step 4 of 10", with a link to that step. Put the progress line and the steps in one wrapper (`div.procedure`), so the line stops following the reader when the steps end. Every step has an `id`. No rail: the progress line does that job.
- **Density:** `body.tool`, `paper` or `slate` palette.
- **Interaction and state:** ticks persist in `localStorage` for this page, with the time the run started, which acts as the run's id. A visible Reset progress button starts a new run. Ticks never hide a step, because a reader who ticked by mistake must still see what they skipped. With script off the boxes still tick but are not saved.
- **When to split:** one page per distinct procedure. Shared setup gets its own page, linked from the preconditions.
- **Print and PDF:** the printed copy is a paper checklist. Boxes print empty, whatever was ticked on screen, unless the reader chose "Print with my progress" (a `.print-btn` with `data-progress`). Commands print in full, wrapped, never cut off.
- **Failure modes:**
  - Two actions in one step, so the reader ticks it after doing only one.
  - No expected result, so the reader cannot tell whether the step worked.
  - The rollback missing, or placed at the top where it is read before it means anything.
  - Prose paragraphs where steps belong.
- **Example:** `examples/do.html`, rotating a database password without downtime.

---

## 7. Review

- **Reader's job:** understand what was found, how bad it is, and what to do first.
- **Their question:** can we ship, and if not, what do we fix first?
- **Signals:** "audit", "findings", "review of", "assessment", "post-incident review".
- **Opens with:** `.bluf` holding the verdict sentence and a list: counts by severity, the one thing to fix first, what happens next.
- **Skeleton:**
  1. A severity summary: counts as tiles or a small table.
  2. Findings, most severe first, every one with the identical shape (`.finding`): a title that states the defect, severity as a `.status`, a disposition `.chip`, then where, evidence, impact and fix in `dl.fields`.
  3. Scope and method: what was reviewed, how, and when.
  4. What was not checked.
  5. Sources as an annex.
- **Navigation:** filter by severity and disposition, with the state in the URL hash. The contents rail when there are more than about eight findings or four `h2`s. Each finding has an `id`.
- **Density:** `body.doc` for fewer than about 15 findings, `body.tool` above that.
- **Interaction and state:** the hash for filters.
- **When to split:** do not make one page per finding. Keep one page and use the filter, because the reader needs to see the findings against each other to judge priority.
- **Print and PDF:** findings never split across pages. Severity reads in greyscale, because `.status` is a shape plus a word. A `.filter-state` line marked `.print-only` states the filter the copy was printed with. A Save as PDF button sits in the masthead.
- **Failure modes:**
  - Findings ordered by where they were found instead of by severity.
  - Findings with no evidence, which turns them into opinions.
  - "What was not checked" left out, so the reader assumes everything was.
- **Example:** `examples/review.html`, an accessibility review of a checkout.

---

## 8. Structuring the knowledge

- **Model the objects before laying out the page.** List the things the page is about (services, findings, steps, terms), the fields each one has, and how they relate. The layout follows from that list. A page laid out first and filled second ends up with each object described differently.
- **One object, one shape, everywhere.** Every finding has the same fields in the same order; every entry has a term, an answer, detail and related links. The reader learns the shape once and then scans.
- **Chunk by what the reader acts on.** A monitor groups by what needs attention, a runbook by step, a review by finding. Grouping by where the information came from suits the writer and costs the reader.
- **Link instead of repeating.** When an object appears twice, the second mention links to the first. Two copies drift apart.
- **Stable ids for anything someone might point at:** every `h2`, every entry, finding and step. Ids name the thing (`finding-3`, `step-7`, `s-404`) and do not change between versions, so links in chats and tickets keep working.
- **Names say what the thing is.** "Payment errors are never announced" beats "Finding 3". Codes may sit beside a name, never in place of it (STYLE-GUIDE 4).

---

## 9. State and the URL

Decide where each piece of state lives with this table. Never put state anywhere else.

| State | Where | Why |
|---|---|---|
| A view someone might share: filters, a search, a sort order, a chart pick | The URL hash, as `#key=value&key=value` | A link then reproduces exactly what the sender saw |
| Personal progress: ticked steps | `localStorage`, keyed to the page path | It belongs to this reader on this machine |
| What a returning reader last saw (Monitor) | `localStorage`, keyed to the page path | It is this reader's history, not the page's |
| Preferences: theme, palette | `localStorage`, keyed to the page path | A convenience; losing it costs nothing |
| Anything else | Nowhere | No cookies, no server, no network |

The hash contract, which the template's script implements:

- **One format.** `#sev=high&disp=launch`. A sort is `sort=<column>.asc` or `.desc`. A chip holds one value per key; several values per key are a stated limit of this version.
- **Changes push history.** A filter, sort or chart pick uses `history.pushState`, so Back undoes it. Typing in a search box pushes one entry per pause, not one per key. Only a transient change (none in the kit today) would replace the entry instead.
- **In-page links keep the state.** A link to `#finding-3` while a filter is on becomes `#at=finding-3&sev=high`: the page scrolls to the target and the filter stays. A hash with no `=` is a plain anchor, so links from outside keep working.
- **A deep link never lands on nothing.** If the target of `at=` is hidden by the current filter, the page clears that view's filter and shows it.
- **Restore everywhere.** Rebuild the view from the hash on load, on `popstate` and on `hashchange`, every time.
- **Say what the list shows, in words.** A sentence built from the state heads every filtered list: "5 of 140 services: expired, Payments", or "All 140 services". The same sentence prints. Put a short phrase on a chip with `data-say` when its label reads badly in a sentence.
- Wrap every storage call in `try`/`catch`. Storage is off in some private windows and on some locked-down machines; the page must still work.

`check.mjs` warns when a page has a filter and in-page links but no handler that keeps the filter, and fails when the markup offers sorting, filtering, a linked chart or a print button that no script delivers.

---

## 10. Datasets inside reading pages

`section.dataset` is the seam between a reading page (`body.doc`) and a tool. Inside it the section switches to tool density: the sans, tighter rows, and the full content width. It holds, in this order:

1. A header strip: the dataset's name and one line naming what is interactive ("Filter, sort, or pick a bar to narrow the table").
2. The filter: a search box and chips.
3. The sentence that says what the table shows.
4. A summary chart whose bars are buttons: picking one filters the table, picking it again clears it. **Each bar counts the records under every filter except its own facet**, so the bars stay a way to switch and do not collapse to one bar after the first pick. The chart keeps direct labels and counts.
5. The records table, sortable, in a `.table-wrap.scroll-y` frame capped in height, so 140 rows are one scrolling frame and not 40 screens of page.

`tools/table.mjs` writes the whole section from an array of records, with `tools/bars.mjs` for the chart. All rows are real HTML rows, so the dataset reads with script off and prints. On paper it prints its chart, the sentence and the table as filtered, compact, with rows unsplit. With `data-print="summary"` on the section it prints only the chart and the sentence, plus a note that the full table is in the file.

---

## 11. Multi-page sets

- **Split when the reader jobs differ,** or when a page passes the limits in its pattern (about 3,000 words for Understand, about 150 entries for Look up, one procedure per Do page). Splitting for length alone makes the reader hunt.
- **A contents page** lists every page with its job and one line on what it holds. It is itself a small Look up page.
- **Previous and next links** for pages read in order (an Understand set). Pages read in any order link back to the contents page instead.
- **Relative links** between the files (`decide.html`, `../index.html`), so the set works from disk, from a zip and from any host.
- **Every page is self-contained:** its own inlined `base.css`, masthead and script, so any one page can be sent alone.

---

## 12. Print and PDF

Every page prints well from the browser's own print. That is the kit's PDF path, and it is the one available on a locked-down machine: Print, then Save as PDF.

- **A Save as PDF button** (`button.print-btn`, calling `window.print()`) goes in the masthead toolbar on Decide, Review and Do pages, and is optional elsewhere. It hides in print and when script is off. `check.mjs` fails a page that has the button and no `window.print()`.
- **The printed header is the masthead:** title, version and date in the meta line. Add them to every page that might be printed, since the copy outlives the screen.
- **External links print their address** after the link text, because paper cannot follow a link. Put `class="no-url"` on a link whose text is already the address. Links in navigation and figures do not print their address.
- **Interactive state is either stated or reset, per pattern.** Monitor, Review and every dataset print the sentence that states the filter. Look up prints the full list. Do prints empty boxes unless the reader asks for their progress. A dataset with `data-print="summary"` prints its chart and counts only.
- **Page margins** come from the `@page` rule already in `base.css`; the browser's own header and footer add page numbers.
- **Server-side PDF belongs to the app that serves the page.** A local service that calls headless Chrome's print-to-PDF gets the same output as the reader's Print button, because both use the print stylesheet. The page only promises that it prints well.
- **No paged-media polyfills.** They would have to be inlined, they add weight, and the page numbers they offer are already in the browser's footer.

---

## 13. The script blocks

The template's closing script holds the blocks the patterns use, written once and copied into every page. Each does nothing on a page without its markup, uses `textContent` only, and keeps every storage call in `try`/`catch`. With script off, `class="no-js"` on `html` hides the filter, the progress line and the print buttons, sort buttons keep their header text and do nothing, and the page reads as a plain document.

**Page state: filter, sort, chart picks and in-page links.** A view is an element with `data-view` (a `section.dataset`, or `main` on a Look up or Review page); with none, the whole page is one view. Inside a view:

- `input[type="search"]` filters by text; its hash key is `data-key`, or `q`.
- `button[data-key][data-value]` chips filter by one value per key; `data-value=""` means All; `data-say` sets the words used in the sentence.
- `[role="button"][data-key][data-value]` chart bars toggle the same way; a `[data-count]` text and a `rect[data-unit]` inside are redrawn with the count.
- `[data-filter-item]` elements carry one `data-<key>` per key (`data-status="expired"`); `[data-filter-group]` hides when none of its items show.
- `th > button.sort` sorts its table by the cell's `data-sort` value or its text, numbers as numbers; `data-col` on the `th` names the column in the hash, and `data-sort-key` on the table separates two sortable tables.
- `.filter-sentence` receives the sentence; `.filter-empty` shows when nothing matches. `data-noun` on the view names the records ("services").
- Keys must be unique on the page; use `data-key` to rename a second search box.

```html
<main data-view data-noun="findings">
  <div class="filter" role="search" aria-label="Filter findings">
    <div class="chips" role="group" aria-labelledby="f-sev"><span id="f-sev">Severity</span>
      <button type="button" data-key="sev" data-value="">All</button>
      <button type="button" data-key="sev" data-value="high" data-say="high severity">High</button>
    </div>
  </div>
  <p class="filter-sentence" aria-live="polite">All 8 findings</p>
  <p class="filter-empty" hidden>No findings match this filter. Choose All to see every finding.</p>
  <article class="finding" id="finding-1" data-filter-item data-sev="high">...</article>
</main>
```

**Step progress.** Markup: a `div.procedure` holding the progress line and `ol.steps.do`, each `li` with an `id` and a `label.step-check` that holds the checkbox and the step title. Optional: `.progress-text` (the "Next: step 4 of 10" sentence), `a.progress-jump` (a link to the next step) and `button[data-reset-steps]`.

```html
<div class="procedure">
<div class="progress"><span class="progress-text" aria-live="polite">Step 1 of 10</span>
  <a class="progress-jump" href="#step-1">Go to it</a><span class="spacer"></span>
  <button type="button" class="btn" data-reset-steps>Reset progress</button></div>
<ol class="steps do">
  <li id="step-1"><label class="step-check"><input type="checkbox"> Find the role the service uses now</label>
    <pre><code>secrets get orders/db --field user</code></pre>
    <p class="expect"><strong>You should see:</strong> <code>orders_app_a</code></p></li>
</ol>
</div>
```

**Returning reader.** A `.since` panel (authored `hidden`, with a `.since-count`, an empty `ul` and a `button[data-dismiss]`) and rows carrying `data-digest="<id>"` and a `.status`. On return the script lists what changed since the last visit; the digest is saved when the reader leaves or dismisses the panel.

**Print.** Any `.print-btn` calls `window.print()`. One with `data-progress` adds `print-progress` to `html` first, which keeps ticked boxes filled on paper; `afterprint` removes it.

---

## 14. How this connects to the style guide

The recipes in STYLE-GUIDE section 13 map onto the patterns. Use the pattern for the structure and the recipe for the details it adds.

| Recipe in STYLE-GUIDE 13 | Pattern |
|---|---|
| Decision brief | Decide |
| Comparison | Decide |
| Research report | Review when it reports findings; Understand when it explains a field |
| Explainer or learning guide | Understand |
| Status or dashboard | Monitor |
| Field guide for use on the move | Do |
| Reference page | Look up |

For a page that is mainly records, and for any chart or table built from data, use the helpers in `tools/` (STYLE-GUIDE 6 and 7.7): they do the label arithmetic and the escaping, and their output passes `check.mjs` by construction.

Everything else in the guide still applies to every pattern: answer first where there is an answer, claim headings where the page argues, tokens for every colour, figures legible at 12px, no sideways scroll on a phone, and a check before handover.
