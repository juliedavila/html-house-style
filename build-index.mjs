// build-index.mjs: regenerates index.html (the GitHub Pages sample) from
// html-house-style/template.html and html-house-style/base.css, so the two never drift.
// Run from the repo root:  node build-index.mjs   (or bun build-index.mjs)

import { readFileSync, writeFileSync } from "node:fs";

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

const kitnote = `  <p class="kitnote no-print">Sample page from the <a href="https://github.com/juliedavila/html-house-style">HTML house style kit</a>. Use the buttons to compare the Paper, Slate and Graphite palettes in light and dark, and scroll to the component gallery for every component. The content is invented.</p>\n`;

const swap = (s, from, to) => { if (!s.includes(from)) throw new Error(`template.html no longer contains: ${from}`); return s.replace(from, to); };
let out = template;
out = swap(out, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`);
out = swap(out, `<title>Shared Build Cache</title>`, `<title>House Style Sample</title>`);
out = swap(out, `<!-- In generated pages, replace this link with the full contents of base.css in a <style> tag. -->\n<link rel="stylesheet" href="base.css">`, `<style>\n${base}\n${extra}\n</style>`);
out = swap(out, `<div class="page">\n`, `<div class="page">\n\n${kitnote}`);

writeFileSync(new URL("./index.html", import.meta.url), out);
console.log(`index.html written: ${out.length} characters`);
