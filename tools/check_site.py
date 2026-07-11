#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
CONTENT = ROOT / "content" / "site.json"


class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for key in ("href", "src"):
            if values.get(key):
                self.refs.append(values[key] or "")


def resolve_reference(page: Path, ref: str) -> Path | None:
    if not ref or ref.startswith(("#", "mailto:", "tel:", "http://", "https://", "data:")):
        return None
    parsed = urlparse(ref)
    path = parsed.path
    target = DIST / path.lstrip("/") if path.startswith("/") else page.parent / path
    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target


def main() -> int:
    errors: list[str] = []
    data = json.loads(CONTENT.read_text(encoding="utf-8"))
    categories = data.get("categories", [])
    category_slugs = [item.get("slug") for item in categories]
    if len(category_slugs) != len(set(category_slugs)):
        errors.append("Category slugs must be unique.")

    project_count = 0
    photo_count = len(data.get("home", {}).get("heroSlides", []))
    for category in categories:
        seen: set[str] = set()
        for project in category.get("projects", []):
            project_count += 1
            slug = project.get("slug")
            if slug in seen:
                errors.append(f'Duplicate project slug "{slug}" in {category.get("slug")}')
            seen.add(slug)
            for photo in [project.get("cover", {})] + project.get("photos", []):
                photo_count += 1
                if photo.get("orientation") not in {"portrait", "landscape"}:
                    errors.append(f'Invalid orientation in {category.get("slug")}/{slug}: {photo.get("orientation")}')
                src = str(photo.get("src", ""))
                if src.startswith("/assets/") and not (ROOT / "public" / src.lstrip("/")).exists():
                    errors.append(f"Missing source image: {src}")

    html_files = list(DIST.rglob("*.html"))
    for page in html_files:
        parser = RefParser()
        parser.feed(page.read_text(encoding="utf-8", errors="replace"))
        for ref in parser.refs:
            target = resolve_reference(page, ref)
            if target is not None and not target.exists():
                errors.append(f"Broken reference in {page.relative_to(DIST)}: {ref}")

    if errors:
        print("Site check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Site check passed: {len(html_files)} HTML pages, {len(categories)} categories, {project_count} shoots, {photo_count} configured photographs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
