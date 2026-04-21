# CHANGELOG

## 2026-04-21 · SA5 cut, ZM8 → ZM4 reorder, LH10 full-banner fix, LW7 bullet

- **SA5 "Themes (transition)" cut.** Per the prior CLAUDE.md "MAYBE I DONT need this anymore" flag, the bare transition slide between Data analysis (SA4) and the three theme testimonials was removed. SA6–SA12 renumbered to SA5–SA11. Şule's section now runs 11 content slides (SA1–SA11). Deck scrubber `max=48 → 47`, counter `1/48 → 1/47`.
- **ZM8 → ZM4 reorder** (from earlier in the day, now reflected in `outline-zm.md`). "Infrastructure and Instructional Design" moves to ZM4 to frame the pilot-design lens before the breakdown/hyperparameters/AmigAI sequence. Prior ZM4–ZM7 shift to ZM5–ZM8; ZM9/ZM10 unchanged. Canvas viz for "Teaching Infrastructure through Breakdown" travels with its content: `src/zm4-viz.js` → `src/zm5-viz.js`, `#zm4-canvas` → `#zm5-canvas`.
- **LH10 NARST banner — full visibility.** Previous commit had tried `object-fit: cover` inline on the `<img>` plus `min-height: 400px` on the figure, but the existing `.stage img { max-width: 50% }` rule meant `cover` just horizontally clipped the banner inside the narrow box. Removed both inline styles; raised `max-width: 50% → 100%` in the `laurie-10` CSS override so the banner fills the right-panel stage at `object-fit: contain` without cropping.
- **LW7 "The Google Question"** — added "Supportive relationship" as a third bullet after "3 years / 1m" and "Second grant: Empire AI Initiative."

## 2026-04-21 · Closing slide (QR + contact) + LW5 wording

- **LW5 "The CUNY Context"** — final bullet changed "Vulnerable population" → "Minoritized population" in both `index.html` and `slides.md` per Luke's revised wording.
- **New closing slide** (`data-slide="closing"`, position 48). Echoes the title slide: same Domain Warping WebGL canvas (via refactored `initAllDomainwarp()` that now iterates `.title-domainwarp` class instead of the single `#title-domainwarp` ID), same `.title-card` + `.title-overlay` scaffold. Content:
  - Title + subtitle echo ("Community, Transparency & Tinkering for Just Futures" / "Lessons Learned from the Critical AI Literacy Institute (CALI)")
  - Links block: GCTLC → `cuny.is/teaching`, CALI → `cuny.is/cali`
  - Email row: `lwaltzer@gc.cuny.edu · lhurson@gc.cuny.edu · zmuhlbauer@gc.cuny.edu · saksoy@brockport.edu`
  - QR code (`images/qr-cuny-is-cali-narst.png`, 740×740 pre-generated with `qrcode` / error-correct H) linking to `https://cuny.is/cali-narst`, captioned `scan · cuny.is/cali-narst`.
- **CSS `.slide-closing`** — 2-col grid (contact block + QR). All font sizes flow through `--fs-*` tokens (`--fs-display`, `--fs-subhead`, `--fs-body-compact`, `--fs-label`, `--fs-meta`, `--fs-cite`). No new inline clamps.
- **Scrubber + counter** bumped `47 → 48`. Cache-buster `?v=20260421d → ?v=20260421e`.

## 2026-04-21 · Consolidated references slide + font sub-clamp audit

Two passes today: (1) a type-consistency audit that pulled every body-text
`clamp()` back onto the `--fs-*` tokens at `:root`; (2) a new consolidated
references slide appended at the end of the deck so attendees can capture
the citation list without interrupting the body of each talk.

### Font token consolidation

- Removed the `section.slide[data-slide^="laurie-"] .content li { font-size: clamp(25px, 2.35vw, 38px) }` rule. That selector was overriding `--fs-dense-li` for every Laurie slide, producing 38px bullets while Luke/Zach/Sule ran at 26px dense / 32px body — a ~45% cross-presenter size jump that failed the eye test and directly caused the laurie-3 and laurie-8 dense-slide vertical overflow.
- Dropped inline sub-clamps on LH4 (`.col h3`, `.col ol li`), LH7 (`.quote-stack blockquote`, `cite`), and LH10 (`.quote-stack blockquote`, `.parallel-points li`). All bodies now read from `--fs-body`, `--fs-body-compact`, `--fs-quote`, `--fs-quote-tight`, `--fs-quote-dense`, `--fs-dense-li`, `--fs-label`, `--fs-cite`, `--fs-meta`.
- Scoped the remaining Laurie-wide `line-height` / `margin-bottom` rule with `:not(.dense-quotes)` so LH11 (Collective World-building) isn't hijacked by the general Laurie bump.
- Tightened LH4 syllabus margins (0.55em → 0.38em) and LH11 testimonial gaps (quote-stack gap 0.55em → 0.42em, blockquote padding 0.55em → 0.4em, parallel-points margin-top 0.65em → 0.4em) to keep both slides clear of the sticky footer at 768h laptop-panel heights — no type-size change.

### References slide (slide 46)

- Added `<section class="slide slide-two-col-text slide-references" data-slide="references" aria-label="Paper references and further reading">` after sule-12.
- Layout: single flat alphabetical `<ul class="reference-list">` with 23 entries, balanced across two columns via CSS `column-count: 2` + `column-rule`. No per-presenter columns — Luke has no formal citations, and the alphabetical order keeps the list compact.
- Type: `--fs-body-compact` on list items, `--fs-label` via the existing `.content .label` pattern. No inline clamps introduced.
- Full bibliographic expansion (volume/journal/pages) deferred to the presenters per TODO.md.

### Files touched

- `index.html` — new references slide after sule-12; scrubber `max="45" → "46"`; counter `1 / 45 → 1 / 46`; cache-buster `?v=20260421c → ?v=20260421d`.
- `src/styles.css` — appended `.slide-references .reference-list` block near the `.slide-two-col-text` rules; removed inline sub-clamps on laurie-4, laurie-7, laurie-10 overrides; simplified Laurie-wide rule to layout-only and scoped to `:not(.dense-quotes)`.
- `TODO.md` — removed the "References slides" item; added LH1, ZM5, ZM8, SA1, SA2 as outstanding `Visual:` specs; appended a "References slide — expansion pending" section listing short-form entries that still need full bibliographic info.
- `CLAUDE.md` — structure counts updated (Luke 8, Laurie 11, Zach 9, Sule 12, 46 total including references slide).

---

## 2026-04-20 · Laurie section revisions (per presenter feedback)

Second Laurie pass driven by reviewing the deck slide-by-slide. One slide cut, the full section renumbered, several visual adjustments, and a uniform font bump for readability at presentation distance.

### Structure

- **LH2 "The Critical AI Literacy Institute" cut** at Laurie's request. Remaining LH3–LH11 renumbered LH2–LH10 (data-slide attributes `laurie-3` … `laurie-11` → `laurie-2` … `laurie-10`, visible labels + aria-labels adjusted). Laurie now runs 10 content slides.
- **Total: 46 → 45 slides.** Scrubber `max` and counter text updated to 45.

### Slide-level revisions

- **LH1 Overview** — added a right-panel visual (`images/faculty-questions.png`, orphaned when LH2 was cut). The slide had an empty `diagram-stage` previously ("visualization not showing").
- **LH4 Research and Information in the Digital Age** — two-col grid shifted from `1fr 1fr` to `1.4fr 1fr` so the Approach bullets on the left get more breathing room. Syllabus column remains legible with a minor font tweak.
- **LH7 Statistical Methods in Earth and Atmospheric Sciences** — bumped Spencer Hill quote from `--fs-quote-tight` to `clamp(20px, 1.85vw, 28px)`, cite size slightly up for legibility.
- **LH9 Critical AI Literacy & Student Agency** — cropped `narst-image.jpg` to 50% of the right-panel stage width, centered, leaving substantial whitespace around the image.
- **LH10 Critical AI Literacy, Agency, & Collective World-building** — kept as pure testimonial per SLIDES.md SLIDE 11 (no visual). Quote font bumped from `--fs-quote-dense` to `--fs-quote-tight`; bullet font from `--fs-body-compact` to `--fs-body` for readability.
- **Uniform Laurie bump** — all list items in `section.slide[data-slide^="laurie-"]` now render at `clamp(25px, 2.35vw, 38px)` / line-height 1.4 for presentation readability.

### Files touched

- `index.html` — LH2 block removed; laurie-3..11 renumbered to laurie-2..10; LH1 image added; LH10 figure-stage populated with narst-image; scrubber `max="46" → "45"`; counter `1 / 46 → 1 / 45`.
- `src/styles.css` — appended Laurie section rules; LH2 dense-quotes comment updated to reference LH10.
- `OUTLINE.md` — Laurie table renumbered; total 46 → 45; added Laurie-2026-04-20 cut note.
- `README.md` — Laurie count 11 → 10; total 46 → 45.
- `CLAUDE.md` — structure counts updated; cut note reflects both LH2 removals.

---

## 2026-04-20 · deck refinements (post-port)

Same-day follow-up to the initial port. Reconciles the deck with the SLIDES.md source after a second read, removes dead infrastructure, and tightens a few layouts.

### Structure

- **LH2 "Defining AI Literacy" cut.** Defining-literacy content absorbed into LH1 Overview + LH3 The Critical AI Literacy Institute. Remaining Laurie slides renumbered. Laurie now runs 11 content slides (LH1–LH11), not 13.
- **ZM4 "Historical OCR prototype" cut.** Remaining Zach slides renumbered. Zach now runs 10 content slides (ZM1–ZM10).
- **SA Conclusion split.** The single Conclusion slide was split into SA11 (Frame #4 — Learning & Using STEM to Promote Justice) and SA12 (Frame #5 — Envisioning Sustainable Futures) so each NASEM equity frame gets its own beat.
- **References slides removed** for all four presenters. Citations live in the paper, not on the deck.
- **Total: 51 → 46 slides.** Scrubber `max` and counter text updated to 46. Slide-navigation deep-link anchors (`#slide-N`) still resolve in order.

### LW5 infrastructure

- **Leaflet map removed.** LW5 "The CUNY Context" now uses a static `images/cuny.png` per the SLIDES.md visual spec. Removed the vendored Leaflet `<link>`/`<script>` imports, the inline `createMap()` block, the `__cunyBoroughReveal` hook, and the borough step-reveal sync calls in `src/slides.js`.
- `vendor/leaflet/` and `vendor/tiles/` retained on disk but no longer referenced — reclaimable ~7 MB if unused.
- Map-related CSS hooks (`.tiles-unavailable`, `.map-mount`, `.campus-*`) remain in `src/styles.css` but have no DOM target.

### Header + footer

- **NARST logo (header) now a link** to https://narst.org/conferences/2026-annual-conference (opens new tab, `rel="noopener"`). Wrapped in `.header-logo-link`.
- **TLC logo (footer) now a link** to https://tlc.commons.gc.cuny.edu/ (opens new tab). Wrapped in `.footer-logo-link`.
- **NARST logo enlarged** from `clamp(20px, 2.4vw, 30px)` height to `clamp(34px, 4.5vw, 52px)` — matches the TLC logo exactly so the two read as paired institutional badges. Tagline "A global organization for improving science education through research" is now legible at presentation distance.
- `--header-h` bumped `48px → 76px` to accommodate the enlarged NARST logo with breathing room.
- **Logos vertically aligned.** Both sit at x=18px from the viewport's left edge. Achieved by moving the TLC logo out of `.footer-slider` into a sibling link, absolutely-positioned at `left: 18px`. `.sticky-footer` gains a `clamp(90px, 9vw, 130px)` padding-left reservation so slider controls clear the logo on narrow viewports.

### LW6 "Our Goals" ladder layout

- Removed the `max-width: 26ch` constraint that was forcing "Reasoned Adoption ↔ Informed Refusal" (36 chars) to wrap to 2 lines, which in turn pushed the third goal off the frame.
- Font-size ceiling reduced `clamp(30px, 4.6vw, 68px) → clamp(28px, 3.8vw, 58px)`; `white-space: nowrap` above 720px guarantees each goal sits on a single line.
- Added a faint sage diagonal guide-rule behind the list (`::before` on `.ladder-list`, Luke's `--accent-luke` at ~35% opacity, 116°) reinforcing the SLIDES.md direction *"one frame — arrayed across diagonally."*
- Indent stops tightened proportionally: `clamp(1.5rem, 10vw, 8rem)` and `clamp(3rem, 20vw, 16rem)` (down from 12rem/22rem caps).
- Mobile media-query cleaned up to comply with the typography token contract: no font-size override (base clamp's 28px floor handles it); mobile rule is now layout-only (restores wrapping, trims indents).

### Files touched

- `index.html` — header logo wrapped in link; TLC logo moved out of `.footer-slider` into a sibling link; footer-slider no longer contains the logo `<img>`.
- `src/styles.css` — `--header-h` bumped; `.header-logo`/`.footer-logo` sizing and link wrappers; `.sticky-footer` padding-left reservation; LW6 ladder rule rewritten.
- `OUTLINE.md` — renumbered for 46 slides; per-presenter counts and per-slide IDs reflect LH2/ZM4 cuts and SA split.
- `README.md` — slide counts corrected (Luke 8, Laurie 11, Zach 10, Şule 12); session title re-typeset with ampersand; Şule spelled with diacritic.
- `CLAUDE.md` — porting-uncertainties list pruned of LH12/LH13 references; logo-link + LW6 contracts added.

---

## 2026-04-20 · NARST Slides port

Ported the authoritative "NARST Slides" source (Luke, Laurie, Şule content; Zach left as-is) into `index.html`, replacing the Lorem Ipsum scaffolding. Every change is listed below.

### Global

- Overall title slide: wording updated from "Community, Transparency, and Tinkering for Just Futures / Lessons Learned from the Critical AI Literacy Institute" to "Community, Transparency & Tinkering for Just Futures / Lessons Learned from the Critical AI Literacy Institute (CALI)". Panelist list punctuation changed from interpuncts to comma-separated list ("Luke Waltzer, Laurie Hurson, Zach Muhlbauer, and Sule Aksoy"). Institution line changed to "CUNY Graduate Center, New York City, NY, USA".
- **Standalone campus map slide (prior deck slide 2, `data-slide="campus-map"`) dropped.** The upgraded map lives only on LW5.
- Scrubber `max` and counter text updated 50 → 51.
- New CSS layouts appended to `src/styles.css`: `.slide-testimonial`, `.quote-stack`, `.slide-two-col-text` + `.two-col-inner`, `.syllabus-list`, `.borough-steps`, `.campus-legend.compact`, `.campus-label-permanent.non-participating`, paper-title variant (`[data-variant="paper-title"]`) for `.slide-break`.
- New JS: `syncBoroughForward/Backward` and `syncAllBoroughsOnShow` in `src/slides.js`, wired into `advance()`, `retreat()`, and `show()`. Inline map script exposes `window.__cunyBoroughReveal(borough, show)`.

### Luke Waltzer section

- **Section divider → paper-title slide.** `data-slide="break-luke"` previously held "Community / Ten talks — one references slide". Replaced with the full paper title "The Critical AI Literacy Institute: Asserting and Preserving Scholarly Agency in the Age of AI" + the source's single affiliation line "Director, Teaching and Learning Center, CUNY Graduate Center". Added `data-variant="paper-title"`.
- **LW1 (`luke-1`)** — was `luke-talk-1` with placeholder Lorem Ipsum titled "The Critical AI Literacy Institute". Now "About the Teaching and Learning Center" with the one source bullet. Visual slot: TLC 1–4 gallery (TBD).
- **LW2 (`luke-2`)** — was `luke-talk-2`. Now "About the Critical AI Literacy Institute (CALI)" with Origins + Elements (Faculty Development / Research / Research & Development / Advocacy). Visual: `images/cali-website-home.png` (copied from `narst-00-01-18/CALI Website home.png`).
- **LW3 (`luke-3`)** — was `luke-talk-3` "Institutional context". Now "Grounding Scholarship" with Critical University Studies / Critical Ed Tech / DH, Science Education, Educational Development.
- **LW4 (`luke-4`)** — was `luke-talk-4` "Project scope". Now "Defining Critical AI Literacy" with Literacies / Critical or Comprehensive AI Literacies / Why the need?
- **LW5 (`luke-5`)** — was `luke-talk-5` "Faculty, student, and staff agency". Now **"The CUNY Context"** — this slide inherits the full campus map, upgraded: full-CUNY coverage (18 campuses), participating (CALI 1–2) vs other color coding, borough step-reveals sequenced Staten Island → Manhattan → Bronx → Queens → Brooklyn. Compact two-row legend. Map id changed from `campus-map` to `cuny-map`.
- **LW6 (`luke-6`)** — was `luke-talk-6` "Critical AI studies framing". Now "Our Goals" with Reasoned Adoption ↔ Informed Refusal / Communities of Practice / Research, Tinker, Advocate.
- **LW7 (`luke-7`)** — was `luke-talk-7` "Critical university studies framing". Now "The Google Question" with 3 years/1m and Empire AI Initiative.
- **LW8 (`luke-8`)** — was `luke-talk-8` "Scholarship of teaching and learning". Now "CALI's Strategy" with Emphasize agency / Identify small teaching moments / Ground interventions in critical inquiry.
- **Dropped slides** — prior `luke-talk-9` "Preliminary findings" and `luke-talk-10` "Institutional implications". The NARST source contains 8 content slides, not 10.
- **References slide (`luke-references`)** — unchanged structure; label updated from "References" / "Luke Waltzer references" / "Luke Waltzer" to "Luke Waltzer · References" / "References" / "To be filled in". Content still placeholder.

### Laurie Hurson section

- **Section divider → paper-title slide.** `data-slide="break-laurie"` previously held "Transparency / Ten talks — one references slide". Replaced with "Fostering Critical AI Literacy as Collective World-Building: Curricular Models for Teaching With/About Generative AI" + "CALI Curricular Lead & Assistant Director of Open Education" + "The Teaching and Learning Center, CUNY Graduate Center". Added `data-variant="paper-title"`.
- **LH1 (`laurie-1`)** — "Overview" with outline list: AI Literacy / CALI Curriculum / Institute as Method / Faculty Interventions / Fostering Critical AI Literacy as Collective World-Building.
- **LH2 (`laurie-2`)** — "Defining AI Literacy". **Layout changed to `.slide-testimonial` (single column with `.quote-stack`).** Two block quotes (Long & Magerko 2020; Almatrafi et al. 2024) with `<cite>` attributions; two arrow-prefixed follow-on bullets for context-dependent definitions.
- **LH3 (`laurie-3`)** — "The Critical AI Literacy Institute" with Disciplinary Questions / Critical Stance / Reflective, collaborative, critical inquiry / Mixed methods and longitudinal iteration. Visual: `images/cali-website-home.png`.
- **LH4 (`laurie-4`)** — "Faculty Development | Spring Meetings" with Reflective Writing / Framing disciplinary approaches / Interdisciplinary Collaboration. Visual: `images/faculty-questions.png`.
- **LH5 (`laurie-5`)** — "Faculty Development | Summer Institute" with Focus / Methods / Goals (Lave & Wenger, 1991; Haraway, 1988). Visual: `images/community-of-practice.jpg`.
- **LH6 (`laurie-6`)** — "Faculty Interventions" listing Sarah Cohn (CCNY) / Krystyna Michael (Hostos) / Martha Nadell (Brooklyn) / Spencer Hill (CCNY). Visual: `images/faculty-interventions.png`.
- **LH7 (`laurie-7`)** — "Research and Information in the Digital Age". **Layout changed to `.slide-two-col-text` with `.two-col-inner`.** Left column: 3 approach bullets. Right column: 8-item syllabus list (LLMs / Evaluating LLM output / Labor, environment, ethics / Plagiarism, cheating, academic integrity / Cognition / Creativity / Alternative models & resistance / Futures).
- **LH8 (`laurie-8`)** — "Integrated Reading and Composition" with Creativity and labor / Student Expertise / Reflection on value of writing. Visual: gallery of `images/km-1.png` + `images/km-5.png` (uses existing `.stage-gallery` scaffold; `data-fragSync="1"` disables auto-rotation to keep focus on text).
- **LH9 (`laurie-9`)** — "Introduction to History and Literature" with Readings on genAI / Collaborative AI class policy / Custom bots for brainstorming. Visual: `images/md-brainstormer.png`.
- **LH10 (`laurie-10`)** — "Statistical Methods in Earth and Atmospheric Sciences". **Layout changed to `.slide-testimonial.tall`.** Left bullets ("What are all the ways…" question + A/B + Claude Code discussion) above a single very long block quote (Spencer Hill faculty reflection), with `<cite>Spencer Hill, City College · CALI faculty reflection</cite>`.
- **LH11 (`laurie-11`)** — "Pedagogical Approaches for Teaching Critical AI Literacy". **Source typo "Pedagogiocal" corrected to "Pedagogical"** (flagged in CLAUDE.md uncertainties).
- **LH12 (`laurie-12`)** — "Critical AI Literacy and Student Agency" with 5 bullets (including Cottom citation).
- **LH13 (`laurie-13`)** — "Critical AI Literacy… as collective world-building" with 6 bullets (Haraway, Lave & Wenger, hooks citations).
- **Added slides** — LH11, LH12, LH13 are new (prior deck had 10 Laurie slides; NARST source has 13).
- **References slide (`laurie-references`)** — unchanged structure; label updated "Laurie Hurson · References" / "References" / "To be filled in".

### Zach Muhlbauer section

- **No changes.** Section divider, all 10 content slides (ZM1–ZM10), and references slide preserved exactly as in the prior deck. NARST source contained empty placeholders only.

### Şule Aksoy section

- **Section divider → paper-title slide.** Renamed from "Science Education and Resistance / Ten talks — one references slide" to the full paper title "Beyond the Black Box: Resisting AI Inevitability Rhetoric and Implications for Science Education". Display name changed from "Sule" to "Şule" (honorific diacritic, `&Scedil;`). Added `data-variant="paper-title"`. **No presenter-role / affiliation lines** — source contained only the paper title for Şule's title slide (unlike Luke and Laurie's title slides, which have left-panel role + affiliation).
- **SA1 (`sule-1`)** — "AI inevitability rhetoric as a knowledge claim deserving scientific scrutiny" (expanded title vs prior "Beyond the Black Box") with 4 source bullets.
- **SA2 (`sule-2`)** — "Conceptual Background" with Freire / Morales-Doyle / Bang / humanities-arts-social-sciences citation (TBD).
- **SA3 (`sule-3`)** — "CALI as evidence" with 3 bullets (Faculty reflections / written reflections / qualitative case study).
- **SA4 (`sule-4`)** — "Data analysis" with 4 grounded-theory bullets. **Source numbered this SLIDE 3 (duplicate of SA3); user directed to treat as SA4 and bump remaining slides down.**
- **SA5 (`sule-5`)** — "Themes" transition slide. **Source notes "MAYBE I DONT need this anymore"; retained for completeness, flagged in CLAUDE.md.**
- **SA6 (`sule-6`)** — "Theme #1 — Critique of Techno-determinism". **Layout `.slide-testimonial`** with two block quotes (both source-italicized).
- **SA7 (`sule-7`)** — "Theme #2 — Threat to Agency". **Layout `.slide-testimonial`** with two block quotes. Source typo "dishearthing" corrected to "disheartening" (flagged in CLAUDE.md).
- **Source typo "Inevitabiluty" silently corrected to "Inevitability"** on Şule's paper-title `<h1>` and throughout Sule-section `aria-label`s (flagged in CLAUDE.md).
- **SA8 (`sule-8`)** — "Theme #3 — Material Implications". **Layout `.slide-testimonial`** with two block quotes.
- **SA9 (`sule-9`)** — "Lessons Learned from CALI" with four named entries (Luke / Laurie / Zach / Şule) each with sub-bullet.
- **SA10 (`sule-10`)** — "Implications for Science Education" with Epistemic agency / Sensemaking / Interdisciplinary thinking / Pedagogy: SSI-based instruction.
- **SA11 (`sule-11`)** — "Conclusion". **Layout `.slide-testimonial`** with two long block quotes (CALI 2.0 Adjunct faculty, CS; Preservice Elementary Teacher).
- **Added slide** — SA11 is new (prior deck had 10 Sule slides; NARST source has 11 after SLIDE 3 duplicate fix).
- **References slide (`sule-references`)** — label updated "Şule Aksoy · References" / "References" / "To be filled in".

### Dropped from source (notes-to-self)

The following source items were not rendered as slide content, per the rule that notes-to-self, visual descriptions, and bracketed meta-commentary are not slide text:

- Pretext block before Title Slide ("CUNY Context … CALI Interdisciplinary Leadership Collective Historian, digital humanist, an environmental psychologist and science educator").
- Every `Notes: …` line (including "disciplinary divergence but shared concerns…", "mention the disservice to students comment", "IDK what to say here", "emotionally squished students" discussion note under SA11).
- Every `Visual:` descriptor line (used to choose the image slot, not rendered as text).
- Bracketed inline meta-commentary: "(maybe share a link to zotero)", "tbd", "MAYBE I DONT need this anymore".
- "That paper on in defense of humanities, arts, and social sciences …" rendered as a visible TBD-citation bullet on SA2 with flag in CLAUDE.md.

### Image assets imported

Copied from `~/Desktop/STUDIO/projects/thinkering/narst-00-01-18/` into `images/` and renamed:

- `CALI Website home.png` → `cali-website-home.png`
- `Community of Practice.jpg` → `community-of-practice.jpg`
- `Faculty interventions.png` → `faculty-interventions.png`
- `Faculty questions.png` → `faculty-questions.png`
- `KM 1.png` → `km-1.png`
- `KM 5.png` → `km-5.png`
- `MD brainstormer.png` → `md-brainstormer.png`
- `Mixed Methods 2.jpg` → `mixed-methods-2.jpg` (not yet placed on any slide; retained for possible future use, see CLAUDE.md).

### Files touched

- `index.html` — slides 1 and 3–26 rewritten; slide 2 dropped; slides 39–51 rewritten (Sule); slides 27–38 (Zach) unchanged. Inline map script extended with full-CUNY data, dual-color markers, compact legend, and `window.__cunyBoroughReveal` hook. Footer scrubber `max` and counter text bumped to 51.
- `src/styles.css` — new layouts appended at end of file; no existing rules modified.
- `src/slides.js` — borough-step sync added to `advance()`, `retreat()`, `show()`; gallery and lightbox paths untouched.
- `OUTLINE.md` — fully rewritten with per-presenter reset numbering.
- `CLAUDE.md` — Porting uncertainties section appended.
- `CHANGELOG.md` — this file, newly created.
