# AGENTS.md — Photography Portfolio

## Source of truth

Read `docs/RESEARCH-BRIEF.md` before making design or information-architecture changes. The portfolio must feel like an independent arts magazine crossed with a live-music contact sheet. Concert work is the flagship discipline; portraits, events, milestones, and field notes demonstrate range without diluting that focus.

## Editing rules

- Edit `src/`, `source-images/`, and `public/`. Never hand-edit `dist/`; it is generated.
- Preserve the route structure: Home, Work, Concerts, Portraits, Events, Field Notes, About, and Inquire.
- Keep primary navigation limited to Work, Concerts, About, and Inquire.
- Keep the Concerts page available in both Story and Index modes.
- Do not add a framework or dependency unless the task genuinely requires it and the tradeoff is documented.
- Do not turn the interface into a card grid, bento dashboard, glass UI, gradient-heavy landing page, or pill-button system.
- Do not add autoplay audio, scroll hijacking, mandatory horizontal navigation, novelty cursors, long preloaders, or motion that competes with the photographs.

## Truthfulness

Never fabricate clients, artists, venues, publications, testimonials, awards, prices, years of experience, availability, response time, captions, or project metadata. Do not remove preview mode until all bracketed identity content is replaced and all demo images are removed or explicitly approved.

## Accessibility and interaction

- Maintain one logical `h1` per route, semantic landmarks, the skip link, visible focus, and keyboard operation.
- Preserve 44px-or-larger practical touch targets.
- Keep menu, view toggle, form, and lightbox usable without a mouse.
- Respect `prefers-reduced-motion` for every nonessential transition.
- Do not encode text, captions, or navigation labels inside portfolio images.
- Keep meaningful contextual alt text for primary portfolio images; decorative duplicate thumbnails may use empty alt text when their controls have labels.

## Image performance

- Hero photography must remain a real HTML image, not a CSS background.
- Preserve explicit image dimensions and responsive AVIF/WebP/JPEG sources.
- Keep the first meaningful hero eager and high priority; keep below-the-fold images lazy.
- Never ship original full-resolution client files.
- Update `src/galleries.json` when changing image order, dimensions, crop focus, alt text, captions, metadata, grouping, or layout.

## Inquiry and privacy

Keep a direct email fallback visible. Do not claim a form submission succeeded unless a real backend confirms it. Do not add marketing opt-in by default. Do not expose private client or event details without permission.

## Required validation

After meaningful changes, run:

```bash
npm run build
npm run audit
```

After replacing or resizing images, run:

```bash
npm run rebuild
```

Do not mark the work complete while the audit fails. When `launchReady` becomes `true`, confirm the real HTTPS domain, social image, canonical URLs, sitemap, robots rules, metadata, and structured data.
