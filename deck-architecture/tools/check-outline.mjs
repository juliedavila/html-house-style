#!/usr/bin/env node
// check-outline.mjs: checks an outline.json before a deck is built from it. Prints the
// ghost deck (the titles alone, which must carry the argument), then PASS, WARN and
// FAIL lines like check.mjs. Exit code 1 on any FAIL. No dependencies; node 18+, bun or deno.
//
//   node tools/check-outline.mjs outline.json
//   import { checkOutline, ghost } from "./tools/check-outline.mjs";

import { SCHEMA, MODES, hasNumber } from "./outline.mjs";

export const KINDS = ["title", "summary", "status", "section", "stats", "chart", "table", "diagram", "figure", "data", "options", "steps",
  "callout", "finding", "pointer", "appendix-divider", "glossary", "sources"];
export const PATTERNS = ["decide", "understand", "look-up", "monitor", "do", "review"];
const LEVELS = ["ok", "warn", "danger", "idle"];
const words = s => String(s).split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
// Slides that are not part of the argument: their titles are labels on purpose.
const plain = s => s.appendix || ["title", "appendix-divider", "pointer"].includes(s.kind);
// The title heuristic is check.mjs's, for h2s: three words or fewer reads as a topic label.
export const topicLike = t => words(t) <= 3;

export function ghost(o) {
  return o.slides.map((s, i) => ({ n: i + 1, s })).filter(x => !plain(x.s)).map(x => `${String(x.n).padStart(2)}. ${x.s.title}`).join("\n");
}

export function checkOutline(o) {
  const out = [], add = (lvl, id, msg) => out.push({ lvl, id, msg });
  const m = o && o.meta, slides = o && o.slides;
  if (!m || !Array.isArray(slides)) { add("FAIL", "schema", "not an outline: needs meta and slides[]"); return out; }
  if (m.schema !== SCHEMA) add("WARN", "schema", `meta.schema is "${m.schema}", expected "${SCHEMA}"`);
  for (const k of ["title", "pattern", "mode"]) if (!m[k]) add("FAIL", "schema", `meta.${k} is missing`);
  if (m.mode && !MODES[m.mode]) add("FAIL", "schema", `meta.mode "${m.mode}" is not presented or preread`);
  if (m.pattern && !PATTERNS.includes(m.pattern)) add("FAIL", "schema", `meta.pattern "${m.pattern}" is not one of the six patterns`);
  if (!slides.length) add("FAIL", "schema", "no slides");
  const L = MODES[m.mode] || MODES.presented, appendixL = MODES.preread;
  const pointerDeck = ["look-up", "do"].includes(m.pattern) && slides.length === 1;

  slides.forEach((s, i) => {
    const at = `slide ${i + 1} (${s.kind})`, bad = msg => add("FAIL", "schema", `${at}: ${msg}`);
    if (!KINDS.includes(s.kind)) bad(`kind "${s.kind}" is not one of ${KINDS.join(", ")}`);
    if (typeof s.title !== "string" || !s.title.trim()) bad("no title");
    if (!Array.isArray(s.body) || s.body.some(b => typeof b !== "string")) bad("body must be an array of strings");
    if (typeof s.notes !== "string") bad("notes must be a string");
    if (!Array.isArray(s.sources)) bad("sources must be an array");
    const body = Array.isArray(s.body) ? s.body : [], title = String(s.title || "");

    // kind by kind
    if (s.chart) {
      const c = s.chart;
      if (!Array.isArray(c.labels) || !Array.isArray(c.values) || c.labels.length !== c.values.length) add("FAIL", "chart", `${at}: chart needs labels and values of equal length`);
      else if (c.values.some(v => typeof v !== "number" || !isFinite(v))) add("FAIL", "chart", `${at}: chart values must be numbers`);
      if (!["bar", "column"].includes(c.type)) add("WARN", "chart", `${at}: chart.type "${c.type}" is not bar or column`);
      if (s.kind === "chart" && !(c.focus || []).length) add("WARN", "chart", `${at}: no focus bar; put the bars the title talks about in the accent, and check the chart shows the title's claim`);
    }
    if (s.kind === "chart" && !s.chart) bad("a chart slide needs chart");
    if (s.kind === "data") {
      if (!s.link) add("FAIL", "data", `${at}: a data slide needs a link to the live view`);
      else if (!/^https?:\/\//.test(s.link)) add("WARN", "data", `${at}: link "${s.link}" is not a full address; pass --url to outline.mjs`);
    }
    if (s.kind === "diagram") {
      const d = s.diagram, ids = new Set((d?.nodes || []).map(nd => nd.id));
      if (!d || !Array.isArray(d.nodes) || d.nodes.length < 2) bad("a diagram needs at least two nodes");
      else for (const nd of d.nodes) if (["x", "y", "w", "h"].some(k => typeof nd[k] !== "number")) bad(`node ${nd.id} needs x, y, w and h in inches`);
      for (const e of d?.edges || []) if (!ids.has(e.from) || !ids.has(e.to)) bad(`edge ${e.from} to ${e.to} names a missing node`);
      if (d && !d.alt) add("WARN", "diagram", `${at}: no alt text for the diagram`);
    }
    if (s.table) {
      const t = s.table;
      if (!Array.isArray(t.header) || !Array.isArray(t.rows)) bad("table needs header and rows");
      else if (t.rows.some(r => r.length !== t.header.length)) add("WARN", "table", `${at}: some rows do not have ${t.header.length} cells`);
      if (t.more && !s.link) add("WARN", "table", `${at}: ${t.more} rows left out and no link to the full table`);
    }
    if (s.kind === "stats" && !(s.stats || []).length) bad("a stats slide needs stats");
    if (s.kind === "steps" && !(s.steps || []).length) bad("a steps slide needs steps");
    if (s.kind === "options" && !(s.options || []).length && !s.table) bad("an options slide needs options or a table");
    if (s.kind === "callout" && !s.callout?.text) bad("a callout slide needs callout.text");
    if (s.status && !LEVELS.includes(s.status.level)) bad(`status level "${s.status.level}" is not ${LEVELS.join(", ")}`);

    // titles are claims
    if (!plain(s)) {
      if (topicLike(title)) add("WARN", "title", `${at}: "${title}" looks like a topic label; state the claim`);
      if (/\?\s*$/.test(title)) add("WARN", "title", `${at}: "${title}" is a question; state the answer`);
      if (words(title) > 16) add("WARN", "title", `${at}: title is ${words(title)} words; at 28pt it runs past two lines`);
    }
    // every number names its source
    const numbered = hasNumber([title, ...body, s.callout?.text, ...(s.steps || []).map(x => x.title + " " + x.text), ...(s.options || []).map(x => x.text), ...(s.table?.rows || []).flat(), ...(s.diagram?.nodes || []).map(n => `${n.label} ${n.sub || ""}`), ...(s.diagram?.edges || []).map(e => e.label)].filter(Boolean).join(" ")) || ["chart", "data", "stats"].includes(s.kind);
    if (numbered && !(s.sources || []).length && !["title", "appendix-divider"].includes(s.kind)) add("FAIL", "source", `${at}: has numbers and no source`);
    // density by mode; the appendix is read, so it gets the pre-read limits
    const lim = s.appendix ? appendixL : L, w = words(body.join(" "));
    if (w > lim.bodyWords * 1.5) add("FAIL", "words", `${at}: ${w} body words; the ${s.appendix ? "appendix" : m.mode} limit is about ${lim.bodyWords}`);
    else if (w > lim.bodyWords) add("WARN", "words", `${at}: ${w} body words; the ${s.appendix ? "appendix" : m.mode} limit is about ${lim.bodyWords}. Tighten the points, keep the claim`);
    if (body.length > L.bullets) add("FAIL", "bullets", `${at}: ${body.length} points; at most ${L.bullets}`);
    if (m.mode === "presented" && !plain(s) && !s.notes && !body.length) add("WARN", "notes", `${at}: presented and nothing for the presenter to say; add notes`);
  });

  const titles = slides.filter(s => !plain(s)).map(s => s.title);
  for (const t of new Set(titles)) if (titles.filter(x => x === t).length > 1) add("WARN", "title", `"${t}" is the title of more than one slide; one idea per slide`);
  if (!pointerDeck && (["decide", "review"].includes(m.pattern) || m.mode === "preread") && !slides.some(s => ["summary", "status"].includes(s.kind)))
    add("FAIL", "summary", `a ${m.mode === "preread" ? "pre-read" : m.pattern} deck needs a summary slide up front`);
  const sum = slides.findIndex(s => ["summary", "status"].includes(s.kind));
  if (sum > 2) add("WARN", "summary", `the summary is slide ${sum + 1}; put it straight after the title`);
  if (!/^mode: (presented|preread)\b/.test(slides[0]?.notes || "")) add("WARN", "mode", `slide 1 notes should start "mode: ${m.mode}." so check-pptx can read the mode from the deck`);
  if (["look-up", "do"].includes(m.pattern) && !pointerDeck) add("WARN", "pattern", `a ${m.pattern} page is used live; a deck of it is a training walk-through at most`);
  const main = slides.filter(s => !plain(s)).length;
  add("INFO", "size", `${slides.length} slides: ${main} in the argument, ${slides.filter(s => s.appendix).length} in the appendix`);
  for (const id of ["schema", "chart", "data", "title", "source", "words", "bullets", "summary"])
    if (!out.some(x => x.id === id && x.lvl !== "INFO")) add("PASS", id, ({ schema: "schema valid", chart: "every chart has labels and values of equal length", data: "every data slide links to its live view",
      title: "every argument title reads as a claim", source: "every slide with numbers names a source", words: `body words within the ${m.mode} limits`, bullets: `at most ${L.bullets} points a slide`, summary: "summary slide in place" })[id]);
  return out;
}

const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const { readFileSync } = await import("node:fs");
  const file = process.argv.slice(2).find(a => !a.startsWith("--"));
  if (!file) { console.log("usage: node tools/check-outline.mjs outline.json"); process.exit(2); }
  let o;
  try { o = JSON.parse(readFileSync(file, "utf8")); } catch (e) { console.log(`FAIL  schema         ${file} is not JSON: ${e.message}`); process.exit(1); }
  if (o?.slides) console.log(`Ghost deck (${o.meta?.mode}, titles only):\n${ghost(o)}\n`);
  const out = checkOutline(o), order = ["schema", "mode", "summary", "title", "source", "words", "bullets", "chart", "data", "table", "diagram", "notes", "pattern", "size"];
  out.sort((p, q) => order.indexOf(p.id) - order.indexOf(q.id));
  for (const x of out) console.log(`${x.lvl.padEnd(4)}  ${x.id.padEnd(8)} ${x.msg}`);
  const n = l => out.filter(x => x.lvl === l).length;
  console.log(`\n${file}: ${n("FAIL")} FAIL, ${n("WARN")} WARN. Not checked here: how the slides look, whether the claims are true.`);
  process.exit(n("FAIL") ? 1 : 0);
}
