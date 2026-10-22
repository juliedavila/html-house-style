---
name: deck-architecture
description: The structure of a slide deck, decided before any slide is drawn. Picks the delivery mode (presented or pre-read) and the reader's job, then sets the slide order, a claim title on every slide, what goes on the slide, in the speaker notes and in the appendix, and how numbers, charts and diagrams carry over, including links back to a live page. Turns a finished html-house-style page into an outline.json the deck-building skill follows slide by slide, and checks the finished .pptx with no renderer. Pairs with the deck-building skill and company template, which own how slides look; this skill does not draw slides. USE WHEN asked for a deck, slides, a presentation, a pre-read or a readout, or to turn a page, report, brief or dashboard into a deck. NOT FOR how a slide looks (the deck skill and template own that), HTML pages (use html-house-style), Word documents, or talks with no slides.
---

# Deck architecture

This skill decides what goes in a deck and where. It never draws a slide: the deck-building skill and the company template own every visual. This skill hands that skill an outline to follow and checks the file it produces.

## Order of precedence

1. The reader's explicit request.
2. The company template and the deck skill, for everything visual: layout, fonts, colours, logos.
3. This guide, for structure. With a `brand.json`, chart and status colours come from it; the template still wins for the rest.

## Fast path

**1. Decide the mode and the pattern before anything else.**

| The request says | Mode | So |
|---|---|---|
| "for the meeting", "I'm presenting", nothing at all | `presented` (the default) | about 30 body words and one idea a slide; the prose goes in the speaker notes |
| "send ahead", "pre-read", "to read before", "to email" | `preread` | about 80 words a slide in full sentences, the evidence on the slide, an executive summary up front |

The pattern is the reader's job, from `html-house-style/PATTERNS.md`: Decide, Understand, Monitor or Review. Look up and Do pages do not become decks: make one slide that points to the page (DECKS.md section 2).

**2. Get an outline.** From the skill folder:

```sh
node tools/outline.mjs page.html --mode presented --url https://host/page.html > outline.json
node tools/check-outline.mjs outline.json      # the ghost deck, then FAIL and WARN
```

`--url` is the page's published address; every data slide links back to it with the view in the hash. Add `--brand brand.json` for brand chart and status colours, `--since old.html` on a Monitor page to mark what changed. With no page, write `outline.json` by hand from the schema in DECKS.md section 6, ghost deck first.

**3. Read the ghost deck.** The titles alone must carry the argument. Fix every FAIL. For each WARN, tighten the points and keep the claim, or name it in the handover.

**4. Hand the outline to the deck skill** with this instruction: "Build one slide per entry in outline.json, in order. Use each slide's title as written. Put `body` on the slide, `notes` in the speaker notes (slide 1's notes start with the mode line; keep it), and `sources` in a line starting 'Source:'. Draw `chart` as a native, editable chart from its labels and values with the `focus` bars in the accent colour and every other bar neutral; draw `diagram` as shapes and connectors at the given positions; put `link` on the slide as a clickable address. Body text at `meta.rules.bodyPt` or larger, chart and table text at 14pt or larger."

**5. Check the result:**

```sh
node tools/check-pptx.mjs deck.pptx            # mode from slide 1's notes, or --mode
```

Fix every FAIL in the outline or the build, and run it again.

**6. Hand over.** With no renderer: "Not rendered. Built from outline.json ([mode], [pattern], [n] slides) and checked by check-outline and check-pptx (0 FAIL, [n] WARN: [why each stands]). Ghost deck: [titles]. Please look at: [two or three things only a render shows, such as a long title wrapping, the diagram, chart labels]." Say which mode you built and that the other is one command away.

Read only when needed: DECKS.md 2 (each pattern as a deck), 5 (what changes on a slide), 6 (the outline schema).

## Files in this skill

- `DECKS.md`: the guide. The two decisions, each pattern as a deck, the rules carried over and the rules that change, the outline schema, the checks and the handover.
- `tools/outline.mjs`: a finished house-style page to `outline.json`. No dependencies; node 18+, bun or deno (`deno run --allow-read`).
- `tools/check-outline.mjs`: validates an outline and prints its ghost deck.
- `tools/check-pptx.mjs`: checks a finished `.pptx`: titles, font floors, words, points, speaker notes, source lines. It reads the zip itself; no renderer, no libraries.
- `tools/selftest.mjs`: runs the tools on the kit's example pages.
- `examples/`: outlines of the Decide and dataset example pages, in both modes.

## Non-negotiables

- The mode is chosen before the outline, and named in the handover.
- Every title is a claim, and the ghost deck reads as the argument.
- One idea a slide; at most 6 points.
- Every number has a source and date on its slide.
- Charts are native and editable; data slides link to the live view.
- Status is a shape and a word.
- You say what you checked and how. You never claim to have looked at a deck you did not open.
