# Codex instructions

This is a dependency-free static photography portfolio. Do not introduce React, npm, Tailwind, a database, or a framework unless Frankie explicitly requests a migration.

## Commands

```bash
./develop
./build
python3 tools/check_site.py
```

## Source of truth

- `content/site.json` owns copy, navigation, colors, hero slides, categories, shoots, and gallery photographs.
- `tools/build_site.py` owns generated page structure.
- `public/assets/site.css` owns public visual design.
- `public/assets/site.js` owns public interaction.
- `dist/` is generated and must be rebuilt after source changes.

## Preserve these product decisions

- The homepage remains a one-screen landing scene with a horizontal highlighted-photo sequence, not a long homepage.
- The primary home action stays generalized rather than graduation- or concert-specific.
- The portfolio hierarchy is Work → Category → Shoot → Gallery.
- Work-category and shoot-cover frames are square for a consistent index. Full gallery photographs remain 3:2 landscape or 2:3 portrait.
- Keep the grid, grain, acid/cobalt accents, ASCII marks, and cybersigil-inspired details subtle enough that photography remains dominant.
- Preserve the sharp editorial/Y2K fashion-magazine direction. Avoid generic card-dashboard styling, excessive glass effects, fake credentials, fake clients, and AI-sounding marketing copy.
- Copy should sound personal, direct, and first-person.
- Preserve keyboard access, visible focus, reduced motion, semantic headings, useful alt text, and the truthful mail-draft inquiry behavior.
- The local editor must never be copied into `dist/` or publicly deployed.
- Keep the toolchain install-free and bounded; do not add an `npm install` requirement.

## Before handing off

Run `./build` and `python3 tools/check_site.py`. Confirm a narrow 320px viewport has no horizontal overflow or clipped category titles.
