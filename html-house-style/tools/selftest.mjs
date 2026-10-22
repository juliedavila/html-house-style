#!/usr/bin/env node
// selftest.mjs: proves the helpers' output passes check.mjs. It builds a bar chart,
// a linked chart, a 140-row sortable table and a 140-row section.dataset from
// invented data, checks each one as a fragment, and exits 1 on any FAIL.
//
//   node tools/selftest.mjs        (or bun tools/selftest.mjs, or deno run -A tools/selftest.mjs)
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { bars } from "./bars.mjs";
import { table } from "./table.mjs";

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
const dir = mkdtempSync(join(tmpdir(), "hhs-selftest-")), check = new URL("../check.mjs", import.meta.url).pathname;
const runner = typeof Deno !== "undefined" ? [process.execPath, "run", "--allow-read", check] : [process.execPath, check];
let failed = 0;
for (const [name, html] of Object.entries(pieces)) {
  const path = join(dir, name); writeFileSync(path, html);
  const r = spawnSync(runner[0], [...runner.slice(1), "--fragment", path], { encoding: "utf8" });
  const last = (r.stdout || "").trim().split("\n").pop();
  const fails = (r.stdout || "").split("\n").filter(l => l.startsWith("FAIL"));
  console.log(`${r.status === 0 ? "ok  " : "FAIL"} ${name}: ${last.replace(/\. Not checked.*$/, "").replace(/^.*: /, "")}`);
  fails.forEach(l => console.log("     " + l));
  if (r.status !== 0) failed++;
}
console.log(failed ? `${failed} piece(s) failed; output kept in ${dir}` : `all ${Object.keys(pieces).length} pieces pass; output in ${dir}`);
process.exit(failed ? 1 : 0);
