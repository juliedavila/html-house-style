#!/usr/bin/env node
// outline.mjs: a finished house-style page as a deck outline (outline.json), the
// structure a deck-building skill follows slide by slide. It decides what goes on each
// slide, in the notes and in the appendix; the deck skill decides how it looks.
// No dependencies; node 18+, bun or deno.
//
//   node tools/outline.mjs page.html --mode presented|preread [--url https://.../page.html]
//        [--brand brand.json] [--since last-week.html] [--force] > outline.json
//
//   import { outline } from "./tools/outline.mjs";
//   const o = outline(html, { mode: "presented", sourceUrl, brand });
//
// It reads the page with regular expressions, like check.mjs, not a DOM. It only knows
// the kit's markup (data-pattern, .bluf, .purpose, claim h2s, .stats, bars.mjs and .d-*
// figures, tables, section.dataset, .compare, ol.steps, .callout, .finding, h2.annex).
// The schema is in DECKS.md section 6; check-outline.mjs validates it.

export const SCHEMA = "deck-outline/1";
export const MODES = {
  presented: { bodyWords: 30, bullets: 6, titlePt: 28, bodyPt: 18, labelPt: 14, sourcePt: 12, tableRows: 5, points: 3 },
  preread: { bodyWords: 80, bullets: 6, titlePt: 28, bodyPt: 14, labelPt: 14, sourcePt: 12, tableRows: 8, points: 4 },
};
// The content area of a 16:9 slide (13.333 x 7.5 inches) under the title, where diagram
// positions are given. A deck skill with a different box scales them linearly.
export const FRAME = { x: 0.6, y: 1.55, w: 12.13, h: 4.95 };

// ---------- reading HTML without a DOM ----------
const decode = s => s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&times;/g, "x").replace(/&amp;/g, "&");
const text = s => decode(String(s ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").replace(/\s+([.,;:!?)])(?=\s|$)/g, "$1").replace(/\(\s+/g, "(").trim();
const attrs = tag => { const a = {}; for (const m of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) a[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5]); return a; };
const cls = (a, c) => (a.class || "").split(/\s+/).includes(c);
const blank = (s, re) => s.replace(re, m => " ".repeat(m.length)); // keeps offsets

// Every element with this tag whose attributes pass `test`, with its inner HTML and range.
function find(html, tag, test = () => true) {
  const out = [];
  for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))) {
    const a = attrs(m[0]); if (!test(a)) continue;
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi"); re.lastIndex = m.index + m[0].length;
    let depth = 1, c, end = html.length, innerEnd = html.length;
    while ((c = re.exec(html))) { depth += c[1] ? -1 : 1; if (!depth) { innerEnd = c.index; end = c.index + c[0].length; break; } }
    out.push({ tag, a, at: m.index, end, inner: html.slice(m.index + m[0].length, innerEnd) });
  }
  return out;
}
const first = (html, tag, c) => find(html, tag, a => !c || cls(a, c))[0];
const without = (html, tag, c) => { for (const e of find(html, tag, a => cls(a, c)).reverse()) html = html.slice(0, e.at) + html.slice(e.end); return html; };

// ---------- text helpers ----------
const wordsOf = s => String(s).split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
const sentences = s => String(s).split(/(?<=[.!?]["”)]?)\s+(?=[A-Z0-9"“(])/).map(x => x.trim()).filter(Boolean);
// Sentences that tell a reader how to work the page ("Pick a bar to filter the table") mean
// nothing on a slide; they are dropped from slide text and notes.
const UI = /\b(pick|click|tap|filter|sort|scroll|choose|open)\b[^.]*\b(bar|chart|table|column|chips?|filters?|link|address)\b|\bthe address keeps\b/i;
const noUI = s => sentences(s).filter(x => !UI.test(x)).join(" ");
const capital = s => s.replace(/^./, c => c.toUpperCase());
const stop = s => /[.!?]$/.test(s) ? s : s + ".";
// The first clause or clauses of a sentence that fit in max words. It cuts only where a
// clause ends (a semicolon, a colon, or a comma before "and", "but", "so", "which"), never
// inside a list. A clause that does not fit is kept whole: a long point is better than a
// cut one, and check-outline flags it.
function clause(s, max) {
  const parts = (sentences(s)[0] || "").split(/(?<=[;:])\s+|(?<=,)\s+(?=(?:and|or|but|so|which|who|where|while|then)\s)/);
  let out = parts[0];
  for (const p of parts.slice(1)) { if (wordsOf(out + " " + p) > max) break; out += " " + p; }
  return out.replace(/[;:,]$/, "");
}
// Whole sentences from several paragraphs within a word budget: each paragraph's lead
// sentence first, then the next ones, kept in reading order. One string per paragraph.
function lead(paras, budget) {
  // a run-in label ("Worked example, part 2.") travels with the sentence after it
  const ss = paras.map(p => sentences(p).reduce((o, x) => (o.length && wordsOf(o[o.length - 1]) < 5 ? o[o.length - 1] += " " + x : o.push(x), o), [])), keep = ss.map(() => 0);
  let used = 0;
  for (let round = 0; ; round++) {
    let added = false;
    for (let i = 0; i < ss.length; i++) {
      if (keep[i] !== round || round >= ss[i].length) continue;
      const w = wordsOf(ss[i][round]);
      if (used + w > budget && used > 0) continue;
      keep[i]++; used += w; added = true;
    }
    if (!added) break;
  }
  return ss.map((s, i) => s.slice(0, keep[i]).join(" ")).filter(Boolean);
}
// "A number" in the sense of the source rule: a measure, not a date, a time, an ordinal
// label (step 3, finding 1, version 2) or a standard's version (WCAG 2.2).
const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const NOT_A_MEASURE = new RegExp([
  `\\b\\d{1,2}\\s+${MONTH}(\\s+\\d{4})?\\b`, `\\b${MONTH}\\s+\\d{1,2}(,\\s*\\d{4})?\\b`, `\\b${MONTH}\\s+\\d{4}\\b`, "\\b\\d{4}-\\d{2}-\\d{2}\\b",
  "\\b(19|20)\\d{2}\\b", "\\b\\d{1,2}:\\d{2}\\b", "\\b(step|steps|finding|findings|version|message|messages|part|day|days|fig|figure|option|phase|week|v)[ -]?\\d+(\\.\\d+)*\\b",
  "`[^`]*`", "(^|\\s)\\d{1,2}[.)]\\s",
].join("|"), "gi");
// a standard and its version (WCAG 2.2, ISO 27001) is a name, matched with case
const STANDARD = /\b[A-Z]{2,}[ -]?\d+(\.\d+)*\b|\b\d+(\.\d+)+\s+[A-Z][a-z]/g;
export const hasNumber = s => /\d/.test(String(s).replace(STANDARD, " ").replace(NOT_A_MEASURE, " ").replace(/\b\d+(st|nd|rd|th)\b/g, " ").replace(/\b[a-z]+[-_.]\d+\b/gi, " "));
const yearOrMonth = s => /\b(19|20)\d{2}\b/.test(s) || new RegExp(`\\b${MONTH}\\b`).test(s);

// ---------- the page's parts ----------
function pageParts(src) {
  const html = blank(blank(src, /<script\b[\s\S]*?<\/script>/gi), /<style\b[\s\S]*?<\/style>/gi).replace(/<!--[\s\S]*?-->/g, m => " ".repeat(m.length));
  const body = html.match(/<body\b([^>]*)>/i), b = body ? attrs(body[0]) : {};
  const mast = first(html, "header", "masthead")?.inner || "";
  const metaSpans = find(first(mast, "div", "meta")?.inner || "", "span").map(s => text(s.inner));
  const date = metaSpans.find(yearOrMonth) || "";
  const mainEl = first(html, "main"), main = mainEl ? mainEl.inner : html;
  // h2s outside the contents rail, each with the HTML up to the next h2
  const nav = find(main, "nav");
  const h2s = find(main, "h2").filter(h => !nav.some(n => h.at > n.at && h.at < n.end));
  const sections = h2s.map((h, i) => {
    const endAt = i + 1 < h2s.length ? h2s[i + 1].at : main.length;
    return { id: h.a.id || "", title: text(h.inner), annex: cls(h.a, "annex"), html: main.slice(h.end, endAt) };
  });
  const opening = main.slice(0, h2s.length ? h2s[0].at : main.length);
  return {
    title: text(first(mast, "h1")?.inner || src.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ""),
    dek: text(first(mast, "p", "dek")?.inner || ""), kicker: text(first(mast, "div", "kicker")?.inner || ""),
    pattern: b["data-pattern"] || "", date, opening, sections,
  };
}

// The kit components inside a stretch of HTML, top level only, in reading order.
const KINDS = [
  ["div", "stats"], ["figure"], ["div", "table-wrap"], ["section", "dataset"], ["div", "compare"], ["ol", "steps"],
  ["div", "callout"], ["article", "finding"], ["dl", "glossary"], ["div", "sources"], ["details"], ["div", "preconditions"],
  ["section", "bluf"], ["p"], ["ul"], ["ol"], ["pre"],
];
const SKIP_P = ["filter-sentence", "filter-empty", "table-note", "footnote", "kitnote", "dataset-print-note", "snapshot-note", "dataset-title", "dataset-how", "expect"];
function components(html) {
  let all = [];
  for (const [tag, c] of KINDS) for (const e of find(html, tag, a => !c || cls(a, c))) all.push({ ...e, kind: c || tag });
  all = all.filter(e => !(e.kind === "p" && SKIP_P.some(c => cls(e.a, c))) && !(e.kind === "ol" && cls(e.a, "steps")));
  all.sort((p, q) => p.at - q.at || q.end - p.end);
  const top = [];
  for (const e of all) if (!top.some(t => e.at >= t.at && e.end <= t.end)) top.push(e);
  // a table's source is the .table-note right after it
  for (const t of top.filter(e => e.kind === "table-wrap")) {
    const m = html.slice(t.end).match(/^\s*<p\b[^>]*class="[^"]*\btable-note\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (m) t.note = text(m[1]);
  }
  return top;
}

// ---------- components to slide parts ----------
function stats(e) {
  return find(e.inner, "div", a => cls(a, "stat")).map(s => {
    const st = find(s.inner, "span", a => cls(a, "status"))[0];
    const what = first(s.inner, "div", "what")?.inner || "";
    return {
      value: text(first(s.inner, "div", "value")?.inner.replace(/<span[^>]*class="[^"]*\bstatus\b[^"]*"[^>]*>[\s\S]*?<\/span>/, m => st && !text(first(s.inner, "div", "value").inner.replace(m, "")) ? m : "") || ""),
      label: text(st ? what.replace(/<span[^>]*class="[^"]*\bstatus\b[^"]*"[^>]*>[\s\S]*?<\/span>/, "") : what),
      source: text(first(s.inner, "div", "src")?.inner || ""),
      ...(st ? { status: statusOf(st) } : {}),
    };
  });
}
const LEVELS = ["ok", "warn", "danger", "idle"];
const statusOf = el => ({ level: (el.a.class || "").split(/\s+/).find(c => LEVELS.includes(c)) || "idle", word: text(el.inner) });

function tableOf(inner) {
  const head = find(inner, "thead")[0], th = head ? find(head.inner, "th") : [];
  const rows = find(find(inner, "tbody")[0]?.inner || inner, "tr").map(r => find(r.inner, "t[hd]").map(c => text(c.inner)));
  const rec = th.findIndex(h => cls(h.a, "rec"));
  return { caption: text(first(inner, "caption")?.inner || ""), header: th.map(h => text(h.inner)), rows, ...(rec >= 0 ? { recommended: rec } : {}) };
}

function svgParts(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 640 360").split(/[\s,]+/).map(Number);
  const els = (tag) => [...svg.matchAll(new RegExp(`<${tag}\\b([^>]*?)(/>|>([\\s\\S]*?)</${tag}>)`, "g"))].map(m => ({ a: attrs(`<x ${m[1]}>`), body: text(m[3] || "") }));
  return { vb, rects: els("rect"), texts: els("text"), paths: els("path"), lines: els("line"), circles: els("circle"),
    title: text(svg.match(/<title\b[^>]*>([\s\S]*?)<\/title>/)?.[1] || ""), desc: text(svg.match(/<desc\b[^>]*>([\s\S]*?)<\/desc>/)?.[1] || "") };
}
const n = v => parseFloat(v);
const num = s => { const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; };

// Bars from bars.mjs or drawn by hand: each value label is a row, matched to the label
// beside it (horizontal) or under it (vertical), and to the bar it sits on.
function chartOf(svg, comment) {
  const p = svgParts(svg), bars = p.rects.filter(r => /\bc-(bar|cat-\d)\b/.test(r.a.class || ""));
  const values = p.texts.filter(t => /\bc-value\b/.test(t.a.class || "") && !isNaN(num(t.body)));
  const names = p.texts.filter(t => /\bc-(label|tick)\b/.test(t.a.class || ""));
  if (!bars.length || values.length < 2) return null;
  const rows = [];
  for (const v of values) {
    const vx = n(v.a.x), vy = n(v.a.y);
    let label = names.find(t => t.a["text-anchor"] === "end" && Math.abs(n(t.a.y) - vy) < 4 && n(t.a.x) < vx), dir = "bar";
    if (!label) { dir = "column"; label = names.filter(t => t.a["text-anchor"] === "middle" && Math.abs(n(t.a.x) - vx) < 3 && n(t.a.y) > vy).sort((a, b) => n(a.a.y) - n(b.a.y))[0]; }
    if (!label) return null;
    const bar = bars.find(r => dir === "bar" ? vy >= n(r.a.y) && vy <= n(r.a.y) + n(r.a.height) + 4 : Math.abs(n(r.a.x) + n(r.a.width) / 2 - vx) < 3);
    const c = (bar?.a.class || "").match(/c-cat-(\d)/);
    rows.push({ dir, label: label.body, value: num(v.body), focus: /\bfocus\b/.test(bar?.a.class || ""), cat: c ? +c[1] : null });
  }
  const unit = (comment.match(/axis 0 to [\d,.]+ ([a-z][\w ]*?),/) || [])[1] || "";
  return {
    type: rows[0].dir, title: p.title, labels: rows.map(r => r.label), values: rows.map(r => r.value), unit,
    focus: rows.flatMap((r, i) => r.focus ? [i] : []), ...(rows.some(r => r.cat) ? { categories: rows.map(r => r.cat) } : {}), alt: p.desc,
  };
}

// A hand-drawn .d-* diagram as nodes and edges in slide inches, inside FRAME.
function diagramOf(svg) {
  const p = svgParts(svg), [vx, vy, W, H] = p.vb, k = Math.min(FRAME.w / W, FRAME.h / H);
  const ox = FRAME.x + (FRAME.w - W * k) / 2, oy = FRAME.y + (FRAME.h - H * k) / 2, r2 = v => Math.round(v * 100) / 100;
  const boxes = p.rects.filter(r => /\bd-(box|focus|zone|cat-\d)\b/.test(r.a.class || "")).map((r, i) => ({ r, x: n(r.a.x), y: n(r.a.y), w: n(r.a.width), h: n(r.a.height), zone: /\bd-zone\b/.test(r.a.class), i }));
  const nodesRaw = boxes.filter(b => !b.zone);
  if (nodesRaw.length < 2) return null;
  const inside = (t, b) => n(t.a.x) >= b.x && n(t.a.x) <= b.x + b.w && n(t.a.y) >= b.y && n(t.a.y) <= b.y + b.h;
  const labels = p.texts.filter(t => /\bd-(label|small)\b/.test(t.a.class || ""));
  const place = b => ({ x: r2(ox + (b.x - vx) * k), y: r2(oy + (b.y - vy) * k), w: r2(b.w * k), h: r2(b.h * k) });
  const nodes = nodesRaw.map((b, i) => {
    const ts = labels.filter(t => inside(t, b));
    const c = (b.r.a.class || "").match(/d-cat-(\d)/);
    return { id: "n" + (i + 1), label: ts.filter(t => /d-label/.test(t.a.class)).map(t => t.body).join(" ") || ts[0]?.body || "",
      sub: ts.filter(t => /d-small/.test(t.a.class)).map(t => t.body).join(" "), ...place(b),
      ...(/\bd-focus\b/.test(b.r.a.class) ? { focus: true } : {}), ...(c ? { cat: +c[1] } : {}) };
  });
  const zones = boxes.filter(b => b.zone).map(b => ({ label: labels.find(t => inside(t, b) && !nodesRaw.some(nb => inside(t, nb)))?.body || "", ...place(b) }));
  const loose = labels.filter(t => !nodesRaw.some(b => inside(t, b)) && !boxes.some(b => b.zone && inside(t, b)));
  const near = (x, y) => nodesRaw.map((b, i) => ({ i, d: Math.hypot(Math.max(b.x - x, 0, x - b.x - b.w), Math.max(b.y - y, 0, y - b.y - b.h)) })).sort((a, b) => a.d - b.d)[0];
  const edges = [];
  for (const e of [...p.paths, ...p.lines].filter(e => /\bd-edge\b/.test(e.a.class || ""))) {
    let pts = [];
    if (e.a.d) { let x = 0, y = 0; for (const m of e.a.d.matchAll(/([MLHV])\s*([-\d.]+)(?:[\s,]+([-\d.]+))?/gi)) {
      const c = m[1].toUpperCase(); if (c === "H") x = +m[2]; else if (c === "V") y = +m[2]; else { x = +m[2]; y = +m[3]; } pts.push([x, y]); } }
    else pts = [[n(e.a.x1), n(e.a.y1)], [n(e.a.x2), n(e.a.y2)]];
    if (pts.length < 2) continue;
    const [a, b] = [near(...pts[0]), near(...pts[pts.length - 1])];
    if (!a || !b || a.d > 16 || b.d > 16 || a.i === b.i) continue;
    const mx = (pts[0][0] + pts[pts.length - 1][0]) / 2, my = (pts[0][1] + pts[pts.length - 1][1]) / 2;
    const lab = loose.map(t => ({ t, d: Math.hypot(n(t.a.x) - mx, n(t.a.y) - my) })).sort((p, q) => p.d - q.d)[0];
    const pt = ([x, y]) => [r2(ox + (x - vx) * k), r2(oy + (y - vy) * k)], hasLab = lab && lab.d < 30;
    edges.push({ from: "n" + (a.i + 1), to: "n" + (b.i + 1), label: hasLab ? lab.t.body : "",
      points: [pt(pts[0]), pt(pts[pts.length - 1])], ...(hasLab ? { labelAt: pt([n(lab.t.a.x), n(lab.t.a.y) - 5]) } : {}),
      arrow: e.a["marker-start"] && e.a["marker-end"] ? "both" : e.a["marker-start"] ? "start" : e.a["marker-end"] ? "end" : "none", ...(/\bfocus\b/.test(e.a.class) ? { focus: true } : {}) });
  }
  return { frame: FRAME, nodes, ...(zones.length ? { zones } : {}), edges, alt: p.desc, title: p.title };
}

function figureOf(e) {
  const cap = first(e.inner, "figcaption")?.inner || "";
  const takeaway = text(first(cap, "strong")?.inner || "");
  const rest = text(without(without(cap.replace(/<strong\b[^>]*>[\s\S]*?<\/strong>/, ""), "span", "fig-id"), "span", "key"));
  const svg = e.inner.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] || "", comment = (e.inner.match(/Scale:[^\n]*/) || [""])[0];
  const ss = sentences(rest), source = (ss.some(x => /\b(19|20)\d{2}\b/.test(x)) ? ss.filter(x => /\b(19|20)\d{2}\b/.test(x)) : ss.filter(yearOrMonth)).join(" ");
  const chart = svg && chartOf(svg, comment), diagram = !chart && svg && diagramOf(svg);
  return { takeaway, caption: rest, source, chart, diagram, alt: svgParts(svg).desc, title: svgParts(svg).title, linked: cls(e.a, "linked") };
}

// A dataset: its chart, its rows with their facet values, and the cuts the prose names.
function datasetOf(e) {
  const fig = figureOf(find(e.inner, "figure")[0] || { inner: "", a: {} });
  const groups = find(e.inner, "div", a => cls(a, "chips")).map(g => {
    const buttons = find(g.inner, "button").filter(b => b.a["data-value"]);
    return { key: buttons[0]?.a["data-key"], values: buttons.map(b => ({ value: b.a["data-value"], word: text(b.inner), say: b.a["data-say"] || text(b.inner).toLowerCase() })) };
  }).filter(g => g.key);
  const bars = find(e.inner, "g", a => a.role === "button" && a["data-key"]);
  const facet = bars[0]?.a["data-key"] || "", facetWords = Object.fromEntries(bars.map(b => [b.a["data-value"], b.a["data-label"]]));
  const t = tableOf(first(e.inner, "div", "table-wrap")?.inner || "");
  const rows = find(first(e.inner, "tbody")?.inner || "", "tr").map(r => ({ ...Object.fromEntries(Object.entries(r.a).filter(([k]) => k.startsWith("data-")).map(([k, v]) => [k.slice(5), v])),
    _id: text(find(r.inner, "t[hd]")[0]?.inner || ""), _status: text(find(r.inner, "span", a => cls(a, "status"))[0]?.inner || "") }));
  const note = text(e.inner.slice(first(e.inner, "div", "table-wrap")?.end || 0).match(/<p\b[^>]*table-note[^>]*>([\s\S]*?)<\/p>/)?.[1] || "");
  return { id: e.a.id || "", noun: e.a["data-noun"] || "records", title: text(first(e.inner, "p", "dataset-title")?.inner || ""), how: text(first(e.inner, "p", "dataset-how")?.inner || ""),
    sentence: text(first(e.inner, "p", "filter-sentence")?.inner || ""), fig, groups, facet, facetWords, header: t.header, rows, note };
}

function findingOf(e) {
  const st = find(e.inner, "span", a => cls(a, "status"))[0], dl = first(e.inner, "dl", "fields")?.inner || "";
  const dts = find(dl, "dt").map(d => text(d.inner)), dds = find(dl, "dd").map(d => text(d.inner));
  return { id: e.a.id || "", title: text(first(e.inner, "h3")?.inner || "").replace(/^\d+\.\s*/, ""), status: st ? statusOf(st) : null,
    chip: text(find(e.inner, "span", a => cls(a, "chip"))[0]?.inner || ""), fields: dts.map((d, i) => [d, noUI(dds[i] || "")]) };
}

// ---------- the outline ----------
export function outline(src, o = {}) {
  const mode = o.mode || "presented", L = MODES[mode];
  if (!L) throw new Error(`outline.mjs: --mode must be presented or preread, not "${mode}"`);
  const page = pageParts(src), url = o.sourceUrl || "page.html", at = id => id ? `${url}#${id}` : url;
  // What a slide cites when its numbers have no source of their own: the page's Sources
  // list (first sentence of the first two items), else the page itself with its date.
  const srcSec = page.sections.find(s => s.annex && /source/i.test(s.title));
  const srcItems = srcSec ? find(srcSec.html, "li").map(li => (sentences(text(li.inner))[0] || "").replace(/\.$/, "")).filter(Boolean) : [];
  const hasDataset = /<section\b[^>]*class="[^"]*\bdataset\b/.test(src);
  const pattern = page.pattern, pageSource = srcItems.length ? srcItems.slice(0, 2).join("; ") : `${page.title}${page.date ? ", " + page.date : ""}`;
  const meta = { schema: SCHEMA, title: page.title, pattern, ...(hasDataset ? { dataset: true } : {}), mode, source: o.sourceName || "", date: page.date, sourceUrl: url, rules: L };
  if (o.brand) meta.brand = brandColours(o.brand.raw || o.brand, o.brand.resolved);
  const slides = [], warnings = [], appendixLater = [];
  // The page's figure ids (FIG-1) mean nothing in a deck; say where the figure is instead.
  const figRef = v => typeof v === "string" ? v.replace(/\b(?:in |see )?FIG-(\d+)\b/g, (m, n) => `${/^(in|see) /.test(m) ? m.split(" ")[0] + " " : ""}figure ${n} on the page`)
    : Array.isArray(v) ? v.map(figRef) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, figRef(x)])) : v;
  const add = s0 => { const s = figRef(s0); slides.push({ kind: s.kind, title: s.title, body: s.body || [], notes: s.notes || "", sources: [...new Set(s.sources || [])], ...rest(s)}); };
  const rest = s => Object.fromEntries(Object.entries(s).filter(([k, v]) => !["kind", "title", "body", "notes", "sources"].includes(k) && v !== undefined && v !== null));
  // A slide with a number in its words and no source of its own cites the page.
  const cite = s => { const words = [s.title, ...(s.body || []), s.callout?.text, ...(s.steps || []).map(x => x.title + " " + x.text),
      ...(s.options || []).map(x => x.text), ...(s.table?.rows || []).flat(), ...(s.stats || []).map(x => x.value), ...(s.diagram?.nodes || []).map(n => n.label + " " + n.sub), ...(s.diagram?.edges || []).map(e => e.label)].filter(Boolean).join(" ");
    if (!(s.sources || []).length && (hasNumber(words) || ["chart", "data", "stats"].includes(s.kind))) s.sources = [pageSource]; return s; };
  const modeNote = `mode: ${mode}.`;

  const opening = components(page.opening);
  const bluf = opening.find(c => c.kind === "bluf"), purpose = opening.find(c => c.kind === "p" && cls(c.a, "purpose"));

  add(cite({ kind: "title", title: page.title, body: mode === "preread" && page.dek ? [page.dek] : [],
    notes: [modeNote, mode === "presented" ? page.dek : "", purpose && mode === "presented" ? text(purpose.inner) : ""].filter(Boolean).join(" "),
    sources: [], kicker: page.kicker, date: page.date }));

  // Look up and Do pages are not decks: one slide that points to the page.
  if (["look-up", "do"].includes(pattern) && !o.force) {
    warnings.push(`outline.mjs: a ${pattern} page should not be a deck; the reader ${pattern === "do" ? "follows the live checklist" : "searches the live page"}. Emitting one pointer slide. Pass --force for a ${pattern === "do" ? "training walk-through" : "full outline"}.`);
    slides.length = 0;
    add({ kind: "pointer", title: page.title, body: [purpose ? clause(sentences(text(purpose.inner))[0], 24) : page.dek, `Open the live page: ${url}`].filter(Boolean),
      notes: `${modeNote} This page is a ${pattern === "do" ? "procedure" : "reference"}: readers use it live, so the deck is one slide that sends them there.`, link: url });
    return { meta, slides, warnings };
  }

  // The opening: the ask (Decide), the verdict (Review), the status (Monitor), or for a
  // pre-read with a purpose line, the short version built from the claim headings.
  const argue = page.sections.filter(s => !s.annex);
  let monitorConsumed = null;
  if (bluf) {
    const p = find(bluf.inner, "p")[0], st = find(p?.inner || "", "span", a => cls(a, "status"))[0];
    const answer = text(st ? p.inner.replace(/<span[^>]*class="[^"]*\bstatus\b[^"]*"[^>]*>[\s\S]*?<\/span>/, "") : p?.inner || "");
    const items = find(find(bluf.inner, "ul")[0]?.inner || "", "li").map(li => text(li.inner));
    const ss = sentences(answer);
    let title = ss[0], extra = ss.slice(1);
    if (wordsOf(title) > 15 && /[,;]/.test(title)) { const c = title.search(/[,;]/); extra = [capital(stop(title.slice(c + 1).trim())), ...extra]; title = title.slice(0, c); }
    if (pattern === "monitor") {
      // One status slide with the same layout every time: status, sentence, tiles, exceptions.
      const tiles = opening.filter(c => c.kind === "stats").flatMap(stats);
      const ex = argue[0] && components(argue[0].html).find(c => ["ul", "ol"].includes(c.kind) && /class="[^"]*\bstatus\b/.test(c.inner));
      const exItems = ex ? find(ex.inner, "li").map(li => { const s = find(li.inner, "span", a => cls(a, "status"))[0];
        return { status: s ? statusOf(s) : null, text: text(s ? li.inner.replace(s ? li.inner.slice(s.at, s.end) : "", "") : li.inner) }; }) : [];
      if (ex) monitorConsumed = argue[0];
      const short = x => `${x.status ? x.status.word + ": " : ""}${mode === "presented" ? x.text.split(":")[0] : x.text}`;
      add({ kind: "status", title: title.replace(/\.$/, ""), status: st ? statusOf(st) : undefined,
        body: [...(mode === "preread" ? extra : []), ...exItems.slice(0, mode === "presented" ? 4 : 5).map(short)],
        notes: [modeNote, mode === "presented" ? extra.join(" ") : "", ex ? `Needs someone: ${argue[0].title}.` : ""].filter(Boolean).join(" "),
        stats: tiles.map(t => mode === "presented" ? { ...t, label: shortLabel(t.label) } : t), sources: tiles.map(t => t.source).filter(Boolean),
        changed: o.since ? changedSince(o.since, src) : null, link: url });
    } else {
      const pts = mode === "presented" ? items.map(i => short3(i, Math.max(6, Math.floor((L.bodyWords - wordsOf(extra.join(" "))) / Math.max(items.length, 1))))) : items;
      add(cite({ kind: "summary", title: stop(title).replace(/\.$/, ""), body: [...extra, ...pts].slice(0, L.bullets),
        notes: [modeNote, mode === "presented" ? items.join(" ") : ""].filter(Boolean).join(" ") }));
    }
  } else if (purpose && mode === "preread") {
    add({ kind: "summary", title: "The short version: " + argue[0]?.title.replace(/^./, c => c.toLowerCase()),
      body: [text(purpose.inner), ...argue.slice(1, L.bullets).map(s => stop(s.title))].slice(0, L.bullets), notes: modeNote });
  }

  // The big-picture diagram of an Understand page recurs with the current part marked.
  let bigPicture = null;

  for (const sec of argue) {
    if (sec === monitorConsumed) continue;
    const comps = components(sec.html), txt = comps.filter(c => ["p", "ul", "ol"].includes(c.kind) && !cls(c.a, "purpose"));
    const evid = comps.filter(c => !["p", "ul", "ol", "bluf", "pre"].includes(c.kind));
    const paras = txt.filter(c => c.kind === "p" && !cls(c.a, "bridge")).map(c => noUI(text(c.inner))).filter(Boolean);
    const lists = txt.filter(c => c.kind !== "p").flatMap(c => find(c.inner, "li").map(li => text(li.inner)));
    const bridge = comps.filter(c => c.kind === "p" && cls(c.a, "bridge")).map(c => text(c.inner));
    const sources = [];
    const notesFull = [...paras.map(p => sentences(p).slice(0, 2).join(" ")), ...lists, ...bridge].join(" ");
    const pointsPresented = (lists.length ? lists : paras.map(p => sentences(p).find(x => wordsOf(x) >= 5)).filter(Boolean)).slice(0, L.points).map(s => short3(s, Math.floor(L.bodyWords / Math.min(L.points, Math.max(1, (lists.length || paras.length))))));
    const textSlide = budget => mode === "presented" ? { body: pointsPresented, notes: notesFull }
      : { body: [...lead(paras, Math.max(budget - wordsOf(lists.slice(0, 3).join(" ")), budget / 2)), ...lists.slice(0, 3).map(i => sentences(i).slice(0, 2).join(" "))].slice(0, L.bullets), notes: [...lists.slice(3), ...bridge].join(" ") };
    const evText = () => mode === "presented" ? { body: [], notes: [...paras, ...lists, ...bridge].join(" ") } : { body: lead(paras, 45).slice(0, 2), notes: [...lists, ...bridge].join(" ") };

    const findings = evid.filter(c => c.kind === "finding").map(findingOf);
    if (findings.length) {
      const serious0 = findings.filter(f => ["danger", "warn"].includes(f.status?.level));
      // the claim slide over the findings lists the serious ones: their titles are the argument
      add(cite({ kind: "section", title: sec.title, body: (mode === "presented" ? serious0.slice(0, 3).map(f => f.title) : serious0.slice(0, L.bullets).map(f => `${f.status.word}: ${f.title}`)), notes: [paras.join(" "), ...bridge].join(" "), link: at(sec.id) }));
      const serious = findings.filter(f => ["danger", "warn"].includes(f.status?.level)), minor = findings.filter(f => !serious.includes(f));
      for (const f of serious) {
        const get = k => f.fields.find(([d]) => d === k)?.[1] || "";
        const body = mode === "presented" ? ["Impact", "Fix"].map(k => `${k}: ${clause(get(k), 12)}`) : f.fields.filter(([d]) => ["Where", "Evidence", "Impact", "Fix"].includes(d)).map(([d, v]) => `${d}: ${v}`);
        add(cite({ kind: "finding", title: f.title, status: f.status, chip: f.chip, body,
          notes: mode === "presented" ? f.fields.map(([d, v]) => `${d}: ${v}`).join(" ") : f.fields.filter(([d]) => !["Where", "Evidence", "Impact", "Fix"].includes(d)).map(([d, v]) => `${d}: ${v}`).join(" "),
          link: at(f.id || sec.id) }));
      }
      if (minor.length) add({ kind: "table", title: `The other ${minor.length === 1 ? "finding is" : (WORDS[minor.length] || minor.length) + " findings are"} low severity`,
        table: { header: ["Finding", "Severity", "Decision"], rows: minor.map(f => [f.title, f.status?.word || "", f.chip]) },
        notes: minor.map(f => `${f.title}. ${f.fields.map(([d, v]) => `${d}: ${v}`).join(" ")}`).join(" "), link: at(sec.id) });
      continue;
    }

    const own = [];
    for (const c of evid) {
      if (c.kind === "stats") { const s = stats(c); own.push({ kind: "stats", stats: mode === "presented" ? s.map(t => ({ ...t, label: shortLabel(t.label) })) : s, sources: s.map(t => t.source).filter(Boolean) }); }
      else if (c.kind === "figure") {
        const f = figureOf(c), src = f.source ? [f.source] : [];
        if (f.chart && f.chart.type === "bar" && f.chart.values.length > DENSE) {
          // too many bars to read on a shared screen: the leaders here, every bar in the appendix
          const c = f.chart, keep = c.values.map((v, i) => i).sort((a, b) => c.values[b] - c.values[a]).slice(0, 10).sort((a, b) => a - b);
          own.push({ kind: "chart", ttl: f.takeaway, chart: { ...c, labels: keep.map(i => c.labels[i]), values: keep.map(i => c.values[i]), focus: keep.flatMap((i, j) => (c.focus || []).includes(i) ? [j] : []), takeaway: f.takeaway },
            body: [`The 10 largest of ${c.values.length}; every bar is in the appendix.`], sources: src, link: at(sec.id) });
          appendixLater.push({ kind: "chart", title: `Detail: ${c.title || sec.title}`, chart: { ...c, takeaway: f.takeaway }, sources: src, link: at(sec.id) });
        }
        else if (f.chart) own.push({ kind: "chart", ttl: f.takeaway, chart: { ...f.chart, takeaway: f.takeaway }, sources: src, link: at(sec.id) });
        else if (f.diagram) { own.push({ kind: "diagram", ttl: f.takeaway, diagram: f.diagram, sources: src, link: at(sec.id) }); if (pattern === "understand" && !bigPicture) bigPicture = f.diagram; }
        else own.push({ kind: "figure", ttl: f.takeaway, figure: { title: f.title, alt: f.alt, caption: f.caption }, sources: src, link: at(sec.id), notes: f.alt });
      }
      else if (c.kind === "table-wrap") {
        const t = tableOf(c.inner), shown = t.rows.slice(0, L.tableRows), more = t.rows.length - shown.length;
        own.push({ kind: t.recommended !== undefined ? "options" : "table", ttl: t.caption, table: { ...t, rows: shown, ...(more ? { more } : {}) }, sources: c.note ? [c.note] : [],
          link: more ? at(sec.id) : undefined, full: more ? { ...t, note: c.note } : null });
      }
      else if (c.kind === "compare") own.push({ kind: "options", options: find(c.inner, "div", a => cls(a, "option")).map(op => ({
        label: text(first(op.inner, "h3")?.inner.replace(/<span[^>]*class="[^"]*\bchip\b[\s\S]*?<\/span>/, "") || ""), text: text(op.inner.replace(/<h3\b[\s\S]*?<\/h3>/, "")), recommended: cls(op.a, "recommended") })) });
      else if (c.kind === "steps") own.push({ kind: "steps", steps: find(c.inner, "li").filter(li => !find(c.inner, "li").some(o => o !== li && li.at > o.at && li.end <= o.end)).map(li => {
        const t = text(first(li.inner, "strong")?.inner || first(li.inner, "label")?.inner || ""), body = text(li.inner.replace(/<(strong|label)\b[\s\S]*?<\/\1>/, "").replace(/<div\b[^>]*callout[\s\S]*?<\/div>/g, ""));
        return mode === "presented" ? { title: t, text: "" } : { title: t, text: body }; }),
        notesExtra: mode === "presented" ? find(c.inner, "li").map(li => text(li.inner)).join(" ") : "" });
      else if (c.kind === "callout") { const kind = (c.a.class || "").split(/\s+/).find(x => x !== "callout") || "note", label = text(first(c.inner, "span", "label")?.inner || "");
        own.push({ kind: "callout", callout: { kind, label, text: text(c.inner.replace(/<span[^>]*class="label"[^>]*>[\s\S]*?<\/span>/, "")) } }); }
      else if (c.kind === "dataset") own.push(...dataSlides(datasetOf(c), sec));
      else if (c.kind === "details") { const sum = text(first(c.inner, "summary")?.inner || ""), body = text(c.inner.replace(/<summary\b[\s\S]*?<\/summary>/, ""));
        own.push({ kind: "callout", ttl: sum, callout: { kind: "question", label: sum, text: body }, qa: true }); }
      else if (c.kind === "preconditions") own.push({ kind: "callout", callout: { kind: "preconditions", label: text(first(c.inner, "span", "label")?.inner || "You need"), text: find(c.inner, "dt").map((d, i) => `${text(d.inner)}: ${text(find(c.inner, "dd")[i]?.inner || "")}`).join(" ") } });
    }
    // Self-check questions: one slide, the questions on it and the answers in the notes.
    const qs = own.filter(s => s.qa);
    if (qs.length) { own.splice(own.indexOf(qs[0]), qs.length, { kind: "section", qa: true, body: qs.map(q => q.callout.label), notesExtra: qs.map(q => `${q.callout.label} ${q.callout.text}`).join(" ") }); }

    if (!own.length) {
      const s = { kind: "section", title: sec.title, ...textSlide(L.bodyWords), link: at(sec.id) };
      if (bigPicture && pattern === "understand") { const d = locate(bigPicture, sec); if (d) { s.kind = "diagram"; s.diagram = d; if (mode === "preread") s.body = lead(paras, 45).slice(0, 2); } }
      add(cite(s)); continue;
    }
    own.forEach((s, i) => {
      const firstSlide = i === 0, t = firstSlide ? sec.title : s.ttl || s.title;
      // Evidence with no claim of its own goes to the appendix: every main slide argues.
      if (!t) { const { ttl, full, notesExtra, qa, ...slide } = s; appendixLater.push({ ...slide, title: `Detail: ${sec.title}`, body: s.body || [], notes: "", link: s.link || at(sec.id) }); return; }
      const words = firstSlide ? (s.qa ? { body: s.body, notes: [paras.join(" "), s.notesExtra].filter(Boolean).join(" ") } : evText()) : { body: s.body || [], notes: "" };
      if (s.kind === "chart" && s.chart.takeaway && s.chart.takeaway !== t && mode === "presented") words.body = [s.chart.takeaway, ...words.body].slice(0, L.points);
      if (s.kind === "chart" && s.chart.takeaway && s.chart.takeaway !== t && mode === "preread") words.body = [s.chart.takeaway, ...words.body];
      if (s.kind === "callout" && mode === "presented") words.notes = [s.callout.text, words.notes].filter(Boolean).join(" ");
      const { ttl, full, notesExtra, qa, ...slide } = s;
      add(cite({ ...slide, title: t, body: s.body?.length ? s.body : words.body, notes: [words.notes, s.notes, notesExtra].filter(Boolean).join(" "), sources: s.sources || [] }));
      if (full) appendixLater.push({ kind: "table", title: `Full table: ${t}`, table: { caption: full.caption, header: full.header, rows: full.rows.slice(0, 15), ...(full.rows.length > 15 ? { more: full.rows.length - 15 } : {}) }, sources: full.note ? [full.note] : [], link: at(sec.id) });
    });
  }

  // The appendix: a divider, then the annex sections, then any full tables cut short above.
  const annex = page.sections.filter(s => s.annex);
  if (annex.length || appendixLater.length) {
    const ap = [];
    for (const sec of annex) {
      const comps = components(sec.html);
      for (const c of comps) {
        if (c.kind === "glossary") { const dt = find(c.inner, "dt"), dd = find(c.inner, "dd");
          chunk(dt.map((d, i) => [text(d.inner), text(dd[i]?.inner || "")]), 6).forEach((rows, i) => ap.push({ kind: "glossary", title: sec.title + (i ? " (continued)" : ""), table: { header: ["Term", "Meaning"], rows } })); }
        else if (c.kind === "sources") chunk(find(c.inner, "li").map(li => text(li.inner)), 6).forEach((items, i) => ap.push({ kind: "sources", title: sec.title + (i ? " (continued)" : ""), body: items, link: at(sec.id) }));
        else if (c.kind === "details") { const sum = text(first(c.inner, "summary")?.inner || ""), tw = first(c.inner, "div", "table-wrap");
          if (tw) { const t = tableOf(tw.inner), note = text(c.inner.match(/<p\b[^>]*table-note[^>]*>([\s\S]*?)<\/p>/)?.[1] || "");
            ap.push({ kind: "table", title: sum, table: { ...t, rows: t.rows.slice(0, 12), ...(t.rows.length > 12 ? { more: t.rows.length - 12 } : {}) }, sources: note ? [note] : [], link: at(sec.id) }); }
          else ap.push({ kind: "section", title: sum, body: lead([text(c.inner.replace(/<summary\b[\s\S]*?<\/summary>/, ""))], L.bodyWords) }); }
        else if (c.kind === "table-wrap") { const t = tableOf(c.inner); ap.push({ kind: "table", title: t.caption || sec.title, table: { ...t, rows: t.rows.slice(0, 12) }, sources: c.note ? [c.note] : [], link: at(sec.id) }); }
        else if (c.kind === "p" && !cls(c.a, "footnote")) ap.push({ kind: "section", title: sec.title, body: lead([text(c.inner)], L.bodyWords) });
      }
    }
    ap.push(...appendixLater);
    if (ap.length) {
      add({ kind: "appendix-divider", title: "Appendix", body: mode === "preread" ? [...new Set(ap.map(s => s.title))].slice(0, L.bullets) : [], notes: "" });
      for (const s of ap) add(cite({ ...s, appendix: true, notes: s.notes || "" }));
    }
  }
  return { meta, slides, warnings };

  // ----- helpers that need the page -----
  function dataSlides(d, sec) {
    const out = [], total = d.rows.length;
    const agg = d.fig.chart ? { ...d.fig.chart, takeaway: d.fig.takeaway } : null;
    out.push({ kind: "data", ttl: sec.title, chart: agg, body: [], sentence: d.sentence, sources: [d.fig.source || d.note].filter(Boolean),
      link: `${url}#${d.id}`, how: d.how });
    // Cuts: chip values the prose outside the dataset names, the rarer the better (an
    // exception argues more than the bulk). Each is the chart under that one filter.
    const prose = text(src.replace(/<section\b[^>]*class="[^"]*\bdataset\b[\s\S]*?<\/section>/, "").replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, "")).toLowerCase();
    const cand = [];
    for (const g of d.groups) if (g.key !== d.facet) for (const v of g.values) {
      const share = d.rows.filter(r => r[g.key] === v.value).length / Math.max(total, 1);
      const hits = (prose.match(new RegExp(`\\b${v.word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) || []).length;
      if (hits && share > 0 && share <= 0.5) cand.push({ g, v, score: hits * (1 - share) });
    }
    cand.sort((a, b) => b.score - a.score);
    let made = 0;
    for (const { g, v } of cand) {
      if (made === 2) break;
      const rows = d.rows.filter(r => r[g.key] === v.value), counts = new Map();
      for (const r of rows) counts.set(r[d.facet], (counts.get(r[d.facet]) || 0) + 1);
      if (Math.max(...counts.values()) < 2) continue; // a chart of ones says less than the list does
      made++;
      // the leaders: the top value, plus any close behind it (three quarters of it or more), up to three
      const sorted = [...counts].sort((a, b) => b[1] - a[1]), top = sorted.filter((x, i) => i < 3 && x[1] >= sorted[0][1] * 0.75);
      const name = x => d.facetWords[x[0]] || capital(String(x[0]));
      const sum = top.reduce((n, x) => n + x[1], 0), same = top.every(x => x[1] === top[0][1]);
      const who = top.length === 1 ? `${name(top[0])} has ${sum}` : same ? `${list(top.map(name))} have ${top[0][1]} each` : `${list(top.map(name))} have ${sum}`;
      const title = `${v.word}: ${who} of the ${rows.length} ${d.noun}`;
      out.push({ kind: "data", ttl: title, chart: { type: "bar", title: `${capital(d.noun)} by ${d.facet}, ${v.say} only`, labels: sorted.map(name), values: sorted.map(x => x[1]),
        unit: d.noun, focus: top.map((_, i) => i), alt: sorted.map(x => `${name(x)} ${x[1]}`).join("; ") + "." },
        sentence: `${rows.length} of ${total} ${d.noun}: ${v.say}`, body: mode === "preread" ? [`${rows.length} of ${total} ${d.noun} are ${v.say}.`] : [],
        sources: [d.fig.source || d.note].filter(Boolean), link: `${url}#at=${d.id}&${g.key}=${v.value}`, cut: { [g.key]: v.value } });
    }
    for (const s of out) s.notes = `The live view: ${s.link}`;
    if (d.fig.takeaway) out[0].body = mode === "preread" ? [d.fig.takeaway, out[0].sentence && !/^All\b/.test(out[0].sentence) ? stop(out[0].sentence) : ""].filter(Boolean) : [d.fig.takeaway];
    appendixLater.push({ kind: "pointer", title: `Full table: all ${total} ${d.noun}`, body: [`${d.title || "The full table"}, filterable and sortable, is on the page at the link below.`], link: `${url}#${d.id}`, sources: [d.note].filter(Boolean) });
    return out;
  }
}
const list = a => a.length < 3 ? a.join(" and ") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const DENSE = 15; // bars a shared screen can carry on one chart
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const chunk = (a, k) => a.reduce((o, x, i) => (i % k ? o[o.length - 1].push(x) : o.push([x]), o), []);
const shortLabel = s => { const q = s.match(/^[^?]*\?/); return q ? q[0] : clause(s, 7); };
// A presented point: the label before a colon kept, then the first clause that fits.
function short3(s, max) { const m = s.match(/^([^:]{2,24}):\s+(.*)$/); return m ? `${m[1]}: ${clause(m[2], Math.max(4, max - wordsOf(m[1])))}` : clause(s, max); }

// The big-picture diagram again, with the nodes this section is about marked.
const STOP = new Set("the a an and or of to for in on at by with your you our this that each only next does from into most more than turns".split(" "));
const keyWords = s => new Set(String(s).toLowerCase().match(/[a-z][a-z-]{3,}/g)?.filter(w => !STOP.has(w)).map(w => w.replace(/s$/, "")) || []);
function locate(d, sec) {
  const want = keyWords(sec.title);
  const hit = d.nodes.filter(nd => [...keyWords(nd.label)].some(w => want.has(w)));
  if (!hit.length || hit.length === d.nodes.length) return null;
  return { ...d, nodes: d.nodes.map(nd => { const { focus, ...rest } = nd; return hit.includes(nd) ? { ...rest, focus: true } : rest; }), edges: d.edges.map(e => { const { focus, ...rest } = e; return rest; }), recurring: true };
}

// Monitor: what moved since an older copy of the same page, by row name and status word.
function changedSince(oldSrc, newSrc) {
  const rows = s => { const d = find(s, "section", a => cls(a, "dataset"))[0]; return d ? datasetOf(d).rows : []; };
  const was = new Map(rows(oldSrc).map(r => [r._id, r._status]));
  return rows(newSrc).filter(r => was.has(r._id) ? was.get(r._id) !== r._status : true).map(r => ({ id: r._id, was: was.get(r._id) || "new", now: r._status }));
}

// Brand colours for charts and status marks only; the company template owns the rest,
// fonts included. Slides are light, so the light values are used. With the sibling
// html-house-style skill present, its brand.mjs resolves the file first, so the colours
// are the contrast-checked ones a branded page uses; alone, the file is read as given.
const HEX = /^#[0-9a-f]{6}$/i;
export function brandColours(b, resolved) {
  if (resolved) { const l = resolved.light;
    return { name: resolved.name, checked: true, chartColors: resolved.deck?.chartColors?.light || [1, 2, 3, 4, 5, 6].map(i => l["cat-" + i]),
      focus: l.accent, base: l.fg3, status: { ok: l.ok, warn: l.warn, danger: l.danger, idle: l.fg3, info: resolved.info?.light?.fg } }; }
  const c = b.colors || {}, s = c.status || {}, pick = v => (HEX.test(v || "") ? v.toUpperCase() : undefined);
  const chart = (b.deck?.chartColors || [c.accent, ...(c.categories || [])]).map(pick).filter(Boolean);
  return { name: b.name || "", checked: false, chartColors: chart, focus: pick(c.accent), base: pick(c.muted) || pick(c.border),
    status: { ok: pick(s.good), warn: pick(s.warn), danger: pick(s.bad), idle: pick(c.muted), info: pick(s.info) } };
}
export async function loadBrand(path) {
  const { readFileSync } = await import("node:fs");
  const raw = JSON.parse(readFileSync(path, "utf8"));
  try { const kit = await import(new URL("../../html-house-style/tools/brand.mjs", import.meta.url).href);
    return { raw, resolved: kit.toJson(kit.resolve(kit.loadBrand(path))) }; }
  catch (e) { if (/brand\.mjs:/.test(e.message)) throw e; return { raw, resolved: null }; }
}

// ---------- CLI ----------
const HELP = `usage: node tools/outline.mjs page.html --mode presented|preread [options] > outline.json
  Reads a finished html-house-style page and prints a deck outline (schema in DECKS.md 6).
    --mode M        presented (someone talks; sparse slides, prose in the notes) or
                    preread (read alone; evidence on the slide). Default presented.
    --url U         the page's published address; data slides link to U#<view>
    --brand F       brand.json: chart and status colours go into meta.brand
    --since F       Monitor: an older copy of the page; the status slide lists what moved
    --force         outline a Look up or Do page anyway (a training walk-through)
  Then: node tools/check-outline.mjs outline.json`;

const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const { readFileSync } = await import("node:fs");
  const args = process.argv.slice(2), opts = {}; let file;
  for (let i = 0; i < args.length; i++) if (["--help", "-h", "--force"].includes(args[i])) opts[args[i].replace(/^-+/, "")] = true; else if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i]; else file = args[i];
  if (opts.help || opts.h) { console.log(HELP); process.exit(0); }
  if (!file) { console.error(HELP); process.exit(2); }
  try {
    const o = outline(readFileSync(file, "utf8"), { mode: opts.mode, sourceUrl: opts.url, sourceName: file.split(/[\\/]/).pop(), force: opts.force,
      brand: opts.brand ? await loadBrand(opts.brand) : null, since: opts.since ? readFileSync(opts.since, "utf8") : null });
    for (const w of o.warnings) console.error(w);
    const { warnings, ...json } = o;
    console.log(JSON.stringify(json, null, 2));
  } catch (e) { console.error(e.message); process.exit(2); }
}
