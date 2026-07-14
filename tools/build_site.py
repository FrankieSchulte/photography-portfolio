#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from html import escape
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "content" / "site.json"
PUBLIC = ROOT / "public"
DEFAULT_OUTPUT = ROOT / "dist"


def esc(value: object) -> str:
    return escape(str(value if value is not None else ""), quote=True)


def load_content() -> dict:
    with CONTENT_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data.get("categories"), list):
        raise ValueError("content/site.json must contain a categories array")
    return data


def orientation(value: str | None) -> str:
    return "portrait" if value == "portrait" else "landscape"


def image_markup(photo: dict, *, class_name: str = "", eager: bool = False, lightbox: bool = False) -> str:
    src = esc(photo.get("src", ""))
    alt = esc(photo.get("alt", "Portfolio photograph"))
    orient = orientation(photo.get("orientation"))
    width, height = ((1000, 1500) if orient == "portrait" else (1500, 1000))
    classes = " ".join(x for x in ["photo-frame", f"ratio-{orient}", class_name] if x)
    loading = "eager" if eager else "lazy"
    priority = ' fetchpriority="high"' if eager else ""
    attrs = ""
    if lightbox:
        attrs = (
            f' data-lightbox="{src}" data-alt="{alt}" '
            f'data-caption="{esc(photo.get("caption", ""))}" tabindex="0" role="button"'
        )
    return (
        f'<figure class="{classes}"{attrs}>'
        f'<img src="{src}" alt="{alt}" width="{width}" height="{height}" '
        f'loading="{loading}" decoding="async"{priority}>'
        f'<span class="photo-grain" aria-hidden="true"></span>'
        f'</figure>'
    )


def head(data: dict, title: str, description: str, path: str, body_class: str) -> str:
    meta = data["meta"]
    robots = '<meta name="robots" content="noindex,nofollow">' if meta.get("noIndex", True) else '<meta name="robots" content="index,follow">'
    config = {
        "name": meta.get("name", "Frankie Schulte"),
        "email": meta.get("email", ""),
        "instagramUrl": meta.get("instagramUrl", "#"),
        "demoMode": meta.get("demoMode", True),
        "twinkleFrequency": data.get("home", {}).get("twinkleFrequency", 8),
        "twinkleAmount": data.get("home", {}).get("twinkleAmount", 16),
        "twinkleDuration": data.get("home", {}).get("twinkleDuration", 4800),
        "twinkleBrightness": data.get("home", {}).get("twinkleBrightness", 60),
    }
    ascii_art = data.get("home", {}).get("asciiArt", ":: FRANKIE SCHULTE / IMAGE ARCHIVE ::")
    # Unicode Braille blank (U+2800) is sometimes drawn as an empty-dot cell.
    # A regular space preserves the artwork's grid without exposing blank cells.
    ascii_display = str(ascii_art).replace("\u2800", " ")
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  {robots}
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/site.css">
  <script>window.PORTFOLIO_CONFIG={json.dumps(config, ensure_ascii=False)};</script>
  <script src="/assets/site.js" defer></script>
</head>
<body class="{esc(body_class)}" data-path="{esc(path)}">
<a class="skip-link" href="#main">Skip to content</a>
<div class="ambient-field" aria-hidden="true">
  <div class="ambient-ascii"><pre data-ascii-output>{esc(ascii_display)}</pre></div>
  <div class="ambient-ascii ambient-ascii-mirror"><pre data-ascii-mirror>{esc(ascii_display)}</pre></div>
</div>
'''


def header(data: dict, active: str = "") -> str:
    meta = data["meta"]
    links = []
    for item in data.get("navigation", []):
        label = item.get("label", "Link")
        href = item.get("href", "#")
        cls = " is-active" if label.lower() == active.lower() else ""
        links.append(f'<a class="nav-link{cls}" href="{esc(href)}">{esc(label)}</a>')
    return f'''
<header class="site-header" data-header>
  <div class="header-shell">
    <a class="brand" href="/" aria-label="{esc(meta.get('name'))}, home">
      <span class="brand-copy"><strong>{esc(meta.get('name'))}</strong><small>Photo / image / motion</small></span>
    </a>
    <nav class="desktop-nav" aria-label="Primary">{''.join(links)}</nav>
    <div class="header-actions">
      <span class="header-edition" aria-hidden="true">VOL. 01 / <span data-year></span></span>
      <button class="menu-button" type="button" data-menu-button aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" data-mobile-menu aria-hidden="true">
  <div class="mobile-menu-code" aria-hidden="true">SELECTED IMAGE ARCHIVE<br>◜───────────◝</div>
  <nav aria-label="Mobile navigation">{''.join(links)}</nav>
  <div class="mobile-contact"><span>{esc(meta.get('location'))}</span><a href="mailto:{esc(meta.get('email'))}">{esc(meta.get('email'))}</a></div>
</div>
'''


def footer(data: dict) -> str:
    meta = data["meta"]
    try:
        footer_line_height = max(0.7, min(3.0, float(meta.get("footerAsciiLineHeight", 1.3))))
    except (TypeError, ValueError):
        footer_line_height = 1.3
    footer_ascii = "\n".join(
        line.strip()
        for line in str(meta.get("footerAscii", "૮ ˶ᵔ ᵕ ᵔ˶ ა")).replace("\u2800", " ").splitlines()
    )
    return f'''
<footer class="site-footer">
  <div class="footer-shell">
    <div class="footer-code"><span>FRANKIE SCHULTE / IMAGE ARCHIVE</span><span>SELECTED WORKS / 01—04</span></div>
    <div class="footer-brand-row"><a class="footer-name" href="/">{esc(meta.get('name'))}</a><pre class="footer-ascii" style="--footer-ascii-line-height:{footer_line_height:g}" aria-hidden="true">{esc(footer_ascii)}</pre></div>
    <div class="footer-links"><a href="mailto:{esc(meta.get('email'))}">{esc(meta.get('email'))}</a><a href="{esc(meta.get('instagramUrl'))}" rel="noreferrer">{esc(meta.get('instagramLabel'))}</a><span>{esc(meta.get('location'))}</span></div>
    <p class="footer-fine">© <span data-year></span> {esc(meta.get('name'))}. All photographs remain the property of their respective creator.</p>
  </div>
</footer>
'''


def end(data: dict, *, include_footer: bool = True) -> str:
    return (footer(data) if include_footer else "") + "\n</body>\n</html>\n"


def render_home(data: dict) -> str:
    meta, home = data["meta"], data["home"]
    name_parts = str(meta.get("name", "Frankie Schulte")).split(maxsplit=1)
    name_first = name_parts[0]
    name_last = name_parts[1] if len(name_parts) > 1 else ""
    features = []
    visible_slides = [slide for slide in home.get("heroSlides", []) if str(slide.get("src", "")).strip()]
    for index, slide in enumerate(visible_slides):
        orient = slide.get("orientation", "landscape")
        if orient not in {"portrait", "landscape", "square"}:
            orient = "landscape"
        load = "eager" if index < 3 else "lazy"
        priority = ' fetchpriority="high"' if index == 0 else ""
        label = slide.get("label", f"Selected frame {str(index + 1).zfill(2)}")
        href = slide.get("href") or "/work/"
        width, height = {"portrait": (1000, 1500), "landscape": (1500, 1000), "square": (1200, 1200)}[orient]
        features.append(f'''
<article class="home-feature home-feature-{index + 1} feature-{esc(orient)}" data-home-feature>
  <a class="home-feature-link" href="{esc(href)}" aria-label="Open {esc(label)}">
    <figure class="home-feature-media">
      <img src="{esc(slide.get('src'))}" alt="{esc(slide.get('alt'))}" width="{width}" height="{height}" style="--focus:{esc(slide.get('position', '50% 50%'))}" loading="{load}" decoding="async"{priority}>
      <span class="photo-grain" aria-hidden="true"></span>
    </figure>
    <p><span>{str(index + 1).zfill(2)}</span>{esc(label)}</p>
  </a>
</article>''')
    categories = "".join(
        f'<a href="/work/{esc(cat["slug"])}/"><span>{str(i+1).zfill(2)}</span>{esc(cat.get("shortTitle", cat.get("title")))}</a>'
        for i, cat in enumerate(data.get("categories", []))
    )
    primary = home.get("primaryCta", {})
    secondary = home.get("secondaryCta", {})
    title = f'{meta.get("name")} — {meta.get("role")}'
    out = head(data, title, meta.get("siteDescription", ""), "/", "page-home")
    out += header(data)
    out += f'''
<main id="main" class="home-stage">
  <section class="home-masthead" aria-labelledby="home-title">
    <div class="masthead-meta"><span>ISSUE 001 / <span data-year></span></span><span>{esc(meta.get('role'))} / {esc(meta.get('location'))}</span><span>PHOTOGRAPHS 01—{str(max(1, len(features))).zfill(2)}</span></div>
    <h1 id="home-title"><span>{esc(name_first)}</span><span>{esc(name_last)}</span></h1>
    <div class="masthead-rule" aria-hidden="true"><span>SELECTED WORKS</span><span>IMAGE / LIGHT / MOVEMENT</span><span>VOL. 01</span></div>
  </section>
  <section class="home-sequence" aria-label="Highlighted photographs">
    <aside class="home-folio" aria-hidden="true"><span class="home-folio-copy"><b>01</b><strong>Selected<br>works</strong></span><span class="tone-swatches"><i></i><i></i><i></i><i></i></span></aside>
    <div class="home-rail" data-home-rail tabindex="0" aria-label="Highlighted photographs. The sequence loops automatically and can also be scrolled horizontally."><div class="home-spread" data-home-spread><div class="home-loop-group" data-home-loop-group>{''.join(features)}</div></div></div>
  </section>
  <section class="home-copy">
    <div><p class="micro-label hero-eyebrow">{esc(home.get('eyebrow'))}</p><p class="home-intro">{esc(home.get('intro'))}</p></div>
    <div class="home-actions">
      <a class="button button-primary" href="{esc(primary.get('href', '/work/'))}">{esc(primary.get('label', 'See my work'))}<span aria-hidden="true">→</span></a>
      <a class="button button-secondary" href="{esc(secondary.get('href', '/inquire/'))}">{esc(secondary.get('label', 'Start a project'))}</a>
    </div>
    <nav class="home-index" aria-label="Portfolio categories">{categories}</nav>
  </section>
</main>
'''
    out += end(data, include_footer=False)
    return out


def render_work(data: dict) -> str:
    meta, work = data["meta"], data["work"]
    cards = []
    for i, cat in enumerate(data.get("categories", [])):
        cover = cat.get("cover", {})
        cards.append(f'''
<a class="category-card" href="/work/{esc(cat['slug'])}/" data-reveal>
  <div class="category-card-media">{image_markup(cover, class_name='category-card-image ratio-square')}<span class="category-card-index">{str(i+1).zfill(2)}</span></div>
  <span class="category-card-copy"><small>{esc(cat.get('eyebrow'))}</small><strong>{esc(cat.get('title'))}</strong></span>
</a>''')
    out = head(data, f'Work — {meta.get("name")}', work.get("intro", ""), "/work/", "page-inner page-work")
    out += header(data, "Work")
    out += f'''
<main id="main">
  <section class="page-intro shell">
    <div class="page-intro-code" aria-hidden="true">SELECTED PHOTOGRAPHS<br>VOLUME 01</div>
    <p class="micro-label" data-reveal>{esc(work.get('eyebrow'))}</p>
    <h1 data-reveal>{esc(work.get('headline'))}</h1>
    <p class="page-intro-copy copy-panel" data-copy-module="INDEX / 01" data-reveal>{esc(work.get('intro'))}</p>
  </section>
  <section class="category-grid shell" aria-label="Photography categories">{''.join(cards)}</section>
</main>
'''
    out += end(data)
    return out


def render_category(data: dict, category: dict) -> str:
    meta = data["meta"]
    projects = []
    for i, project in enumerate(category.get("projects", [])):
        projects.append(f'''
<a class="project-card" href="/work/{esc(category['slug'])}/{esc(project['slug'])}/" data-reveal>
  <div class="project-card-media">{image_markup(project.get('cover', {}), class_name='project-card-image ratio-square')}<span class="project-card-index">{str(i+1).zfill(2)}</span></div>
  <span class="project-card-copy"><small>{esc(project.get('kicker'))}</small><strong>{esc(project.get('title'))}</strong><span>{esc(project.get('location'))} · {esc(project.get('year'))} ↗</span></span>
</a>''')
    description = category.get("intro", "")
    out = head(data, f'{category.get("title")} — {meta.get("name")}', description, f'/work/{category["slug"]}/', "page-inner page-category")
    out += header(data, "Work")
    out += f'''
<main id="main">
  <section class="category-hero shell">
    <div class="category-hero-top"><a class="back-link" href="/work/" data-reveal>← All work</a><span aria-hidden="true">ARCHIVE / {esc(category.get('slug')).upper()}</span></div>
    <p class="micro-label" data-reveal>{esc(category.get('eyebrow'))}</p>
    <h1 data-reveal>{esc(category.get('title'))}</h1>
    <p class="copy-panel" data-copy-module="SEQUENCE / 01" data-reveal>{esc(description)}</p>
  </section>
  <section class="project-grid shell" aria-label="Shoots in {esc(category.get('title'))}">{''.join(projects)}</section>
  <section class="soft-cta shell" data-reveal><p>Have something in mind that fits here—or doesn’t fit neatly anywhere?</p><a class="button button-primary" href="/inquire/">Tell me about it <span>↗</span></a></section>
</main>
'''
    out += end(data)
    return out


def render_project(data: dict, category: dict, project: dict) -> str:
    meta = data["meta"]
    photos = []
    for i, photo in enumerate(project.get("photos", [])):
        photos.append(f'''
<div class="project-photo project-photo-{(i % 5) + 1}" data-reveal>
  {image_markup(photo, lightbox=True)}
  {f'<p>{esc(photo.get("caption"))}</p>' if photo.get("caption") else ''}
</div>''')
    path = f'/work/{category["slug"]}/{project["slug"]}/'
    out = head(data, f'{project.get("title")} — {meta.get("name")}', project.get("description", ""), path, "page-inner page-project")
    out += header(data, "Work")
    out += f'''
<main id="main">
  <section class="project-hero shell">
    <a class="back-link" href="/work/{esc(category['slug'])}/">← {esc(category.get('title'))}</a>
    <div class="project-heading">
      <div><p class="micro-label" data-reveal>{esc(project.get('kicker'))}</p><h1 data-reveal>{esc(project.get('title'))}</h1></div>
      <dl data-reveal><div><dt>Place</dt><dd>{esc(project.get('location'))}</dd></div><div><dt>Year</dt><dd>{esc(project.get('year'))}</dd></div><div><dt>Images</dt><dd>{len(project.get('photos', []))}</dd></div></dl>
    </div>
    <p class="project-description copy-panel" data-copy-module="FIELD NOTE / 01" data-reveal>{esc(project.get('description'))}</p>
  </section>
  <section class="project-gallery shell" aria-label="{esc(project.get('title'))} photographs">{''.join(photos)}</section>
  <nav class="project-next shell" aria-label="Project navigation"><a href="/work/{esc(category['slug'])}/">More {esc(category.get('shortTitle', category.get('title')))} <span>↗</span></a><a href="/inquire/">Start a project <span>↗</span></a></nav>
</main>
'''
    out += end(data)
    return out


def render_about(data: dict) -> str:
    meta, about = data["meta"], data["about"]
    paragraphs = "".join(
        f'<p class="copy-panel" data-copy-module="BIO / {i + 1:02d}" data-reveal>{esc(p)}</p>'
        for i, p in enumerate(about.get("body", []))
    )
    portrait = {"src": about.get("portrait"), "alt": about.get("portraitAlt"), "orientation": "portrait"}
    out = head(data, f'About — {meta.get("name")}', about.get("headline", ""), "/about/", "page-inner page-about")
    out += header(data, "About")
    out += f'''
<main id="main" class="about-layout shell">
  <section class="about-copy">
    <p class="micro-label" data-reveal>{esc(about.get('eyebrow'))}</p>
    <h1 data-reveal>{esc(about.get('headline'))}</h1>
    <div class="about-body">{paragraphs}</div>
    <p class="availability copy-panel" data-copy-module="STATUS / OPEN" data-reveal>{esc(about.get('availability'))}</p>
    <a class="button button-primary" href="/inquire/" data-reveal>Start a conversation <span>↗</span></a>
  </section>
  <aside class="about-photo" data-reveal>{image_markup(portrait, eager=True)}<p>{esc(meta.get('location'))} · Available to travel when the project makes sense.</p></aside>
</main>
'''
    out += end(data)
    return out


def render_inquire(data: dict) -> str:
    meta, inquire = data["meta"], data["inquire"]
    options = "".join(f'<option value="{esc(x)}">{esc(x)}</option>' for x in inquire.get("projectTypes", []))
    form_endpoint = str(inquire.get("formEndpoint", "")).strip()
    delivery_note = "Your message is sent directly. No separate email app is needed." if form_endpoint else "Add your Formspree endpoint in the editor to enable direct delivery."
    out = head(data, f'Inquire — {meta.get("name")}', inquire.get("intro", ""), "/inquire/", "page-inner page-inquire")
    out += header(data, "Inquire")
    out += f'''
<main id="main" class="inquire-layout shell">
  <section class="inquire-copy">
    <p class="micro-label" data-reveal>{esc(inquire.get('eyebrow'))}</p>
    <h1 data-reveal>{esc(inquire.get('headline'))}</h1>
    <p class="copy-panel" data-copy-module="TRANSMISSION / 01" data-reveal>{esc(inquire.get('intro'))}</p>
    <div class="direct-contact" data-reveal><a href="mailto:{esc(meta.get('email'))}">{esc(meta.get('email'))}</a><a href="{esc(meta.get('instagramUrl'))}">{esc(meta.get('instagramLabel'))}</a><span>{esc(meta.get('location'))}</span></div>
  </section>
  <form class="inquiry-form" action="#" method="POST" data-inquiry-form data-form-endpoint="{esc(form_endpoint)}">
    <label class="form-honey" aria-hidden="true">Leave this field empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label>
    <div class="form-grid">
      <label><span>Name</span><input name="name" autocomplete="name" required></label>
      <label><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
      <label><span>Project type</span><select name="projectType" required><option value="">Choose one</option>{options}</select></label>
      <label><span>Date or timeline</span><input name="timeline" placeholder="A date or a rough window"></label>
      <label class="form-wide"><span>City, venue, or location</span><input name="location"></label>
      <label class="form-wide"><span>What are you planning?</span><textarea name="details" rows="7" required></textarea></label>
    </div>
    <div class="form-submit"><button class="button button-primary" type="submit">{esc(inquire.get('buttonLabel', 'Send inquiry'))} <span>↗</span></button><p>{esc(delivery_note)}</p></div>
    <p class="form-status" data-form-status role="status"></p>
  </form>
</main>
'''
    out += end(data)
    return out


def render_404(data: dict) -> str:
    meta = data["meta"]
    out = head(data, f'Page not found — {meta.get("name")}', "The requested page could not be found.", "/404.html", "page-inner page-404")
    out += header(data)
    out += '''<main id="main" class="error-page shell"><p class="micro-label">404 / Out of frame</p><h1>That page isn’t here.</h1><a class="button button-primary" href="/work/">See the work <span>↗</span></a></main>'''
    out += end(data)
    return out


def write_page(output: Path, relative: str, html: str) -> None:
    target = output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding="utf-8")


def redirect_page(url: str) -> str:
    safe = esc(url)
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="0;url={safe}"><link rel="canonical" href="{safe}"><title>Redirecting…</title></head><body><p><a href="{safe}">Continue</a></p></body></html>'''


def build(output: Path) -> None:
    data = load_content()
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    if (PUBLIC / "assets").exists():
        shutil.copytree(PUBLIC / "assets", output / "assets")

    write_page(output, "index.html", render_home(data))
    write_page(output, "work/index.html", render_work(data))
    write_page(output, "about/index.html", render_about(data))
    write_page(output, "inquire/index.html", render_inquire(data))
    write_page(output, "404.html", render_404(data))

    for category in data.get("categories", []):
        write_page(output, f'work/{category["slug"]}/index.html', render_category(data, category))
        for project in category.get("projects", []):
            write_page(output, f'work/{category["slug"]}/{project["slug"]}/index.html', render_project(data, category, project))

    redirects = {
        "graduation/index.html": "/work/portraits-graduation/",
        "portraits/index.html": "/work/portraits-graduation/",
        "events/index.html": "/work/events/",
        "concerts/index.html": "/work/concerts/",
        "travel/index.html": "/work/personal-travel/",
        "field-notes/index.html": "/work/personal-travel/",
    }
    for rel, url in redirects.items():
        write_page(output, rel, redirect_page(url))

    robots = "User-agent: *\nDisallow: /\n" if data["meta"].get("noIndex", True) else "User-agent: *\nAllow: /\n"
    write_page(output, "robots.txt", robots)

    # A sitemap is generated with relative paths until a public domain is supplied.
    paths = ["/", "/work/", "/about/", "/inquire/"]
    for category in data.get("categories", []):
        paths.append(f'/work/{category["slug"]}/')
        paths.extend(f'/work/{category["slug"]}/{p["slug"]}/' for p in category.get("projects", []))
    write_page(output, "sitemap-paths.txt", "\n".join(paths) + "\n")

    manifest = {
        "name": f'{data["meta"].get("name")} Photography',
        "short_name": data["meta"].get("shortName", "FS"),
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#ffffff",
    }
    write_page(output, "site.webmanifest", json.dumps(manifest, indent=2))

    print(f"Built {len(list(output.rglob('*.html')))} HTML pages in {output}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the static photography portfolio")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    build(args.output.resolve())


if __name__ == "__main__":
    main()
