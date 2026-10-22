#!/usr/bin/env node
// selftest.mjs: runs the deck tools on the kit's example pages and on small made-up
// inputs, and fails loudly when a rule stops holding. No dependencies; node 18+, bun or
// deno (deno run --allow-read selftest.mjs).
import { readFileSync, existsSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import process from "node:process";
import { outline } from "./outline.mjs";
import { checkOutline } from "./check-outline.mjs";
import { checkPptx } from "./check-pptx.mjs";

const kit = new URL("../../html-house-style/", import.meta.url);
let bad = 0;
const ok = (cond, what) => { console.log(`${cond ? "ok  " : "FAIL"}  ${what}`); if (!cond) bad++; };
const fails = o => checkOutline(o).filter(x => x.lvl === "FAIL");

// 1. Every example page, both modes: 0 FAIL; Look up and Do give one pointer slide and a warning.
if (!existsSync(new URL("examples/decide.html", kit))) { console.log("html-house-style/ is not beside deck-architecture/; skipping the example pages"); }
else for (const p of ["decide", "review", "report-with-dataset", "understand", "monitor", "look-up", "do"]) for (const mode of ["presented", "preread"]) {
  const o = outline(readFileSync(new URL(`examples/${p}.html`, kit), "utf8"), { mode, sourceUrl: `https://example.org/${p}.html` });
  const f = fails(o);
  ok(!f.length, `${p} ${mode}: ${o.slides.length} slides, 0 FAIL${f.length ? " (" + f.map(x => x.msg).join("; ") + ")" : ""}`);
  if (["look-up", "do"].includes(p)) ok(o.slides.length === 1 && o.slides[0].kind === "pointer" && o.warnings.length === 1, `${p} ${mode}: one pointer slide and a warning`);
  if (p === "report-with-dataset") ok(o.slides.filter(s => s.kind === "data").every(s => s.link && s.chart) && o.slides.some(s => /#at=dataset&status=expired$/.test(s.link || "")), `${p} ${mode}: data slides link to their filtered view`);
}

// 2. A dense bar chart splits: ten bars on the slide, every bar in the appendix.
const bars = Array.from({ length: 20 }, (_, i) => `<text class="c-label" x="80" y="${i * 32 + 27}" text-anchor="end">Team ${i + 1}</text>
<rect class="c-bar" x="89" y="${i * 32 + 12}" width="${200 - i * 5}" height="20"/><text class="c-value" x="${300 - i * 5}" y="${i * 32 + 27}">${40 - i}</text>`).join("\n");
const dense = `<html><body class="doc" data-pattern="review"><div class="page"><header class="masthead"><h1>Twenty teams own the backlog</h1><div class="meta"><span>1 Oct 2026</span></div></header><main>
<section class="bluf"><p>Fix the backlog in the five largest teams first.</p></section>
<h2 id="teams">The backlog sits with a few large teams</h2><figure><div class="figure-frame"><svg viewBox="0 0 640 660">${bars}</svg></div>
<figcaption><strong>Team 1 has the most open items.</strong> Backlog export, 1 Oct 2026.</figcaption></figure></main></div></body></html>`;
const d = outline(dense, { mode: "presented", sourceUrl: "https://example.org/dense.html" });
const main = d.slides.find(s => s.kind === "chart" && !s.appendix), detail = d.slides.find(s => s.kind === "chart" && s.appendix);
ok(main?.chart.values.length === 10 && detail?.chart.values.length === 20 && !fails(d).length, "a 20-bar chart: 10 bars on the slide, all 20 in the appendix, 0 FAIL");

// 3. check-outline catches what it should.
const broken = { meta: { schema: "deck-outline/1", title: "T", pattern: "decide", mode: "presented" }, slides: [
  { kind: "title", title: "T", body: [], notes: "mode: presented.", sources: [] },
  { kind: "section", title: "Background", body: ["Costs rose 40% last year."], notes: "", sources: [] },
  { kind: "chart", title: "Costs rose in every region", body: [], notes: "x", sources: ["Ledger, 2026"], chart: { type: "bar", labels: ["a", "b"], values: [1] } },
  { kind: "data", title: "Two regions carry most of the cost", body: [], notes: "x", sources: ["Ledger, 2026"] },
  { kind: "section", title: "Seven points is too many for one slide", body: ["a", "b", "c", "d", "e", "f", "g"], notes: "x", sources: [] }] };
const got = checkOutline(broken), has = (lvl, re) => got.some(x => x.lvl === lvl && re.test(x.msg));
ok(has("FAIL", /no source/) && has("FAIL", /equal length/) && has("FAIL", /link to the live view/) && has("FAIL", /7 points/) && has("FAIL", /summary slide/) && has("WARN", /topic label/),
  "check-outline: no source, uneven chart, unlinked data slide, 7 points, missing summary, topic title");

// 4. check-pptx on two small decks built here: one breaks the rules, one keeps them.
function zip(files) { // stored, one deflated entry, enough for the reader to prove itself
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const locals = [], centrals = []; let off = 0;
  Object.entries(files).forEach(([name, text], i) => {
    const raw = Buffer.from(text), method = i === 0 ? 8 : 0, data = method ? deflateRawSync(raw) : raw, n = Buffer.from(name);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(method, 8); h.writeUInt32LE(crc(raw), 14);
    h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(method, 10); c.writeUInt32LE(crc(raw), 16);
    c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(off, 42);
    locals.push(h, n, data); centrals.push(c, n); off += 30 + n.length + data.length;
  });
  const cd = Buffer.concat(centrals), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(centrals.length / 2, 8); e.writeUInt16LE(centrals.length / 2, 10);
  e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, e]);
}
const sp = (type, paras, sz) => `<p:sp><p:nvSpPr><p:nvPr>${type ? `<p:ph type="${type}"/>` : ""}</p:nvPr></p:nvSpPr><p:txBody>${paras.map(t => `<a:p><a:r><a:rPr${sz ? ` sz="${sz}"` : ""}/><a:t>${t}</a:t></a:r></a:p>`).join("")}</p:txBody></p:sp>`;
function deck(slides) {
  const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const f = { "ppt/presentation.xml": `<p:presentation><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join("")}</p:sldIdLst></p:presentation>`,
    "ppt/_rels/presentation.xml.rels": `<Relationships>${slides.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${R}/slide" Target="slides/slide${i + 1}.xml"/>`).join("")}</Relationships>` };
  slides.forEach((s, i) => {
    f[`ppt/slides/slide${i + 1}.xml`] = `<p:sld><p:cSld><p:spTree>${s.shapes}</p:spTree></p:cSld></p:sld>`;
    f[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = `<Relationships>${s.notes ? `<Relationship Id="rId9" Type="${R}/notesSlide" Target="../notesSlides/notesSlide${i + 1}.xml"/>` : ""}</Relationships>`;
    if (s.notes) f[`ppt/notesSlides/notesSlide${i + 1}.xml`] = `<p:notes><p:cSld><p:spTree>${sp("body", [s.notes])}</p:spTree></p:cSld></p:notes>`;
  });
  return zip(f);
}
const title = { shapes: sp("title", ["Costs can fall a fifth by moving two regions"], 4000), notes: "mode: presented." };
const badDeck = deck([title, { shapes: sp("title", ["Costs"], 2800) + sp("body", ["Costs rose 40% last year"], 1200) }]);
const goodDeck = deck([title, { shapes: sp("title", ["Costs rose 40% last year, most of it in two regions"], 2800) + sp("body", ["Two regions carry most of it"], 1800) + sp(null, ["Source: Ledger, 2025 and 2026"], 1200), notes: "Walk through the two regions." }]);
const b = checkPptx(badDeck).out, g = checkPptx(goodDeck).out, bh = re => b.some(x => x.lvl === "FAIL" && re.test(x.msg));
ok(bh(/body text at 12pt/) && bh(/no "Source:" line/) && bh(/no speaker notes/) && b.some(x => x.lvl === "WARN" && /topic label/.test(x.msg)), "check-pptx: small body, no source line, no notes, topic title are caught");
ok(!g.some(x => x.lvl === "FAIL"), `check-pptx: the corrected deck passes${g.some(x => x.lvl === "FAIL") ? " (" + g.filter(x => x.lvl === "FAIL").map(x => x.msg).join("; ") + ")" : ""}`);

console.log(bad ? `\n${bad} check(s) failed` : "\nall checks passed");
process.exit(bad ? 1 : 0);
