# Critical AI Literacy Institute — Brooklyn College

A 27-slide presentation for the CALI faculty visit to Brooklyn College on March 25, 2026. Single-page HTML deck, no build system, no dependencies.

**Live:** [cuny-ai-lab.github.io/cali-brooklyn](https://cuny-ai-lab.github.io/cali-brooklyn/)

**Presented by:** Luke Waltzer, Laurie Hurson, Zach Muhlbauer
Teaching and Learning Center, CUNY Graduate Center

---

## Slide Overview

| # | Title | Section | Stage |
|---|-------|---------|-------|
| 1 | Title | — | Boids iframe |
| 2 | Origins of CALI | About CALI | Step-grid (4) |
| 3 | CALI as an Intervention | About CALI | Step-grid (4) |
| 4 | Campuses | Cohort 1, 2025 | Table |
| 5 | Disciplines | Cohort 1, 2025 | Table |
| 6 | Faculty Rank | Cohort 1, 2025 | Bar chart |
| 7 | Second CALI Cohort | Cohort 2, 2026 | Step-grid (3) |
| 8 | Campuses | Cohort 2, 2026 | Table |
| 9 | Disciplines | Cohort 2, 2026 | Table |
| 10 | Faculty Rank | Cohort 2, 2026 | Bar chart |
| 11 | **BREAK** — Laurie Hurson | Curriculum & Research | — |
| 12 | Faculty Development | Curriculum | Image |
| 13 | Community of Practice | Curriculum | Image |
| 14 | Mixed Methods | Research | Image |
| 15 | Student Surveys | Research | Gallery (2) |
| 16 | Faculty Interventions | Research | Image |
| 17 | Teaching Critical AI Literacy | Research | Image |
| 18 | **BREAK** — Zach Muhlbauer | T(h)inkering | — |
| 19 | Technical Lead | T(h)inkering | Step-grid (4) |
| 20 | Year 1 Infrastructure | T(h)inkering | Gallery (2, frag-synced) |
| 21 | Piloting on Hugging Face | T(h)inkering | Gallery (2, frag-synced) |
| 22 | <u>Then</u> and Now | T(h)inkering | Image + caption |
| 23 | Then and <u>Now</u> | T(h)inkering | Gallery (3) |
| 24 | T(h)inkering to Come | T(h)inkering | Image + caption |
| 25 | Lessons Learned | T(h)inkering | Step-grid (4) |
| 26 | Policy and Strategy | Looking Ahead | Step-grid (4) |
| 27 | Questions | Discussion | Links |

---

## Structure and Design

The deck uses a custom engine (`src/slides.js`) with no framework dependencies. Each slide is a `<section class="slide">` containing a `.content` panel (text) and a `.stage` panel (visuals). On desktop (720px+) these sit side by side; on mobile they stack vertically.

**Navigation:** Arrow keys, spacebar, or swipe. Esc toggles an overview grid. A sticky footer scrubber allows direct slide access.

**Progressive reveal:** Elements with `class="frag"` appear one at a time on advance. Gallery sync attributes (`data-gallery-idx`, `data-start-gallery`, `data-frag-sync`) tie bullet reveals to specific carousel images.

**Visual identity:** Dark theme with soft grey-blue palette. CSS custom properties in `src/styles.css` control all colors. Typography is system sans-serif. TLC logo in the footer.

**Accessibility:** Slides use semantic `role`, `aria-label`, and `aria-roledescription` attributes. A `prefers-reduced-motion` media query disables all animations. Focus management moves to the active slide on navigation.

**Stage types:**
- `stage-img` — single image with optional caption
- `stage-gallery` — multi-image carousel with dots and auto-rotation
- `stage-table` — data tables
- `step-grid` — numbered step rows with progressive reveal
- `stage-fill` — full-bleed iframe/canvas/video

---

## Template

This deck is built on the CUNY AI Intro slide engine. To create a new deck from the same template:

[zmuhls.github.io/cuny-ai-intro](https://zmuhls.github.io/cuny-ai-intro/)

---

## Quick Start

```bash
git clone https://github.com/CUNY-AI-Lab/cali-brooklyn.git
cd cali-brooklyn
open index.html
```

Navigate: arrow keys / spacebar. Esc for overview. Hash routing: `index.html#5`

---

## Deploy

Push to `main` — GitHub Pages rebuilds automatically. No build step.
