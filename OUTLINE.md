# OUTLINE.md

## Deck structure

NARST 2026 CALI deck. Structure matches the authoritative SLIDES.md source in `thinkering/`.

Per-presenter reset numbering:

- **LW** — Luke Waltzer · 8 content slides (LW1–LW8)
- **LH** — Laurie Hurson · 10 content slides (LH1–LH10)
- **ZM** — Zach Muhlbauer · 10 content slides (ZM1–ZM10)
- **SA** — Şule Aksoy · 11 content slides (SA1–SA11)

Every presenter also gets a paper-title section divider. References slides were removed 2026-04-20.

**Total: 47 slides (46 core + closing)**

| Deck # | Slide ID | Title |
|---|---|---|
| 1 | Title | Community, Transparency & Tinkering for Just Futures |

---

## Luke Waltzer

| Deck # | Slide ID | Title |
|---|---|---|
| 2 | Luke · Paper Title | The Critical AI Literacy Institute: Asserting and Preserving Scholarly Agency in the Age of AI |
| 3 | LW1 | About the Teaching and Learning Center |
| 4 | LW2 | About the Critical AI Literacy Institute (CALI) |
| 5 | LW3 | Grounding Scholarship |
| 6 | LW4 | Defining Critical AI Literacy |
| 7 | LW5 | The CUNY Context |
| 8 | LW6 | Our Goals |
| 9 | LW7 | The Google Question |
| 10 | LW8 | CALI's Strategy |

---

## Laurie Hurson

| Deck # | Slide ID | Title |
|---|---|---|
| 11 | Laurie · Paper Title | Fostering Critical AI Literacy as Collective World-Building: Curricular Models for Teaching With/About Generative AI |
| 12 | LH1 | Overview |
| 13 | LH2 | Summer Institute |
| 14 | LH3 | Faculty Interventions |
| 15 | LH4 | Research and Information in the Digital Age |
| 16 | LH5 | Integrated Reading and Composition |
| 17 | LH6 | Introduction to History and Literature |
| 18 | LH7 | Statistical Methods in Earth and Atmospheric Sciences |
| 19 | LH8 | Interventions for Teaching Critical AI Literacy |
| 20 | LH9 | Critical AI Literacy & Student Agency |
| 21 | LH10 | Critical AI Literacy, Agency, & Collective World-building |

---

## Zach Muhlbauer

| Deck # | Slide ID | Title |
|---|---|---|
| 22 | Zach · Paper Title | Tinkering as Critical AI Literacy: Teaching AI Infrastructure through Breakdown and Reconfiguration |
| 23 | ZM1 | Tinkering as Critical AI Literacy |
| 24 | ZM2 | Designing for Tinkerability |
| 25 | ZM3 | Tinkering as Bricolage |
| 26 | ZM4 | Infrastructure and Instructional Design |
| 27 | ZM5 | Teaching Infrastructure through Breakdown |
| 28 | ZM6 | Hyperparameters as Instructional Controls |
| 29 | ZM7 | AmigAI: Breakdown and Reconfiguration |
| 30 | ZM8 | AmigAI: Tinkering with System Prompts |
| 31 | ZM9 | The CUNY AI Lab Sandbox |
| 32 | ZM10 | Cohort 2 in the Sandbox |

---

## Şule Aksoy

| Deck # | Slide ID | Title |
|---|---|---|
| 33 | Şule · Paper Title | Beyond the Black Box: Resisting AI Inevitability Rhetoric and Implications for Science Education |
| 34 | SA1 | AI inevitability rhetoric as a knowledge claim deserving scientific scrutiny |
| 35 | SA2 | Conceptual Background |
| 36 | SA3 | CALI as evidence |
| 37 | SA4 | Data analysis |
| 38 | SA5 | Theme #1 — Critique of Techno-determinism |
| 39 | SA6 | Theme #2 — Threat to Agency |
| 40 | SA7 | Theme #3 — Material Implications |
| 41 | SA8 | Lessons Learned from CALI |
| 42 | SA9 | Implications for Science Education |
| 43 | SA10 | Conclusion — Frame #4 |
| 44 | SA11 | Conclusion — Frame #5 |

---

## Notes on this port

- **Leaflet map removed** (2026-04-20): LW5 now uses a static `images/cuny.png`. The previous borough-reveal lifecycle and vendored tiles were retired with the map.
- **Paper-title section dividers**: all four presenters (Luke, Laurie, Zach, Şule) now use the `paper-title` variant carrying presenter name, role, affiliation, and full paper title.
- **Testimonial quotes** from the source render as block quotes inside `.slide-testimonial` layouts (LH7, LH10, SA5, SA6, SA7, SA10, SA11).
- **References slides removed** (2026-04-20): citations live in the paper, not on the deck.
- **LH2 "Defining AI Literacy" cut** (2026-04-20): earlier cut; content absorbed into Overview + CALI Institute.
- **LH2 "Critical AI Literacy Institute" cut** (2026-04-20, Laurie request): second Laurie cut; remaining LH3–LH11 renumbered LH2–LH10, putting Laurie at 10 content slides.
- **ZM4 cut** (2026-04-20): "Historical OCR prototype" dropped; remaining Zach slides renumbered. Zach's section now runs 10 content slides.
- **SA split** (2026-04-20): the Conclusion slide was split into SA11 (Frame #4) and SA12 (Frame #5) so each NASEM equity frame gets its own beat.
- **Carousels do not autoforward**: image and quote carousels (LW4 quote, LH5 image) advance only via presenter input.
- **NARST + TLC logos linked** (2026-04-20): the NARST header badge links to the 2026 conference page; the TLC footer badge links to `tlc.commons.gc.cuny.edu`. Both sized identically and pinned to `x=18px` so they align vertically down the left edge of the deck.

See `CHANGELOG.md` for the full record of what was moved, renamed, and dropped.
