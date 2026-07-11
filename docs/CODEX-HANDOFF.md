# Codex Handoff

## Project shape

This is a small static-site generator built with native Node.js modules and a Python/Pillow image pipeline. There are no npm dependencies to update or debug.

- `src/site.json` contains identity, copy, services, and metadata.
- `src/galleries.json` contains image sequencing and presentation data.
- `src/render.mjs` generates all HTML routes.
- `src/styles.css` owns the visual system and responsive edition.
- `src/main.js` owns progressive interaction.
- `scripts/build.mjs` writes `dist/`.
- `scripts/audit.mjs` checks local integrity and launch safety.
- `scripts/optimize-images.py` writes responsive formats.

## High-value next tasks

1. Replace the identity and biography placeholders with the photographer’s real information.
2. Curate and install real concert work first; update story chapter names and metadata.
3. Replace the supporting galleries only when each category has enough strong work.
4. Tune the accent color against the supplied concert archive if chartreuse clashes.
5. Add real approved credibility proof conditionally through `src/site.json`.
6. Connect a production form endpoint only if email-draft behavior is insufficient.
7. Run a browser accessibility and performance review after real images are installed.

## Guardrails

Do not convert the project into a generic component-library portfolio. Preserve editorial pacing, asymmetric composition, real HTML images, and the distinction between immersive Story and fast Index browsing. Do not fabricate missing proof to make empty sections look complete.

## Suggested first prompt for Codex

> Read `AGENTS.md`, `docs/RESEARCH-BRIEF.md`, and the current source. Keep `launchReady` false. Replace the identity placeholders in `src/site.json` with the information I provide, remove any services I do not offer, rebuild, run the audit, and report every remaining placeholder or launch blocker without inventing content.
