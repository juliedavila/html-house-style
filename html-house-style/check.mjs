#!/usr/bin/env node
// check.mjs: static checks for a page built with the html-house-style kit.
// No dependencies and no browser. It reads one HTML file and prints
// PASS, FAIL, WARN and INFO lines with line numbers. Exit code 1 on any FAIL.
//
//   node check.mjs page.html        (Node 18+)
//   bun check.mjs page.html
//   deno run --allow-read check.mjs page.html
//
// It uses regular expressions, not a DOM, so it is a strong hint and not a
// proof. Every rule here can also be done by hand; see CHECKLIST.md.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";

const file = process.argv[2];
if (!file) { console.log("usage: node check.mjs page.html"); process.exit(2); }
const src = readFileSync(file, "utf8");

// ---------- helpers ----------
const out = [];
const lineOf = i => src.slice(0, i).split("\n").length;
const add = (lvl, id, msg, i) => out.push({ lvl, id, msg: (i >= 0 ? `line ${lineOf(i)}: ` : "") + msg });
const fail = (id, msg, i = -1) => add("FAIL", id, msg, i);
const warn = (id, msg, i = -1) => add("WARN", id, msg, i);
const info = (id, msg, i = -1) => add("INFO", id, msg, i);
const blank = (s, re) => s.replace(re, m => m.replace(/[^\n]/g, " ")); // keeps offsets and lines
const attrs = tag => { const a = {}; for (const m of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) a[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5]; return a; };
const decode = s => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&times;/g, "x");
const text = s => decode(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const hasClass = (tag, c) => new RegExp(`class\\s*=\\s*["'][^"']*\\b${c}\\b`).test(tag);
const num = v => (v === undefined || v === "" ? NaN : parseFloat(v));

// Source with scripts, styles and comments blanked: what the reader sees, as markup.
const noScript = blank(src, /<script\b[\s\S]*?<\/script>/gi);
const noCode = blank(noScript, /<style\b[\s\S]*?<\/style>/gi);

// ---------- 1. comments and Mermaid leaks ----------
{
  let i = 0, bad = 0, mermaid = 0, stripped = noCode;
  while ((i = noCode.indexOf("<!--", i)) >= 0) {
    const end = noCode.indexOf("-->", i + 4);
    if (end < 0) { fail("comments", "an HTML comment is never closed; the rest of the page is hidden", i); bad++; break; }
    const body = noCode.slice(i + 4, end);
    if (/\b(graph (TD|LR|TB|RL)|flowchart|sequenceDiagram|stateDiagram|classDiagram)\b/.test(body)) { warn("comments", "Mermaid source in an HTML comment; move it to <script type=\"text/plain\" class=\"diagram-source\">", i); mermaid++; }
    stripped = stripped.slice(0, i) + " ".repeat(end + 3 - i) + stripped.slice(end + 3);
    i = end + 3;
  }
  for (const m of stripped.matchAll(/-->|--&gt;/g)) { fail("comments", "stray \"-->\" in page text: a comment ended early (Mermaid arrows close HTML comments) and its source is visible", m.index); bad++; }
  if (!bad && !mermaid) add("PASS", "comments", "comments balanced; no source text leaking into the page");
}

// ---------- 2. CSS: inlined base, page CSS, sizes ----------
const styles = [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => ({ css: m[1], at: m.index + m[0].indexOf(">") + 1 }));
let allCss = styles.map(s => s.css).join("\n");
const pageCss = []; // [{css, at}] with the inlined base.css removed
for (const s of styles) {
  const a = s.css.indexOf("House style: base stylesheet"), b = s.css.indexOf("/* end of base.css */");
  if (a >= 0 && b > a) { const start = s.css.lastIndexOf("/*", a); pageCss.push({ css: s.css.slice(0, start), at: s.at }, { css: s.css.slice(b), at: s.at + b }); }
  else if (a >= 0) { pageCss.push({ css: "", at: s.at }); warn("base-css", "inlined base.css has no end marker; page CSS after it is not checked for colours", s.at); }
  else pageCss.push(s);
}
const inlined = styles.some(s => s.css.includes("House style: base stylesheet"));
const link = src.match(/<link\b[^>]*rel\s*=\s*["']?stylesheet[^>]*>/i);
if (inlined) add("PASS", "base-css", "base.css is inlined");
else if (link && /href\s*=\s*["']?[^"'\s>]*base\.css/.test(link[0])) {
  warn("base-css", "base.css is linked, not inlined (fine for template.html; inline it in a page you hand over)", link.index);
  const p = join(dirname(file), attrs(link[0]).href); if (existsSync(p)) allCss += "\n" + readFileSync(p, "utf8");
} else fail("base-css", "base.css is not inlined");

const fontSize = {}; // svg class -> px in viewBox units
for (const m of allCss.matchAll(/svg\s+\.([\w-]+)\s*\{([^}]*)\}/g)) {
  const f = m[2].match(/font\s*:[^;]*?([\d.]+)px/) || m[2].match(/font-size\s*:\s*([\d.]+)px/);
  if (f) fontSize[m[1]] = parseFloat(f[1]);
}
const svgRule = (allCss.match(/\.figure-frame\s*>\s*svg\s*\{([^}]*)\}/) || [, ""])[1];
const minDefault = num((svgRule.match(/min-width\s*:\s*var\(--fig-min,\s*([\d.]+)px\)/) || [])[1]) || 0;
const growMatch = allCss.match(/calc\(var\(--fig-min,\s*([\d.]+)px\)\s*\*\s*([\d.]+)\)/);
const growFactor = growMatch ? parseFloat(growMatch[2]) : Infinity, growDefault = growMatch ? parseFloat(growMatch[1]) : 0;
const hasRail = /<nav\b[^>]*class\s*=\s*["'][^"']*\btoc\b/.test(src);
const COLS = [324, 622, hasRail ? 798 : 1082]; // phone 390, tablet 720, desktop content column inside a figure frame

// ---------- 3. figures and SVG geometry ----------
const ids = new Map();
for (const m of noScript.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) { if (ids.has(m[1])) fail("ids", `duplicate id "${m[1]}"`, m.index); else ids.set(m[1], m.index); }
if (!out.some(o => o.id === "ids")) add("PASS", "ids", `${ids.size} ids, all unique`);

const figures = [...noCode.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi)];
for (const f of figures) {
  const fig = f[0], at = f.index;
  if (hasClass(fig.match(/<figure\b[^>]*>/)[0], "code")) continue; // code listings
  if (!/class\s*=\s*["'][^"']*\bfigure-frame\b/.test(fig)) fail("figure", "figure without .figure-frame", at);
  if (!/class\s*=\s*["'][^"']*\bzoom-btn\b/.test(fig)) fail("figure", "figure without an Enlarge .zoom-btn", at);
  const cap = fig.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
  if (!cap) fail("figure", "figure without figcaption", at);
  else if (!/^\s*(<span\b[^>]*fig-id[^>]*>[\s\S]*?<\/span>\s*)?<strong\b/.test(cap[1])) fail("figure", "caption does not open with a <strong> takeaway sentence (after the optional .fig-id)", at + cap.index);
}
for (const m of noCode.matchAll(/<img\b[^>]*>/gi)) if (!/\salt\s*=/.test(m[0])) fail("figure", "img without alt", m.index);

const svgs = [...noScript.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi)];
let labelIssues = 0;
for (const s of svgs) {
  const svg = s[0], at = s.index, open = svg.match(/<svg\b[^>]*>/)[0], a = attrs(open);
  const before = noCode.slice(0, at), inFrame = before.lastIndexOf("figure-frame") > before.lastIndexOf("</figure>") && /figure-frame/.test(before);
  const vb = (a.viewbox || "").trim().split(/[\s,]+/).map(Number);
  const texts = [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi)];
  if (!inFrame && !texts.length) continue; // an icon
  const where = `svg at line ${lineOf(at)}`;
  if (vb.length !== 4 || vb.some(isNaN)) { fail("svg", `${where} has no viewBox`, at); continue; }
  const [vx, vy, W, H] = vb;
  if (inFrame) {
    if (a.role !== "img") fail("svg", `${where}: add role="img"`, at);
    if (!/<title\b/.test(svg) || !/<desc\b/.test(svg)) fail("svg", `${where}: needs <title> and <desc>`, at);
    const lb = (a["aria-labelledby"] || "").split(/\s+/).filter(Boolean);
    if (!lb.length) fail("svg", `${where}: aria-labelledby should point at its title and desc ids`, at);
    for (const id of lb) if (!ids.has(id)) fail("svg", `${where}: aria-labelledby names missing id "${id}"`, at);
  } else warn("svg", `${where} has labels but is not inside figure > .figure-frame`, at);

  const figMin = num(((a.style || "").match(/--fig-min\s*:\s*([\d.]+)px/) || [])[1]);
  const smallOk = /\bsmall-ok\b/.test(a.class || "");
  if (inFrame && isNaN(figMin)) fail("label-size", `${where}: set style="--fig-min: ${W}px" (its viewBox width) so it never draws below 1:1`, at);
  else if (figMin < W) fail("label-size", `${where}: --fig-min ${figMin}px is below the viewBox width ${W}; labels shrink`, at);
  const minW = isNaN(figMin) ? minDefault : figMin;
  const maxW = smallOk ? (isNaN(figMin) ? 400 : figMin) : (isFinite(growFactor) ? (isNaN(figMin) ? growDefault : figMin) * growFactor : Infinity);
  const scales = COLS.map(c => Math.max(Math.min(c, maxW), minW) / W);
  const sizeOf = t => { const ta = attrs(`<x ${t}>`); const own = num(ta["font-size"]) || num(((ta.style || "").match(/font-size\s*:\s*([\d.]+)/) || [])[1]);
    if (!isNaN(own)) return own; for (const c of (ta.class || "").split(/\s+/)) if (fontSize[c]) return fontSize[c]; return 16; };
  const labels = texts.map(t => { const ta = attrs(`<x ${t[1]}>`), str = text(t[2]), size = sizeOf(t[1]);
    const cls = ta.class || "", upper = str === str.toUpperCase() && /[A-Z]/.test(str), bold = /c-value|d-mark|weight/.test(cls) || upper;
    const w = str.length * size * (bold ? 0.6 : 0.55) * 1.1, x = num(ta.x), y = num(ta.y), anchor = ta["text-anchor"] || "start";
    const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
    return { str, size, x, y, x0, x1: x0 + w, y0: y - size, y1: y + size * 0.25, i: at + t.index, cls }; });
  const smallest = Math.min(...labels.map(l => l.size));
  if (labels.length) {
    const px = scales.map(k => (smallest * k).toFixed(1));
    info("label-size", `${where}: viewBox ${W} wide, --fig-min ${isNaN(figMin) ? "unset" : figMin}; scale ${scales.map(k => k.toFixed(2)).join(" / ")} at columns ${COLS.join(" / ")}px; smallest label ${smallest} units shows at ${px.join(" / ")}px`, at);
    if (smallest * Math.min(...scales) < 12 - 1e-9) { fail("label-size", `${where}: smallest label shows at ${(smallest * Math.min(...scales)).toFixed(1)}px; the floor is 12px`, at); labelIssues++; }
    if (Math.max(...scales) > 1.25 + 1e-9) warn("label-size", `${where}: drawn at ${Math.max(...scales).toFixed(2)}x on a wide screen; a small chart looks blown up (use --fig-min with base.css v1.1, or .small-ok)`, at);
    if (smallOk && W > 324) warn("label-size", `${where}: small chart ${W} wide pans on a 390px phone; draw it at 320 wide or less`, at);
  }
  if (/\btransform\s*=/.test(svg)) { warn("label-fit", `${where} uses transform; fit and overlap checks skipped for it`, at); continue; }
  const rects = [...svg.matchAll(/<rect\b[^>]*>/gi)].map(r => { const ra = attrs(r[0]); return { x: num(ra.x) || 0, y: num(ra.y) || 0, w: num(ra.width), h: num(ra.height), cls: ra.class || "" }; }).filter(r => r.w > 0 && r.h > 0);
  const segs = [];
  for (const p of svg.matchAll(/<path\b[^>]*>/gi)) { const pa = attrs(p[0]); if (/c-grid|d-zone/.test(pa.class || "") || !pa.d) continue;
    let cx = 0, cy = 0, sx = 0, sy = 0; const tok = pa.d.match(/[MLHVZmlhvz]|-?[\d.]+(?:e-?\d+)?/g) || []; let cmd = "";
    for (let k = 0; k < tok.length;) { if (/[A-Za-z]/.test(tok[k])) { cmd = tok[k++]; if (/z/i.test(cmd)) { segs.push([cx, cy, sx, sy]); cx = sx; cy = sy; } continue; }
      const n = () => parseFloat(tok[k++]); const rel = cmd === cmd.toLowerCase(); let nx = cx, ny = cy;
      if (/m/i.test(cmd)) { nx = n() + (rel ? cx : 0); ny = n() + (rel ? cy : 0); cx = sx = nx; cy = sy = ny; cmd = rel ? "l" : "L"; continue; }
      if (/l/i.test(cmd)) { nx = n() + (rel ? cx : 0); ny = n() + (rel ? cy : 0); } else if (/h/i.test(cmd)) nx = n() + (rel ? cx : 0); else if (/v/i.test(cmd)) ny = n() + (rel ? cy : 0); else { k++; continue; }
      segs.push([cx, cy, nx, ny]); cx = nx; cy = ny; } }
  for (const l of svg.matchAll(/<line\b[^>]*>/gi)) { const la = attrs(l[0]); if (!/c-grid/.test(la.class || "")) segs.push([num(la.x1), num(la.y1), num(la.x2), num(la.y2)]); }
  labels.forEach((l, n) => {
    if (isNaN(l.x) || isNaN(l.y)) return;
    if (l.x0 < vx || l.x1 > vx + W || l.y0 < vy || l.y1 > vy + H) { fail("label-fit", `"${l.str}" runs past the viewBox (estimated ${Math.round(l.x0)} to ${Math.round(l.x1)} of ${vx} to ${vx + W})`, l.i); labelIssues++; }
    const box = rects.filter(r => !/c-bar|c-cat/.test(r.cls) && l.x >= r.x && l.x <= r.x + r.w && l.y >= r.y && l.y <= r.y + r.h).sort((p, q) => p.w * p.h - q.w * q.h)[0];
    if (box && !/d-zone/.test(box.cls) && (l.x0 < box.x + 4 || l.x1 > box.x + box.w - 4)) { fail("label-fit", `"${l.str}" is about ${Math.round(l.x1 - l.x0)} units wide and does not fit its ${box.w}-wide box with 4 units padding`, l.i); labelIssues++; }
    for (const o of labels.slice(n + 1)) if (l.x0 < o.x1 && o.x0 < l.x1 && l.y0 < o.y1 && o.y0 < l.y1) { fail("label-fit", `"${l.str}" overlaps "${o.str}"`, l.i); labelIssues++; }
    for (const [x1, y1, x2, y2] of segs) {
      const hit = y1 === y2 ? y1 >= l.y0 && y1 <= l.y + 2 && Math.min(x1, x2) < l.x1 && Math.max(x1, x2) > l.x0
        : x1 === x2 ? x1 >= l.x0 && x1 <= l.x1 && Math.min(y1, y2) < l.y + 2 && Math.max(y1, y2) > l.y0 : false;
      if (hit) { fail("label-fit", `"${l.str}" sits on a ${y1 === y2 ? "horizontal" : "vertical"} line at ${y1 === y2 ? "y=" + y1 : "x=" + x1}`, l.i); labelIssues++; break; }
    }
  });
}
if (!svgs.length) info("label-size", "no SVG figures");
else if (!labelIssues) add("PASS", "label-size", "every SVG label is 12px or more at 324, 622 and the desktop column, inside its box and clear of lines and other labels (estimated widths)");
if (!out.some(o => o.id === "figure" || o.id === "svg")) add("PASS", "figure", `${figures.length} figures: frame, Enlarge button, caption with a takeaway; SVGs have viewBox, role, title and desc`);

// ---------- 4. colour and 5. dark and print safety (page CSS only) ----------
const cssRules = (css, base) => { // flat list of {sel, body, media:[...], at}
  const res = [], stack = []; let i = 0, start = 0;
  css = css.replace(/\/\*[\s\S]*?\*\//g, m => " ".repeat(m.length));
  while (i < css.length) { const ch = css[i];
    if (ch === "{") { const pre = css.slice(start, i).trim(); if (pre.startsWith("@")) { stack.push(pre); start = i + 1; }
      else { const end = css.indexOf("}", i); res.push({ sel: pre, body: css.slice(i + 1, end), media: [...stack], at: base + start }); i = end; start = end + 1; } }
    else if (ch === "}") { stack.pop(); start = i + 1; }
    i++; }
  return res; };
let colourIssues = 0;
for (const pc of pageCss) for (const r of cssRules(pc.css, pc.at)) {
  const screen = r.media.some(m => /\bscreen\b/.test(m));
  for (const m of r.body.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch|lab)\(/g)) { fail("colour", `hard-coded colour "${m[0]}" in page CSS (${r.sel}); use a token`, r.at); colourIssues++; }
  if (/\[data-theme=["']?dark/.test(r.sel) && !screen) fail("dark-print", `dark rule "${r.sel}" is not inside @media screen; it will print dark`, r.at);
  if (r.media.some(m => /prefers-color-scheme:\s*dark/.test(m)) && !screen) fail("dark-print", `prefers-color-scheme: dark block without "screen"; it will print dark`, r.at);
  if (/position\s*:\s*fixed/.test(r.body) && !screen) warn("dark-print", `position: fixed in "${r.sel}" outside @media screen can overlap printed text`, r.at);
  if (/white-space\s*:\s*nowrap/.test(r.body)) warn("overflow", `white-space: nowrap in "${r.sel}"; check it on a 390px phone`, r.at);
  if (!/figure-frame|table-wrap|\bpre\b|dialog/.test(r.sel)) for (const m of r.body.matchAll(/(?:^|[;\s])(min-width|width|flex-basis|left|margin-left|grid-template-columns)\s*:\s*([^;]+)/g))
    for (const v of m[2].matchAll(/(\d+(?:\.\d+)?)px/g)) if (+v[1] > 358 && !/max-width/.test(m[0])) fail("overflow", `${m[1]}: ${v[1]}px in "${r.sel}" is wider than a 390px phone column (358px)`, r.at);
}
for (const m of noScript.matchAll(/<([\w-]+)\b[^>]*\sstyle\s*=\s*["']([^"']*)["'][^>]*>/g)) {
  if (/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/.test(m[2])) { fail("colour", `hard-coded colour in a style attribute on <${m[1]}>`, m.index); colourIssues++; }
  for (const v of m[2].matchAll(/(?:^|;)\s*(min-width|width|flex-basis)\s*:\s*(\d+)px/g)) if (+v[2] > 358 && !/^(svg|img)$/i.test(m[1])) fail("overflow", `style="${v[1]}: ${v[2]}px" on <${m[1]}> is wider than a phone column`, m.index);
}
for (const m of noScript.matchAll(/\s(fill|stroke|stop-color|color)\s*=\s*["']([^"']*)["']/g))
  if (!/^(none|currentColor|transparent|context-stroke|context-fill|inherit|var\(--[\w-]+\)|url\(#[\w-]+\))$/i.test(m[2].trim())) { fail("colour", `${m[1]}="${m[2]}" in markup; use a .d-* or .c-* class`, m.index); colourIssues++; }
if (!colourIssues) add("PASS", "colour", "no hard-coded colours in page CSS, style attributes or SVG attributes");
if (!out.some(o => o.id === "dark-print")) add("PASS", "dark-print", "page CSS keeps dark rules under @media screen");

// ---------- 6. tables and long strings ----------
let tableIssues = 0;
for (const m of noCode.matchAll(/<table\b/gi)) {
  const w = noCode.lastIndexOf("table-wrap", m.index);
  if (w < 0 || noCode.slice(w, m.index).includes("</table>")) { fail("overflow", "table not inside .table-wrap; it will push the page sideways on a phone", m.index); tableIssues++; }
  const t = noCode.slice(m.index, noCode.indexOf("</table>", m.index)), cap = t.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i);
  const cols = ((t.match(/<tr\b[\s\S]*?<\/tr>/i) || [""])[0].match(/<t[hd]\b/gi) || []).length;
  if (cap && cols >= 3 && text(cap[1]).length > 40) { warn("overflow", `caption is ${text(cap[1]).length} characters on a ${cols}-column table; on a phone it scrolls away. Put the source in .table-note after the wrapper`, m.index); tableIssues++; }
}
const visible = blank(blank(noCode, /<!--[\s\S]*?-->/g), /<(pre|code)\b[\s\S]*?<\/\1>/gi);
for (const m of visible.replace(/<[^>]*>/g, t => " ".repeat(t.length)).matchAll(/\S{31,}/g)) warn("overflow", `long unbroken string "${m[0].slice(0, 40)}..." may push a phone sideways; wrap it in <code> or shorten it`, m.index);
if (!tableIssues && !out.some(o => o.id === "overflow")) add("PASS", "overflow", "tables wrapped; no fixed widths over 358px outside scroll frames; no long unbroken strings");

// ---------- 7. document structure ----------
const h2s = [...noCode.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi)].map(m => ({ a: attrs(`<h2 ${m[1]}>`), t: text(m[2]), i: m.index }));
const bodyText = text(blank(noCode, /<(nav|dialog)\b[\s\S]*?<\/\1>/gi).replace(/^[\s\S]*?<body\b[^>]*>/i, ""));
const words = bodyText.split(/\s+/).filter(Boolean).length;
let annexSeen = false, structIssues = 0;
for (const h of h2s) {
  const annex = /\bannex\b/.test(h.a.class || "");
  if (!h.a.id) { fail("structure", `h2 "${h.t}" has no id`, h.i); structIssues++; }
  if (annex) annexSeen = true;
  else if (annexSeen) { fail("structure", `argument heading "${h.t}" comes after an annex heading; annexes go last`, h.i); structIssues++; }
  else if (h.t.split(/\s+/).length <= 3) { warn("writing", `h2 "${h.t}" looks like a topic label; state a claim, or mark a navigation section class="annex"`, h.i); }
  if (/\?\s*$/.test(h.t)) warn("writing", `h2 "${h.t}" is a question; state the answer`, h.i);
}
const toc = noCode.match(/<nav\b[^>]*class\s*=\s*["'][^"']*\btoc\b[\s\S]*?<\/nav>/i);
const needRail = h2s.length >= 4 || words >= 1200;
if (needRail && !toc) { fail("structure", `${h2s.length} h2s and about ${words} words: add the contents rail`); structIssues++; }
if (toc) {
  const links = [...toc[0].matchAll(/href\s*=\s*["']#([^"']+)["']/g)].map(m => m[1]);
  if (!links.length) { fail("structure", "contents rail is empty in the HTML; write the list into the page so it works without script", toc.index); structIssues++; }
  for (const h of h2s) if (h.a.id && !links.includes(h.a.id)) { fail("structure", `contents rail has no link to #${h.a.id}`, toc.index); structIssues++; }
  for (const l of links) if (!ids.has(l)) { fail("structure", `contents rail links to missing #${l}`, toc.index); structIssues++; }
  if (!needRail) warn("structure", `only ${h2s.length} h2s and about ${words} words; the rail is optional here`, toc.index);
}
const blufs = [...noCode.matchAll(/class\s*=\s*["'][^"']*\bbluf\b/g)];
if (blufs.length > 1) { fail("structure", `${blufs.length} .bluf blocks; use one`, blufs[1].index); structIssues++; }
if (!blufs.length && !/class\s*=\s*["'][^"']*\bpurpose\b/.test(noCode)) warn("structure", "no .bluf and no .purpose sentence; a page that argues opens with .bluf, a reference or tool page with one sentence of purpose");
if (blufs.length && toc && blufs[0].index > toc.index) warn("structure", "the .bluf comes after the contents rail; on a phone the reader scrolls past the rail to reach it", blufs[0].index);
let prev = 1; for (const m of noCode.matchAll(/<h([1-6])\b/gi)) { const lv = +m[1]; if (lv > prev + 1) warn("structure", `heading jumps from h${prev} to h${lv}`, m.index); prev = lv; }
if (!structIssues) add("PASS", "structure", `${h2s.length} h2s with unique ids${toc ? ", rail lists them all" : ""}; ${blufs.length} .bluf; about ${words} words`);

// ---------- 8. self-contained ----------
let ext = 0;
for (const [re, what] of [[/<script\b[^>]*\ssrc\s*=/gi, "external script"], [/@import\b/g, "@import"], [/url\(\s*["']?https?:/gi, "remote url()"],
  [/<(img|iframe|video|audio|source|embed|object)\b[^>]*\s(src|data)\s*=\s*["']?https?:/gi, "remote media"], [/<link\b[^>]*href\s*=\s*["']?https?:/gi, "remote link"]])
  for (const m of src.matchAll(re)) { fail("self-contained", `${what}: the page must open with the network off`, m.index); ext++; }
for (const m of src.matchAll(/@font-face/g)) { warn("self-contained", "@font-face: only local() sources are allowed", m.index); ext++; }
for (const m of noCode.matchAll(/\bfetch\(|XMLHttpRequest/g)) warn("self-contained", "network call in markup", m.index);
const kb = new TextEncoder().encode(src).length / 1024;
if (kb > 2048) warn("self-contained", `page is ${(kb / 1024).toFixed(1)}MB; keep it under 2MB`);
if (!ext) add("PASS", "self-contained", `no external scripts, styles, fonts or media; ${Math.round(kb)}KB`);

// ---------- 9. scripts ----------
for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const t = attrs(`<s ${m[1]}>`).type; if (t && !/javascript/.test(t)) continue;
  try { new Function(m[2]); } catch (e) { fail("script", `inline script does not parse: ${e.message}`, m.index); }
  if (/localStorage/.test(m[2]) && !/\btry\b/.test(m[2])) warn("script", "localStorage used without try/catch", m.index);
  for (const g of m[2].matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)) if (!ids.has(g[1])) warn("script", `script looks up #${g[1]}, which is not in the page`, m.index);
}
for (const m of noCode.matchAll(/<[^>]*role\s*=\s*["']tab["'][^>]*>/g)) { const c = attrs(m[0])["aria-controls"]; if (!c || !ids.has(c)) fail("script", "tab without aria-controls pointing at its panel", m.index); }
for (const m of noCode.matchAll(/<[^>]*role\s*=\s*["']tabpanel["'][^>]*>/g)) if (/\shidden\b/.test(m[0])) warn("script", "tab panel authored hidden; without script it is unreachable. Let the script hide it", m.index);
if (/zoom-btn|data-toggle-theme/.test(noCode) && !/<html\b[^>]*class\s*=\s*["'][^"']*\bno-js\b/.test(src)) warn("script", "add class=\"no-js\" to <html> so script-only controls hide when script is off");
if (!out.some(o => o.id === "script")) add("PASS", "script", "inline scripts parse; storage guarded; tabs wired");

// ---------- 10. writing ----------
let wr = 0;
for (const m of src.matchAll(/\u2014|\u2013|&mdash;|&ndash;|&#821[12];/g)) { fail("writing", "em or en dash; use a comma, colon, parentheses or a new sentence", m.index); wr++; }
const vis = visible.replace(/<abbr\b[^>]*title[^>]*>[\s\S]*?<\/abbr>/gi, m => " ".repeat(m.length)).replace(/<[^>]*>/g, t => " ".repeat(t.length));
const defined = new Map(); for (const m of vis.matchAll(/\(([A-Z]{2,5})s?\)/g)) if (!defined.has(m[1])) defined.set(m[1], m.index);
const okAcr = new Set(["HTML", "CSS", "SVG", "PDF", "URL", "JS", "OK", "ID", "UTC", "AM", "PM", "TB", "GB", "MB", "KB", "PNG", "JPEG", "UI", "USD", "FIG"]);
const seen = new Set();
for (const m of vis.matchAll(/\b([A-Z]{2,5})s?\b/g)) { const a = m[1]; if (seen.has(a) || okAcr.has(a)) continue; seen.add(a);
  if (!defined.has(a) || defined.get(a) > m.index + a.length + 2) { warn("writing", `acronym "${a}" is not spelled out on first use, as in "continuous integration (CI)"`, m.index); wr++; } }
const norm = s => text(s).toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/(es|s)$/, "").trim();
const terms = [...noCode.matchAll(/<(\w+)\b[^>]*class\s*=\s*["'][^"']*\bterm\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => ({ n: norm(m[2]), t: text(m[2]), i: m.index }));
const gl = noCode.match(/<dl\b[^>]*class\s*=\s*["'][^"']*\bglossary\b[\s\S]*?<\/dl>/i);
const dts = gl ? [...gl[0].matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/gi)].map(m => ({ n: norm(m[1]), t: text(m[1]) })) : [];
for (const t of terms) if (!dts.some(d => d.n === t.n)) { fail("glossary", `.term "${t.t}" is missing from dl.glossary`, t.i); wr++; }
for (const d of dts) if (!terms.some(t => t.n === d.n)) { fail("glossary", `glossary entry "${d.t}" is never marked as a .term in the text`, gl.index); wr++; }
for (const m of noCode.matchAll(/<[^>]*class\s*=\s*["'][^"']*\bterm\b[^>]*>/g)) { const ta = attrs(m[0]); if (!ta["data-def"]) fail("glossary", ".term without data-def", m.index); if (ta.tabindex !== "0") warn("glossary", ".term without tabindex=\"0\" cannot be reached by keyboard or tap", m.index); }
if (!wr) add("PASS", "writing", `no em or en dashes; acronyms spelled out; ${terms.length} terms all in the glossary`);

// ---------- report ----------
const order = ["comments", "base-css", "ids", "figure", "svg", "label-size", "label-fit", "colour", "dark-print", "overflow", "structure", "self-contained", "script", "writing", "glossary"];
out.sort((p, q) => order.indexOf(p.id) - order.indexOf(q.id));
for (const o of out) console.log(`${o.lvl.padEnd(4)}  ${o.id.padEnd(14)} ${o.msg}`);
const n = l => out.filter(o => o.lvl === l).length;
console.log(`\n${file}: ${n("FAIL")} FAIL, ${n("WARN")} WARN. Not checked here: fonts on the reader's machine, curved or diagonal label collisions, print page breaks, the zoom dialog, how it looks.`);
process.exit(n("FAIL") ? 1 : 0);
