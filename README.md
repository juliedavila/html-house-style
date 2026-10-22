# HTML house style

A Claude skill that makes the HTML pages Claude generates readable, restrained and consistent: briefs, reports, explainers, dashboards and diagram pages.

Generated pages tend to share one look: a gradient hero, emoji section markers, a grid of identical rounded cards, and diagrams too small to read. This kit replaces that look with a house style built from one reader's feedback over many projects.

**[See the sample page](https://juliedavila.github.io/html-house-style/)** and use its buttons to switch palettes and themes.

## What it does

- **Answer first.** Every page opens with a bottom-line block, and every section heading states a claim, so skimming the headings gives you the argument.
- **A calm editorial look.** Serif reading text, a sans interface, warm neutral grounds, one accent colour, and space and hairlines in place of boxes.
- **Diagrams you can read.** Diagrams are drawn as inline SVG that follows light and dark themes. Labels stay readable at the size you see them, and every figure has an Enlarge button with zoom.
- **Phone and print.** Pages never scroll sideways on a phone, and they print clean in the light palette even from a machine set to dark mode.
- **One self-contained file.** No CDNs, frameworks, web fonts or network requests, so a page opens from disk and works on locked-down machines.
- **Check before handover.** Claude renders the page at desktop and phone widths, in light, dark and print, and looks at it region by region before calling it done.

## What is in the repo

```
html-house-style/          the skill: copy this folder
  SKILL.md                 when and how Claude uses the kit
  STYLE-GUIDE.md           the full guide, with the reason behind each rule
  base.css                 the stylesheet every page inlines
  template.html            a sample decision brief using every component
  CHECKLIST.md             the pre-handover check
index.html                 the sample page, self-contained, served by GitHub Pages
```

## Install

**Claude Code, every project:**

```sh
git clone https://github.com/juliedavila/html-house-style.git
mkdir -p ~/.claude/skills
cp -R html-house-style/html-house-style ~/.claude/skills/
```

**Claude Code, one repository:** copy the `html-house-style` folder into that repository's `.claude/skills/`.

Start a new session. Claude loads the skill whenever you ask for HTML. You can also say "use the html-house-style skill".

**claude.ai:** zip the `html-house-style` folder and upload it under Settings, then Capabilities, then Skills. Where skills are not available, add `STYLE-GUIDE.md`, `base.css` and `template.html` to a project's knowledge, or paste the guide at the start of a conversation.

## Make it yours

Three palettes ship in `base.css`, each with a light and a dark theme:

| Palette | Feel |
|---|---|
| `paper` (default) | Warm editorial: paper ground, ink text, deep blue accent |
| `slate` | Cool neutral, the safest choice for a corporate audience |
| `graphite` | Near-monochrome with a teal accent, for dense tools |

To add your own, copy a palette block in `base.css` and change the ground, the accent pair and their tints. Section 5.2 of the guide covers the contrast targets. The guide is opinionated on purpose; edit it to match your own reader.

## License

MIT. See [LICENSE](LICENSE).
