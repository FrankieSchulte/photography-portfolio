# Editing guide

## The content model

The site is intentionally organized around four levels:

1. **Landing page** — a full-screen introduction and horizontal highlighted-image sequence.
2. **Work index** — equal entry points into the current photography categories.
3. **Category page** — a responsive grid of distinct shoots.
4. **Shoot page** — a complete image sequence for one session, show, event, or trip.

All content lives in `content/site.json`. The browser editor changes that file and then calls `tools/build_site.py`.

## Add a shoot

1. Run `./develop` and open the tokenized editor URL.
2. Open **Shoots & photos**.
3. Choose the category.
4. Select **Add shoot**.
5. Give it a unique title and URL slug.
6. Upload or select a cover and identify the source orientation. Public category and shoot covers display as square crops.
7. Add gallery photographs, alt text, and optional captions.
8. Save and rebuild.

The category grid and new shoot page are generated automatically.

## Rename buttons

- Header buttons: **Basics → Navigation**.
- Landing buttons: **Landing page → Opening copy**.
- Inquiry submit button: **About & inquiry → Inquiry page**.

## Replace a featured homepage photograph

Open **Landing page**, upload the image in the featured sequence, add a short frame label and meaningful alt text, choose its source shape, and adjust focus with a value such as:

```text
50% 35%
```

The first percentage moves the crop horizontally. The second moves it vertically.

## Change the color direction

Open **Basics → Color & motion** and choose two colors. Visitors can still choose another palette for their own browser through the public theme control.

## Advanced edits

Use **Advanced JSON** for structured fields not exposed elsewhere. Use the source files for behavior or design changes:

```text
public/assets/site.css
public/assets/site.js
tools/build_site.py
```
