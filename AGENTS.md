# Codex instructions

This is a dependency-free static site. Do not introduce React, Tailwind, shadcn, npm, Vite, or a build tool unless Frankie explicitly asks for a migration.

## Priorities

1. Keep the homepage category order: Graduation, Events, Concerts, Personal / Travel.
2. Keep the writing personal and plainspoken; avoid generic marketing language.
3. Preserve the grainy, film-adjacent visual treatment without covering or degrading the photographs.
4. Keep the palette selector and two-color custom theme support.
5. Preserve keyboard access, visible focus, reduced-motion behavior, and the truthful mail-draft inquiry flow.
6. Do not invent clients, credentials, testimonials, prices, locations, or contact details.

## Editing map

- Identity/contact/theme defaults: `assets/js/site-config.js`
- Shared visual system: `assets/css/styles.css`
- Shared interactions: `assets/js/app.js`
- Page content: root HTML files or `scripts/generate_pages.py`
- Photographs: `assets/images/`
- Research source of truth: `docs/ORIGINAL-RESEARCH-BRIEF.md`

Run `python3 scripts/check_site.py` after changes.
