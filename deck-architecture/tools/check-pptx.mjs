#!/usr/bin/env node
// check-pptx.mjs: checks a finished .pptx against the deck rules, with no dependencies
// and no renderer. It unzips with node:zlib, reads each slide's XML with regular
// expressions, prints the ghost deck, then PASS, WARN and FAIL lines. Exit 1 on any FAIL.
//
//   node tools/check-pptx.mjs deck.pptx [--mode presented|preread]
//   (bun, or deno run --allow-read)
//
// The mode comes from --mode, or from a "mode: presented" token at the start of slide 1's
// speaker notes (outline.mjs puts it there). Font sizes are read from each run; a run
// with no size inherits from the layout placeholder, then the master's text styles. A
// size it cannot resolve is reported as inherited and skipped.

import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import process from "node:process";
import { MODES, hasNumber } from "./outline.mjs";
import { topicLike } from "./check-outline.mjs";

// ---------- zip: the central directory, then each entry's data ----------
export function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip file (no end of central directory)");
  const count = buf.readUInt16LE(eocd + 10), files = new Map();
  for (let i = 0, p = buf.readUInt32LE(eocd + 16); i < count; i++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28);
    const extra = buf.readUInt16LE(p + 30), comment = buf.readUInt16LE(p + 32), local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28), data = buf.subarray(start, start + size);
    files.set(name, () => (method === 8 ? inflateRawSync(data) : data).toString("utf8"));
    p += 46 + nameLen + extra + comment;
  }
  return { has: n => files.has(n), read: n => (files.has(n) ? files.get(n)() : "") };
}

// ---------- XML by regex ----------
const decode = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const all = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}\\b[^>]*?(?:/>|>[\\s\\S]*?</${tag}>)`, "g"))].map(m => m[0]);
const attr = (xml, name) => xml.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const words = s => String(s).split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
const rels = (zip, part) => {
  const dir = part.replace(/[^/]+$/, ""), x = zip.read(dir + "_rels/" + part.split("/").pop() + ".rels"), out = [];
  for (const r of all(x, "Relationship")) {
    const t = attr(r, "Target"), path = t.startsWith("/") ? t.slice(1) : (dir + t).split("/").reduce((a, s) => (s === ".." ? a.pop() : s !== "." && a.push(s), a), []).join("/");
    out.push({ type: attr(r, "Type").split("/").pop(), path, id: attr(r, "Id") });
  }
  return out;
};

// A placeholder's key: its type (title and ctrTitle are one), else "body" with its idx.
const phOf = sp => { const ph = sp.match(/<p:ph\b[^>]*>/)?.[0]; if (!ph) return null; const t = attr(ph, "type") || "body"; return { type: t === "ctrTitle" ? "title" : t, idx: attr(ph, "idx") }; };
const lvl1 = xml => attr(xml.match(/<a:lvl1pPr\b[\s\S]*?<a:defRPr\b[^>]*>/)?.[0] || "", "sz");
// The size a placeholder's text inherits from a layout or master shape of the same kind.
function inherited(sp, ...parts) {
  const ph = phOf(sp); if (!ph) return null;
  for (const xml of parts) for (const other of all(xml, "p:sp")) {
    const o = phOf(other); if (!o || o.type !== ph.type || (ph.idx && o.idx && o.idx !== ph.idx && ph.type === "body")) continue;
    const sz = lvl1(other.match(/<a:lstStyle>[\s\S]*?<\/a:lstStyle>/)?.[0] || "") || attr(other.match(/<a:rPr\b[^>]*>|<a:endParaRPr\b[^>]*>/)?.[0] || "", "sz");
    if (sz) return +sz;
  }
  return null;
}

function readSlide(zip, path, master) {
  const xml = zip.read(path), r = rels(zip, path);
  const layout = zip.read(r.find(x => x.type === "slideLayout")?.path || "");
  const styles = { title: lvl1(master.match(/<p:titleStyle>[\s\S]*?<\/p:titleStyle>/)?.[0] || ""), body: lvl1(master.match(/<p:bodyStyle>[\s\S]*?<\/p:bodyStyle>/)?.[0] || ""), other: lvl1(master.match(/<p:otherStyle>[\s\S]*?<\/p:otherStyle>/)?.[0] || "") };
  const shapes = all(xml, "p:sp").map(sp => {
    const ph = phOf(sp), scale = +(attr(sp.match(/<a:normAutofit\b[^>]*>/)?.[0] || "", "fontScale") || 100000) / 100000;
    const fallback = inherited(sp, layout, master) || (ph ? +(styles[ph.type === "title" ? "title" : "body"] || 0) || null : +(styles.other || 0) || null);
    // a line break inside a paragraph starts a new point, as it does on screen
    const paras = all(sp, "a:p").flatMap(p => p.split(/<a:br\b[^>]*\/>/)).map(p => {
      const runs = all(p, "a:r").map(rr => ({ text: decode((rr.match(/<a:t>([\s\S]*?)<\/a:t>/) || [, ""])[1]), sz: attr(rr.match(/<a:rPr\b[^>]*>/)?.[0] || "", "sz") }));
      return { text: runs.map(x => x.text).join("").trim(), sizes: runs.filter(x => x.text.trim()).map(x => x.sz ? (+x.sz / 100) * scale : fallback ? (fallback / 100) * scale : null) };
    }).filter(p => p.text);
    return { ph, paras, text: paras.map(p => p.text).join(" ") };
  });
  const tables = all(xml, "a:tbl").map(t => all(t, "a:r").map(rr => ({ text: decode((rr.match(/<a:t>([\s\S]*?)<\/a:t>/) || [, ""])[1]), sz: attr(rr.match(/<a:rPr\b[^>]*>/)?.[0] || "", "sz") })));
  const charts = r.filter(x => x.type === "chart").map(x => zip.read(x.path));
  const notesXml = zip.read(r.find(x => x.type === "notesSlide")?.path || "");
  const notes = all(notesXml, "p:sp").filter(sp => phOf(sp)?.type === "body").map(sp => all(sp, "a:t").map(t => decode(t.replace(/<[^>]+>/g, ""))).join(" ")).join(" ").trim();
  return { shapes, tables, charts, notes };
}

export function checkPptx(buf, opts = {}) {
  const zip = unzip(buf), out = [], add = (lvl, id, msg) => out.push({ lvl, id, msg });
  const pres = zip.read("ppt/presentation.xml"), pr = rels(zip, "ppt/presentation.xml");
  const order = [...pres.matchAll(/<p:sldId\b[^>]*r:id="([^"]+)"/g)].map(m => pr.find(x => x.id === m[1])?.path).filter(Boolean);
  const master = zip.read(pr.find(x => x.type === "slideMaster")?.path || "");
  const slides = order.map(p => readSlide(zip, p, master));
  if (!slides.length) { add("FAIL", "deck", "no slides found"); return { out, ghost: "" }; }
  const mode = opts.mode || (slides[0].notes.match(/^\s*mode:\s*(presented|preread)\b/) || [])[1];
  if (!mode) add("WARN", "mode", 'no mode: pass --mode, or start slide 1\'s notes with "mode: presented." Checking as presented');
  const L = MODES[mode || "presented"], AP = MODES.preread;
  let appendix = false, inheritedRuns = 0;
  const ghost = [];
  slides.forEach((s, i) => {
    const at = `slide ${i + 1}`, title = s.shapes.find(x => x.ph?.type === "title");
    const titleText = title?.text || "";
    if (/^appendix\b/i.test(titleText)) appendix = true;
    const main = i > 0 && !appendix;
    if (!titleText) add("FAIL", "title", `${at}: no title`);
    else if (main) {
      ghost.push(`${String(i + 1).padStart(2)}. ${titleText}`);
      if (topicLike(titleText)) add("WARN", "title", `${at}: "${titleText}" looks like a topic label; state the claim`);
      if (/\?\s*$/.test(titleText)) add("WARN", "title", `${at}: "${titleText}" is a question; state the answer`);
    }
    // body: the body placeholders; with none, the wordiest text box that is not a label
    const isSource = x => /^(source|sources|live view)\b/i.test(x.text) || /^https?:\/\//.test(x.text);
    let body = s.shapes.filter(x => x.ph && x.ph.type !== "title" && !["sldNum", "dt", "ftr"].includes(x.ph.type));
    if (!body.length) { const big = s.shapes.filter(x => !x.ph && !isSource(x) && words(x.text) > 12).sort((a, b) => words(b.text) - words(a.text))[0]; if (big) body = [big]; }
    const labels = s.shapes.filter(x => x !== title && !body.includes(x));
    const bodyParas = body.flatMap(x => x.paras), w = words(bodyParas.map(p => p.text).join(" ")), lim = appendix ? AP : L;
    if (w > lim.bodyWords * 1.5) add("FAIL", "words", `${at}: ${w} body words; the ${appendix ? "appendix" : mode || "presented"} limit is about ${lim.bodyWords}`);
    else if (w > lim.bodyWords) add("WARN", "words", `${at}: ${w} body words; the limit is about ${lim.bodyWords}`);
    if (bodyParas.length > L.bullets) add("FAIL", "bullets", `${at}: ${bodyParas.length} points; at most ${L.bullets}`);
    // font floors
    const floor = (sizes, min, what, lvl = "FAIL") => { const known = sizes.filter(v => v != null); inheritedRuns += sizes.length - known.length;
      const low = Math.min(...known); if (known.length && low < min - 0.01) add(lvl, "fonts", `${at}: ${what} at ${+low.toFixed(1)}pt; the floor is ${min}pt`); };
    if (title) floor(title.paras.flatMap(p => p.sizes), L.titlePt - 4, "title", "WARN");
    floor(bodyParas.flatMap(p => p.sizes), i === 0 ? 18 : L.bodyPt, "body text");
    floor(labels.filter(x => !isSource(x)).flatMap(x => x.paras.flatMap(p => p.sizes)), L.labelPt, "label text");
    floor(labels.filter(isSource).flatMap(x => x.paras.flatMap(p => p.sizes)), L.sourcePt, "source or link line", "WARN");
    floor(s.tables.flat().filter(r => r.text.trim()).map(r => (r.sz ? +r.sz / 100 : null)), L.labelPt, "table text");
    for (const c of s.charts) {
      const szs = [...c.matchAll(/<a:defRPr\b[^>]*\bsz="(\d+)"/g)].map(m => +m[1] / 100);
      if (!szs.length) add("WARN", "fonts", `${at}: chart text sizes are inherited; set them to ${L.labelPt}pt or more`);
      else if (Math.min(...szs) < L.labelPt) add("FAIL", "fonts", `${at}: chart text at ${Math.min(...szs)}pt; the floor is ${L.labelPt}pt`);
      const cats = [...c.matchAll(/<c:cat>[\s\S]*?<c:ptCount val="(\d+)"/g)].map(m => +m[1]), vals = [...c.matchAll(/<c:val>[\s\S]*?<c:ptCount val="(\d+)"/g)].map(m => +m[1]);
      if (!vals.length || cats.some((n, k) => n !== vals[k])) add("FAIL", "chart", `${at}: chart categories and values do not line up (${cats.join("/")} vs ${vals.join("/")})`);
    }
    // numbers need a source line
    const seen = [titleText, ...body.map(x => x.text), ...labels.filter(x => !isSource(x)).map(x => x.text), ...s.tables.flat().map(r => r.text)].join(" ");
    if (i > 0 && !/^appendix$/i.test(titleText) && (hasNumber(seen) || s.charts.length) && !labels.some(x => /^sources?\b/i.test(x.text)) && !/^sources?$/i.test(titleText))
      add("FAIL", "source", `${at}: has numbers and no "Source:" line`);
    if (mode !== "preread" && main && !s.notes) add("FAIL", "notes", `${at}: presented, and no speaker notes`);
  });
  if (inheritedRuns) add("INFO", "fonts", `${inheritedRuns} text runs inherit a size this checker could not resolve; skipped`);
  const n = id => out.some(x => x.id === id && x.lvl !== "INFO");
  const pass = { title: "every slide has a title, and the argument titles read as claims", words: `body words within the ${mode || "presented"} limits`, bullets: `at most ${L.bullets} points a slide`,
    fonts: `titles about ${L.titlePt}pt, body ${L.bodyPt}pt or more, labels, tables and charts ${L.labelPt}pt or more`, source: "every slide with numbers has a source line", chart: "chart categories and values line up",
    ...(mode !== "preread" ? { notes: "every argument slide has speaker notes" } : {}) };
  for (const [id, msg] of Object.entries(pass)) if (!n(id)) add("PASS", id, msg);
  add("INFO", "deck", `${slides.length} slides, mode ${mode || "presented (assumed)"}`);
  return { out, ghost: ghost.join("\n"), mode };
}

const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const args = process.argv.slice(2), file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--mode");
  if (!file) { console.log("usage: node tools/check-pptx.mjs deck.pptx [--mode presented|preread]"); process.exit(2); }
  let r;
  try { r = checkPptx(readFileSync(file), { mode: args.includes("--mode") ? args[args.indexOf("--mode") + 1] : undefined }); }
  catch (e) { console.log(`FAIL  deck     ${file}: ${e.message}`); process.exit(1); }
  console.log(`Ghost deck (${r.mode || "mode unknown"}, titles only):\n${r.ghost}\n`);
  const ids = ["deck", "mode", "title", "words", "bullets", "fonts", "chart", "source", "notes"];
  r.out.sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
  for (const x of r.out) console.log(`${x.lvl.padEnd(4)}  ${x.id.padEnd(8)} ${x.msg}`);
  const n = l => r.out.filter(x => x.lvl === l).length;
  console.log(`\n${file}: ${n("FAIL")} FAIL, ${n("WARN")} WARN. Not checked here: how it looks, text overflowing its box, overlaps, colour contrast.`);
  process.exit(n("FAIL") ? 1 : 0);
}
