# Pre-handover checklist

Run every item. Report what you checked when you hand the page over.

## Structure

- [ ] The first screen shows the kicker, a title that states the main claim, the dek, the meta line and the bottom-line block.
- [ ] The bottom line says the answer, why now, the cost and what would change the answer (or the recipe's equivalent).
- [ ] Every `h2` is a claim. Reading only the headings tells the story.
- [ ] Plans and processes are numbered steps.
- [ ] Method, research trail and full sources sit at the end or in collapsed sections.
- [ ] Pages longer than about three screens have the contents rail, and every `h2` has an `id`.

## Writing

- [ ] Every specialist term is defined on first use (`.term`) and in the glossary.
- [ ] Acronyms are spelled out on first use.
- [ ] No internal codes stand in for names in prose.
- [ ] Every number names its source and date. Measured and assumed are kept apart in the wording.
- [ ] No em dashes, no rhetorical questions, no filler closers.
- [ ] A cold reader would not need to read any sentence twice.

## Look

- [ ] `base.css` is inlined in full; page CSS uses tokens, no stray hex values.
- [ ] One accent colour dominates; the second accent appears only a few times.
- [ ] Status uses `.status` with an icon shape and a word.
- [ ] No gradients, emoji, stock images, icon-per-bullet, ALL CAPS headings.
- [ ] Cards only for real groups, and no two cards touch.
- [ ] Nothing sits flush against the block above it.
- [ ] No heading leaves a single word alone on its last line.

## Figures

- [ ] Each figure would be missed if removed.
- [ ] Each sits in `figure > .figure-frame`, has an Enlarge button, and a caption that opens with the takeaway.
- [ ] Labels are at least 12px at displayed size; no label overlaps a line, box or other label; no text runs out of its box or the viewBox.
- [ ] Edge types differ by line style; categories keep one colour each, with a legend.
- [ ] Illustrative figures say so and carry no numbers; data figures name source and date.
- [ ] SVGs have `title` and `desc`, unique marker ids, and Mermaid source kept beside them if Mermaid was used.

## Technical

- [ ] Single file. Opens from disk with the network off. No CDNs, fonts, libraries.
- [ ] `localStorage` access is wrapped in `try`/`catch`; the page works without it.
- [ ] Works with JavaScript off (content readable, collapsibles usable).

## Verified by looking

- [ ] Desktop render (1280 to 1440px) checked region by region at full size.
- [ ] True phone viewport (390px, via DevTools device metrics, not `--window-size`) checked; `scrollWidth <= innerWidth`.
- [ ] Dark mode checked.
- [ ] Print preview checked: light colours, nothing split badly, collapsed sections open, no fixed elements overlapping text.
- [ ] Every figure opened in the Enlarge dialog and read at zoom.
- [ ] Contents rail, tabs, collapsibles and enlarge buttons clicked.
