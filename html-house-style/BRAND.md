# Use your brand

A company with a brand guide writes its colours and fonts into one small file, `brand.json`, once. Every page built with `tools/page.mjs --brand brand.json` then uses them, and so does every deck a deck builder makes from the same file. Nobody edits `base.css`, and the kit's guarantees still hold: text contrast, categories that stay apart for colour-blind readers, status as a shape plus a word, dark mode, and print in light colours.

```sh
node tools/brand.mjs brand.json --report                           # what the kit kept, derived and changed
node tools/page.mjs body.html page.html --brand brand.json --check  # a branded page, checked
```

`brand.example.json` in this folder is a complete example. Copy it and change the values.

## The schema

The keys use a brand guide's words; the `base.css` token names appear only in the `--json` output. Only `name`, `colors.background`, `colors.text` and `colors.accent` are required. Colours are hex (`#0B6E8A` or `#08A`). Any other key is an error, so a typo stops the build.

| Key | Required | What it is |
|---|---|---|
| `name` | yes | The palette name. Lower case letters, digits and hyphens, starting with a letter; it becomes `<html data-palette="name">`. Not `paper`, `slate` or `graphite`. |
| `colors.background` | yes | The page ground. |
| `colors.surface` | no | Cards, figures and boxes. Derived: the background mixed 60% toward white. |
| `colors.text` | yes | Body text. |
| `colors.muted` | no | Secondary text (the dek, captions). Derived from text and background. |
| `colors.accent` | yes | The primary brand colour: links, the bottom-line rule, the recommended option, the focus of a diagram. |
| `colors.accent2` | no | A secondary brand colour, used rarely: the kicker, the ornament, a decision callout. Derived: the accent. |
| `colors.border` | no | Control and card borders. Derived from text and background. |
| `colors.status` | no | `{ "good", "warn", "bad", "info" }`, any of them. Each one left out uses the kit's own. |
| `colors.categories` | no | Up to 6 colours for series, zones and teams, in order. The rest are filled from the kit's six, picked to sit furthest from the brand's. |
| `dark` | no | Any of the `colors` keys for dark mode. Anything left out is derived from the light value. |
| `fonts.reading` | no | The reading face (body text and headings): a family name, a comma list, or a list of names. |
| `fonts.interface` | no | The interface face (labels, tables, controls). |
| `fonts.mono` | no | The code and data face. |
| `radius` | no | Corner radius in pixels, 0 to 24. Small corners scale with it. |
| `logoText` | no | A short wordmark, up to 40 characters, put at the front of the masthead kicker ("Harbor · Audit · ..."). Text only; no image is loaded. |
| `deck.titleFont` | no | Deck builders: the face for slide titles. Default: the reading face. |
| `deck.bodyFont` | no | Deck builders: the face for slide text. Default: the interface face. |
| `deck.chartColors` | no | Deck builders: chart colours to use in place of the categories. |

These key names are stable. The deck builder reads the same file, so a key is never renamed without a major version.

```json
{
  "name": "harbor",
  "colors": {
    "background": "#F6F8F9", "surface": "#FFFFFF", "text": "#16222B", "muted": "#4A5863",
    "accent": "#0B6E8A", "accent2": "#B4532A", "border": "#83909A",
    "status": { "good": "#276F46", "warn": "#8A5A00", "bad": "#B3261E", "info": "#0B6E8A" },
    "categories": ["#0B6E8A", "#B4532A", "#6B5BB5", "#1F7A5A"]
  },
  "dark": { "background": "#0F1A21", "accent": "#5FC3E0" },
  "fonts": { "reading": "Charter", "interface": ["Inter", "Helvetica Neue"], "mono": "JetBrains Mono" },
  "radius": 4,
  "logoText": "Harbor",
  "deck": { "titleFont": "Charter", "bodyFont": "Inter" }
}
```

## Fonts: only installed fonts work

A self-contained page loads nothing from the network, so it cannot load a web font. A brand font shows only on machines where it is installed. The kit puts the brand's fonts in front of its own stacks, so a machine without them falls back to the kit's choice (Iowan Old Style or Charter for reading, the system sans for the interface, Menlo or Consolas for code), never to a browser default. If the brand face matters on every machine, the reader's company has to install it.

## What is derived

Everything `base.css`'s palettes define gets a value, in light and dark: the three grounds (background, surface, sunken), three text levels, both accents and their tints, the border and hairline, the good, warn and bad colours with a ground for each, six categories, and the scroll cue. What the brand file leaves out is worked out with plain colour maths in OKLCH, the colour space where a lightness step looks like the same step at every hue:

- **Grounds.** Surface: the background mixed toward white. Sunken: the background a little darker. Dark ground: a near-black tinted slightly toward the accent's hue.
- **Text levels.** Muted and subtle text are mixes of the text colour into the background, then pushed until they pass.
- **Tints.** Each accent's tint is the accent mixed almost all the way into the surface (light) or a deep, low-chroma version of its hue (dark).
- **Dark accents and statuses.** The light colour's hue and chroma, lifted to a light enough value to read on the dark ground.
- **Status grounds.** A pale (light) or deep (dark) ground of the status colour's own hue.
- **Info.** `base.css` has no info token: a page draws notes with the accent and its tint. `status.info` is checked and passed to deck builders through `--json`.

## What is guaranteed, and how changes are reported

`brand.mjs` computes WCAG contrast for every pairing the kit uses, in light and in dark:

| Pairing | Needs |
|---|---|
| Body, muted and subtle text on background, surface and sunken | 4.5:1 |
| Body text on the accent tints and the status grounds (callouts) | 4.5:1 |
| Accent (links) on background, surface and its tint | 4.5:1 |
| Second accent on background, surface and its tint | 4.5:1 |
| Each status colour on its own ground, the background and the surface | 4.5:1 |
| Borders on background and surface | 3:1 |
| Each category on surface and background | 3:1 |

A brand colour that fails is moved in lightness only, by the smallest step that passes; its hue and chroma stay. A derived colour is moved without comment, since the brand never stated it. Every change to a brand colour is reported in one line:

```
light accent #F26B1D darkened to #C75100 for 4.5:1 on background and surface and accent tint
```

Categories are also checked pairwise for separation. Each pair is compared under normal vision and under simulated protanopia and deuteranopia (Machado, Oliveira and Fernandes 2009, full severity), and must be at least 10 apart in CIE 1976 colour difference (dE76). Tritanopia is reported but not enforced, as for the kit's own palette. When a pair is too close, the later colour is replaced by the nearest colour (by colour difference to the original) that is far enough from every other category and still passes 3:1, and the report says so:

```
light category 3 #C88800 replaced by #9F6400: it was 1.7 dE76 from category 1 under deutan vision (needs 10)
```

`deck.chartColors` is the brand's own call: it is checked and weak pairs are reported, but it is never changed.

With `--strict`, `brand.mjs` changes nothing: it lists every brand colour that would have to change and exits 1. Use it in a brand file's own tests, so a brand that slips below the line is caught where it is maintained. Without it, the report follows the CSS; `--report` prints the report alone.

Feeding the kit's own `paper` palette through `brand.mjs` gives no adjustments and the same category numbers `base.css` records, which is how the maths was checked.

## What the page gets

`page.mjs --brand` resolves the brand file, puts the palette after `base.css` in the same `<style>` tag, between `/* brand palette: NAME */` and `/* end brand palette */`, and sets `<html data-palette="NAME" data-palette-locked>`, so a palette remembered from another page cannot replace the brand. The block holds the light palette, the dark palette under `@media screen` for both the system setting and `data-theme="dark"` (the same selectors `base.css` uses), a print block with the kit's white-paper values, the font stacks and the radius. `check.mjs` treats the marked block like `base.css`, since its values were checked when it was generated; page CSS outside it still may not hold a colour. `check.mjs` fails a page whose `data-palette` is neither built in nor an inlined brand.

`node tools/brand.mjs brand.json` prints the same block, for a page built by hand: paste it after `base.css` and set `data-palette`.

## How decks use it

A deck builder reads the same `brand.json` and calls `node tools/brand.mjs brand.json --json` (or imports `resolve` and `toJson` from `tools/brand.mjs`) for the final values:

| JSON key | What it holds |
|---|---|
| `name` | The palette name. |
| `light`, `dark` | Every token, by its `base.css` name without `--p-`: `bg`, `surface`, `sunken`, `fg`, `fg2`, `fg3`, `accent`, `accent2`, `border`, `hairline`, `tint`, `tint2`, `danger`, `warn`, `ok`, `danger-bg`, `warn-bg`, `ok-bg`, `cat-1` to `cat-6`, `scroll-shadow`. |
| `info` | `{ light: { fg, bg }, dark: { fg, bg } }`. |
| `fonts` | Full stacks: `read`, `display`, `ui`, `mono`. |
| `radius`, `logoText` | As given, or `null` and `""`. |
| `deck` | `titleFont` and `bodyFont` as full stacks; `chartColors` as `{ light: [...], dark: [...] }`. |
| `adjustments`, `categoryFixes`, `weakPairs` | What was changed or still fails, as the report states it. |

The deck builder uses these values as they are, so a deck in the brand passes the same contrast and separation checks as a page.
