const ROUTES = {
  home: "",
  work: "work",
  concerts: "concerts",
  portraits: "portraits",
  events: "events",
  "field-notes": "field-notes",
  about: "about",
  inquire: "inquire",
};

const NAV = [
  ["work", "Work"],
  ["concerts", "Concerts"],
  ["about", "About"],
  ["inquire", "Inquire"],
];

const MOBILE_NAV = [
  ["concerts", "Concerts"],
  ["work", "Work"],
  ["inquire", "Inquire"],
  ["about", "About"],
  ["portraits", "Portraits"],
  ["events", "Events & Milestones"],
  ["field-notes", "Field Notes"],
];

const CONTENTS = [
  { number: "01", key: "concerts", title: "Live / Concerts", phrase: "Performance, crowd, venue, atmosphere." },
  { number: "02", key: "portraits", title: "Portraits", phrase: "Observed presence and constructed ideas." },
  { number: "03", key: "events", title: "Events & Milestones", phrase: "Complete stories, not isolated highlights." },
  { number: "04", key: "field-notes", title: "Field Notes", phrase: "Place, weather, distance, and quiet." },
];

const WORK_INDEX = [
  { number: "01", key: "concerts", title: "Live / Concerts", eyebrow: "Flagship practice", copy: "Live coverage, tour documentation, festivals, editorial stories, and artist portraits.", image: "C04" },
  { number: "02", key: "portraits", title: "Portraits", eyebrow: "Observed / Constructed", copy: "Natural portraiture and stylized image-making for artists, editorial work, and creative commissions.", image: "P06" },
  { number: "03", key: "events", title: "Events & Milestones", eyebrow: "Context / People / Detail", copy: "Consistent coverage from establishing frame to the final atmosphere, including graduation work.", image: "E03" },
  { number: "04", key: "field-notes", title: "Field Notes", eyebrow: "Personal practice", copy: "A slower visual notebook of landscape, nature, and the character of place.", image: "F03" },
];

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function routePath(current, target, query = "") {
  const targetSlug = ROUTES[target];
  const currentSlug = ROUTES[current];
  if (targetSlug === undefined) throw new Error(`Unknown target route: ${target}`);
  const suffix = query ? `?${query}` : "";
  if (!currentSlug) {
    return targetSlug ? `./${targetSlug}/${suffix}` : `./${suffix}`;
  }
  return targetSlug ? `../${targetSlug}/${suffix}` : `../${suffix}`;
}

function assetPath(current, file) {
  return `${ROUTES[current] ? "../" : "./"}assets/${file}`;
}

function findImage(galleries, id) {
  for (const key of ["concerts", "portraits", "events", "fieldNotes", "headshot"]) {
    const found = galleries[key].find((image) => image.id === id);
    if (found) return found;
  }
  throw new Error(`Missing image id: ${id}`);
}

function responsivePicture(current, image, options = {}) {
  const {
    className = "",
    sizes = "(min-width: 900px) 72vw, 100vw",
    eager = false,
    decorative = false,
    objectFit = "cover",
  } = options;
  const base = assetPath(current, `images/${image.file}`);
  const alt = decorative ? "" : image.alt;
  return `
    <picture class="picture ${esc(className)}">
      <source type="image/avif" srcset="${base}-480.avif 480w, ${base}-960.avif 960w, ${base}-1600.avif 1600w" sizes="${esc(sizes)}">
      <source type="image/webp" srcset="${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w" sizes="${esc(sizes)}">
      <img src="${base}-960.jpg"
        srcset="${base}-480.jpg 480w, ${base}-960.jpg 960w, ${base}-1600.jpg 1600w"
        sizes="${esc(sizes)}"
        width="${image.width}" height="${image.height}"
        alt="${esc(alt)}"
        loading="${eager ? "eager" : "lazy"}"
        ${eager ? 'fetchpriority="high"' : ""}
        decoding="async"
        style="object-position:${esc(image.focal)};object-fit:${esc(objectFit)}">
    </picture>`;
}

function lightboxButton(current, image, options = {}) {
  const { className = "", sizes, decorative = false, eager = false } = options;
  const full = assetPath(current, `images/${image.file}-1600.jpg`);
  return `
    <button class="image-button ${esc(className)}" type="button"
      data-lightbox-item
      data-full="${full}"
      data-alt="${esc(image.alt)}"
      data-caption="${esc(image.caption)}"
      data-meta="${esc(image.meta)}"
      data-width="${image.width}"
      data-height="${image.height}"
      aria-label="Open ${esc(image.id)} in the image viewer">
      ${responsivePicture(current, image, { sizes, decorative, eager })}
    </button>`;
}

function figure(current, image, options = {}) {
  const {
    className = "",
    sizes,
    eager = false,
    showCaption = true,
    clickable = true,
    decorative = false,
  } = options;
  return `
    <figure class="portfolio-figure ${esc(className)} layout-${esc(image.layout)} reveal" ${image.demo ? 'data-demo="true"' : ""}>
      ${clickable
        ? lightboxButton(current, image, { sizes, decorative, eager })
        : responsivePicture(current, image, { sizes, decorative, eager })}
      ${showCaption ? `
      <figcaption>
        <span class="figure-id">${esc(image.id)}</span>
        <span>${esc(image.caption)}</span>
      </figcaption>` : ""}
    </figure>`;
}

function statusBanner(site) {
  if (site.launchReady) return "";
  return `
    <aside class="preview-banner" aria-label="Preview status">
      <strong>Preview mode.</strong>
      Demo imagery and bracketed details are intentionally marked. Replace them before publishing.
    </aside>`;
}

function header(current, site) {
  const desktopLinks = NAV.map(([key, label]) => `
    <a href="${routePath(current, key)}" ${key === current ? 'aria-current="page"' : ""}>${esc(label)}</a>`).join("");
  const mobileLinks = MOBILE_NAV.map(([key, label], index) => `
    <a href="${routePath(current, key)}" ${key === current ? 'aria-current="page"' : ""}>
      <span>${String(index + 1).padStart(2, "0")}</span>${esc(label)}
    </a>`).join("");
  return `
    <header class="site-header" data-header>
      <a class="wordmark" href="${routePath(current, "home")}" aria-label="${esc(site.name)} home">${esc(site.wordmark)}</a>
      <nav class="desktop-nav" aria-label="Primary navigation">${desktopLinks}</nav>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">
        <span class="menu-toggle-label">Menu</span>
        <span class="menu-toggle-icon" aria-hidden="true"><i></i><i></i></span>
      </button>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden>
        <div class="mobile-menu-links">${mobileLinks}</div>
        <div class="mobile-menu-meta">
          <p>${esc(site.role)}</p>
          <p>${esc(site.travelNote)}</p>
          <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
        </div>
      </nav>
    </header>`;
}

function footer(current, site) {
  return `
    <footer class="site-footer">
      <div class="footer-masthead">${esc(site.wordmark)}</div>
      <div class="footer-grid">
        <div>
          <p class="mono-label">Practice</p>
          <p>${esc(site.role)}<br>${esc(site.travelNote)}</p>
        </div>
        <div>
          <p class="mono-label">Navigate</p>
          <a href="${routePath(current, "concerts")}">Concerts</a>
          <a href="${routePath(current, "work")}">Work index</a>
          <a href="${routePath(current, "about")}">About</a>
        </div>
        <div>
          <p class="mono-label">Contact</p>
          <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
          <a href="${esc(site.instagramUrl)}" rel="me noopener noreferrer">${esc(site.instagramHandle)}</a>
          <a href="${routePath(current, "inquire")}">Project inquiry</a>
        </div>
      </div>
      <div class="footer-legal">
        <span>© <span data-current-year>2026</span> ${esc(site.copyrightName)}</span>
        <span>All photographs remain the copyright of their creator.</span>
      </div>
    </footer>`;
}

function lightbox() {
  return `
    <dialog class="lightbox" data-lightbox aria-labelledby="lightbox-caption">
      <div class="lightbox-shell">
        <div class="lightbox-toolbar">
          <span class="lightbox-count" data-lightbox-count>01 / 01</span>
          <button type="button" class="text-control" data-lightbox-close>Close <span aria-hidden="true">×</span></button>
        </div>
        <div class="lightbox-stage">
          <button class="lightbox-arrow lightbox-prev" type="button" data-lightbox-prev aria-label="Previous image">←</button>
          <img data-lightbox-image src="" alt="" width="1600" height="1200">
          <button class="lightbox-arrow lightbox-next" type="button" data-lightbox-next aria-label="Next image">→</button>
        </div>
        <div class="lightbox-caption" id="lightbox-caption">
          <p data-lightbox-meta></p>
          <p data-lightbox-caption></p>
        </div>
      </div>
    </dialog>`;
}

function baseDocument({ current, site, title, description, body, bodyClass = "theme-paper", includeLightbox = true }) {
  const prefix = ROUTES[current] ? "../" : "./";
  const canonical = `${site.siteUrl.replace(/\/$/, "")}/${ROUTES[current] ? `${ROUTES[current]}/` : ""}`;
  const indexable = site.launchReady && !site.siteUrl.includes("example");
  const structuredData = indexable ? `
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: site.name,
      url: canonical,
      email: site.email,
      areaServed: site.region,
      description,
    }).replaceAll("<", "\\u003c")}</script>` : "";
  return `<!doctype html>
<html lang="${esc(site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0A0A0A">
  <meta name="color-scheme" content="light dark">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"}">
  ${indexable ? `<link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(site.siteUrl.replace(/\/$/, ""))}/assets/og-preview.jpg">
  <meta name="twitter:card" content="summary_large_image">` : ""}
  <link rel="icon" href="${prefix}assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="${prefix}site.webmanifest">
  <link rel="stylesheet" href="${prefix}assets/styles.css">
  ${structuredData}
</head>
<body class="${esc(bodyClass)}" data-page="${esc(current)}">
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${statusBanner(site)}
  ${header(current, site)}
  <main id="main-content">${body}</main>
  ${footer(current, site)}
  ${includeLightbox ? lightbox() : ""}
  <script src="${prefix}assets/main.js" defer></script>
</body>
</html>`;
}

function sectionLabel(number, label) {
  return `<div class="section-folio"><span>${esc(number)}</span><span>${esc(label)}</span></div>`;
}

function actions(current, primary = "concerts", secondary = "inquire", query = "") {
  return `<div class="actions">
    <a class="action-primary" href="${routePath(current, primary, query)}">${primary === "concerts" ? "View Concerts" : "Start an inquiry"}<span aria-hidden="true">↗</span></a>
    <a class="action-secondary" href="${routePath(current, secondary)}">${secondary === "inquire" ? "Inquire" : "Explore work"}<span aria-hidden="true">→</span></a>
  </div>`;
}

function inquiryBanner(current, site, heading = "Planning a show, portrait, event, or graduation?", query = "") {
  return `
    <section class="inquiry-banner theme-signal">
      <div>
        <p class="mono-label">Available for selected commissions</p>
        <h2>${esc(heading)}</h2>
      </div>
      <div class="inquiry-banner-meta">
        <p>${esc(site.travelNote)}</p>
        <a class="action-ink" href="${routePath(current, "inquire", query)}">Tell me about the project <span aria-hidden="true">↗</span></a>
      </div>
    </section>`;
}

function homePage(site, galleries) {
  const current = "home";
  const hero = findImage(galleries, galleries.homeSelections.hero);
  const concertImages = galleries.homeSelections.concertFeature.map((id) => findImage(galleries, id));
  const portraitImages = galleries.homeSelections.portraits.map((id) => findImage(galleries, id));
  const eventImages = galleries.homeSelections.events.map((id) => findImage(galleries, id));
  const fieldImage = findImage(galleries, galleries.homeSelections.fieldNote);
  const headshot = findImage(galleries, galleries.homeSelections.headshot);
  const contentImages = [hero, portraitImages[0], eventImages[0], fieldImage];

  const contents = CONTENTS.map((entry, index) => `
    <li>
      <a href="${routePath(current, entry.key)}">
        <span class="contents-number">${entry.number}</span>
        <span class="contents-title">${entry.title}</span>
        <span class="contents-phrase">${entry.phrase}</span>
        <span class="contents-arrow" aria-hidden="true">↗</span>
      </a>
      <div class="contents-preview" aria-hidden="true">
        ${responsivePicture(current, contentImages[index], { decorative: true, sizes: "220px" })}
      </div>
    </li>`).join("");

  const body = `
    <section class="home-hero theme-ink">
      <figure class="hero-media" ${hero.demo ? 'data-demo="true"' : ""}>
        ${responsivePicture(current, hero, { eager: true, sizes: "100vw" })}
      </figure>
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="hero-kicker">${esc(site.heroKicker)}</p>
        <h1><span>Photographs</span><em>with a pulse.</em></h1>
        <div class="hero-bottom">
          <p><strong>${esc(site.name)}</strong><br>${esc(site.role)}<br>${esc(site.region)}</p>
          ${actions(current)}
        </div>
      </div>
      <a class="scroll-cue" href="#contents">Scroll to contents <span aria-hidden="true">↓</span></a>
    </section>

    <section class="contents-section" id="contents">
      ${sectionLabel("ISSUE 01", "Contents / Selected practices")}
      <ol class="contents-list">${contents}</ol>
    </section>

    <section class="concert-feature theme-ink">
      <div class="concert-feature-intro">
        ${sectionLabel("PRACTICE 01", "Live music")}
        <h2>Live /<br><em>Concerts</em></h2>
        <p>Stories built from performer, crowd, venue, light, and the charged details between them. For artists, venues, promoters, festivals, labels, and publications.</p>
        <a class="inline-link" href="${routePath(current, "concerts")}">Enter the full concert story <span aria-hidden="true">↗</span></a>
      </div>
      <div class="concert-feature-images">
        ${figure(current, concertImages[0], { className: "feature-image-a", showCaption: false, sizes: "(min-width:900px) 64vw, 100vw" })}
        ${figure(current, concertImages[1], { className: "feature-image-b", showCaption: false, sizes: "(min-width:900px) 28vw, 56vw" })}
        ${figure(current, concertImages[2], { className: "feature-image-c", showCaption: false, sizes: "(min-width:900px) 30vw, 78vw" })}
      </div>
    </section>

    <section class="range-spread portraits-spread">
      <div class="spread-heading">
        ${sectionLabel("PRACTICE 02", "Portraits / Observed + Constructed")}
        <h2>Presence,<br>made visible.</h2>
        <p>Natural and stylized portraiture with enough space for personality, collaboration, and a distinct visual idea.</p>
        <a class="inline-link" href="${routePath(current, "portraits")}">Explore portraits <span aria-hidden="true">↗</span></a>
      </div>
      <div class="portrait-diptych">
        ${figure(current, portraitImages[0], { showCaption: false, sizes: "(min-width:900px) 38vw, 82vw" })}
        ${figure(current, portraitImages[1], { showCaption: false, sizes: "(min-width:900px) 42vw, 82vw" })}
      </div>
    </section>

    <section class="range-spread events-spread theme-ink">
      <div class="events-copy">
        ${sectionLabel("PRACTICE 03", "Events & milestones")}
        <h2>One occasion.<br>A complete story.</h2>
        <p>Establishing context, candid human moments, defining details, and the atmosphere that carries through the final frame.</p>
        <a class="inline-link" href="${routePath(current, "events")}">View events & milestones <span aria-hidden="true">↗</span></a>
      </div>
      <div class="contact-strip" aria-label="Event preview sequence">
        ${eventImages.map((image) => figure(current, image, { showCaption: false, sizes: "(min-width:900px) 22vw, 74vw" })).join("")}
      </div>
    </section>

    <section class="field-spread">
      <div class="field-image">
        ${figure(current, fieldImage, { showCaption: false, sizes: "(min-width:900px) 63vw, 100vw" })}
      </div>
      <div class="field-copy">
        ${sectionLabel("PRACTICE 04", "Field Notes")}
        <h2>A quieter<br><em>frequency.</em></h2>
        <p>Landscape and nature as a personal essay: slower pacing, place, weather, distance, and attentive looking.</p>
        <a class="inline-link" href="${routePath(current, "field-notes")}">Open Field Notes <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="about-excerpt theme-paper">
      <div class="about-excerpt-image">
        ${figure(current, headshot, { showCaption: false, sizes: "(min-width:900px) 34vw, 82vw" })}
      </div>
      <div class="about-excerpt-copy">
        ${sectionLabel("PROFILE", "The photographer")}
        <h2>Human energy,<br>identity, and place.</h2>
        <p class="lead">${esc(site.aboutShort)}</p>
        <p class="placeholder-copy">${esc(site.aboutLong[0])}</p>
        <a class="inline-link" href="${routePath(current, "about")}">Read the working approach <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    ${inquiryBanner(current, site)}`;

  return baseDocument({
    current,
    site,
    title: site.pages.home.title,
    description: site.pages.home.description,
    body,
    bodyClass: "theme-paper home-page",
  });
}

function workPage(site, galleries) {
  const current = "work";
  const rows = WORK_INDEX.map((entry) => {
    const image = findImage(galleries, entry.image);
    return `
      <article class="work-index-row reveal">
        <a class="work-index-copy" href="${routePath(current, entry.key)}">
          <span class="work-index-number">${entry.number}</span>
          <span class="work-index-eyebrow">${entry.eyebrow}</span>
          <h2>${entry.title}</h2>
          <p>${entry.copy}</p>
          <span class="work-index-arrow" aria-hidden="true">↗</span>
        </a>
        <div class="work-index-image" ${image.demo ? 'data-demo="true"' : ""}>
          ${responsivePicture(current, image, { sizes: "(min-width:900px) 42vw, 100vw" })}
        </div>
      </article>`;
  }).join("");
  const body = `
    <header class="page-masthead theme-paper">
      ${sectionLabel("INDEX", "Selected work")}
      <h1>Work</h1>
      <div class="masthead-deck">
        <p>Four distinct practices, one point of view: human energy, identity, and place.</p>
        <p>Concerts lead. Portraits, events, milestones, and field notes show the range around that center.</p>
      </div>
    </header>
    <section class="work-index">${rows}</section>
    ${inquiryBanner(current, site)}`;
  return baseDocument({ current, site, title: site.pages.work.title, description: site.pages.work.description, body, bodyClass: "theme-paper work-page" });
}

function splitIntoChapters(images) {
  const chapters = [];
  for (const image of images) {
    const last = chapters.at(-1);
    if (!last || last.group !== image.group) chapters.push({ group: image.group, images: [image] });
    else last.images.push(image);
  }
  return chapters;
}

function chapterLabel(group, index) {
  if (group === "Opening") return ["OPENING", "Lead frame"];
  if (group === "Interlude") return ["INTERLUDE", "Standalone frame"];
  return [`SEQUENCE ${String(index).padStart(2, "0")}`, "[Artist / venue / date]"];
}

function concertsPage(site, galleries) {
  const current = "concerts";
  const images = galleries.concerts;
  const hero = images[0];
  let sequenceNumber = 0;
  const story = splitIntoChapters(images).map((chapter) => {
    if (chapter.group.startsWith("Story")) sequenceNumber += 1;
    const [number, label] = chapterLabel(chapter.group, sequenceNumber);
    return `
      <section class="story-chapter" aria-labelledby="chapter-${esc(chapter.images[0].id)}">
        <div class="chapter-heading" id="chapter-${esc(chapter.images[0].id)}">
          <span>${esc(number)}</span><span>${esc(label)}</span><span>${String(chapter.images.length).padStart(2, "0")} frames</span>
        </div>
        <div class="story-grid">
          ${chapter.images.map((image) => figure(current, image, { sizes: image.layout.includes("portrait") ? "(min-width:900px) 42vw, 88vw" : "(min-width:900px) 78vw, 100vw" })).join("")}
        </div>
      </section>`;
  }).join("");

  const index = images.map((image) => `
    <figure class="index-item" ${image.demo ? 'data-demo="true"' : ""}>
      ${lightboxButton(current, image, { decorative: true, sizes: "(min-width:900px) 18vw, 44vw" })}
      <figcaption><span>${esc(image.id)}</span><span>${esc(image.group)}</span></figcaption>
    </figure>`).join("");

  const body = `
    <section class="portfolio-hero theme-ink">
      <figure class="portfolio-hero-media" ${hero.demo ? 'data-demo="true"' : ""}>
        ${responsivePicture(current, hero, { eager: true, sizes: "100vw" })}
      </figure>
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="portfolio-hero-copy">
        <p class="mono-label">Practice 01 / Flagship</p>
        <h1>Live /<br><em>Concerts</em></h1>
        <p>${esc(hero.meta)}</p>
      </div>
    </section>

    <section class="portfolio-intro theme-paper">
      <div>
        ${sectionLabel("LIVE MUSIC", "Coverage / documentation / editorial")}
        <h2>The room, the performer,<br>and everything between.</h2>
      </div>
      <div>
        <p class="lead">${esc(site.concertIntro)}</p>
        <p class="placeholder-copy">This starter demonstrates three sequence slots and standalone hero frames. Replace them with 18–30 approved images only when the archive supports that length.</p>
      </div>
    </section>

    <section class="gallery-shell theme-paper" data-gallery-shell>
      <div class="gallery-toolbar" aria-label="Gallery view options">
        <div>
          <span class="mono-label">Browse mode</span>
          <span class="gallery-count">${String(images.length).padStart(2, "0")} demo frames</span>
        </div>
        <div class="view-toggle" role="group" aria-label="Choose gallery view">
          <button type="button" data-gallery-mode="story" aria-pressed="true">Story</button>
          <button type="button" data-gallery-mode="index" aria-pressed="false">Index</button>
        </div>
      </div>
      <div class="gallery-story" data-gallery-view="story">${story}</div>
      <div class="gallery-index" data-gallery-view="index" hidden>${index}</div>
    </section>

    ${inquiryBanner(current, site, "Booking live coverage, tour documentation, festival work, or artist portraits?", "project=Concert%20%2F%20Tour")}`;
  return baseDocument({ current, site, title: site.pages.concerts.title, description: site.pages.concerts.description, body, bodyClass: "theme-ink concerts-page" });
}

function supportingGallery(images, current) {
  return `<div class="supporting-gallery">
    ${images.map((image) => figure(current, image, { sizes: image.layout.includes("portrait") ? "(min-width:900px) 38vw, 88vw" : "(min-width:900px) 68vw, 100vw" })).join("")}
  </div>`;
}

function portraitsPage(site, galleries) {
  const current = "portraits";
  const observed = galleries.portraits.filter((image) => image.group === "Observed");
  const constructed = galleries.portraits.filter((image) => image.group === "Constructed");
  const body = `
    <header class="split-page-hero theme-paper">
      <div class="split-page-title">
        ${sectionLabel("PRACTICE 02", "Portraits")}
        <h1>Presence,<br><em>made visible.</em></h1>
        <p>Artist press, editorial, personal branding, graduation portraits, and creative commissions where the work supports the use.</p>
      </div>
      <div class="split-page-image" ${observed[0].demo ? 'data-demo="true"' : ""}>
        ${responsivePicture(current, observed[0], { eager: true, sizes: "(min-width:900px) 50vw, 100vw" })}
      </div>
    </header>

    <section class="gallery-section theme-paper">
      <div class="gallery-section-heading">
        ${sectionLabel("02.A", "Portraits / Observed")}
        <h2>Character before performance.</h2>
        <p>Expression, gesture, environment, and available light—images that feel attentive rather than over-directed.</p>
      </div>
      ${supportingGallery(observed, current)}
    </section>

    <section class="gallery-section theme-ink">
      <div class="gallery-section-heading">
        ${sectionLabel("02.B", "Portraits / Constructed")}
        <h2>An idea built together.</h2>
        <p>Stylized lighting, deliberate color, location or studio concepts, and a clear visual premise.</p>
      </div>
      ${supportingGallery(constructed, current)}
    </section>
    ${inquiryBanner(current, site, "Planning an artist, editorial, or creative portrait?", "project=Artist%20or%20Editorial%20Portrait")}`;
  return baseDocument({ current, site, title: site.pages.portraits.title, description: site.pages.portraits.description, body, bodyClass: "theme-paper portraits-page" });
}

function eventsPage(site, galleries) {
  const current = "events";
  const storyImages = galleries.events.filter((image) => image.group === "Event Story");
  const milestoneImages = galleries.events.filter((image) => image.group === "Milestones");
  const body = `
    <header class="page-masthead event-masthead theme-ink">
      ${sectionLabel("PRACTICE 03", "Events & milestones")}
      <h1>One occasion.<br><em>A complete story.</em></h1>
      <div class="masthead-deck">
        <p>Context, candid human moments, decisive details, groups, speakers or stage, and a final atmosphere frame.</p>
        <p>Private names and sensitive event details remain unpublished until approved.</p>
      </div>
    </header>

    <section class="gallery-section theme-paper">
      <div class="gallery-section-heading">
        ${sectionLabel("03.A", "Event sequence")}
        <h2>Consistency across the room.</h2>
        <p>A short assignment sequence proves coverage more effectively than a wall of unrelated highlights.</p>
      </div>
      ${supportingGallery(storyImages, current)}
    </section>

    <section class="gallery-section milestone-section theme-ink">
      <div class="gallery-section-heading">
        ${sectionLabel("03.B", "Graduation / Milestones")}
        <h2>Polished, celebratory,<br>and unmistakably yours.</h2>
        <p>Individual portraits, family and friend groupings, location context, details, and the energy around the achievement.</p>
        <a class="inline-link" href="${routePath(current, "inquire", "project=Graduation")}">Ask about graduation coverage <span aria-hidden="true">↗</span></a>
      </div>
      ${supportingGallery(milestoneImages, current)}
    </section>
    ${inquiryBanner(current, site, "Planning an event, celebration, or graduation session?", "project=Event")}`;
  return baseDocument({ current, site, title: site.pages.events.title, description: site.pages.events.description, body, bodyClass: "theme-ink events-page" });
}

function fieldNotesPage(site, galleries) {
  const current = "field-notes";
  const images = galleries.fieldNotes;
  const body = `
    <header class="field-hero theme-paper">
      <div>
        ${sectionLabel("PRACTICE 04", "Field Notes")}
        <h1>A quieter<br><em>frequency.</em></h1>
      </div>
      <div>
        <p class="lead">Landscape and nature as a personal essay. Place, weather, distance, and the kind of attention that changes the pace of looking.</p>
      </div>
    </header>
    <section class="field-sequence theme-paper">
      ${images.map((image, index) => `
        <div class="field-frame field-frame-${(index % 3) + 1}">
          ${figure(current, image, { sizes: image.layout.includes("portrait") ? "(min-width:900px) 44vw, 88vw" : "(min-width:900px) 74vw, 100vw" })}
        </div>`).join("")}
    </section>
    ${inquiryBanner(current, site)}`;
  return baseDocument({ current, site, title: site.pages["field-notes"].title, description: site.pages["field-notes"].description, body, bodyClass: "theme-paper field-page" });
}

function aboutPage(site, galleries) {
  const current = "about";
  const headshot = galleries.headshot[0];
  const approach = site.approach.map((item) => `
    <article>
      <span>${esc(item.number)}</span>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.text)}</p>
    </article>`).join("");
  const services = site.services.map((service, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${esc(service)}</li>`).join("");
  const credentials = site.credentials.length ? `
    <section class="proof-section">
      ${sectionLabel("SELECTED", "Clients / artists / publications / venues")}
      <p>${site.credentials.map(esc).join(" · ")}</p>
    </section>` : `
    <section class="proof-section empty-proof" aria-label="Credentials placeholder">
      ${sectionLabel("SELECTED", "Credentials")}
      <p>No client, artist, venue, publication, award, or testimonial has been inserted. Add only real, approved proof in <code>src/site.json</code>.</p>
    </section>`;
  const body = `
    <header class="about-hero theme-paper">
      <div class="about-title">
        ${sectionLabel("PROFILE", "About / approach / services")}
        <h1>Human energy,<br>identity, and place.</h1>
        <p class="lead">${esc(site.aboutShort)}</p>
      </div>
      <div class="about-headshot" ${headshot.demo ? 'data-demo="true"' : ""}>
        ${responsivePicture(current, headshot, { eager: true, sizes: "(min-width:900px) 42vw, 100vw" })}
      </div>
    </header>

    <section class="biography theme-paper">
      <div>${sectionLabel("BIOGRAPHY", site.travelNote)}</div>
      <div class="biography-copy">
        ${site.aboutLong.map((paragraph) => `<p class="${paragraph.startsWith("[") ? "placeholder-copy" : ""}">${esc(paragraph)}</p>`).join("")}
      </div>
    </section>

    <section class="approach-section theme-ink">
      <div class="approach-heading">
        ${sectionLabel("METHOD", "Working approach")}
        <h2>Attentive on set.<br>Decisive in the edit.</h2>
      </div>
      <div class="approach-grid">${approach}</div>
    </section>

    <section class="services-section theme-paper">
      <div>
        ${sectionLabel("SERVICES", "Available commissions")}
        <h2>Focused enough to be memorable.<br>Flexible enough to be useful.</h2>
      </div>
      <ol>${services}</ol>
    </section>

    ${credentials}
    ${inquiryBanner(current, site)}`;
  return baseDocument({ current, site, title: site.pages.about.title, description: site.pages.about.description, body, bodyClass: "theme-paper about-page" });
}

function inquirePage(site) {
  const current = "inquire";
  const projectOptions = site.projectTypes.map((type) => `<option value="${esc(type)}">${esc(type)}</option>`).join("");
  const budgetOptions = site.budgetOptions.map((type) => `<option value="${esc(type)}">${esc(type)}</option>`).join("");
  const body = `
    <header class="inquire-hero theme-ink">
      <div>
        ${sectionLabel("CONTACT", "Start a project")}
        <h1>Tell me what<br>you’re making.</h1>
      </div>
      <div class="inquire-direct">
        <p>${esc(site.travelNote)}</p>
        <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
        <a href="${esc(site.instagramUrl)}" rel="me noopener noreferrer">${esc(site.instagramHandle)}</a>
        <p class="placeholder-copy">Add real response-time language only after deciding what you can consistently promise.</p>
      </div>
    </header>

    <section class="inquiry-form-section theme-paper">
      <div class="form-intro">
        ${sectionLabel("BRIEF", "Only the details that help plan the work")}
        <h2>A useful first note.</h2>
        <p>The form creates an email draft in your default mail app. It does not claim to store or send anything on its own.</p>
      </div>
      <form class="inquiry-form" data-inquiry-form data-recipient="${esc(site.email)}">
        <div class="form-field">
          <label for="name">Name <span aria-hidden="true">*</span></label>
          <input id="name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="form-field">
          <label for="email">Email <span aria-hidden="true">*</span></label>
          <input id="email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="form-field form-field-wide">
          <label for="project-type">Project type <span aria-hidden="true">*</span></label>
          <select id="project-type" name="projectType" required>
            <option value="">Choose one</option>
            ${projectOptions}
          </select>
        </div>
        <div class="form-field">
          <label for="timeline">Preferred date or timeline</label>
          <input id="timeline" name="timeline" type="text" placeholder="Example: October 18 or fall 2026">
        </div>
        <div class="form-field">
          <label for="location">City, venue, or location</label>
          <input id="location" name="location" type="text" autocomplete="address-level2">
        </div>
        <div class="form-field form-field-wide">
          <label for="usage">Intended usage or deliverables</label>
          <textarea id="usage" name="usage" rows="4" placeholder="Example: editorial gallery, press selects, social crops, prints"></textarea>
        </div>
        <div class="form-field form-field-wide">
          <label for="budget">Budget range <span class="optional">Optional</span></label>
          <select id="budget" name="budget">
            <option value="">Choose one</option>
            ${budgetOptions}
          </select>
        </div>
        <div class="form-field form-field-wide">
          <label for="details">Project details <span aria-hidden="true">*</span></label>
          <textarea id="details" name="details" rows="8" required placeholder="Share the people involved, the feeling you want, timing, access, usage, and anything already decided."></textarea>
        </div>
        <div class="form-submit form-field-wide">
          <button class="action-primary" type="submit">Create email draft <span aria-hidden="true">↗</span></button>
          <p class="form-helper">Required fields are marked with an asterisk. No marketing subscription is added.</p>
          <p class="form-status" data-form-status role="status" aria-live="polite"></p>
        </div>
      </form>
    </section>`;
  return baseDocument({ current, site, title: site.pages.inquire.title, description: site.pages.inquire.description, body, bodyClass: "theme-ink inquire-page", includeLightbox: false });
}

function notFoundPage(site) {
  const current = "home";
  const body = `
    <section class="not-found theme-paper">
      ${sectionLabel("404", "Frame not found")}
      <h1>That page moved<br>out of view.</h1>
      <p>Return to the portfolio index or open the flagship concert work.</p>
      ${actions(current, "concerts", "work")}
    </section>`;
  return baseDocument({ current, site, title: `Page not found — ${site.name}`, description: "The requested portfolio page could not be found.", body, bodyClass: "theme-paper not-found-page", includeLightbox: false });
}

export function renderPages(site, galleries) {
  return new Map([
    ["index.html", homePage(site, galleries)],
    ["work/index.html", workPage(site, galleries)],
    ["concerts/index.html", concertsPage(site, galleries)],
    ["portraits/index.html", portraitsPage(site, galleries)],
    ["events/index.html", eventsPage(site, galleries)],
    ["field-notes/index.html", fieldNotesPage(site, galleries)],
    ["about/index.html", aboutPage(site, galleries)],
    ["inquire/index.html", inquirePage(site)],
    ["404.html", notFoundPage(site)],
  ]);
}

export { ROUTES };
