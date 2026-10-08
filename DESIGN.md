---
name: Eliot Luca
description: A quiet, credible personal site set on prepared blue paper in iron-gall ink.
colors:
  carta: "#a3b8ca"
  carta-pale: "#c6d4e0"
  carta-deep: "#97adc0"
  iron-gall: "#221a14"
  metalpoint: "#33404c"
  silver: "#5d6c7a"
  lead-white: "#f4f1e8"
  night-carta: "#1b2139"
  night-line: "#ece9e0"
  night-metalpoint: "#aebac5"
  night-heightening: "#c3d2de"
  plate-entity: "#020203"
  entity-teal: "#7abdb4"
  entity-text: "#e9eeec"
  plate-orbes: "#000000"
  orbes-text: "#f2f2f0"
typography:
  inscription:
    fontFamily: "'Castoro Titling', 'Trajan Pro', 'Times New Roman', serif"
    fontSize: "clamp(3rem, 1rem + 6vw, 5.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0.02em"
    fontFeature: "lnum"
  display:
    fontFamily: "'EB Garamond Variable', 'EB Garamond', Garamond, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 1.2rem + 4.6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'EB Garamond Variable', 'EB Garamond', Garamond, 'Times New Roman', serif"
    fontSize: "clamp(2.125rem, 1.4rem + 2.6vw, 3rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'EB Garamond Variable', 'EB Garamond', Garamond, 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 1.2rem + 1.8vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "'EB Garamond Variable', 'EB Garamond', Garamond, 'Times New Roman', serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.32
    letterSpacing: "-0.005em"
  body:
    fontFamily: "'EB Garamond Variable', 'EB Garamond', Garamond, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "onum, pnum"
  prose:
    fontFamily: "'EB Garamond Variable', 'EB Garamond', Garamond, 'Times New Roman', serif"
    fontSize: "1.3125rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Mona Sans Variable', 'Mona Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 450
    lineHeight: 1.4
    letterSpacing: "0"
    fontFeature: "lnum, tnum"
  dimension:
    fontFamily: "'Mona Sans Variable', 'Mona Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 450
    letterSpacing: "0.01em"
    fontFeature: "lnum, tnum"
    fontVariation: "'wdth' 82"
rounded:
  none: "0"
spacing:
  s1: "0.5rem"
  s2: "1rem"
  s3: "1.5rem"
  s4: "2rem"
  s5: "3rem"
  s6: "4.5rem"
  s7: "6rem"
  s8: "9rem"
  gutter: "clamp(16px, 4vw, 64px)"
components:
  action:
    backgroundColor: "transparent"
    textColor: "{colors.iron-gall}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.6em 1em"
  action-hover:
    backgroundColor: "rgb(244 241 232 / 0.62)"
  choice-segment:
    backgroundColor: "transparent"
    textColor: "{colors.iron-gall}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5em 0.9em"
  choice-segment-selected:
    backgroundColor: "{colors.iron-gall}"
    textColor: "{colors.carta}"
  field-ruled:
    backgroundColor: "transparent"
    textColor: "{colors.iron-gall}"
    rounded: "{rounded.none}"
    padding: "0.15em 0 0.2em"
  nav-link:
    textColor: "{colors.iron-gall}"
    typography: "{typography.label}"
    padding: "0.35em 0"
  plate-entity:
    backgroundColor: "{colors.plate-entity}"
    textColor: "{colors.entity-text}"
    rounded: "{rounded.none}"
    padding: "clamp(1.25rem, 6cqi, 2.75rem)"
  plate-orbes:
    backgroundColor: "{colors.plate-orbes}"
    textColor: "{colors.orbes-text}"
    rounded: "{rounded.none}"
    padding: "clamp(1.25rem, 6.5cqi, 3rem)"
---

# Design System: Eliot Luca

## Overview

**Creative North Star: "The Prepared Sheet"**

The site is one sheet of carta da zucchero, the dusty blue paper Renaissance draughtsmen prepared for silverpoint, written on in brown-black iron-gall ink and heightened with lead white. It reads as a finance-trained founder's record: ruled ledgers, dated tables, plain sentence-case headings, real figures. The drawing hand appears in a few measured places: the rotating skeletal polyhedron beside the name, a handful of dimensioned studies on About, and the disciplines timeline. Those are signatures, not decoration, and they stay scarce.

Density is calm and editorial. Everything sits on a 12-column sheet with generous vertical bands; structure comes from 1px ink rules and type hierarchy, never from boxes, tints or cards. The two ventures, THE ENTITY and ORBES, are tipped in as plates in their own identities: dark stock laid onto the blue paper, the only objects that lift off the sheet.

The world refuses both the headshot-and-card-grid template and the eccentric notebook. Credibility first, range proven by facts, Leonardo as restraint.

**Key Characteristics:**
- Drenched blue paper ground with fibre noise; brown-black ink for all type and line.
- Square corners everywhere; 1px rules carry all structure.
- Three faces with fixed jobs: inscriptional capitals, Garamond reading text, Mona Sans interface and numbers.
- Ledgers and ruled lists instead of cards.
- Drawings are ink line art with real dimension lettering, drawn in once on load.
- Venture plates keep their own identity and are the sole lifted surfaces.

## Colors

A drenched, low-chroma paper palette: one blue ground, one warm ink, one lead-white light, with a metalpoint grey for secondary text.

### Primary
- **Iron-Gall Ink** (iron-gall): every heading, body line, 1px structural rule, drawing stroke, focus ring and selected control fill. In night mode the ink role passes to **Lead-White Line** (night-line).

### Secondary
- **Lead-White Heightening** (lead-white): the light. Text selection, highlight strokes in drawings, and, at 62% opacity, the hover wash under links and controls (`rgb(244 241 232 / 0.62)`). In night mode the role passes to **Pale Heightening** (night-heightening), with the wash at 16%.

### Neutral
- **Carta da Zucchero** (carta): the page ground, drenched edge to edge. Night: **Indigo Carta** (night-carta).
- **Pale Carta / Deep Carta** (carta-pale, carta-deep): sheet tints, kept in reserve for drawings and quiet fills.
- **Metalpoint** (metalpoint): secondary text: intros, descriptions, table headers, meta lines, field labels. Night: night-metalpoint.
- **Silver** (silver): non-text only. Link underlines at rest, dashed construction lines in drawings, the scrollbar. Too light for text on carta; never set copy in it.
- **Rule** (`rgb(34 26 20 / 0.28)`): the faint row divider inside ledgers and lists; the strong rule is full ink.

### Tertiary (venture plates only)
- **Entity Black / Entity Teal / Entity Text** (plate-entity, entity-teal, entity-text): THE ENTITY's own stock, accent and type, used only inside its plate.
- **Orbes Black / Orbes Text** (plate-orbes, orbes-text): ORBES's own stock and type, used only inside its plate.

### Named Rules
**The One Ink Rule.** Type and line on the sheet are iron-gall (or metalpoint for secondary text). No accent hue exists on the sheet; emphasis comes from weight, size, rule weight or the heightening wash.

**The Plate Quarantine Rule.** Venture colours (teal, plate blacks) never leak onto the sheet, and sheet tokens never style plate interiors beyond the shared type stacks.

## Typography

**Display Font:** Castoro Titling (with Trajan Pro, Times New Roman)
**Body Font:** EB Garamond Variable (with EB Garamond, Garamond, Times New Roman)
**Label/Mono Font:** Mona Sans Variable (with Helvetica Neue, Arial)

**Character:** Roman inscriptional capitals for the few marks that should feel cut; an Aldine-lineage book face for every heading and line of reading; a neutral variable grotesque, width-adjustable, for interface, tabular numbers and dimension lettering.

### Hierarchy
- **Inscription** (Castoro 400, clamp 3rem to 5.5rem, 0.95): the name on Home and Links, the header wordmark (17px, 0.14em tracking), manifesto titles, drop caps, essay and point numerals, key readout figures.
- **Display** (Garamond 400, step-5, 1.02, -0.02em): inner page titles, sentence case.
- **Headline** (Garamond 400, step-4, 1, -0.015em): section and band titles, sentence case, sitting on a full ink rule.
- **Title** (Garamond 400, step-3, 1.12): essay titles, claims, prose h2. Prose h3 is Garamond italic at step-2.
- **Lede** (Garamond 400, step-2, 1.32): one reading line under a page title, max 30em.
- **Body** (Garamond 400, step-0 18px, 1.55, old-style proportional figures). Long-form prose at step-1 (21px), 1.6, max 34em.
- **Label** (Mona Sans 450, step--1 15px, lining tabular figures, no tracking): nav, actions, field labels, table heads, meta. Smallest step--2 (13px) for legends and colophon.
- **Dimension** (Mona Sans 450 at 82% width, 0.01em): measurements inside drawings and scale ticks.
- **Annotation** (Garamond italic): captions beside studies, legends of groups, the "Now" mark.

### Named Rules
**The Sentence-Case Rule.** Page, section and band titles are Garamond in sentence case. Capitals belong to Castoro alone, and Castoro never sets a section title.

**The Two Figures Rule.** Numbers in reading text are old-style; numbers in interface, ledgers and readouts are lining tabular Mona Sans.

## Layout

A centred sheet up to 1440px with fluid gutters (16px to 64px) and a 12-column grid (column gap 12px to 32px). The home hero holds the name block in columns 1 to 7 and the single drawing in 9 to 12; below 1000px the drawing moves above, below 640px it disappears and the name fills the width on one line. Content bands are separated by large vertical space (s8, 9rem; s7 below 900px) and each opens with a headline on a full ink rule. Inner pages open with a title block (s6 top, s5 bottom). Reading measure is 34em. Tables and ruled lists collapse to stacked two-column rows below 760px. Instrument pages split 5:7 controls to readout, readout sticky, single column below 900px. Spacing follows an 8px-based ladder (s1 to s8).

## Elevation & Depth

The sheet is flat. Depth is carried by paper texture (a tiled fractal-noise fibre layer) and by ink weight: a full ink rule marks a boundary, a 28% rule divides rows. The only lifted objects are the two venture plates, laid on the paper like tipped-in prints.

### Shadow Vocabulary
- **Tipped-in plate** (`box-shadow: 0 22px 40px -22px rgb(0 0 0 / 0.55), 0 3px 8px -4px rgb(0 0 0 / 0.28), inset 0 1px 0 <plate text at 12%>`): venture plates only, with a 1px plate mark inset 6px.
- **Heightening halo** (`box-shadow: 0 0 0 10px var(--wash)`): a lit study gets a lead-white wash around it; a state, not elevation.

### Named Rules
**The Flat Sheet Rule.** Nothing on the sheet casts a shadow. Only a tipped-in plate lifts.

## Shapes

Square corners throughout (0 radius) for controls, plates, tables and fields. Borders are 1px ink or rule; focus is a 2px ink outline offset 3px. The only round forms are drawn ones: timeline nodes and graph nodes, which are drawing marks, not UI chrome. The scale thumb is an engraved index (a pointed pentagon, 14 by 26px), not a dot.

## Components

### Links
Ink text with a 1px underline in silver at 0.22em offset. Hover darkens the underline to ink and sweeps a lead-white wash in from the left behind the lower half of the text (260ms, ease-out). Navigation and title links hide the underline at rest and show it on hover; the current page keeps underline and wash.

### Buttons
- **Shape:** square (0).
- **Action:** transparent, 1px ink border, Mona Sans label 15px, padding 0.6em 1em.
- **Hover / Focus:** lead-white wash fill; 2px ink focus outline.
- **Segmented choice:** a 1px ink box divided by ink rules; selected segment fills with ink and takes the ground colour as text. Used for presets, units and the Day / Auto / Night switch.
- Primary calls to action on content pages are text links, not buttons.

### Ledgers
The house list and table. A full ink rule on top, 28% rules between rows, firm or title in Garamond step-1, role and dates in Mona Sans metalpoint, durations right-aligned. Collapses to stacked rows on mobile.

### Inputs / Fields
- **Style:** a ruled field: no box, no fill, a 1px ink baseline; value in Mona Sans step-2 tabular, unit beside it in metalpoint.
- **Focus:** baseline thickens to 2px.
- **Error:** baseline turns dashed; message in Mona Sans 13px ink.
- **Scale:** range input drawn as an engraved rule with major and minor ticks and an ink index; value printed beside the label.

### Navigation
Wordmark in Castoro left, four Mona Sans links plus Contact right, baseline-aligned in a thin top band. Below 640px the links spread across the full width on a second row and Contact drops (the footer carries it).

### Readout figures
Mona Sans step-2 figures under a 28% rule with a metalpoint label; the key figure spans the row under a full ink rule and is set in Castoro at step-5.

### Drawn study
A figure whose SVG uses the shared stroke grammar: ink 1.25px, fine 0.75px, bold 2px, metalpoint dashed 3/3 construction lines, lead-white heightening 2.5px; dimension lettering in condensed Mona Sans, annotations in Garamond italic. On first load the ink draws itself (1.6s, ease-out cubic-bezier(0.16, 1, 0.3, 1)) and heightening settles after; static under reduced motion and without JS.

### Venture plate
A dark tipped-in print in the venture's own identity, with an inner plate mark, its own accent and link style, live facts as a ruled figure row, and a plain "Open" link.

## Do's and Don'ts

### Do:
- **Do** set every surface on the drenched carta ground with iron-gall ink; use metalpoint for secondary text only.
- **Do** build structure from 1px ink rules (boundaries) and 28% rules (rows), never from boxes or fills.
- **Do** use Garamond sentence case for every page, section and band title.
- **Do** set interface text, ledgers and figures in Mona Sans with lining tabular numerals.
- **Do** keep drawings to the shared stroke grammar and give each one real dimension or annotation lettering.
- **Do** keep at most one drawing per viewport on Home; drawings are signatures.
- **Do** frame ventures as tipped-in plates in their own identity.

### Don't:
- **Don't** round corners on controls, plates, fields or tables.
- **Don't** cast shadows on the sheet; only venture plates lift.
- **Don't** use Castoro capitals for section titles, labels or navigation.
- **Don't** set text in silver; it fails contrast on carta and is reserved for underlines and construction lines.
- **Don't** bring the ventures' teal or blacks onto the sheet.
- **Don't** add card grids, headshot cards or tinted feature boxes.
- **Don't** add small uppercase tracked labels above headings.
