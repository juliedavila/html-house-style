// build-index.mjs: regenerates the GitHub Pages site from the kit, so the two never drift.
//   index.html       from html-house-style/template.html and base.css
//   examples/*.html  from html-house-style/examples/*.html and base.css
// Run from the repo root:  node build-index.mjs   (or bun build-index.mjs)

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";

const dir = new URL("./html-house-style/", import.meta.url);
const template = readFileSync(new URL("template.html", dir), "utf8");
const base = readFileSync(new URL("base.css", dir), "utf8").trimEnd();

const extra = `
/* Sample page only. */
@media screen {
  /* Safe-area gutter for phones with notches. */
  .page { padding-left: max(var(--gutter), env(safe-area-inset-left, 0px)); padding-right: max(var(--gutter), env(safe-area-inset-right, 0px)); }
}
.kitnote { font: 500 var(--fs-sm)/1.45 var(--font-ui); color: var(--fg-muted); background: var(--sunken); border-radius: var(--radius); padding: var(--s3) var(--s4); margin: 0 0 var(--s5); }`;

const repo = "https://github.com/juliedavila/html-house-style";
const kitnote = `  <p class="kitnote no-print">Sample page from the <a href="${repo}">HTML house style kit</a>. Use the buttons to compare the Paper, Slate and Graphite palettes in light and dark, and scroll to the component gallery for every component. The <a href="examples/index.html">page pattern examples</a> show one page for each reader's job. The content is invented.</p>\n`;
const titles = { decide: "Decide", understand: "Understand", "look-up": "Look up", monitor: "Monitor", do: "Do", review: "Review" };
const exampleNote = name => `  <p class="kitnote no-print">${titles[name] ? `Example of the ${titles[name]} pattern` : name === "index" ? "Page pattern examples" : "Example of a mixed page (a reading page with an explorable dataset)"} from the <a href="${repo}">HTML house style kit</a>. Back to ${name !== "index" ? `the <a href="index.html">examples</a> or ` : ""}the <a href="../index.html">sample page</a>. The content is invented.</p>\n`;

const swap = (s, from, to, where) => { if (!s.includes(from)) throw new Error(`${where} no longer contains: ${from}`); return s.replace(from, to); };
const viewport = [`<meta name="viewport" content="width=device-width, initial-scale=1">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`];
const style = `<style>\n${base}\n${extra}\n</style>`;

let out = template;
out = swap(out, ...viewport, "template.html");
out = swap(out, `<title>Shared Build Cache</title>`, `<title>House Style Sample</title>`, "template.html");
out = swap(out, `<!-- In generated pages, replace this link with the full contents of base.css in a <style> tag. -->\n<link rel="stylesheet" href="base.css">`, style, "template.html");
out = swap(out, `<div class="page">\n`, `<div class="page">\n\n${kitnote}`, "template.html");
writeFileSync(new URL("./index.html", import.meta.url), out);
console.log(`index.html written: ${out.length} characters`);

mkdirSync(new URL("./examples/", import.meta.url), { recursive: true });
const names = readdirSync(new URL("examples/", dir)).filter(f => f.endsWith(".html")).sort();
if (!names.length) throw new Error("html-house-style/examples/ has no pages");
for (const file of names) {
  const where = `examples/${file}`, name = file.replace(/\.html$/, "");
  let page = readFileSync(new URL(`examples/${file}`, dir), "utf8");
  page = swap(page, ...viewport, where);
  page = swap(page, `<!-- In generated pages, replace this link with the full contents of base.css in a <style> tag. -->\n<link rel="stylesheet" href="../base.css">`, style, where);
  page = swap(page, `<div class="page">\n`, `<div class="page">\n\n${exampleNote(name)}`, where);
  // On the site the sample brief is ../index.html, not ../template.html.
  page = page.replaceAll(`href="../template.html"`, `href="../index.html"`);
  writeFileSync(new URL(`./examples/${file}`, import.meta.url), page);
  console.log(`examples/${file} written: ${page.length} characters`);
}
