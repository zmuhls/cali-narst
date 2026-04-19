# CLAUDE.md

## Project

This repository contains the NARST 2026 CALI presentation deck.

Current repository target:
- GitHub repo: `milwrite/cali-narst`
- Deployment target: GitHub Pages from `main`

## Current deck rules

- Single-page HTML slide deck, no build system required
- Keep `index.html` as the canonical deck file
- Use `src/styles.css` and `src/slides.js` for shared behavior and styling
- Prefer real session metadata and presenter names
- Keep placeholder text where real talk prose has not been approved yet
- Preserve large readable typography suitable for live presentation

## Current structure requirement

The deck should follow this exact structure:

- 1 title slide
- 4 section-divider slides, one for each presenter
- 10 content slides for each presenter
- 1 references slide for each presenter

That yields 49 total slides.

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
