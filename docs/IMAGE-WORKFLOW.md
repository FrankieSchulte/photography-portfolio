# Image Workflow

## 1. Curate before exporting

A portfolio is a visual argument, not an archive. Start with the strongest relevant image, remove near-duplicates, and ensure every frame adds a new subject, scale, light, emotion, composition, or storytelling function.

Recommended starting ranges:

- Concerts: fewer strong images are better than padding; grow toward 18–30 only when two or three complete stories support it.
- Portraits: roughly 10–20 excellent images across Observed and Constructed work.
- Events and milestones: roughly 10–20, prioritizing assignment consistency.
- Field Notes: a concise personal essay with slower pacing.

## 2. Export safe source masters

Do not use original camera files or full-resolution client deliveries. Export sRGB JPEG masters around 1600–2400 pixels on the long edge, with finished color, controlled sharpening, and no private metadata that should not be public.

Use descriptive filenames in production, for example:

```text
artist-name-venue-city-live-01.jpg
editorial-portrait-subject-name-01.jpg
graduation-campus-city-01.jpg
field-notes-place-name-01.jpg
```

You may retain the starter filenames while designing, then rename them by changing both the source file and the `file` value in `src/galleries.json`.

## 3. Update the manifest

For every image in `src/galleries.json`, update:

- `file` — filename without extension.
- `width` and `height` — actual source aspect ratio.
- `alt` — concise meaningful content in the context of the page.
- `caption` — useful context only; avoid filler.
- `meta` — approved artist/subject, venue/location, city, and year.
- `group` — sequence or section placement.
- `layout` — one of `full`, `wide`, `wide-offset`, `medium`, `square`, `portrait`, or `portrait-offset`.
- `focal` — CSS object position such as `50% 35%` for deliberate cropped previews.
- `demo` — set to `false` after the real image and information are approved.

## 4. Generate derivatives

Place the matching JPEG master in `source-images/`, then run:

```bash
npm run images
```

The optimizer writes AVIF, WebP, and progressive JPEG files at 480, 960, and 1600 pixels wide into `public/assets/images/`.

## 5. Build and review

```bash
npm run build
npm run audit
npm run start
```

Review:

- Hero crop and face placement at desktop and mobile widths.
- Color gradients and shadow detail on real phones, especially concert images.
- Captions, names, permissions, and spelling.
- Native aspect ratios in the story view.
- Contact-sheet crops and focal positions.
- Layout shifts while images load.
- Keyboard focus and lightbox controls.

## 6. Social preview

Replace `public/assets/og-preview.jpg` with a 1200×630 image reflecting the final identity. Use a representative approved photograph and keep critical text away from the edges.
