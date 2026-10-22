#!/usr/bin/env node
// table.mjs: an array of records as a kit table, or as a whole section.dataset
// (filter, linked bar chart, sortable table). No dependencies; node 18+, bun or deno.
//
//   import { table } from "./tools/table.mjs";
//   table(rows, { caption, source, id, columns, filters: ["team"], statuses })
//   table(rows, { id, source, dataset: { facet: "team", chips: ["status"], noun: "services", chart: { title, takeaway } } })
//
//   node tools/table.mjs rows.json [--columns cols.json] [--caption C] [--source S] [--id ID] > table.html
//
// Columns: [{ key, label, type: "text"|"num"|"date"|"status", align, format, sortable, rowHeader,
//   wide (a sentence per row: keeps 16em on phones), href (row => link target) }],
// inferred from the first rows when left out. Every value is escaped. Numbers and dates
// carry their raw value in data-sort; numbers are right-aligned with tabular figures.
// statuses maps a value to [class, word], e.g. { expired: ["danger", "Expired"] };
// without it, common words map to ok, warn, danger or idle. Filter keys must be
// lowercase letters (they become data-<key> on each row). Tables over 25 rows scroll.
import { bars, esc, slug } from "./bars.mjs";

const RANK = { danger: 0, warn: 1, idle: 2, ok: 3 };
const guess = v => /block|fail|expir|danger|down|high/i.test(v) ? "danger" : /warn|risk|soon|late|medium/i.test(v) ? "warn"
  : /ok|done|moved|pass|valid|healthy|low/i.test(v) ? "ok" : "idle";
const cap = s => String(s).replace(/[_-]+/g, " ").replace(/^./, c => c.toUpperCase());
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const day = v => { const d = new Date(v); return isNaN(d) ? esc(v) : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

export function columnsFor(rows) {
  const sample = rows.slice(0, 10);
  return Object.keys(rows[0] || {}).map((key, i) => {
    const vals = sample.map(r => r[key]).filter(v => v !== undefined && v !== null && v !== "");
    const type = vals.every(v => typeof v === "number") ? "num" : vals.every(v => /^\d{4}-\d{2}-\d{2}/.test(v)) ? "date"
      : /status|state|severity/i.test(key) ? "status" : "text";
    return { key, label: cap(key), type, rowHeader: i === 0 && type === "text" };
  });
}

function status(v, statuses) {
  const [cls, word] = (statuses && statuses[v]) || [guess(v), cap(v)];
  return { cls, word, rank: statuses ? Object.keys(statuses).indexOf(String(v)) : RANK[cls] };
}

function cell(r, c, o) {
  const v = r[c.key], tag = c.rowHeader ? 'th scope="row"' : "td";
  const num = c.type === "num", cls = num || c.align === "right" ? ' class="num"' : c.wide ? ' class="long"' : "";
  let html, sort = "";
  if (c.format) html = esc(c.format(v, r));
  else if (num) html = v === "" || v == null ? "" : esc(Number(v).toLocaleString("en-US"));
  else if (c.type === "date") html = day(v);
  else if (c.type === "status") { const s = status(v, o.statuses); html = `<span class="status ${s.cls}">${esc(s.word)}</span>`; sort = ` data-sort="${s.rank}"`; }
  else html = esc(v);
  if (c.href) html = `<a href="${esc(c.href(r))}">${html}</a>`;
  if (num || c.type === "date") sort = ` data-sort="${esc(v)}"`;
  return `<${tag}${cls}${sort}>${html}</${tag.split(" ")[0]}>`;
}

export function table(rows, o = {}) {
  if (o.dataset) return dataset(rows, o);
  const cols = o.columns || columnsFor(rows), sortable = o.sortable !== false, long = o.scrollY ?? rows.length > 25;
  const head = cols.map(c => {
    const cls = c.type === "num" ? ' class="num"' : c.wide ? ' class="long"' : "", label = esc(c.label ?? cap(c.key));
    return `<th scope="col"${cls} data-col="${esc(c.key)}">${sortable && c.sortable !== false ? `<button type="button" class="sort">${label}</button>` : label}</th>`;
  }).join("");
  const filt = o.filters || [];
  const body = rows.map(r => {
    const attrs = filt.length ? " data-filter-item" + filt.map(k => ` data-${k}="${esc(slug(r[k]))}"`).join("") : "";
    const dig = o.digest ? ` data-digest="${esc(r[o.digest])}"` : "";
    return `      <tr${attrs}${dig}>${cols.map(c => cell(r, c, o)).join("")}</tr>`;
  }).join("\n");
  const sk = o.sortKey ? ` data-sort-key="${esc(o.sortKey)}"` : "";
  return `<div class="table-wrap${long ? " scroll-y" : ""}"><table${o.id ? ` id="${esc(o.id)}"` : ""}${sk}>
    ${o.caption ? `<caption>${esc(o.caption)}</caption>\n    ` : ""}<thead><tr>${head}</tr></thead>
    <tbody>
${body}
    </tbody>
  </table></div>${o.source ? `\n<p class="table-note">${esc(o.source)}</p>` : ""}`;
}

function dataset(rows, o) {
  o = { ...o, columns: o.columns || columnsFor(rows) };
  const d = o.dataset, id = o.id || "dataset", noun = d.noun || "records", n = rows.length;
  const facet = d.facet, chips = d.chips || [], filters = [...new Set([facet, ...chips, ...(o.filters || [])].filter(Boolean))];
  const qk = d.searchKey || "q", word = (k, v) => { const c = (o.columns || []).find(c => c.key === k);
    return c && c.type === "status" ? status(v, o.statuses).word : cap(v); };
  const groups = chips.map(k => {
    const vals = [...new Set(rows.map(r => r[k]))];
    if (o.statuses && (o.columns || []).some(c => c.key === k && c.type === "status")) vals.sort((a, b) => status(a, o.statuses).rank - status(b, o.statuses).rank);
    const label = cap((o.columns || []).find(c => c.key === k)?.label || k);
    return `    <div class="chips" role="group" aria-labelledby="${id}-${k}"><span id="${id}-${k}">${esc(label)}</span>
      <button type="button" data-key="${k}" data-value="">All</button>
${vals.map(v => `      <button type="button" data-key="${k}" data-value="${esc(slug(v))}">${esc(word(k, v))}</button>`).join("\n")}
    </div>`;
  }).join("\n");
  const counts = [...rows.reduce((m, r) => m.set(r[facet], (m.get(r[facet]) || 0) + 1), new Map())]
    .map(([v, c]) => ({ label: word(facet, v), key: v, value: c }));
  const chart = facet ? bars(counts, { unit: noun, width: 320, ...(d.chart || {}), id: id + "-chart", linked: { key: facet } }) : "";
  return `<section class="dataset" data-view data-noun="${esc(noun)}" id="${esc(id)}"${d.print ? ` data-print="${esc(d.print)}"` : ""}>
  <div class="dataset-head"><p class="dataset-title">${esc(d.title || `${cap(noun)} dataset`)}</p><p class="dataset-how">${esc(d.how || "Filter, sort, or pick a bar to narrow the table.")}</p></div>
  <div class="filter" role="search" aria-label="Filter ${esc(noun)}">
    <div class="field"><label for="${id}-q">Search ${esc(noun)}</label><input id="${id}-q" type="search" data-key="${qk}" autocomplete="off"></div>
${groups}
  </div>
  <p class="filter-sentence" aria-live="polite">All ${n} ${esc(noun)}</p>
${chart}
  <p class="filter-empty" hidden>No ${esc(noun)} match. Clear the filters to see all ${n}.</p>
${table(rows, { ...o, dataset: undefined, id: id + "-table", filters, scrollY: true })}
  <p class="dataset-print-note">This printed copy shows the summary. The full table of ${n} ${esc(noun)} is in the file.</p>
</section>`;
}

// CLI: node tools/table.mjs rows.json [--columns cols.json] [--caption C] [--source S] [--id ID] [--dataset FACET --noun N --chips a,b]
const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const { readFileSync } = await import("node:fs");
  const args = process.argv.slice(2), opts = {}; let file;
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i]; else file = args[i];
  if (!file) { console.error("usage: node tools/table.mjs rows.json [--columns cols.json] [--caption C] [--source S] [--id ID] [--dataset FACET --noun N --chips a,b]"); process.exit(2); }
  const rows = JSON.parse(readFileSync(file, "utf8"));
  if (opts.columns) opts.columns = JSON.parse(readFileSync(opts.columns, "utf8"));
  if (opts.dataset) opts.dataset = { facet: opts.dataset, noun: opts.noun, chips: opts.chips ? opts.chips.split(",") : [] };
  console.log(table(rows, opts));
}
