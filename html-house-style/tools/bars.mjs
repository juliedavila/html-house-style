#!/usr/bin/env node
// bars.mjs: a sorted horizontal bar chart as a complete <figure>, ready to paste
// into a page built with the kit. No dependencies; node 18+, bun or deno.
//
//   import { bars } from "./tools/bars.mjs";
//   const html = bars([{ label: "Payments", value: 31 }, ...], { title, unit, source, takeaway, id });
//
//   node tools/bars.mjs data.json --title "Services by team" --unit services \
//     --source "Deploy log, Oct 2026" --takeaway "Payments owns the most." > fig.html
//
// Items: { label, value, cat? (1 to 6), focus? (true), key? (the filter value; default the label) }. Options: title, unit,
// max, sort ("desc", "asc" or "none"; default "desc"), width (default 640; 320 fits a phone), small
// (true: never grow past its width; for charts up to about 400 wide), source,
// takeaway, id, linked ({ key }: each row becomes a keyboard button that filters
// the records carrying data-<key>; needs the kit's closing script).
// Widths use the same estimate as check.mjs, duplicated here on purpose:
// characters x size x 0.55 (0.6 for bold) x 1.1. Labels are 13 units, ticks 12.

const W_PLAIN = 0.55, W_BOLD = 0.6, W_SLACK = 1.1, LABEL = 13, VALUE = 13, TICK = 12;
const est = (s, size, bold) => String(s).length * size * (bold ? W_BOLD : W_PLAIN) * W_SLACK;
export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const slug = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmt = v => Number(v).toLocaleString("en-US");
const r1 = v => Math.round(v * 10) / 10;

// A round axis maximum and step: steps of 1, 2, 2.5 or 5 times a power of ten, four or five ticks.
export function niceAxis(max) {
  if (!(max > 0)) return { top: 1, step: 1 };
  const raw = max / 4, p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw);
  return { top: Math.ceil(max / step) * step, step };
}

export function bars(items, o = {}) {
  const id = o.id || "fig-" + slug(o.title || "bars"), width = o.width || 640, pad = 16;
  const rows = items.map((d, i) => ({ ...d, value: Number(d.value), i }));
  if (o.sort !== "none") rows.sort((a, b) => (o.sort === "asc" ? a.value - b.value : b.value - a.value) || a.i - b.i);
  const { top, step } = o.max ? { top: o.max, step: niceAxis(o.max).step } : niceAxis(Math.max(...rows.map(d => d.value)));
  const labelW = Math.max(...rows.map(d => est(d.label, LABEL)));
  const valW = Math.max(...rows.map(d => est(fmt(d.value), VALUE, true)), est(fmt(top), VALUE, true));
  const x0 = Math.ceil(pad + labelW + 10), right = Math.floor(width - Math.max(pad, est(fmt(top), TICK) / 2 + 4));
  const plot = right - x0 - (o.linked ? valW + 8 : 0), k = plot / top;
  if (plot < 80) throw new Error(`bars.mjs: labels leave only ${Math.round(plot)} units for bars; shorten labels or raise width`);
  const rowH = 32, barH = 20, y0 = 12, base = y0 + rows.length * rowH, tickY = base + 18, height = tickY + 6;
  const out = [];
  for (let t = 0; t <= top + 1e-9; t += step) {
    const x = r1(x0 + t * k);
    if (t > 0) out.push(`<line class="c-grid" x1="${x}" y1="${y0 - 4}" x2="${x}" y2="${base}"/>`);
    out.push(`<text class="c-tick" x="${x}" y="${tickY}" text-anchor="middle">${fmt(r1(t))}</text>`);
  }
  out.push(`<line class="c-axis" x1="${x0}" y1="${y0 - 4}" x2="${x0}" y2="${base}"/>`);
  rows.forEach((d, n) => {
    const y = y0 + n * rowH, bw = r1(Math.max(0, d.value) * k), ty = y + 15;
    const cls = d.cat ? `c-cat-${d.cat}` : d.focus ? "c-bar focus" : "c-bar";
    const inside = !o.linked && bw >= valW + 12;
    const vx = inside ? r1(x0 + bw - 6) : r1(x0 + bw + 6);
    const label = `<text class="c-label" x="${x0 - 8}" y="${ty}" text-anchor="end">${esc(d.label)}</text>`;
    const bar = `<rect class="${cls}" x="${x0}" y="${y}" width="${bw}" height="${barH}"${o.linked ? ` data-unit="${r1(k * 1000) / 1000}"` : ""}/>`;
    const val = `<text class="c-value" x="${vx}" y="${ty}"${inside ? ' text-anchor="end"' : ""}${o.linked ? " data-count" : ""}>${fmt(d.value)}</text>`;
    if (!o.linked) return out.push(label, bar, val);
    out.push(`<g role="button" tabindex="0" aria-pressed="false" data-key="${esc(o.linked.key)}" data-value="${esc(slug(d.key ?? d.label))}" data-label="${esc(d.label)}">`,
      `  <rect class="c-hit" x="${pad - 4}" y="${y - 6}" width="${width - 2 * pad + 8}" height="${rowH}"/>`, "  " + label, "  " + bar, "  " + val, `</g>`);
  });
  const unit = o.unit ? " " + o.unit : "";
  const desc = rows.map(d => `${d.label} ${fmt(d.value)}${unit}`).join("; ") + ".";
  const small = o.small ? ' class="small-ok"' : "";
  return `<figure${o.linked ? ' class="linked"' : ""}>
  <button class="zoom-btn no-print" type="button">Enlarge</button>
  <div class="figure-frame">
    <!-- Scale: x = ${x0} + value * ${r1(k * 1000) / 1000}; axis 0 to ${fmt(top)}${unit}, step ${fmt(step)}. Made by tools/bars.mjs. -->
    <svg${small} viewBox="0 0 ${width} ${height}" style="--fig-min: ${width}px" role="${o.linked ? "group" : "img"}" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg">
      <title id="${id}-t">${esc(o.title || "Bar chart")}</title>
      <desc id="${id}-d">${esc(desc)}</desc>
      ${out.join("\n      ")}
    </svg>
  </div>
  <figcaption><strong>${esc(o.takeaway || o.title || "")}</strong>${o.linked ? " Pick a bar to filter the table below; pick it again to clear. Each bar counts the rows under every other filter." : ""}${o.source ? " " + esc(o.source) + "." : ""}</figcaption>
</figure>`;
}

// CLI. --help prints the options.
const HELP = `usage: node tools/bars.mjs data.json [options] > fig.html
  data.json   [{ "label", "value", "cat": 1-6, "focus": true, "key" }], or { "items": [...], "options": {...} }
  Prints a complete <figure>: Enlarge button, .figure-frame, SVG with --fig-min, caption.
    --title T          SVG title (also the caption when there is no takeaway)
    --takeaway K       the caption's bold first sentence: what the chart shows
    --source S         source and date, after the takeaway
    --unit U           unit after each value in the description ("services")
    --id ID            figure id prefix (default fig-<title>)
    --width N          viewBox width; 640 default, 320 fits a phone
    --small            never grow past its width (charts up to about 400 wide)
    --sort desc|asc|none   bar order; desc default
    --max N            axis maximum, instead of a round number above the data
    --linked KEY       each bar becomes a button that filters rows carrying data-KEY
                       (needs the kit's closing script and matching data-filter-item rows)
  Labels are 13 units and ticks 12, so with --fig-min they never draw under 13px and 12px.
  Write to a file, then include it: a line <!-- include: fig.html --> in body.html is
  replaced by the file when page.mjs assembles the page, and --check checks it there.`;

const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const { readFileSync } = await import("node:fs");
  const args = process.argv.slice(2), opts = {}; let file;
  for (let i = 0; i < args.length; i++) if (["--help", "-h", "--small"].includes(args[i])) opts[args[i].replace(/^-+/, "")] = true; else if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i]; else file = args[i];
  if (opts.help || opts.h) { console.log(HELP); process.exit(0); }
  if (!file) { console.error(HELP); process.exit(2); }
  const data = JSON.parse(readFileSync(file, "utf8")), items = Array.isArray(data) ? data : data.items;
  if (opts.width) opts.width = +opts.width; if (opts.max) opts.max = +opts.max; if (opts.linked) opts.linked = { key: opts.linked };
  console.log(bars(items, { ...(data.options || {}), ...opts }));
}
