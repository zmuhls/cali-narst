# CLAUDE.md

## Project

This repository contains the NARST 2026 CALI presentation deck.

Current repository target:
- GitHub repo: `CUNY-AI-Lab/cali-narst`
- Deployment target: GitHub Pages from `main`

## Current deck rules

- Single-page HTML slide deck, no build system required
- Keep `index.html` as the canonical deck file
- Use `src/styles.css` and `src/slides.js` for shared behavior and styling
- Prefer real session metadata and presenter names
- Keep placeholder text where real talk prose has not been approved yet
- Preserve large readable typography suitable for live presentation

## Current structure requirement

The deck should follow this structure:

- 1 title slide
- 4 section-divider (paper-title) slides, one for each presenter
- content slides per presenter (currently: Luke 8, Laurie 11, Zach 8, Şule 10)
- 1 consolidated references slide (added 2026-04-21, position 43)
- 1 closing slide with QR + contact info (added 2026-04-21, position 44)

That yields 44 total slides. Per-presenter references slides were removed
2026-04-20 and replaced 2026-04-21 with a single alphabetical
"References &amp; Further Reading" slide (`data-slide="references"`).
The closing slide (`data-slide="closing"`) echoes the title slide's
Domain Warping canvas as a visual bookend and carries a QR code pointing
at `cuny.is/cali-narst` plus TLC / CALI links and presenter emails.

## Presenters and talk blocks

1. Luke Waltzer, Community
2. Laurie Hurson, Transparency
3. Zach Muhlbauer, Tinkering
4. Sule Aksoy, Science education and resistance

## Placeholder policy

For now, use placeholders for:
- body paragraphs
- bullet detail
- charts that do not yet have approved data
- references not yet entered

But keep these real:
- session title
- subtitle
- presenter names
- session date/time/location
- section titles
- talk titles drawn from the PDF

## Visual features already added

- `frappe-charts` included by CDN for future figures
- `p5.js` included by CDN for generative or animated visual space

## Local-asset contract (added 2026-04-20)

The deck runs entirely from `file://` with no network. Two things make
that work; do not undo them without replacing the local asset path:

- `vendor/fonts/fonts.css` + 27 `vendor/fonts/*.woff2` — Newsreader,
  IBM Plex Sans, IBM Plex Mono. Generated from a Google Fonts response
  with all `https://fonts.gstatic.com/...` URLs rewritten to bare
  filenames.
- `images/*` — every slide visual (gif, png, jpg) is copied locally.
  Source files live in `images-2/{Presenter}/`; canonical deck refs
  use the lowercase-hyphenated copies in `images/`.

`vendor/leaflet/` and `vendor/tiles/` are retained on disk but no longer
referenced by the deck — Leaflet was removed 2026-04-20 (see below). They
can be deleted to reclaim ~7 MB if nobody plans to revive the map.

## Leaflet removal (2026-04-20)

LW5 ("The CUNY Context") used a vendored Leaflet map (offline tiles +
campus circles + IntersectionObserver/ResizeObserver lifecycle). It was
replaced with a static `images/cuny.png` per the SLIDES.md visual spec.
The Leaflet `<link>`/`<script>` imports and the inline `createMap()` /
`__cunyBoroughReveal` JS block were removed from `index.html`.
Map-related CSS hooks (`.tiles-unavailable`, `.map-mount`, `.campus-*`)
remain in `src/styles.css` but no longer have any DOM target — safe to
clean up in a future pass.

## Typography token contract (added 2026-04-20)

Type sizes live as `--fs-*` custom properties at `:root` in
`src/styles.css`. Selectors reference the tokens; media queries toggle
*layout only*, not size. Do not add `font-size: <px>` overrides inside
`@media (max-width: …)` blocks — clamp() floors handle small viewports.
See `AUDIT-cali-hardening.md` for the full token list and rationale.

## Header + footer logo contract (added 2026-04-20)

The NARST (top-left) and TLC (bottom-left) logos are a matched pair:

- Same size via the same clamp: `height: clamp(34px, 4.5vw, 52px)`.
- Same x-offset (18px from the viewport edge). NARST sits there naturally
  as the header's first flex child; TLC is absolutely-positioned
  (`.footer-logo-link { position: absolute; left: 18px; top: 50% }`)
  because `.footer-slider` is `max-width: 1280px` centered and would
  otherwise drift right at wide viewports.
- Both logos are wrapped in `<a target="_blank" rel="noopener">` links:
  - NARST → `https://narst.org/conferences/2026-annual-conference`
  - TLC   → `https://tlc.commons.gc.cuny.edu/`
- `.sticky-footer` carries `padding-left: clamp(90px, 9vw, 130px)` to
  reserve space for the absolute TLC logo so slider controls never
  collide with it on narrow viewports. Do not reduce this padding
  without also re-homing the TLC logo.
- `--header-h: 76px` is sized for the enlarged NARST logo with breathing
  room. Reducing `--header-h` will clip the header badge.

## LW6 "Our Goals" ladder contract (added 2026-04-20)

LW6 is the deck's lone ladder layout — three goals cascade from
top-left to bottom-right as one diagonal array. The source note reads
*"One frame — arrayed across diagonally."*

- `.ladder-list li` uses `white-space: nowrap` above 720px. The longest
  bullet ("Reasoned Adoption ↔ Informed Refusal", 36 chars) only fits on
  one line at the current `clamp(28px, 3.8vw, 58px)` size; reverting the
  font-size ceiling past ~60px or re-introducing a `max-width` in `ch`
  will send it back into a 2-line wrap and push bullet 3 off-frame.
- The faint sage diagonal rule behind the list is a `::before` on
  `.ladder-list` using `--accent-luke` at ~35% opacity, drawn via
  `linear-gradient(116deg, …)`. `isolation: isolate` on the ul keeps
  `z-index: -1` confined to the ladder's stacking context.
- The mobile `@media (max-width: 720px)` block is layout-only
  (white-space: normal + tighter indents). Don't re-add a font-size
  override there — the base clamp's 28px floor already handles small
  viewports.

## Files to keep updated together

When changing structure, update these together:
- `index.html`
- `README.md`
- `OUTLINE.md`
- `CLAUDE.md`

## Notes for future edits

- Keep slides accessible with semantic headings where possible
- Maintain keyboard and scrubber navigation
- Prefer editable HTML over screenshot-heavy slides
- Use references slides to stage presenter-specific citations later

## Porting uncertainties (2026-04-20)

The NARST Slides source was ported into `index.html` today. The following items need resolution tomorrow before the session on 2026-04-21:

- **LW1 visual — TLC 1–4 gallery**: source says "Visual: tlc1, tlc2, tlc3, tlc4". No image files were supplied for `tlc1.png` etc. Currently a placeholder `diagram-card` sits in the stage. Decide: supply the four images, or reuse existing TLC-related assets (`images/TLC-Logo-v4-No-GC-white.png` is already used in the footer).
- **LW7 visual — "a gif"**: source says "Visual: A gif". No animated asset supplied; placeholder in place. Decide which GIF to embed (Google acquisition-era visual? CUNY-investment chart?).
- **LW3 visual — "Array of images of key books (or maybe slideshow?)"**: source is explicitly uncertain. Placeholder in place. Decide whether to pull book covers for Critical University Studies / Critical Ed Tech / DH titles.
- **LW4 visual — "Screenshots of key texts"**: similarly unspecified; placeholder in place.
- **LW2, LW6, LW8, LH9, LH11, SA1, SA2, SA3, SA8, SA9 visuals — "tbd"**: source marks these as `Visual: tbd` or equivalent. Placeholders in place. (LH and SA numbers here reference the current post-renumber deck, not the original port.)
- **LH3 citations** (Summer Institute): Lave & Wenger, 1991; Haraway, 1988; Harding, 1993 render inline in the Goals bullet. References slides no longer exist — confirm in-talk attribution norms with Laurie.
- **LH8 quote attribution** (Statistical Methods): the long testimonial is rendered with `<cite>Spencer Hill, City College · CALI faculty reflection</cite>`. Source did not formally attribute the quote; inference drawn from LH8 being the Spencer Hill course. Confirm before presenting.
- **LH11 Haraway inline cite** (Collective World-building): the long Haraway 1988 quote renders with `<cite>Haraway, 1988</cite>` alongside the hooks and Barad citations. Confirm attribution formatting with Laurie.
- **SA2 citation — "That paper on in defense of humanities, arts, and social sciences …"**: rendered on SA2 as a visible TBD-citation bullet. The actual citation is still unknown.
- **SA5 / SA6 / SA7 / SA10 / SA11 block-quote attributions**: all quotes are attributed to "CALI faculty reflection" or the specific persona cited in the source (CALI 2.0 Adjunct faculty, CS; Preservice Elementary Teacher). Verify attributions with Şule.
- **SA7 typo "dishearthing"**: corrected to "disheartening". Flag for Şule.
- **Source typo "Inevitabiluty" on Şule's paper title and SA2**: silently corrected to "Inevitability" on the break-sule paper-title slide and in all Sule-section aria-labels. Flag for Şule.
- **Şule paper-title slide has no role / affiliation line**: the NARST Slides source gives Şule only the paper title (no left-panel role or institutional line like Luke and Laurie have). The paper-title slide therefore renders with only the panelist name + paper title. Add role + affiliation text if Şule wants parity with the other two paper-title slides.
- **Luke paper-title role line**: normalized 2026-04-21 to match Laurie/Zach/Şule — two lines, `.presenter-role` ("Director") above `.affiliation` ("The Teaching and Learning Center, CUNY Graduate Center"). Earlier single-line `.affiliation` has been replaced.
- **Şule display name**: section divider, labels, and aria-labels use "Şule" (with ş, `&Scedil;`). If the public-facing spelling is "Sule", run a find-and-replace in `index.html`.
- **Title-slide date**: source said "April 22nd, 2024"; retained the NARST-program date "April 21, 2026" (confirmed with user). Eyebrow reads "NARST 2026 · April 21". Adjust if the room block actually spans both days.
- **`images/mixed-methods-2.jpg`**: copied but not yet placed on any slide. Candidate for LH3 or LH4 as alternate mixed-methods visual; decide with Laurie.
- **References slides**: removed 2026-04-20 per Z's direction. Citations live in the paper, not on the deck.

See `CHANGELOG.md` for the full record of what was moved, renamed, and dropped.
