#!/usr/bin/env node
// brand.mjs: a company's brand colours and fonts as a complete kit palette. It reads a
// brand.json (BRAND.md has the schema), fills in every token base.css's palettes define,
// derives what the brand file leaves out, and enforces the kit's guarantees: WCAG contrast
// for every text and ground pairing the kit uses, in light and dark, and categories that
// stay apart under the two common red-green colour-vision deficiencies. A brand colour
// that fails is moved in lightness only, by the smallest step that passes, and reported.
// No dependencies; node 18+, bun or deno.
//
//   node tools/brand.mjs brand.json              (the palette CSS, then a short report)
//   node tools/brand.mjs brand.json --report     (the report only)
//   node tools/brand.mjs brand.json --json       (every final value, light and dark, for deck builders)
//   node tools/brand.mjs brand.json --strict     (refuse instead of adjusting: exit 1 on any adjustment)
//
//   import { loadBrand, resolve, brandCss, report } from "./tools/brand.mjs";

import { readFileSync } from "node:fs";
import process from "node:process";

// ---------- colour math ----------
// Hex in and out; OKLCH for lightness moves and mixing; CIE Lab for colour difference.

const clamp01 = v => Math.min(1, Math.max(0, v));
export function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) throw new Error(`brand.mjs: "${hex}" is not a hex colour like #2D5283`);
  const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join("") : m[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
export const rgbToHex = rgb => "#" + rgb.map(c => Math.round(clamp01(c) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const toLinear = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = c => c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

// WCAG 2 relative luminance and contrast ratio.
export const luminance = hex => { const [r, g, b] = hexToRgb(hex).map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// OKLab and OKLCH (Ottosson 2020).
function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
export function oklch(hex) {
  const [L, a, b] = linearToOklab(hexToRgb(hex).map(toLinear));
  return [L, Math.hypot(a, b), (Math.atan2(b, a) * 180 / Math.PI + 360) % 360];
}
// Back to hex. A colour outside sRGB keeps its lightness and hue and loses chroma until it fits.
export function fromOklch(L, C, H) {
  L = clamp01(L);
  const rad = H * Math.PI / 180, lin = c => oklabToLinear([L, c * Math.cos(rad), c * Math.sin(rad)]);
  const inGamut = rgb => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
  let c = C;
  if (!inGamut(lin(c))) { let lo = 0, hi = C; for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(lin(mid))) lo = mid; else hi = mid; } c = lo; }
  return rgbToHex(lin(c).map(v => fromLinear(clamp01(v))));
}
// Mix two colours in OKLab: t = 0 gives a, t = 1 gives b.
export function mix(a, b, t) {
  const p = linearToOklab(hexToRgb(a).map(toLinear)), q = linearToOklab(hexToRgb(b).map(toLinear));
  return rgbToHex(oklabToLinear(p.map((v, i) => v + (q[i] - v) * t)).map(v => fromLinear(clamp01(v))));
}

// CIE Lab (D65) and the 1976 colour difference, as the kit's own category check uses.
function linearToLab([r, g, b]) {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047, Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
// Colour-vision simulation: Machado, Oliveira and Fernandes 2009, severity 1.0, on linear RGB.
export const VISION = {
  normal: null,
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const seenAs = (hex, vision) => { const lin = hexToRgb(hex).map(toLinear), M = VISION[vision];
  return linearToLab(M ? M.map(row => clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])) : lin); };
export const deltaE = (a, b, vision = "normal") => { const p = seenAs(a, vision), q = seenAs(b, vision); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

// ---------- the kit's defaults and rules ----------

// The kit's shared status and category colours (base.css section 1), used where the brand says nothing.
const KIT = {
  light: { danger: "#A8281F", warn: "#8A5300", ok: "#2C6B3A", "danger-bg": "#F8E5E2", "warn-bg": "#F6ECDA", "ok-bg": "#E3F0E5",
    cats: ["#2F7FC1", "#8C7A0B", "#C24D7A", "#4E4AA8", "#2F8A57", "#7E2340"] },
  dark: { danger: "#FF8A80", warn: "#F0B44C", ok: "#7CCB8F", "danger-bg": "#3A1E1C", "warn-bg": "#362A14", "ok-bg": "#1C3022",
    cats: ["#86D0F5", "#C9B23C", "#F29CBC", "#8778DC", "#5DBE88", "#C25C7C"] },
};
// The kit's font stacks (base.css section 2). A brand font goes in front; these stay behind it.
export const KIT_FONTS = {
  read: `"Iowan Old Style", "Charter", "Bitstream Charter", "Source Serif 4", "Source Serif Pro", "Sitka Text", Cambria, Georgia, serif`,
  display: `"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`,
  ui: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  mono: `Menlo, "Cascadia Code", Consolas, "DejaVu Sans Mono", "Liberation Mono", ui-monospace, monospace`,
};
// The token order base.css uses, so the generated block reads like the built-in palettes.
export const TOKENS = ["bg", "surface", "sunken", "fg", "fg2", "fg3", "accent", "accent2", "border", "hairline", "tint", "tint2",
  "danger", "warn", "ok", "danger-bg", "warn-bg", "ok-bg", "cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6", "scroll-shadow"];
// Print always uses light values on white paper, as base.css section 15 sets them.
const PRINT = { bg: "#FFFFFF", surface: "#FFFFFF", sunken: "#F3F3F1", fg: "#111111", fg2: "#3D3D3D", fg3: "#555555", hairline: "#CFCFCF" };

export const TEXT = 4.5, GRAPHIC = 3;   // WCAG AA for text; 3:1 for borders and category marks
export const SEPARATION = 10;           // minimum dE76 between any two categories, normal, protan and deutan vision
const STATUS_KEYS = { good: "ok", warn: "warn", bad: "danger" };
const BUILT_IN = ["paper", "slate", "graphite"];

// ---------- reading the brand file ----------

const COLOR_KEYS = ["background", "surface", "text", "muted", "accent", "accent2", "border", "status", "categories"];
const hex = (v, where) => { try { return rgbToHex(hexToRgb(v)); } catch { throw new Error(`brand.mjs: ${where} is "${v}", not a hex colour like #2D5283`); } };
function colorSet(c = {}, where) {
  const out = {};
  for (const k of Object.keys(c)) if (!COLOR_KEYS.includes(k)) throw new Error(`brand.mjs: unknown key ${where}.${k}; use ${COLOR_KEYS.join(", ")}`);
  for (const k of COLOR_KEYS.slice(0, 7)) if (c[k] != null) out[k] = hex(c[k], `${where}.${k}`);
  if (c.status) { out.status = {};
    for (const k of Object.keys(c.status)) { if (!["good", "warn", "bad", "info"].includes(k)) throw new Error(`brand.mjs: unknown key ${where}.status.${k}; use good, warn, bad, info`);
      out.status[k] = hex(c.status[k], `${where}.status.${k}`); } }
  if (c.categories) { if (!Array.isArray(c.categories) || c.categories.length > 6) throw new Error(`brand.mjs: ${where}.categories must be a list of up to 6 colours`);
    out.categories = c.categories.map((v, i) => hex(v, `${where}.categories[${i}]`)); }
  return out;
}
// A font family stack as CSS: names with spaces are quoted, generic families are not.
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|-apple-system|math|emoji)$/;
export function fontStack(v, where) {
  const list = Array.isArray(v) ? v : String(v).split(",");
  return list.map(f => String(f).trim().replace(/^["']|["']$/g, "")).filter(Boolean).map(f => {
    if (/[;{}<>\\"]/.test(f)) throw new Error(`brand.mjs: ${where} has a character a font name cannot hold: "${f}"`);
    return GENERIC.test(f) ? f : `"${f}"`;
  }).join(", ");
}
// Validate a parsed brand.json and normalise its values. Throws with the key that is wrong.
export function readBrand(b) {
  if (!b || typeof b !== "object") throw new Error("brand.mjs: the brand file must be a JSON object");
  const known = ["name", "colors", "dark", "fonts", "radius", "logoText", "deck", "$schema", "comment"];
  for (const k of Object.keys(b)) if (!known.includes(k)) throw new Error(`brand.mjs: unknown key "${k}"; use ${known.slice(0, 7).join(", ")}`);
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(b.name || "")) throw new Error(`brand.mjs: name must be lower case letters, digits and hyphens, starting with a letter (it becomes data-palette); got "${b.name}"`);
  if (BUILT_IN.includes(b.name)) throw new Error(`brand.mjs: name "${b.name}" is a built-in palette; pick another`);
  const colors = colorSet(b.colors, "colors");
  for (const k of ["background", "text", "accent"]) if (!colors[k]) throw new Error(`brand.mjs: colors.${k} is required`);
  const fonts = {};
  for (const k of Object.keys(b.fonts || {})) { if (!["reading", "interface", "mono"].includes(k)) throw new Error(`brand.mjs: unknown key fonts.${k}; use reading, interface, mono`);
    fonts[k] = fontStack(b.fonts[k], `fonts.${k}`); }
  if (b.radius != null && !(Number.isFinite(+b.radius) && +b.radius >= 0 && +b.radius <= 24)) throw new Error("brand.mjs: radius must be a number of pixels from 0 to 24");
  if (b.logoText != null && (typeof b.logoText !== "string" || b.logoText.length > 40)) throw new Error("brand.mjs: logoText must be a short string (40 characters at most)");
  const deck = {};
  for (const k of Object.keys(b.deck || {})) {
    if (k === "titleFont" || k === "bodyFont") deck[k] = fontStack(b.deck[k], `deck.${k}`);
    else if (k === "chartColors") { if (!Array.isArray(b.deck[k])) throw new Error("brand.mjs: deck.chartColors must be a list of hex colours"); deck[k] = b.deck[k].map((v, i) => hex(v, `deck.chartColors[${i}]`)); }
    else throw new Error(`brand.mjs: unknown key deck.${k}; use titleFont, bodyFont, chartColors`);
  }
  return { name: b.name, colors, dark: colorSet(b.dark, "dark"), fonts, radius: b.radius == null ? null : +b.radius, logoText: b.logoText || "", deck };
}
export const loadBrand = path => { let raw;
  try { raw = JSON.parse(readFileSync(path, "utf8")); } catch (e) { throw new Error(`brand.mjs: cannot read ${path}: ${e.message}`); }
  return readBrand(raw); };

// ---------- fitting a colour to its grounds ----------

const minContrast = (c, grounds) => Math.min(...grounds.map(g => contrast(c, g)));
// The smallest change in OKLCH lightness (chroma and hue kept) that gives `min` contrast against
// every ground. Tries darker and lighter and keeps the smaller move; null if neither direction can.
export function fit(color, grounds, min) {
  if (minContrast(color, grounds) >= min) return color;
  const [L, c, H] = oklch(color), C = c < 0.003 ? 0 : c, tries = []; // a grey keeps no hue
  for (const end of [0, 1]) {
    if (minContrast(fromOklch(end, C, H), grounds) < min) continue;
    let lo = L, hi = end;  // lo fails, hi passes
    for (let i = 0; i < 32; i++) { const mid = (lo + hi) / 2; if (minContrast(fromOklch(mid, C, H), grounds) >= min) hi = mid; else lo = mid; }
    let out = fromOklch(hi, C, H), step = 0;
    while (minContrast(out, grounds) < min && step++ < 50) out = fromOklch(hi += (end - L > 0 ? 0.002 : -0.002), C, H); // rounding to hex
    tries.push({ out, move: Math.abs(hi - L) });
  }
  return tries.length ? tries.sort((a, b) => a.move - b.move)[0].out : null;
}

// ---------- resolving a brand into the full token set ----------

// Plain names for the report, in brand-guide words.
const ROLE = { fg: "text", fg2: "muted text", fg3: "subtle text", accent: "accent", accent2: "second accent", border: "border",
  danger: "status bad", warn: "status warn", ok: "status good", "cat-1": "category 1", "cat-2": "category 2", "cat-3": "category 3",
  "cat-4": "category 4", "cat-5": "category 5", "cat-6": "category 6" };
const GROUND = { bg: "background", surface: "surface", sunken: "sunken", tint: "accent tint", tint2: "second accent tint",
  "danger-bg": "its status ground", "warn-bg": "its status ground", "ok-bg": "its status ground" };

export function resolve(brand) {
  const adjustments = [], weak = [], fixes = [];
  const out = { name: brand.name, light: {}, dark: {}, info: {} };
  for (const theme of ["light", "dark"]) {
    const given = theme === "light" ? brand.colors : brand.dark, base = brand.colors, t = out[theme], dark = theme === "dark";
    // Fit a colour; record the move if the colour came from the brand file.
    const place = (key, color, groundKeys, min, fromBrand) => {
      const grounds = groundKeys.map(g => t[g]), done = fit(color, grounds, min);
      if (!done) throw new Error(`brand.mjs: ${theme} ${ROLE[key] || key} ${color} cannot reach ${min}:1 on ${groundKeys.map(g => GROUND[g] || g).join(" and ")} by lightness alone; change the ${dark ? "dark " : ""}background`);
      if (done !== color && fromBrand) {
        // One line per colour: a second fit of the same colour extends the first adjustment.
        const prev = adjustments.find(a => a.theme === theme && a.key === key), from = prev ? prev.from : color;
        const on = [...new Set([...(prev ? prev.on : []), ...groundKeys.map(g => GROUND[g] || g)])];
        const adj = { theme, key, from, to: done, min, on,
          text: `${theme} ${ROLE[key] || key} ${from} ${luminance(done) < luminance(from) ? "darkened" : "lightened"} to ${done} for ${min}:1 on ${on.join(" and ")}` };
        if (prev) Object.assign(prev, adj); else adjustments.push(adj);
      }
      return (t[key] = done);
    };
    const lc = hex => oklch(hex);

    // Grounds. Dark grounds, when not given, are a near-neutral dark tinted toward the accent's hue.
    const hueA = lc(base.accent)[2];
    if (!dark) {
      t.bg = given.background;
      t.surface = given.surface || mix(t.bg, "#FFFFFF", 0.6);
      t.sunken = fromOklch(lc(t.bg)[0] - 0.03, lc(t.bg)[1], lc(t.bg)[2]);
    } else {
      t.bg = given.background || fromOklch(0.2, 0.008, hueA);
      const [L, C, H] = lc(t.bg);
      t.surface = given.surface || fromOklch(L + 0.03, C, H);
      t.sunken = fromOklch(L - 0.015, C, H);
      if (luminance(t.bg) > 0.18) throw new Error(`brand.mjs: dark.background ${t.bg} is too light for a dark theme`);
    }
    const grounds = ["bg", "surface", "sunken"];

    // Text in three levels, all at 4.5:1 on every ground.
    const text = given.text || fromOklch(0.93, Math.min(lc(base.text)[1], 0.012), lc(base.text)[2]);
    place("fg", text, grounds, TEXT, !!given.text);
    place("fg2", given.muted || mix(t.fg, t.bg, dark ? 0.24 : 0.3), grounds, TEXT, !!given.muted);
    place("fg3", mix(t.fg, t.bg, dark ? 0.38 : 0.45), grounds, TEXT, false);

    // Accents and their tints. A tint is lightened (or darkened, in dark) before the accent is touched.
    const accentFrom = (k, fallback) => given[k] || (dark ? (() => { const [L, C, H] = lc(fallback); return fromOklch(Math.max(L, 0.76), Math.min(C, 0.14), H); })() : fallback);
    for (const [k, tk, src] of [["accent", "tint", "accent"], ["accent2", "tint2", given.accent2 || base.accent2 ? "accent2" : "accent"]]) {
      const c = accentFrom(src, base[src] || base.accent);
      place(k, c, ["bg", "surface"], TEXT, !!given[k]);
      const [L, C, H] = lc(t[k]);
      t[tk] = dark ? fromOklch(0.3, Math.min(C * 0.35, 0.045), H) : mix(t[k], t.surface, 0.88);
      for (let i = 0; i < 20 && contrast(t[k], t[tk]) < TEXT; i++) t[tk] = dark ? fromOklch(lc(t[tk])[0] - 0.01, lc(t[tk])[1], H) : mix(t[tk], t.surface, 0.3);
      place(k, t[k], ["bg", "surface", tk], TEXT, !!given[k]);
    }

    // Borders at 3:1 for controls; hairlines are decoration and carry no meaning.
    place("border", given.border || mix(t.fg, t.bg, dark ? 0.55 : 0.5), ["bg", "surface"], GRAPHIC, !!given.border);
    t.hairline = mix(t.fg, t.bg, dark ? 0.8 : 0.85);

    // Status: the brand's good, warn and bad, or the kit's. Each sits on a pale (or deep) ground of its own hue.
    const kit = KIT[theme], status = given.status || {}, baseStatus = base.status || {};
    for (const [bk, kk] of Object.entries(STATUS_KEYS)) {
      let fg = status[bk], bgc;
      if (!fg && dark && baseStatus[bk]) { const [L, C, H] = lc(baseStatus[bk]); fg = fromOklch(Math.max(L, 0.78), Math.min(C, 0.15), H); }
      if (fg) { const [, C, H] = lc(fg); bgc = dark ? fromOklch(0.27, Math.min(C * 0.3, 0.035), H) : fromOklch(0.94, Math.min(C * 0.25, 0.035), H); }
      else { fg = kit[kk]; bgc = kit[kk + "-bg"]; }
      t[kk + "-bg"] = bgc;
      place(kk, fg, [kk + "-bg", "bg", "surface"], TEXT, !!status[bk]);
    }
    // Body text on the tinted grounds (callouts) at 4.5:1; those grounds are derived, so they move first.
    for (const g of ["tint", "tint2", "danger-bg", "warn-bg", "ok-bg"])
      for (let i = 0; i < 20 && contrast(t.fg, t[g]) < TEXT; i++) t[g] = mix(t[g], t.bg, 0.3);
    // Info has no token in base.css (pages draw notes with the accent and its tint); decks get it from --json.
    const info = status.info || (dark && baseStatus.info ? fromOklch(Math.max(lc(baseStatus.info)[0], 0.78), lc(baseStatus.info)[1], lc(baseStatus.info)[2]) : null);
    if (info) { const [, C, H] = lc(info);
      const ibg = dark ? fromOklch(0.27, Math.min(C * 0.3, 0.035), H) : fromOklch(0.94, Math.min(C * 0.25, 0.035), H);
      const ifg = fit(info, [ibg, t.bg, t.surface], TEXT);
      if (ifg !== info && status.info) adjustments.push({ theme, key: "info", from: info, to: ifg, min: TEXT, on: ["its status ground", "background", "surface"],
        text: `${theme} status info ${info} ${luminance(ifg) < luminance(info) ? "darkened" : "lightened"} to ${ifg} for ${TEXT}:1 on its status ground and background and surface` });
      out.info[theme] = { fg: ifg, bg: ibg };
    } else out.info[theme] = { fg: t.accent, bg: t.tint };

    // Categories: the brand's, then the kit's in the order that keeps them furthest from the brand's.
    let cats = (given.categories || (dark && base.categories ? base.categories.map(c => { const [L, C, H] = lc(c); return fromOklch(Math.max(L, 0.72), C, H); }) : [])).slice();
    const brandCount = (given.categories || []).length;
    const gap = c => Math.min(99, ...cats.flatMap(o => ["normal", "protan", "deutan"].map(v => deltaE(c, o, v))));
    while (cats.length < 6) {
      if (!cats.length) { cats = kit.cats.slice(); break; }
      const left = kit.cats.filter(p => !cats.includes(p)).sort((a, b) => gap(b) - gap(a));
      cats.push(left[0]);
    }
    cats.forEach((c, i) => place(`cat-${i + 1}`, c, ["surface", "bg"], GRAPHIC, i < brandCount));
    // Separation: a pair too close under normal, protan or deutan vision gets its later colour replaced by
    // the nearest one (by dE76 to the original) that is far enough from every other category and still passes 3:1.
    for (let pass = 0; pass < 6; pass++) {
      const bad = weakPairs(cats6(t));
      if (!bad.length) break;
      const { a, b } = bad[0], key = `cat-${b + 1}`, was = t[key], alt = separable(t, b);
      weak.push({ theme, a: a + 1, b: b + 1, vision: bad[0].vision, dE: bad[0].dE, colors: [t[`cat-${a + 1}`], was], suggest: alt });
      if (!alt) break;
      t[key] = alt;
      fixes.push({ theme, key, from: was, to: alt, fromBrand: b < brandCount, text: `${theme} category ${b + 1} ${was} replaced by ${alt}: it was ${bad[0].dE.toFixed(1)} dE76 from category ${a + 1} under ${bad[0].vision} vision (needs ${SEPARATION})` });
    }
    t["scroll-shadow"] = dark ? "rgb(255 255 255 / 0.12)" : "rgb(0 0 0 / 0.14)";
  }
  // The brand's fonts first, then the kit's stack behind them, each name once.
  const stack = (front, kit) => [...new Set([...(front ? front.split(", ") : []), ...kit.split(", ")])].join(", ");
  out.fonts = { read: stack(brand.fonts.reading, KIT_FONTS.read), display: stack(brand.fonts.reading, KIT_FONTS.display),
    ui: stack(brand.fonts.interface, KIT_FONTS.ui), mono: stack(brand.fonts.mono, KIT_FONTS.mono) };
  out.radius = brand.radius;
  out.logoText = brand.logoText;
  const deckColors = brand.deck.chartColors;
  out.deck = { titleFont: stack(brand.deck.titleFont, out.fonts.display), bodyFont: stack(brand.deck.bodyFont, out.fonts.ui),
    chartColors: { light: deckColors || cats6(out.light), dark: deckColors || cats6(out.dark) } };
  // A chartColors override is the brand's call: it is checked and reported, never changed.
  const deckWeak = deckColors ? weakPairs(deckColors).map(p => ({ theme: "deck", a: p.a + 1, b: p.b + 1, vision: p.vision, dE: p.dE, colors: [deckColors[p.a], deckColors[p.b]], suggest: null })) : [];
  out.adjustments = adjustments; out.categoryFixes = fixes; out.weakPairs = [...weak, ...deckWeak];
  out.checks = checks(out);
  return out;
}
const cats6 = t => [1, 2, 3, 4, 5, 6].map(i => t[`cat-${i}`]);
// Every pair of colours closer than SEPARATION under normal, protan or deutan vision, worst first.
export function weakPairs(list) {
  const res = [];
  for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++)
    for (const vision of ["normal", "protan", "deutan"]) { const dE = deltaE(list[a], list[b], vision); if (dE < SEPARATION) res.push({ a, b, vision, dE }); }
  return res.sort((p, q) => p.dE - q.dE);
}
// The colour nearest to category i (by dE76) that keeps SEPARATION from the others and 3:1 on the grounds.
function separable(t, i) {
  const was = t[`cat-${i + 1}`], others = cats6(t).filter((_, j) => j !== i), [L, C, H] = oklch(was);
  let best = null, bestD = Infinity;
  for (let dh = -180; dh <= 180; dh += 6) for (let dl = -0.3; dl <= 0.3001; dl += 0.02) for (const cs of [1, 0.75, 1.25]) {
    const cand = fromOklch(L + dl, Math.min(C * cs, 0.25), (H + dh + 360) % 360);
    if (minContrast(cand, [t.surface, t.bg]) < GRAPHIC) continue;
    if (others.some(o => ["normal", "protan", "deutan"].some(v => deltaE(cand, o, v) < SEPARATION))) continue;
    const d = deltaE(cand, was); if (d < bestD) { bestD = d; best = cand; }
  }
  return best;
}

// Every pairing the kit uses, with its lowest ratio, for the report and the self-test.
export const PAIRS = [
  ["body text", "fg", ["bg", "surface", "sunken"], TEXT],
  ["muted text", "fg2", ["bg", "surface", "sunken"], TEXT],
  ["subtle text", "fg3", ["bg", "surface", "sunken"], TEXT],
  ["body text on tints", "fg", ["tint", "tint2", "danger-bg", "warn-bg", "ok-bg"], TEXT],
  ["accent and links", "accent", ["bg", "surface", "tint"], TEXT],
  ["second accent", "accent2", ["bg", "surface", "tint2"], TEXT],
  ["status good", "ok", ["ok-bg", "bg", "surface"], TEXT],
  ["status warn", "warn", ["warn-bg", "bg", "surface"], TEXT],
  ["status bad", "danger", ["danger-bg", "bg", "surface"], TEXT],
  ["borders", "border", ["bg", "surface"], GRAPHIC],
  ...[1, 2, 3, 4, 5, 6].map(i => [`category ${i}`, `cat-${i}`, ["surface", "bg"], GRAPHIC]),
];
function checks(r) {
  return PAIRS.map(([label, key, grounds, min]) => {
    const lo = th => Math.min(...grounds.map(g => contrast(r[th][key], r[th][g])));
    return { label, key, min, light: lo("light"), dark: lo("dark") };
  });
}

// ---------- output ----------

const block = (sel, t, indent = "") => {
  const lines = []; let row = [];
  for (const k of TOKENS) { row.push(`--p-${k}: ${t[k]};`); if (row.length === 3 || ["sunken", "fg3", "accent2", "hairline", "tint2", "ok", "ok-bg", "cat-3", "cat-6"].includes(k)) { lines.push(row.join(" ")); row = []; } }
  if (row.length) lines.push(row.join(" "));
  return `${indent}${sel} {\n${lines.map(l => indent + "  " + l).join("\n")}\n${indent}}`;
};
// The palette as a CSS block for after base.css. The markers let check.mjs treat it like base.css.
export function brandCss(r) {
  const p = `:root[data-palette="${r.name}"]`, fonts = [`  --font-read: ${r.fonts.read};`, `  --font-display: ${r.fonts.display};`,
    `  --font-ui: ${r.fonts.ui};`, `  --font-mono: ${r.fonts.mono};`];
  if (r.radius != null) fonts.push(`  --radius: ${r.radius}px; --radius-sm: ${Math.round(r.radius * 2 / 3)}px;`);
  return `/* brand palette: ${r.name} */
/* Generated by tools/brand.mjs from a brand file. Change the brand file and run it again; do not edit here.
   Every value is checked: text 4.5:1 on its grounds, borders and categories 3:1, categories at least
   ${SEPARATION} dE76 apart under normal, protan and deutan vision. Dark sits under @media screen, so print is light. */
${block(p, r.light)}
${p} {
${fonts.join("\n")}
}
@media screen and (prefers-color-scheme: dark) {
${block(`${p}:not([data-theme="light"])`, r.dark, "  ")}
}
@media screen {
${block(`:root[data-theme="dark"]${p.slice(5)}`, r.dark, "  ")}
}
@media print {
  ${p} { ${Object.entries(PRINT).map(([k, v]) => `--p-${k}: ${v};`).join(" ")} }
}
/* end brand palette */`;
}

export function report(r) {
  const lines = [`brand "${r.name}": ${r.adjustments.length} contrast adjustment(s), ${r.categoryFixes.length} category replacement(s), ${r.weakPairs.filter(w => !w.suggest || w.theme === "deck").length} unresolved weak pair(s)`];
  for (const a of r.adjustments) lines.push("  adjusted: " + a.text);
  for (const f of r.categoryFixes) lines.push("  replaced: " + f.text);
  for (const w of r.weakPairs.filter(w => !w.suggest)) lines.push(`  weak: ${w.theme} ${w.theme === "deck" ? "chart colours" : "categories"} ${w.a} and ${w.b} (${w.colors.join(", ")}) are ${w.dE.toFixed(1)} dE76 apart under ${w.vision} vision (needs ${SEPARATION})${w.theme === "deck" ? "; deck.chartColors is used as given" : "; no separable alternative found"}`);
  lines.push("  lowest contrast, light / dark (needs):");
  for (const c of r.checks) lines.push(`    ${c.label.padEnd(20)} ${c.light.toFixed(2).padStart(5)} / ${c.dark.toFixed(2).padStart(5)}  (${c.min})`);
  for (const th of ["light", "dark"]) {
    const list = cats6(r[th]), m = v => { let lo = Infinity; for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) lo = Math.min(lo, deltaE(list[a], list[b], v)); return lo.toFixed(1); };
    lines.push(`  categories, ${th}: min dE76 normal ${m("normal")}, protan ${m("protan")}, deutan ${m("deutan")} (needs ${SEPARATION}); tritan ${m("tritan")} (reported only)`);
  }
  return lines.join("\n");
}
// Strict mode refuses any brand colour the kit would have to change.
export const refusals = r => [...r.adjustments.map(a => a.text), ...r.categoryFixes.filter(f => f.fromBrand).map(f => f.text), ...r.weakPairs.filter(w => !w.suggest).map(w => `${w.theme} categories ${w.a} and ${w.b} too close under ${w.vision} vision`)];
const ordered = t => Object.fromEntries(TOKENS.map(k => [k, t[k]]));
export const toJson = r => ({ name: r.name, light: ordered(r.light), dark: ordered(r.dark), info: r.info, fonts: r.fonts, radius: r.radius, logoText: r.logoText, deck: r.deck,
  adjustments: r.adjustments.map(a => a.text), categoryFixes: r.categoryFixes.map(f => f.text), weakPairs: r.weakPairs });

// CLI
const HELP = `usage:
  node tools/brand.mjs brand.json            the palette CSS for [data-palette="NAME"], then a short report
  node tools/brand.mjs brand.json --report   the report only
  node tools/brand.mjs brand.json --json     every final value, light and dark, as JSON (deck builders read this)
  node tools/brand.mjs brand.json --strict   refuse instead of adjusting: list what fails and exit 1
  Use it on a page with: node tools/page.mjs body.html page.html --brand brand.json
  BRAND.md has the schema; brand.example.json is a complete example.`;
const isMain = typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const args = process.argv.slice(2), file = args.find(a => !a.startsWith("-"));
  if (!file || args.includes("--help") || args.includes("-h")) { console.log(HELP); process.exit(file ? 0 : 2); }
  try {
    const r = resolve(loadBrand(file));
    if (args.includes("--strict")) { const no = refusals(r);
      if (no.length) { console.error(`brand.mjs --strict: ${no.length} brand colour(s) fail the kit's checks:\n` + no.map(n => "  " + n).join("\n")); process.exit(1); } }
    if (args.includes("--json")) console.log(JSON.stringify(toJson(r), null, 2));
    else if (args.includes("--report")) console.log(report(r));
    else console.log(brandCss(r) + "\n\n/*\n" + report(r) + "\n*/");
  } catch (e) { console.error(e.message); process.exit(2); }
}
