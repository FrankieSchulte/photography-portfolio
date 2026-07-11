#!/usr/bin/env python3
"""Create responsive AVIF, WebP, and JPEG derivatives from source-images/.

The image manifest is src/galleries.json. Each item must have file, width,
and height values. Replace source masters, update metadata, then run:
    npm run images
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "galleries.json"
SOURCE = ROOT / "source-images"
OUTPUT = ROOT / "public" / "assets" / "images"
TARGET_WIDTHS = (480, 960, 1600)


def iter_specs(data: dict) -> Iterable[dict]:
    for category in ("concerts", "portraits", "events", "fieldNotes", "headshot"):
        yield from data[category]


def save_derivative(image: Image.Image, target: Path, format_name: str) -> bool:
    if target.exists():
        return False
    target.parent.mkdir(parents=True, exist_ok=True)
    if format_name == "AVIF":
        image.save(target, "AVIF", quality=50, speed=10)
    elif format_name == "WEBP":
        image.save(target, "WEBP", quality=78, method=6)
    elif format_name == "JPEG":
        image.save(target, "JPEG", quality=82, optimize=True, progressive=True, subsampling=1)
    else:
        raise ValueError(format_name)
    return True


def main() -> None:
    data = json.loads(MANIFEST.read_text())
    missing: list[str] = []
    count = 0

    for spec in iter_specs(data):
        source_path = SOURCE / f'{spec["file"]}.jpg'
        if not source_path.exists():
            missing.append(str(source_path.relative_to(ROOT)))
            continue

        with Image.open(source_path) as raw:
            raw = ImageOps.exif_transpose(raw).convert("RGB")
            expected_ratio = spec["width"] / spec["height"]
            actual_ratio = raw.width / raw.height
            if abs(expected_ratio - actual_ratio) > 0.02:
                print(
                    f'warning: {source_path.name} ratio {raw.width}:{raw.height} '
                    f'differs from manifest {spec["width"]}:{spec["height"]}'
                )

            for target_width in TARGET_WIDTHS:
                width = min(target_width, raw.width)
                height = round(raw.height * (width / raw.width))
                resized = raw if width == raw.width else raw.resize((width, height), Image.Resampling.LANCZOS)
                base = OUTPUT / f'{spec["file"]}-{target_width}'
                count += int(save_derivative(resized, base.with_suffix(".avif"), "AVIF"))
                count += int(save_derivative(resized, base.with_suffix(".webp"), "WEBP"))
                count += int(save_derivative(resized, base.with_suffix(".jpg"), "JPEG"))
                if resized is not raw:
                    resized.close()

    if missing:
        print("Missing source images:")
        for path in missing:
            print(f"  - {path}")
        raise SystemExit(1)

    print(f"wrote {count} responsive image files to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
