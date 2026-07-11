# Frankie Schulte Photography Portfolio — static edition

A dependency-free photography portfolio built with ordinary HTML, CSS, and JavaScript. There is no framework, package manager, bundler, or install step.

## Preview locally

From this folder:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

You can also open `index.html` directly, though a local server is better for testing links and browser behavior.

## What changed in this revision

- Full-screen black-and-white hero photography with a subtle animated orange/purple grain field behind and through the image.
- Visitor palette selector with monochrome, orange/violet, ember/plum, cobalt/amber, and arbitrary two-color custom themes.
- Personal, first-person copy headed by “Hi, I’m Frankie Schulte.”
- Homepage and Work order: Graduation Photos, Events, Concerts, Personal / Travel.
- Generalized positioning rather than a concert-only brand.
- Separate Work, Graduation, Events, Concerts, Personal / Travel, About, and Inquire pages.
- Sequence/contact-sheet gallery switcher and keyboard-accessible lightbox.
- Responsive mobile menu, visible focus, reduced-motion support, and a truthful mail-draft inquiry form.

## First files to edit

- `assets/js/site-config.js` — name, city/region, email, Instagram, travel status, and default palette.
- `index.html`, `about.html`, and the gallery HTML files — page copy.
- `assets/css/styles.css` — layout, motion, typography, and theme treatment.
- `assets/images/` — replace every demo photograph with Frankie’s real work.
- `scripts/generate_pages.py` — canonical page content if you want to regenerate all HTML pages from one file.

## Replacing images

The current photographs are low-resolution demo crops used only to make the UI direction visible. Keep the same filenames for the quickest replacement, providing both `.jpg` and `.webp` files:

```text
hero-concert
 graduation-01 through graduation-03
 event-01 through event-04
 concert-02 and concert-03
 travel-01 through travel-03
```

For production, use web-sized exports around 1600–2400 pixels on the long edge, in sRGB. Do not publish original full-resolution client files.

## Palette behavior

The public default is set in `assets/js/site-config.js`:

```js
defaultTheme: "orange-violet"
```

Visitors can choose another preset or any two colors. Their selection is saved only in their own browser with `localStorage`.

## Safe preview state

The project intentionally uses:

- Placeholder contact details.
- `noindex,nofollow` metadata.
- Clearly labeled demo images.
- No invented clients, testimonials, prices, credentials, or private-event details.

Replace those items and remove `noindex,nofollow` before launch.

## Quality check

```bash
python3 scripts/check_site.py
```

The checker verifies local HTML, CSS, JavaScript, image, and navigation references without installing anything.
