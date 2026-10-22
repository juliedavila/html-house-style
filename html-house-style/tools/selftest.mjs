#!/usr/bin/env node
// selftest.mjs: proves the helpers' output passes check.mjs. It builds a bar chart,
// a linked chart, a 140-row sortable table and a 140-row section.dataset from
// invented data and checks each one as a fragment. It builds one page from every
// snippet in SNIPPETS.md and one page per pattern with page.mjs, checks them as
// pages, and proves page.mjs rebuilds every example exactly. Exits 1 on any FAIL.
//
//   node tools/selftest.mjs        (or bun tools/selftest.mjs, or deno run -A tools/selftest.mjs)
import { writeFileSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { bars } from "./bars.mjs";
import { table } from "./table.mjs";
import { skeleton, parseBody, assemble, rules, snippets, snippet, includes } from "./page.mjs";

// A small deterministic generator, so every run checks the same rows.
let seed = 7; const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rand() * a.length)];
const teams = ["Payments", "Search", "Accounts", "Platform", "Data", "Mobile"];
const rows = Array.from({ length: 140 }, (_, i) => ({
  service: `service-${String(i + 1).padStart(3, "0")}`, team: pick(teams), status: pick(["expired", "soon", "ok", "ok", "ok"]),
  days: Math.round(rand() * 400) - 20, renewed: `2026-${String(1 + Math.floor(rand() * 9)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
}));
const statuses = { expired: ["danger", "Expired"], soon: ["warn", "Under 30 days"], ok: ["ok", "Valid"] };
const columns = [{ key: "service", label: "Service", type: "text", rowHeader: true }, { key: "team", label: "Team", type: "text" },
  { key: "status", label: "Status", type: "status" }, { key: "days", label: "Days left", type: "num" }, { key: "renewed", label: "Last renewed", type: "date" }];
const counts = teams.map(t => ({ label: t, value: rows.filter(r => r.team === t).length }));

const pieces = {
  "bars.html": bars(counts, { title: "Services by team", unit: "services", source: "Invented for the self-test", takeaway: "Each team owns between 15 and 30 services." }),
  "bars-small.html": bars(counts.slice(0, 3), { width: 320, small: true, title: "Three teams", takeaway: "A small chart keeps its own size." }),
  "table.html": table(rows, { columns, statuses, caption: "Certificates", source: "Invented for the self-test" }),
  "dataset.html": table(rows, { id: "certs", columns, statuses, source: "Invented for the self-test",
    dataset: { facet: "team", chips: ["status"], noun: "services", chart: { title: "Services by team", takeaway: "Pick a team to narrow the table." } } }),
};
// Whole pages: every snippet in one Decide page, and each pattern's skeleton reassembled.
const kitFile = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const blocks = [...kitFile("SNIPPETS.md").matchAll(/```html\n([\s\S]*?)```/g)].map(m => m[1]);
if (!blocks[0].includes("<!-- snippets -->")) throw new Error("SNIPPETS.md: the first html block must be the page frame, with a <!-- snippets --> comment");
const pages = { "snippets.html": assemble(blocks[0].replace("<!-- snippets -->", blocks.slice(1).join("\n")), { title: "Snippets Self-Test", pattern: "decide" }) };
// The one page that must fail: body content directly in .with-toc, with no .prose wrapper.
const unwrapped = assemble(blocks[0].replace(/<div class="prose">\n/, "").replace(/(<\/div>\n\s*<\/div>\n<\/main>)/, m => m.replace("</div>\n", "")).replace("<!-- snippets -->", ""), { title: "Unwrapped", pattern: "decide" });
for (const p of ["decide", "understand", "look-up", "monitor", "do", "review", "dataset"]) { const { meta, body } = parseBody(skeleton(p)); pages[`page-${p}.html`] = assemble(body, meta); }

// page.mjs must rebuild every example exactly: the example, with its base.css link swapped for the inlined file.
const base = kitFile("base.css").trimEnd(), link = /<!-- In generated pages[^\n]*-->\n<link rel="stylesheet" href="\.\.\/base\.css">/;
let failed = 0;
for (const f of readdirSync(new URL("../examples/", import.meta.url)).filter(f => f.endsWith(".html"))) {
  const { meta, body } = parseBody(skeleton(f.replace(/\.html$/, ""))), same = assemble(body, meta) === kitFile("examples/" + f).replace(link, () => `<style>\n${base}\n</style>`);
  console.log(`${same ? "ok  " : "FAIL"} examples/${f}: page.mjs ${same ? "rebuilds it exactly" : "output differs from the example"}`);
  if (!same) failed++;
}

// page.mjs lookups: every pattern has rules, every snippet name (and every name SKILL.md lists) resolves to its own section.
const ok = (pass, what) => { console.log(`${pass ? "ok  " : "FAIL"} ${what}`); if (!pass) failed++; };
const PATS = { decide: "Decide", understand: "Understand", "look-up": "Look up", monitor: "Monitor", do: "Do", review: "Review", dataset: "Datasets inside reading pages" };
const ruleText = Object.entries(PATS).map(([p, h]) => { const t = rules(p); return t.startsWith("## ") && t.includes(h) && t.includes("State and the URL") === ["look-up", "monitor", "review", "dataset"].includes(p); });
ok(ruleText.every(Boolean), `--rules: ${ruleText.filter(Boolean).length} of 7 patterns print their section, with the state rules exactly where state is kept`);
const all = snippets(), listed = kitFile("SKILL.md").match(/with `--snippet`: ([^(]+?) \(/)[1].split(", ");
const resolves = n => { try { return snippet(n); } catch { return ""; } };
const bad = [...all.map(x => x.name), ...listed].filter(n => { const t = resolves(n); return !t || !all.some(x => x.text === t); });
ok(!bad.length && listed.length === all.length, `--snippet: ${all.length} sections, ${listed.length} names in SKILL.md, every one resolves${bad.length ? "; not: " + bad.join(", ") : ""}`);

const dir = mkdtempSync(join(tmpdir(), "hhs-selftest-")), check = new URL("../check.mjs", import.meta.url).pathname;
const runner = typeof Deno !== "undefined" ? [process.execPath, "run", "--allow-read", check] : [process.execPath, check];
{ const path = join(dir, "unwrapped.html"); writeFileSync(path, unwrapped);
  const r = spawnSync(runner[0], [...runner.slice(1), path], { encoding: "utf8" }), caught = r.status === 1 && /^FAIL\s+with-toc/m.test(r.stdout || "");
  console.log(`${caught ? "ok  " : "FAIL"} unwrapped.html: ${caught ? "body outside .prose is caught" : "check.mjs missed body content outside .prose"}`);
  if (!caught) failed++; }
// include markers: a generated piece goes in by file, and a missing file stops the build.
writeFileSync(join(dir, "inc-table.html"), pieces["table.html"]);
const { meta: im, body: ib } = parseBody(skeleton("look-up"));
pages["page-include.html"] = assemble(includes(ib.replace("</main>", "  <!-- include: inc-table.html -->\n  </main>"), dir), im);
let missing = false; try { includes("<!-- include: nope.html -->", dir); } catch { missing = true; }
ok(pages["page-include.html"].includes("<caption>Certificates</caption>") && !pages["page-include.html"].includes("<!-- include:") && missing, "include: the marker is replaced by the file, and a missing file is an error");
for (const [name, html] of [...Object.entries(pieces), ...Object.entries(pages)]) {
  const path = join(dir, name); writeFileSync(path, html);
  const r = spawnSync(runner[0], [...runner.slice(1), ...(pages[name] ? [] : ["--fragment"]), path], { encoding: "utf8" });
  const last = (r.stdout || "").trim().split("\n").pop();
  const fails = (r.stdout || "").split("\n").filter(l => l.startsWith("FAIL"));
  console.log(`${r.status === 0 ? "ok  " : "FAIL"} ${name}: ${last.replace(/\. Not checked.*$/, "").replace(/^.*: /, "")}`);
  fails.forEach(l => console.log("     " + l));
  if (r.status !== 0) failed++;
}
console.log(failed ? `${failed} piece(s) failed; output kept in ${dir}` : `all ${Object.keys(pieces).length + Object.keys(pages).length} pieces and pages pass; output in ${dir}`);
process.exit(failed ? 1 : 0);
