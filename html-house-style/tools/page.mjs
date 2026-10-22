#!/usr/bin/env node
// page.mjs: the fast way to build a page. Print a pattern's example body to edit, then
// wrap the edited body into one complete, self-contained page: doctype, the full base.css
// inlined in <style>, the template's head script, zoom dialog and closing script.
// No dependencies; node 18+, bun or deno.
//
//   node tools/page.mjs --rules monitor                      (that pattern's rules from PATTERNS.md)
//   node tools/page.mjs --snippet list                       (component names; --snippet callouts prints one)
//   node tools/page.mjs --skeleton monitor > body.html      (edit body.html)
//   node tools/page.mjs body.html page.html --check          (assemble, then run check.mjs)
//
//   import { skeleton, assemble, rules, snippet, includes } from "./tools/page.mjs";
//
// The body file is everything inside <div class="page">. Its first line may be JSON meta,
// {"title":...,"pattern":...,"palette":...,"density":...}, as --skeleton prints it.
// Flags win over the meta line; the pattern sets the density and palette left unset.
// A line <!-- include: piece.html --> is replaced by that file, relative to the body file.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const kit = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, kit), "utf8");

// The six patterns, plus the mixed page (a reading page with an explorable dataset).
// Density and palette as PATTERNS.md and the examples give them.
export const PATTERNS = {
  decide: { density: "doc", palette: "paper" },
  understand: { density: "doc", palette: "paper" },
  "look-up": { density: "tool", palette: "graphite" },
  monitor: { density: "tool", palette: "graphite" },
  do: { density: "tool", palette: "slate" },
  review: { density: "doc", palette: "paper" },
  "report-with-dataset": { density: "doc", palette: "paper", pattern: "review" },
};
const ALIAS = { dataset: "report-with-dataset", lookup: "look-up" };
const name = p => ALIAS[p] || p;
const PATTERN_LIST = "decide, understand, look-up, monitor, do, review, dataset";

const BODY_OPEN = `<div class="page">\n`, BODY_CLOSE = `\n</div>\n\n<dialog class="zoom"`;
const LINK = /<!-- In generated pages, replace this link[^\n]*-->\n<link rel="stylesheet" href="(\.\.\/)?base\.css">/;
const need = (m, what) => { if (!m) throw new Error(`page.mjs: template.html markers moved (${what}); update page.mjs`); return m[0]; };

// The template's head script, zoom dialog and closing script, minus the gallery calculator.
export function parts() {
  const t = read("template.html");
  const head = need(t.match(/<script>\n\/\* Before first paint[\s\S]*?<\/script>/), "head script");
  const dialog = need(t.match(/<dialog class="zoom"[\s\S]*?<\/dialog>/), "zoom dialog");
  let close = need(t.match(/<script>\n\(\(\) => \{[\s\S]*?<\/script>/), "closing script");
  const a = close.indexOf("  // Gallery calculator"), b = close.indexOf("  // Page patterns");
  if (a < 0 || b < a) throw new Error("page.mjs: template.html markers moved (gallery calculator block); update page.mjs");
  return { head, dialog, close: close.slice(0, a) + close.slice(b) };
}

// The body of an example page, with its meta as a JSON first line.
export function skeleton(pattern) {
  const file = name(pattern);
  if (!PATTERNS[file] && file !== "index") throw new Error(`page.mjs: no skeleton for "${pattern}"; use one of ${PATTERN_LIST}`);
  const html = read(`examples/${file}.html`);
  const i = html.indexOf(BODY_OPEN), j = html.indexOf(BODY_CLOSE);
  if (i < 0 || j < i) throw new Error(`page.mjs: examples/${file}.html has no <div class="page"> body`);
  const meta = {
    title: html.match(/<title>([\s\S]*?)<\/title>/)[1],
    pattern: html.match(/<body[^>]*data-pattern="([^"]+)"/)[1],
    palette: html.match(/<html[^>]*data-palette="([^"]+)"/)[1],
    density: html.match(/<body class="([^"]+)"/)[1],
  };
  const body = html.slice(i + BODY_OPEN.length, j), off = 3; // line 1 meta, line 2 this note, body from line 3
  const h2s = [...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(m => `L${body.slice(0, m.index).split("\n").length + off - 1} ${m[1].replace(/<[^>]+>/g, "")}`);
  return JSON.stringify(meta) + "\n" + `${NOTE} ${h2s.join(" · ") || "none"} -->` + "\n" + body + "\n";
}
const NOTE = "<!-- page.mjs sections (page.mjs drops this line):";

// One pattern's section of PATTERNS.md, plus "State and the URL" for the patterns that keep state.
const SECTION = { decide: "2. Decide", understand: "3. Understand", "look-up": "4. Look up", monitor: "5. Monitor", do: "6. Do", review: "7. Review", "report-with-dataset": "10. Datasets inside reading pages" };
const STATEFUL = ["look-up", "monitor", "review", "report-with-dataset"];
const section = (md, title) => { const i = md.indexOf(`\n## ${title}\n`);
  if (i < 0) throw new Error(`page.mjs: PATTERNS.md has no "## ${title}" section; update page.mjs`);
  const rest = md.slice(i + 1), j = rest.slice(3).search(/\n(## |---\n)/); return (j < 0 ? rest : rest.slice(0, j + 3)).trimEnd() + "\n"; };
export function rules(pattern) {
  const key = name(pattern); if (!SECTION[key]) throw new Error(`page.mjs: no rules for "${pattern}"; use one of ${PATTERN_LIST}`);
  const md = read("PATTERNS.md");
  return section(md, SECTION[key]) + (STATEFUL.includes(key) ? "\n" + section(md, "9. State and the URL") : "");
}

// SNIPPETS.md as [{ name, rule, text }], one per bold run-in heading.
export function snippets() {
  const md = read("SNIPPETS.md"), out = [];
  for (const m of md.matchAll(/^\*\*([^*]+?)\.\*\* ([^\n]*)/gm)) {
    const rest = md.slice(m.index), end = rest.slice(2).search(/\n(\*\*[^*]+?\.\*\* |## )/);
    out.push({ name: m[1], rule: m[2].match(/^.*?\.(?=\s|$)/)?.[0] || m[2], text: (end < 0 ? rest : rest.slice(0, end + 2)).trimEnd() + "\n" });
  }
  return out;
}
export function snippet(query) {
  const all = snippets(), q = String(query).toLowerCase().trim();
  if (q === "list") return all.map(s => `${s.name.toLowerCase()}: ${s.rule}`).join("\n") + "\n";
  const hit = all.filter(s => s.name.toLowerCase() === q);
  const found = hit.length ? hit : all.filter(s => s.name.toLowerCase().startsWith(q)).concat(all.filter(s => !s.name.toLowerCase().startsWith(q) && s.name.toLowerCase().includes(q)));
  if (found.length === 1) return found[0].text;
  throw new Error(found.length ? `page.mjs: "${query}" matches ${found.map(s => s.name.toLowerCase()).join(", ")}; be more specific`
    : `page.mjs: no snippet "${query}"; node tools/page.mjs --snippet list`);
}

// Replace each <!-- include: file --> line with that file, relative to dir. A missing file is an error.
export function includes(body, dir) {
  return body.replace(/^[ \t]*<!-- include: (.+?) -->[ \t]*$/gm, (_, file) => {
    const path = resolve(dir, file.trim());
    if (!existsSync(path)) throw new Error(`page.mjs: include not found: ${file.trim()} (looked for ${path})`);
    return readFileSync(path, "utf8").trimEnd();
  });
}

// Split a body file into its meta line (if any) and the body, dropping the sections note.
export function parseBody(src) {
  const nl = src.indexOf("\n"), first = (nl < 0 ? src : src.slice(0, nl)).trim();
  const meta = first.startsWith("{") ? JSON.parse(first) : {};
  let body = first.startsWith("{") ? src.slice(nl + 1) : src;
  if (body.startsWith(NOTE)) body = body.slice(body.indexOf("\n") + 1);
  return { meta, body: body.trimEnd() };
}

// A complete page from a body and its meta.
export function assemble(body, meta = {}) {
  const key = name(meta.pattern || ""), p = PATTERNS[key];
  if (!p) throw new Error(`page.mjs: pattern "${meta.pattern}" is not one of ${Object.keys(PATTERNS).join(", ")}`);
  const pattern = p.pattern || key, density = meta.density || p.density, palette = meta.palette || p.palette;
  if (!["doc", "tool"].includes(density)) throw new Error(`page.mjs: density must be doc or tool, not "${density}"`);
  if (!["paper", "slate", "graphite"].includes(palette)) throw new Error(`page.mjs: palette must be paper, slate or graphite, not "${palette}"`);
  if (!meta.title) throw new Error("page.mjs: the page needs a title (--title, or title in the meta line)");
  const title = String(meta.title).replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;");
  const base = read("base.css").trimEnd(), { head, dialog, close } = parts();
  return `<!doctype html>
<html lang="en" class="no-js" data-palette="${palette}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${base}
</style>
${head}
</head>
<body class="${density}" data-pattern="${pattern}">
<div class="page">
${body}
</div>

${dialog}

${close}
</body>
</html>
`;
}

// CLI
const HELP = `usage:
  node tools/page.mjs --rules PATTERN
      Print that pattern's rules from PATTERNS.md (plus the state rules if it keeps state).
  node tools/page.mjs --snippet NAME      (--snippet list: every name with its rule)
      Print one component's rule and markup from SNIPPETS.md.
  node tools/page.mjs --skeleton PATTERN > body.html
      Print a pattern's example body to edit. Line 1 is JSON meta; line 2 lists the
      sections with their line numbers (page.mjs drops it when it assembles).
      PATTERN: decide, understand, look-up, monitor, do, review, dataset
      (dataset: a Review reading page with an explorable section.dataset)
  node tools/page.mjs body.html page.html [options]
      Wrap body.html (everything inside <div class="page">) into a complete page.
      --title T        page <title> (else the meta line's title)
      --pattern P      one of the patterns above (sets density and palette)
      --palette X      paper, slate or graphite
      --density D      doc or tool
      --check          run check.mjs on page.html; print FAIL and WARN lines only;
                       exit 1 on any FAIL
  Flags win over the meta line. A line <!-- include: piece.html --> in body.html is
  replaced by that file (relative to body.html), so table.mjs and bars.mjs output
  goes in without a splice script. Edit body.html with your editor or a node script,
  not sed -i (BSD and GNU differ).`;

const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const args = process.argv.slice(2), opts = {}, files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--check" || args[i] === "--help" || args[i] === "-h") opts[args[i].replace(/^-+/, "")] = true;
    else if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];
    else files.push(args[i]);
  }
  try {
    if (opts.help || opts.h) { console.log(HELP); process.exit(0); }
    if (opts.skeleton) { process.stdout.write(skeleton(opts.skeleton)); process.exit(0); }
    if (opts.rules) { process.stdout.write(rules(opts.rules)); process.exit(0); }
    if (opts.snippet) { process.stdout.write(snippet(opts.snippet)); process.exit(0); }
    if (files.length !== 2) { console.error(HELP); process.exit(2); }
    const parsed = parseBody(readFileSync(files[0], "utf8")), meta = parsed.meta, body = includes(parsed.body, dirname(resolve(files[0])));
    for (const k of ["title", "pattern", "palette", "density"]) if (opts[k]) meta[k] = opts[k];
    if (opts.pattern) { const p = PATTERNS[name(opts.pattern)]; if (p && !opts.palette) meta.palette = p.palette; if (p && !opts.density) meta.density = p.density; }
    const html = assemble(body, meta);
    writeFileSync(files[1], html);
    if (!opts.check) console.log(`${files[1]} written: ${html.length} characters`);
    if (opts.check) {
      const check = new URL("check.mjs", kit).pathname;
      const run = typeof Deno !== "undefined" ? [process.execPath, "run", "--allow-read", check] : [process.execPath, check];
      const r = spawnSync(run[0], [...run.slice(1), files[1]], { encoding: "utf8" });
      const lines = (r.stdout || "").split("\n"), shown = lines.filter(l => /^(FAIL|WARN)/.test(l));
      if (r.status === 0 && !shown.length) console.log(`0 FAIL 0 WARN: ${files[1]}`);
      else { shown.forEach(l => console.log(l)); console.log(lines.filter(Boolean).pop() || r.stderr); }
      process.exit(r.status === 0 ? 0 : 1);
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
