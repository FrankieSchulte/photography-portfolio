# Photography Portfolio Starter

A complete, dependency-light, multi-page photography portfolio based on the creative direction in `docs/RESEARCH-BRIEF.md`.

The visual idea is **independent arts magazine meets live-music contact sheet**: an ink-and-paper palette, restrained signal color, editorial typography, issue-like numbering, asymmetrical image rhythms, and a flagship concert experience that supports both slow story viewing and fast contact-sheet scanning.

## What is included

- Eight routes: Home, Work, Concerts, Portraits, Events, Field Notes, About, and Inquire.
- A flagship Concerts page with Story and Index modes.
- An accessible native-dialog lightbox with previous/next buttons, keyboard arrows, Escape, and swipe gestures.
- A full-screen mobile menu with large tap targets.
- Reduced-motion behavior, visible keyboard focus, semantic landmarks, a skip link, explicit image dimensions, and contextual alt-text fields.
- Responsive AVIF, WebP, and JPEG derivatives at 480, 960, and 1600 pixels wide.
- Safe preview mode: demo labels, `noindex`, and `robots.txt` disallow remain active until real content is installed.
- An inquiry form that creates a mail draft rather than pretending a backend submission succeeded.
- Automated build and audit scripts with no npm package dependencies.
- `AGENTS.md` project conventions for a clean Codex handoff.

## Run locally

Requirements: Node.js 18 or newer and Python 3.10 or newer with Pillow AVIF/WebP support.

```bash
npm run dev
```

Then open the local URL printed in the terminal. The generated site lives in `dist/`.

Useful commands:

```bash
npm run build        # Generate dist/ from src/
npm run audit        # Check routes, local references, metadata, and image derivatives
npm run images       # Rebuild responsive image files from source-images/
npm run rebuild      # Images + site build + audit
npm run demo:images  # Regenerate the abstract development images
```

## Where to edit

Always edit the source files, not `dist/`:

- `src/site.json` — name, region, role, contact details, biography, services, page titles, and descriptions.
- `src/galleries.json` — image order, grouping, dimensions, focal position, alt text, captions, metadata, and layout rhythm.
- `src/render.mjs` — page structure and reusable HTML render functions.
- `src/styles.css` — the complete visual system and responsive behavior.
- `src/main.js` — menu, gallery toggle, lightbox, reveal behavior, and inquiry-form logic.
- `source-images/` — web-safe source masters used by the image optimizer.

`dist/` is generated output and may be deleted and rebuilt at any time.

## Personalize in this order

1. Replace every bracketed detail in `src/site.json`: name, city/region, email, Instagram, biography, and service language.
2. Curate your strongest real photographs. Do not try to fill every demo slot if the work is not ready.
3. Replace the source masters and update every image entry in `src/galleries.json`, including contextual alt text and approved metadata.
4. Set each replaced image’s `demo` field to `false`.
5. Replace `public/assets/og-preview.jpg` and, if desired, the favicon.
6. Run `npm run rebuild` and review every route at desktop and mobile widths.
7. Change `siteUrl` to the real HTTPS domain.
8. Set `launchReady` to `true` only after `npm run audit` passes without placeholder errors.

When `launchReady` is `false`, the site intentionally displays a preview banner, marks demo images, emits `noindex,nofollow`, and blocks crawlers through `robots.txt`.

## Image replacement

The easiest path is to keep the current filenames, replace the matching JPEG in `source-images/`, update its width/height and content fields in `src/galleries.json`, then run:

```bash
npm run images
npm run build
npm run audit
```

The optimizer never needs original camera files. Export high-quality, color-corrected sRGB JPEG masters at approximately 1600–2400 pixels on the long edge. See `docs/IMAGE-WORKFLOW.md` for the full workflow.

## Inquiry form behavior

There is no fake submission endpoint. With the placeholder address still present, the form explains that a real email must be added. Once `src/site.json` contains a real email, the form validates the fields and opens a pre-composed draft in the visitor’s default email application.

For a production form service later, preserve the current labels, validation, status region, direct email fallback, and privacy language.

## Deployment

`dist/` is a static site and can be deployed to Netlify, Cloudflare Pages, GitHub Pages, Vercel static hosting, an S3-compatible host, or a conventional web server. See `docs/DEPLOYMENT.md` for the final checks and hosting notes.

## Codex handoff

Open the project root in Codex. `AGENTS.md` contains the non-negotiable design, truthfulness, performance, and accessibility conventions. A good first Codex task is:

> Read `AGENTS.md`, `docs/RESEARCH-BRIEF.md`, and `docs/CODEX-HANDOFF.md`. Replace the bracketed identity copy in `src/site.json`, preserve safe preview mode, run the build and audit, and summarize any remaining launch blockers.

## Important content rule

No client, artist, venue, publication, award, testimonial, price, availability claim, or private event detail should be added unless it is real and approved. The demo visuals are intentionally abstract and visibly marked so they cannot be mistaken for portfolio proof.
