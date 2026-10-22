# Snippets

The shortest correct markup for every component in `base.css`, taken from `template.html` and `examples/`. Copy a snippet into your body file, change the words, keep the classes and the shape. The line above each says when to use it and the usual mistake; STYLE-GUIDE section 6 has the reasons. `tools/selftest.mjs` puts every `html` block into the page frame at its `<!-- snippets -->` comment and requires 0 FAIL from `check.mjs`, so ids are unique across the file; change them when you copy.

## Page frame

**Page frame.** The masthead, bottom line, rail and prose of a Decide page; the Understand, Look up and Do skeletons swap `.bluf` for `.purpose`. Put `.bluf` before `nav.toc`, put everything after the rail inside the one `div.prose` (anything else directly in `.with-toc` lands in the rail column on a wide screen), write the rail's list into the HTML, and list every `h2` that has an id. Keep the rail at four or more `h2`s or about 1,200 words; Look up, Monitor and Do pages leave it out. Decide, Review and Do pages keep the Save as PDF button; only a tool the reader lives in adds the palette and theme buttons from `template.html`.

```html
<header class="masthead">
  <div class="toolbar no-print"><button type="button" class="print-btn">Save as PDF</button></div>
  <div class="kicker">Decision brief · Platform engineering</div>
  <h1>Move every team to one shared build cache this quarter</h1>
  <p class="dek">One or two sentences on what the page concludes, with the main number.</p>
  <div class="meta"><span>Draft 3</span><span>Updated 22 Oct 2026</span><span>7 min read</span></div>
</header>

<main>
  <div class="with-toc">
    <section class="bluf">
      <span class="label">Bottom line</span>
      <p>Approve phase 1: put the four largest repositories on the shared cache by 30 November.</p>
      <ul>
        <li><strong>Cost:</strong> one engineer for six weeks (estimate).</li>
        <li><strong>Stop if:</strong> the hit rate stays under 60% after two weeks.</li>
      </ul>
    </section>

    <nav class="toc" aria-label="Contents">
      <details open>
        <summary>Contents</summary>
        <ol>
          <li><a href="#situation">Builds are now the slowest step between merge and deploy</a></li>
          <li><a href="#options">A shared service beats bigger runners on cost</a></li>
          <li><a href="#plan">Phase 1 runs six weeks, in three steps</a></li>
          <li class="annex-start"><a href="#glossary">Glossary</a></li>
          <li><a href="#sources">Sources</a></li>
        </ol>
      </details>
    </nav>

    <div class="prose">
      <h2 id="situation">Builds are now the slowest step between merge and deploy</h2>
      <p>Each team runs its own cache, and about half of all continuous integration (CI) runs start cold.</p>
      <!-- snippets -->
      <hr class="mark">
      <h2 id="sources" class="annex">Sources</h2>
      <div class="sources"><ol><li>CI analytics export, September 2026.</li><li>Runner metrics dashboard, July to October 2026.</li></ol></div>
    </div>
  </div>
</main>
```

**Purpose.** Understand, Look up and Do pages open with one sentence saying what the page is for, in place of `.bluf`. A Monitor page uses `.bluf` with one computed status sentence and no list.

```html
<p class="purpose">By the end of this page you can explain how a cache lookup turns into a hit or a miss.</p>
```

## Text

**Utilities.** `.muted` for secondary text, `.num` or `.tabular` for aligned figures, `.visually-hidden` for screen-reader-only text, `.no-print` and `.print-only` for one medium, `.no-url` on a link whose address should not print. A plain `hr` separates loose groups; `hr.mark`, the dotted ornament, appears at most three times.

**Term.** A specialist word on first use. Every `.term` needs a matching `dt` in `dl.glossary` (see Annex), and every `dt` needs a `.term` in the text; the checker fails either way round.

```html
<p>The <span class="term" tabindex="0" data-def="The share of build steps served from the cache instead of run again.">cache hit rate</span> sets the saving.</p>
```

**Footnote.** A numbered link out and a link back; both ids are needed.

```html
<p>About half of all runs start cold.<sup class="fn"><a href="#fn1" id="fnref1">1</a></sup></p>
<p class="footnote" id="fn1">1. A run counts as cold when its runner has no cached output for any step. <a href="#fnref1">Back to text</a></p>
```

**Quote.** The source goes in a `footer` inside the blockquote, never in the text after it.

```html
<blockquote><p>Half our pipeline time goes to rebuilding things nobody changed.</p><footer>Runner team retrospective notes, Sep 2026</footer></blockquote>
```

**Callouts.** One aside per section at most. Plain for a note, `decision`, `risk`, or `stop` for a stop condition. The `.label` comes first.

```html
<div class="callout"><span class="label">Note</span>Plain callouts use the accent tint.</div>
<div class="callout decision"><span class="label">Decision</span>Platform owns the cache service; teams own their keys.</div>
<div class="callout risk"><span class="label">Risk</span>Storage cost grows with the number of branches kept.</div>
<div class="callout stop"><span class="label">Stop</span>Roll back if any build ships a stale artifact.</div>
```

**Status and chips.** Status is always a shape plus a word (`ok`, `warn`, `danger`, `idle`), never colour alone. A chip is a small tag, such as a disposition or an owner.

```html
<p>Cache service: <span class="status ok">On track</span> · Security review: <span class="status danger">Blocked</span> · Rollout: <span class="status idle">Not started</span> · Writes: <span class="status warn">At risk</span></p>
<p><span class="chip">Recommended</span> <span class="chip">Draft</span></p>
```

**Bridge.** Understand pages end each section with one line saying what the reader now knows and what comes next.

```html
<p class="bridge">You now know who asks. Next: how the resolver knows whom to ask.</p>
```

**Code.** A code block with a caption; the `tok-` classes are optional.

```html
<figure class="code">
  <pre><code><span class="tok-c"># Inputs that form a cache key</span>
<span class="tok-k">key</span> = sha256(source_tree, lockfiles, <span class="tok-s">"v1"</span>)</code></pre>
  <figcaption><code>cache-key.txt</code>: what goes into a key.</figcaption>
</figure>
```

## Structure

**Stats.** Three or four numbers, each with what it measures and a source. A status can stand in for a value.

```html
<div class="stats">
  <div class="stat"><div class="value">18.4 min</div><div class="what">Median pipeline time</div><div class="src">CI export, Sep 2026</div></div>
  <div class="stat"><div class="value">52%</div><div class="what">Runs that start with a cold cache</div><div class="src">CI export, Sep 2026</div></div>
  <div class="stat"><div class="value"><span class="status warn">At risk</span></div><div class="what">Fourth-quarter deploy goal</div><div class="src">Goals tracker, Oct 2026</div></div>
</div>
```

**Cards and grid.** Cards only for a real group of things, never for paragraphs; a `.grid` holds peers that need no box.

```html
<div class="cards">
  <div class="card"><h3>Runner team</h3><p>Owns the runners and their images.</p></div>
  <div class="card"><h3>Platform team</h3><p>Builds and runs the cache service.</p></div>
</div>
<div class="grid">
  <div><h3>Hit</h3><p>Output comes back in seconds.</p></div>
  <div><h3>Miss</h3><p>The runner builds and writes back.</p></div>
</div>
```

**Compare.** Options side by side, the recommended one marked, and always the cost of doing nothing.

```html
<h2 id="options">A shared service beats bigger runners on cost</h2>
<div class="compare">
  <div class="option recommended"><h3>A. Shared service <span class="chip">Recommended</span></h3><p>One cache for all runners. Needs an owner.</p></div>
  <div class="option"><h3>B. Bigger runners</h3><p>Fewer cold starts, same duplication, higher spend.</p></div>
  <div class="option"><h3>C. Do nothing</h3><p>No cost now. Queue time keeps growing.</p></div>
</div>
```

**Steps.** A plan as numbered steps, the title in `strong`, an owner and a date in each. A bullet list of next steps is the common mistake.

```html
<h2 id="plan">Phase 1 runs six weeks, in three steps</h2>
<ol class="steps">
  <li><strong>Stand up the service (Priya, by 6 Nov)</strong>Deploy behind the existing load balancer.</li>
  <li><strong>Decide (Sam, 30 Nov)</strong>Expand, adjust, or roll back.</li>
</ol>
```

**Timeline.** Dated events in order; `.now` marks today.

```html
<ol class="timeline">
  <li><time datetime="2026-07">Jul 2026</time>Queue time starts to climb.</li>
  <li class="now"><time datetime="2026-10-22">22 Oct 2026</time>This brief.</li>
  <li><time datetime="2026-11-30">30 Nov 2026</time>Phase 1 decision.</li>
</ol>
```

**Details.** Detail the reader may skip. Put the content in `div.body`; it prints open.

```html
<details><summary>How cache keys are computed</summary><div class="body"><p>Key = hash of source inputs, lockfiles and toolchain version.</p></div></details>
```

**Tabs.** Parallel views of one thing, never a sequence. Each panel repeats its name in `.tab-label` so it reads with script off and in print.

```html
<div class="tabs">
  <div role="tablist" aria-label="Phase 1 views">
    <button type="button" role="tab" id="tab-week" aria-controls="panel-week" aria-selected="true">By week</button>
    <button type="button" role="tab" id="tab-team" aria-controls="panel-team" aria-selected="false">By team</button>
  </div>
  <div role="tabpanel" id="panel-week" aria-labelledby="tab-week" tabindex="0"><p class="tab-label">By week</p><p>Weeks 1 and 2: read-only.</p></div>
  <div role="tabpanel" id="panel-team" aria-labelledby="tab-team" tabindex="0"><p class="tab-label">By team</p><p>Platform builds; four teams switch on writes.</p></div>
</div>
```

## Data

**Table.** Every table sits in `.table-wrap`, with `th scope` on headers and row headers, `.num` on number columns, and its source in `.table-note` after the wrapper, not inside it. Options in columns mark the recommended one with `.rec` on its header and cells.

```html
<div class="table-wrap"><table>
  <caption>Options against the deciding criteria</caption>
  <thead><tr><th scope="col">Criterion</th><th scope="col" class="rec">A. Shared service</th><th scope="col">C. Do nothing</th></tr></thead>
  <tbody><tr><th scope="row">Monthly cost</th><td class="rec num">$1,400</td><td class="num">$0</td></tr></tbody>
</table></div>
<p class="table-note">Cloud price sheet, October 2026. Costs are estimates.</p>
```

**Sortable table.** Generate it: `node tools/table.mjs rows.json --caption C --source S`. By hand, `button.sort` is the first thing inside its `th`, and number and date cells carry their raw value in `data-sort`. Two sortable tables on a page each need a `data-sort-key`. Over 25 rows add `scroll-y` to the wrapper. A sentence-long column gets `class="long"` on its `th` and cells.

```html
<div class="table-wrap"><table data-sort-key="runs">
  <thead><tr><th scope="col" data-col="repo"><button type="button" class="sort">Repository</button></th><th scope="col" class="num" data-col="runs"><button type="button" class="sort">Runs</button></th><th scope="col" class="long">Note</th></tr></thead>
  <tbody>
    <tr><th scope="row">web-app</th><td class="num" data-sort="4210">4,210</td><td class="long">Moves first.</td></tr>
    <tr><th scope="row">auth</th><td class="num" data-sort="910">910</td><td class="long">Moves last.</td></tr>
  </tbody>
</table></div>
<p class="table-note">CI export, September 2026.</p>
```

**Dataset.** More than about 25 records inside a reading page: a filter, a linked bar chart and the table it filters, in one `section.dataset`. Always generate it; never paste the records as prose or one long static table. Give it an `--id` that differs from its `h2`'s id (`services-data` under `h2#services`).

```sh
node tools/table.mjs rows.json --dataset team --noun services --chips status --statuses statuses.json --id services-data \
  --title "Services by certificate state" --chart-title "Services by team" --takeaway "Payments owns the most." \
  --source "Certificate inventory, Oct 2026" > dataset.html
# then, in body.html where it goes:  <!-- include: dataset.html -->
```

**Filter bar.** A view (`data-view`) holds a search box, chip groups, the filter sentence, the empty message and items with one `data-<key>` per key. Keys are unique on the page. The state lives in the URL hash.

```html
<div data-view data-noun="entries">
  <div class="filter" role="search" aria-label="Filter the entries">
    <div class="field"><label for="snip-q">Filter entries</label><input id="snip-q" type="search" data-key="sq" autocomplete="off"></div>
    <div class="chips" role="group" aria-labelledby="snip-area"><span id="snip-area">Area</span>
      <button type="button" data-key="area" data-value="">All</button>
      <button type="button" data-key="area" data-value="cache">Cache</button>
      <button type="button" data-key="area" data-value="runner">Runner</button>
    </div>
  </div>
  <p class="filter-sentence" aria-live="polite">All 2 entries</p>
  <p class="filter-empty" hidden>No entries match. Clear the filter to see both.</p>
  <div class="print-all"><!-- items: the .entry snippet below, one per record --></div>
</div>
```

**Entry.** The Look up shape: term, one-line answer, detail, related links. Every entry has an `id`, so a link can point at it. A Look up page puts a `nav.index` of jump links above the entries.

```html
<nav class="index" aria-label="Index">
  <span class="label">By area</span>
  <ul><li><a href="#entry-hit">Cache hit</a></li></ul>
</nav>
<article class="entry" id="entry-hit" data-filter-item data-area="cache">
  <h3>Cache hit</h3>
  <p class="answer">The output came back from the cache; nothing was rebuilt.</p>
  <p class="detail">A hit takes seconds.</p>
  <p class="related">Related: <a href="#finding-1">Stale artifacts</a></p>
</article>
```

**Finding.** The Review shape, identical for every finding: a title that states the defect, severity as a `.status`, a disposition chip, then where, evidence, impact and fix. Most severe first.

```html
<article class="finding" id="finding-1">
  <h3>1. Stale artifacts are served for up to an hour after a key change</h3>
  <div class="finding-meta"><span class="status danger">High</span><span class="chip">Fix before rollout</span></div>
  <dl class="fields">
    <dt>Where</dt><dd>Cache service, key lookup</dd>
    <dt>Evidence</dt><dd>Two of 40 test builds returned output from the previous toolchain.</dd>
    <dt>Impact</dt><dd>A wrong binary could ship.</dd>
    <dt>Fix</dt><dd>Include the toolchain hash in every key.</dd>
  </dl>
</article>
```

**Preconditions and do-steps.** A Do page opens with who, access and time, then one action per step, a checkbox, and what the reader should see. Every `li` has an `id`. Add a rollback heading and a "done when" line; the checker warns without them.

```html
<div class="preconditions">
  <span class="label">Before you start</span>
  <dl class="fields"><dt>Who</dt><dd>The platform on-call engineer</dd><dt>Time</dt><dd>About 10 minutes</dd></dl>
</div>
<div class="procedure">
<div class="progress"><span class="progress-text" aria-live="polite">Step 1 of 1</span><a class="progress-jump" href="#snip-step-1">Go to it</a><span class="spacer"></span><button type="button" class="btn" data-reset-steps>Reset progress</button></div>
<ol class="steps do">
  <li id="snip-step-1"><label class="step-check"><input type="checkbox"> Turn on read-only mode</label>
    <pre><code>cachectl mode set read-only</code></pre>
    <p class="expect"><strong>You should see:</strong> mode: read-only</p></li>
</ol>
</div>
```

**Monitor extras.** The "as of" time sits in the masthead meta before the first `h2`. The returning-reader panel is authored `hidden`; rows it watches carry `data-digest` and a `.status`. A `.print-only` line states the snapshot time and filter on paper.

```html
<p class="snapshot-note print-only">Snapshot as of 22 Oct 2026, 09:00 UTC.</p>
<section class="since" hidden><p><strong class="since-count">Changed since your last visit</strong></p><ul></ul><button type="button" class="btn" data-dismiss>Dismiss</button></section>
<!-- a watched row: <tr data-digest="orders">...<span class="status ok">Moved</span>...</tr>; table.mjs --digest KEY writes these -->
```

## Figures

**Bar chart.** Generate it from data; never place bar coordinates by eye. `--width 320 --small` for a chart that fits a phone. Include the file in the body; `page.mjs --check` checks it with the page.

```sh
node tools/bars.mjs counts.json --title "Services by team" --unit services \
  --takeaway "Payments owns the most services." --source "Deploy log, Oct 2026" > fig.html
# then, in body.html where it goes:  <!-- include: fig.html -->
```

**Figure frame and a diagram.** Enlarge button first, then `.figure-frame`, then a caption whose first sentence is a `<strong>` takeaway. The SVG gets `style="--fig-min: Wpx"` with W its viewBox width, a `title` and `desc`, and only `.d-*` classes for colour. Boxes are `d-box` (or `d-focus` for the subject), names `d-label` (13 units), notes `d-small` (12), arrows `d-edge` with a marker (`control` dashed for a fallback path, `evidence` dotted). Keep any Mermaid source in `<script type="text/plain" class="diagram-source">` inside the figure, never in a comment. Make every box wide enough for its label: 13 x 0.55 x characters, plus padding.

```html
<figure>
  <button class="zoom-btn no-print" type="button">Enlarge</button>
  <div class="figure-frame">
    <svg viewBox="0 0 480 120" style="--fig-min: 480px" role="img" aria-labelledby="snip-fig1-t snip-fig1-d" xmlns="http://www.w3.org/2000/svg">
      <title id="snip-fig1-t">A runner asks the cache before it builds</title>
      <desc id="snip-fig1-d">A CI runner sends a lookup to the cache service; a hit returns stored output.</desc>
      <defs><marker id="snip-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <rect class="d-box" x="20" y="24" width="160" height="72" rx="6"/>
      <text class="d-label" x="100" y="64" text-anchor="middle">CI runner</text>
      <rect class="d-focus" x="300" y="24" width="160" height="72" rx="6"/>
      <text class="d-label" x="380" y="64" text-anchor="middle">Cache service</text>
      <path class="d-edge focus" d="M180 48 H298" marker-end="url(#snip-arrow)"/>
      <text class="d-small" x="239" y="40" text-anchor="middle">lookup</text>
      <path class="d-edge control" d="M300 76 H182" marker-end="url(#snip-arrow)"/>
      <text class="d-small" x="241" y="94" text-anchor="middle">hit: output</text>
    </svg>
  </div>
  <figcaption><span class="fig-id">FIG-1</span> <strong>Every build checks the cache first.</strong> Solid: the lookup. Dashed: the answer on a hit.</figcaption>
</figure>
```

**Zoned diagram with categories.** Dashed `d-zone` outlines for ownership, `d-cat-1` to `d-cat-6` for categories, and a `.key.cat-N` legend in the caption. Mark a sketch that is not to scale with `d-mark` and `.mark-illustrative`.

```html
<figure>
  <button class="zoom-btn no-print" type="button">Enlarge</button>
  <div class="figure-frame">
    <svg viewBox="0 0 480 160" style="--fig-min: 480px" role="img" aria-labelledby="snip-fig2-t snip-fig2-d" xmlns="http://www.w3.org/2000/svg">
      <title id="snip-fig2-t">Who owns which part of the cache path</title>
      <desc id="snip-fig2-d">Web runners sit in the team zone; the cache service sits in the platform zone.</desc>
      <text class="d-mark" x="464" y="20" text-anchor="end">ILLUSTRATIVE</text>
      <rect class="d-zone" x="16" y="28" width="200" height="116" rx="8"/>
      <text class="d-small" x="30" y="50">Team zone</text>
      <rect class="d-zone" x="264" y="28" width="200" height="116" rx="8"/>
      <text class="d-small" x="278" y="50">Platform zone</text>
      <rect class="d-cat-1" x="40" y="70" width="150" height="48" rx="6"/>
      <text class="d-label" x="115" y="99" text-anchor="middle">Web runners</text>
      <rect class="d-cat-4" x="290" y="70" width="150" height="48" rx="6"/>
      <text class="d-label" x="365" y="99" text-anchor="middle">Cache service</text>
    </svg>
  </div>
  <figcaption><span class="fig-id">FIG-2</span> <strong>Teams own their runners; platform owns the cache.</strong> <span class="key cat-1">Team-owned</span><span class="key cat-4">Platform-owned</span> <span class="mark-illustrative">Illustrative</span></figcaption>
</figure>
```

**Hand-drawn chart.** When `bars.mjs` does not fit (a line, a stacked bar), compute every coordinate from the data and write the scale in a comment. Values `c-value`, axis text `c-tick`, a series line `c-line`, a highlighted bar `c-bar focus`, categories `c-cat-N`. Add `class="small-ok"` to a chart under about 400 wide.

```html
<figure>
  <button class="zoom-btn no-print" type="button">Enlarge</button>
  <div class="figure-frame">
    <!-- Scale: y = 150 - percent * 1.6. -->
    <svg class="small-ok" viewBox="0 0 320 184" style="--fig-min: 320px" role="img" aria-labelledby="snip-fig3-t snip-fig3-d" xmlns="http://www.w3.org/2000/svg">
      <title id="snip-fig3-t">Share of runs that start cold, by repository size</title>
      <desc id="snip-fig3-d">Large repositories 71 percent, small 34 percent.</desc>
      <line class="c-axis" x1="16" y1="150" x2="304" y2="150"/>
      <rect class="c-bar focus" x="72" y="36.4" width="64" height="113.6"/>
      <text class="c-value" x="104" y="28.4" text-anchor="middle">71%</text>
      <text class="c-tick" x="104" y="170" text-anchor="middle">Large</text>
      <rect class="c-bar" x="184" y="95.6" width="64" height="54.4"/>
      <text class="c-value" x="216" y="87.6" text-anchor="middle">34%</text>
      <text class="c-tick" x="216" y="170" text-anchor="middle">Small</text>
    </svg>
  </div>
  <figcaption><span class="fig-id">FIG-3</span> <strong>Large repositories start cold most often.</strong> CI export, Sep 2026.</figcaption>
</figure>
```

**Annotation.** Dim the context and point at the subject; the pointer note names what the reader should do about it.

```html
<div class="annotate">
  <div class="stats">
    <div class="stat subject"><div class="value">52%</div><div class="what">Runs that start cold</div></div>
    <div class="stat context"><div class="value">18.4 min</div><div class="what">Median pipeline time</div></div>
  </div>
  <p class="pointer-note up"><span class="n">1</span>Phase 1 has to move this number.</p>
</div>
```

## Forms

**Form.** A `fieldset` with a `legend`, a `label` for every input, hints in `.hint`, checkboxes in `label.check`, and the result in `output`. Mark it `no-print`. Its script is yours to write; keep it in the closing script.

```html
<form id="snip-calc" class="no-print" onsubmit="return false">
  <fieldset>
    <legend>Estimate the time saved</legend>
    <div class="field"><label for="snip-runs">Runs per day</label><input id="snip-runs" type="number" min="0" value="400"></div>
    <div class="field"><label for="snip-rate">Expected hit rate</label><select id="snip-rate"><option>60%</option><option>80%</option></select><span class="hint">Your own estimate.</span></div>
    <label class="check"><input id="snip-week" type="checkbox"> Show a five-day week</label>
    <p>Estimated saving: <output id="snip-out" for="snip-runs snip-rate">24 hours a day</output></p>
  </fieldset>
</form>
```

## Annex

**Glossary.** An annex section after every argument heading, with a plain label and `class="annex"`, like Sources, Method and Detail. List it in the rail after `li.annex-start`.

```html
<h2 id="glossary" class="annex">Glossary</h2>
<dl class="glossary">
  <dt>Cache hit rate</dt><dd>The share of build steps served from the cache instead of run again.</dd>
</dl>
```
