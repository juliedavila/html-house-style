# Deck architecture

This guide says what goes into a deck and where: the order of the slides, the title on each, what the slide says, what the presenter says, what waits in the appendix, and how numbers, charts and figures travel from a page to a slide. It does not say how a slide looks. The company template and the deck-building skill own every visual: layout, fonts, colours, logos, slide masters. This guide owns the structure they fill.

It sits beside `html-house-style/`. The reader's jobs are the same six patterns, defined once in `html-house-style/PATTERNS.md`; this guide maps each one onto a deck and never redefines it. A deck made from a house-style page carries the same claims as the page. Only the density changes.

Use it with the files beside it:

- `SKILL.md`: the fast path.
- `tools/outline.mjs`: a finished house-style page as an outline, `outline.json`.
- `tools/check-outline.mjs`: checks an outline and prints its ghost deck.
- `tools/check-pptx.mjs`: checks a finished `.pptx` with no renderer and no dependencies.
- `examples/`: outlines made from the kit's example pages, in both modes.

**Precedence.** The reader's request wins. Next comes the company template and the deck skill, for everything visual. This guide comes last, and covers structure only. When a `brand.json` exists (`html-house-style/BRAND.md`), chart and status colours come from it; the company template still wins for everything else, fonts included.

---

## 1. Two decisions before the first slide

Make both before outlining. Each one changes the deck more than any visual choice.

**The reader's job.** What will the people in the room, or the person reading alone, do in the minute after the last slide? The answer picks one of the six patterns in `html-house-style/PATTERNS.md` section 1: Decide, Understand, Look up, Monitor, Do, Review. If a house-style page exists, its `data-pattern` already says.

**The delivery mode.** Decide it now, because it decides where every sentence lives.

| | `presented` | `preread` |
|---|---|---|
| Read how | Someone talks over it, on a shared screen | Alone, before the meeting or instead of it |
| Ask for it with | "for the meeting", "I'm presenting", "for the review on Thursday" | "send ahead", "pre-read", "to read before", "to email" |
| Per slide | One idea, about 30 words of body at most | One idea, about 80 words of body at most, in full sentences |
| The evidence | Spoken; the slide shows the chart or number | On the slide, with its source |
| Speaker notes | What the presenter says, in full | Optional |
| Opens with | The title, then the ask or the verdict | The title, then a one-slide executive summary |
| Ends with | The appendix after a divider | An appendix that answers the likely questions |

**The default is `presented`**, because that is how most decks are used. When the request does not say, build `presented` and name the choice in the handover, so the reader can ask for the other one ("This is built to present. Say 'send ahead' for a pre-read version").

A deck that will be both presented and sent ahead is two outlines from the same page, one in each mode. Never split the difference: a half-dense deck is too wordy to present and too thin to read.

Mode changes density and where text lives. It never changes the claims. The ghost deck (section 4) of the two modes should read almost the same.

---

## 2. Each pattern as a deck

### Decide

1. **Title slide:** the recommendation itself as the title ("Move the platform team to a one-week on-call rotation in January").
2. **The ask:** what the room is asked to approve, then why now, the cost and the stop conditions. This is the page's `.bluf`.
3. **Situation:** the numbers, as stat tiles, each with its source.
4. **The model:** the one figure that shows why the recommendation works.
5. **Options:** compared side by side, the pick marked, the cost of doing nothing included.
6. **Plan:** numbered steps with an owner and a date in each.
7. **Risks and stop conditions.**
8. **Appendix** after a divider: data tables, detail, sources.

### Review

1. **Title slide:** the verdict ("The checkout is not ready to launch: three findings stop customers paying").
2. **Verdict and counts:** the fix-first item and the counts by severity.
3. **One slide per serious finding** (high and medium), every one in the identical shape: severity as a shape and a word, the disposition, then impact and fix (presented) or where, evidence, impact and fix (pre-read). The identical shape is the point; the room learns it on the first finding and reads the rest by position.
4. **Minor findings in one table.**
5. **Scope, and what was not checked**, as their own slides. Leaving out "not checked" lets the room assume everything was.
6. **Appendix:** sources, method detail.

### Understand

1. **The big picture first:** the figure that shows every part and how they connect.
2. **One concept per slide, in dependency order.** Never use a concept before its slide.
3. **The same diagram recurs**, with the part the slide is about highlighted. The room keeps one map and watches the highlight move, instead of learning a new picture each time.
4. **Misreadings** and a **self-check** (questions on the slide, answers in the notes).
5. **Appendix:** glossary, sources.

### Monitor

One status slide, with **an identical layout every time** it is shown: the status as a shape and a word, the status sentence as the title, up to four tiles that each answer a question, and the exceptions, sorted by urgency. Mark what changed since the last time the deck was shown (`outline.mjs --since last-week.html` lists it). Link to the live page; the deck is a snapshot and says so. Add a data slide or a trend only when the meeting needs it.

### Look up and Do: do not make a deck

A reference is searched and a runbook is followed, both live. A deck of either is read once and then goes stale beside the real thing. Make one slide that points to the page, with its address. If the request is training on a procedure, make a walk-through that links the live checklist at every step, and say in the handover that the checklist, not the deck, is what people use. `outline.mjs` emits the pointer slide and a warning for these patterns unless you pass `--force`.

### A page with a dataset

A reading page with a `section.dataset` becomes two or three data slides, each **one pre-filtered cut with a claim title**, and each linking to the live view with that filter set:

- The aggregate: the page's own chart, with the page's heading as the title.
- Then the cuts the prose argues from. `outline.mjs` picks filter values the page's text names, preferring the rarer ones, because an exception argues more than the bulk ("Expired: Platform has 4 of the 9 services"; "Manual: Mobile and Data have 20 of the 30 services"). A cut whose largest bar is 1 is left out: a list says that better than a chart.
- The full table goes to the appendix as a link, never as a forty-row slide.

---

## 3. Rules carried over from the page

- **Titles are claims.** A slide title is a sentence someone could disagree with, never a topic ("Options", "Next steps", "Background"). The appendix, the divider and the title slide are the exceptions.
- **One idea per slide.** A slide that needs two titles is two slides.
- **The evidence shows the title's claim.** A title about repositories needs a chart of repositories, not of teams; a title that names a leader needs that bar in the accent. When the chart you have shows something else, change the title to what the chart shows or make the chart the title needs. The checkers cannot see this mismatch, so read each chart slide's title against its bars.
- **Every number names its source and date**, on the slide, in a source line. A number with no source is an opinion.
- **Status is a shape plus a word**, never a colour alone. Projectors, printouts and colour-blind readers all lose colour.
- **Accent means "look here".** One focus per chart: the bars the title talks about. Everything else is neutral. A chart with no focus bar has not said what to look at.
- **The annex becomes the appendix**, after a divider slide titled "Appendix". Glossary, sources, method and full tables live there.
- **Plans are numbered steps** with an owner and a date.

## 4. The ghost deck

Read the titles alone, in order, with nothing else. That is the ghost deck, and it must carry the whole argument. If it does not, the deck does not argue; it decorates. Both checkers print it. Read it before anything else, and fix the titles before the slides.

## 5. Rules that change on a slide

- **No interaction, so link to it.** A page lets the reader filter, sort and pick a bar; a slide cannot. Every data slide carries a link to the page with the same view in the URL hash, following the page's hash contract (`html-house-style/PATTERNS.md` section 9): `page.html#at=dataset&status=expired` scrolls to the dataset with that filter on. A chart slide links to its section.
- **Legibility floors, for a shared screen.**

  | Text | Floor |
  |---|---|
  | Titles | about 28pt |
  | Body, presented | 18pt |
  | Body, pre-read | 14pt |
  | Chart labels and values, table text, diagram labels | 14pt |
  | Source and link lines | 12pt |
  | Points per slide | at most 6 |

- **Dense figures split.** More than about 15 bars, or a diagram with more than about 8 boxes, becomes an overview slide and a detail slide. For a bar chart `outline.mjs` keeps the 10 largest bars on the slide and puts every bar in the appendix. A dense diagram it leaves whole; split that by hand, an overview of the zones first, then one slide per zone. Long tables show 5 rows (presented) or 8 (pre-read) and send the rest to the appendix or the link.
- **Charts are native.** A chart goes into the deck as the deck tool's own chart, built from labels and values, so it stays editable and sharp. Never paste a screenshot of the page's SVG.
- **Diagrams are shapes and connectors.** The outline gives each box a position in inches and each line its two ends, so the deck skill draws them as native shapes the presenter can edit.
- **Speaker notes hold what the presenter says** (presented): the paragraphs the slide leaves out, condensed. In a pre-read they are optional.
- **What the page says about itself goes.** Sentences that tell a reader how to work the page ("Pick a bar to filter the table") are dropped, and figure ids (FIG-1) become "figure 1 on the page".

---

## 6. The outline

`outline.json` is the hand-off between this guide and the deck skill. Build it with `tools/outline.mjs` from a finished page, or write it by hand from this schema when there is no page. Then the deck skill follows it slide by slide.

```json
{
  "meta": {
    "schema": "deck-outline/1",
    "title": "Seventeen services need a new certificate within 30 days",
    "pattern": "review",
    "dataset": true,
    "mode": "presented",
    "source": "report-with-dataset.html",
    "date": "Scanned 20 Oct 2026",
    "sourceUrl": "https://example.org/report.html",
    "rules": { "bodyWords": 30, "bullets": 6, "titlePt": 28, "bodyPt": 18, "labelPt": 14, "sourcePt": 12, "tableRows": 5, "points": 3 },
    "brand": { "name": "harbor", "checked": true, "chartColors": ["#0B6E8A"], "focus": "#0B6E8A", "base": "#666D74",
               "status": { "ok": "#276F46", "warn": "#8A5A00", "danger": "#B3261E", "idle": "#666D74", "info": "#0B6E8A" } }
  },
  "slides": [
    { "kind": "title", "title": "...", "body": [], "notes": "mode: presented. ...", "sources": [] },
    { "kind": "data", "title": "Expired: Platform has 4 of the 9 services", "body": [], "notes": "The live view: ...",
      "sources": ["Certificate scan, 20 Oct 2026."], "link": "https://example.org/report.html#at=dataset&status=expired",
      "chart": { "type": "bar", "labels": ["Platform", "Mobile"], "values": [4, 2], "focus": [0], "unit": "services", "alt": "..." } }
  ]
}
```

**Every slide** has `kind`, `title`, `body` (a list of points; one string per point), `notes` (what the presenter says) and `sources` (strings, each with a date). It may have `link` (the page, with the view in the hash) and `appendix: true`.

| `kind` | Extra fields | From the page |
|---|---|---|
| `title` | `kicker`, `date` | masthead; slide 1's notes start `mode: presented.` or `mode: preread.` |
| `summary` | | `.bluf`: answer as title, the list as points; for a pre-read with `.purpose`, the short version |
| `status` | `status`, `stats`, `changed` | Monitor `.bluf`, tiles and the exceptions list |
| `section` | `diagram` (Understand, recurring) | an argument `h2` with prose |
| `stats` | `stats: [{ value, label, source, status? }]` | `.stats` tiles |
| `chart` | `chart` | a `bars.mjs` or hand-drawn bar chart |
| `data` | `chart`, `sentence`, `cut?` | `section.dataset`: the aggregate and the cuts |
| `table` | `table: { caption, header, rows, more?, recommended? }` | tables; `more` counts rows left out |
| `options` | `options: [{ label, text, recommended }]` or `table` with `recommended` | `.compare`, or a table with `th.rec` |
| `steps` | `steps: [{ title, text }]` | `ol.steps` |
| `callout` | `callout: { kind, label, text }` | `.callout` (stop, decision, ...) |
| `finding` | `status`, `chip` | `article.finding` |
| `diagram` | `diagram` | a hand-drawn `.d-*` figure |
| `figure` | `figure: { title, alt, caption }` | a figure that is neither (a line chart): redraw it from `alt` |
| `pointer` | | Look up and Do pages; the full-table link in the appendix |
| `appendix-divider` | | before the annex |
| `glossary`, `sources` | `table` or `body` | `dl.glossary`, `.sources` |

- **`chart`:** `type` (`bar` horizontal or `column` vertical), `labels` and `values` of equal length, `focus` (indices of the accent bars), `unit`, `categories` (1 to 6 per bar, when the page used category colours), `takeaway` (the caption's claim) and `alt` (the data in words).
- **`diagram`:** `frame` (the content area in inches on a 13.333 by 7.5 slide: x 0.6, y 1.55, w 12.13, h 4.95), `nodes: [{ id, label, sub, x, y, w, h, focus?, cat? }]` in inches inside the frame, `zones` (dashed groups) when the page has them, `edges: [{ from, to, label, arrow, points, labelAt, focus? }]` with `arrow` one of `none`, `start`, `end`, `both`, and `alt`. A deck skill with a different box scales every coordinate by the same factor. `recurring: true` marks the big-picture diagram shown again with this slide's part highlighted.
- **`status`:** `{ level, word }`, `level` one of `ok`, `warn`, `danger`, `idle`.
- **`meta.brand`:** chart and status colours only. `checked: true` means `html-house-style/tools/brand.mjs` resolved them, so they meet the same contrast rules as a branded page. Slides use the light values.

Writing an outline by hand: decide the mode and pattern, write the ghost deck first (titles only, in order), then fill each slide's body, notes and sources, and run `check-outline.mjs` on it.

## 7. The checks

**`check-outline.mjs outline.json`** prints the ghost deck, then:

- FAIL: the schema is broken; a slide has numbers and no source; body words pass one and a half times the mode's limit; more than 6 points; a chart's labels and values differ in length; a data slide has no link; a Decide or Review deck, or any pre-read, has no summary slide.
- WARN: a title that reads as a topic (three words or fewer) or a question; a title over 16 words; body words over the limit; a presented slide with nothing for the presenter to say; a link that is not a full address.

**`check-pptx.mjs deck.pptx`** reads the finished file, with no renderer. It unzips with `node:zlib`, reads each slide's title, text runs and font sizes (resolving inherited sizes from the layout and master), and checks: every slide has a title, and argument titles read as claims; body text, labels, tables and chart text meet the floors in section 5; word and point counts per mode; speaker notes on every argument slide of a presented deck; a "Source:" line on every slide with numbers. It reads the mode from `--mode`, or from `mode:` at the start of slide 1's notes.

Neither checker sees the slides. They do not catch text that overflows its box, shapes that overlap, or colour contrast. Those need a render.

## 8. Handing over

Say what you built and how you checked it, at the tier you reached. With no renderer (the usual case for a deck built by a script):

> Not rendered. Built from outline.json ([mode], [pattern], [n] slides) and checked by check-outline and check-pptx (0 FAIL, [n] WARN: [why each stands]). Ghost deck: [the titles]. Please look at: [the two or three things only a render can confirm, such as long titles wrapping, the diagram on slide n, chart labels on slide n].

Never write "it looks right" for a deck you did not open.
