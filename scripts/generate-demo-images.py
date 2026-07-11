#!/usr/bin/env python3
"""Generate clearly non-photographic demo masters for the portfolio starter.

These files exist only to demonstrate composition and responsive-image behavior.
Replace them with approved photography before launch.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "galleries.json"
OUT = ROOT / "source-images"

INK = (10, 10, 10)
PAPER = (242, 239, 231)
ACCENT = (216, 255, 62)

CONCERT_PALETTES = [
    ((9, 9, 12), (236, 47, 120), (62, 82, 255)),
    ((6, 7, 10), (255, 138, 38), (178, 52, 255)),
    ((8, 10, 12), (52, 224, 255), (234, 48, 102)),
    ((6, 7, 8), (216, 255, 62), (66, 105, 255)),
]
PORTRAIT_PALETTES = [
    ((232, 219, 196), (22, 22, 24), (168, 68, 52)),
    ((217, 224, 214), (20, 21, 25), (68, 86, 158)),
    ((238, 232, 221), (29, 24, 22), (194, 146, 46)),
    ((27, 27, 31), (233, 226, 212), (204, 65, 104)),
]
EVENT_PALETTES = [
    ((20, 18, 17), (239, 186, 91), (198, 74, 86)),
    ((13, 17, 22), (92, 182, 203), (242, 184, 73)),
    ((235, 227, 213), (34, 33, 36), (170, 86, 127)),
    ((21, 18, 24), (188, 128, 235), (95, 207, 169)),
]
FIELD_PALETTES = [
    ((219, 226, 216), (94, 117, 91), (35, 44, 39)),
    ((226, 214, 197), (152, 104, 72), (56, 49, 45)),
    ((196, 214, 223), (79, 112, 122), (27, 42, 52)),
    ((221, 217, 196), (127, 132, 83), (54, 59, 45)),
]


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size)
    draw = ImageDraw.Draw(image)
    for y in range(height):
        t = y / max(height - 1, 1)
        color = tuple(lerp(top[i], bottom[i], t) for i in range(3))
        draw.line((0, y, width, y), fill=color)
    return image


def add_grain(image: Image.Image, strength: float = 0.07, seed: int = 1) -> Image.Image:
    random.seed(seed)
    noise = Image.effect_noise(image.size, 32).convert("RGB")
    noise = ImageEnhance.Contrast(noise).enhance(0.75)
    return Image.blend(image, noise, strength)


def glow_layer(size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple[int, int, int], opacity: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*color, opacity))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.45))


def make_concert(size: tuple[int, int], seed: int) -> Image.Image:
    rng = random.Random(seed)
    palette = CONCERT_PALETTES[seed % len(CONCERT_PALETTES)]
    bg, color_a, color_b = palette
    width, height = size
    image = gradient(size, tuple(max(0, c - 2) for c in bg), tuple(min(255, c + 12) for c in bg)).convert("RGBA")

    for idx, color in enumerate((color_a, color_b, ACCENT if seed % 3 == 0 else color_a)):
        x = rng.randint(int(width * 0.08), int(width * 0.92))
        y = rng.randint(-int(height * 0.04), int(height * 0.18))
        radius = rng.randint(int(width * 0.12), int(width * 0.28))
        image = Image.alpha_composite(image, glow_layer(size, (x, y), radius, color, 120 if idx < 2 else 58))

    beams = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(beams)
    for idx, color in enumerate((color_a, color_b)):
        source_x = rng.randint(int(width * 0.12), int(width * 0.88))
        spread = rng.randint(int(width * 0.18), int(width * 0.45))
        end_x = max(0, min(width, source_x + rng.randint(-spread, spread)))
        points = [
            (source_x - width * 0.025, 0),
            (source_x + width * 0.025, 0),
            (end_x + spread * 0.55, height),
            (end_x - spread * 0.55, height),
        ]
        draw.polygon(points, fill=(*color, 34 + idx * 10))
    beams = beams.filter(ImageFilter.GaussianBlur(max(8, width // 140)))
    image = Image.alpha_composite(image, beams)

    stage = ImageDraw.Draw(image)
    horizon = int(height * (0.72 + rng.random() * 0.08))
    stage.rectangle((0, horizon, width, height), fill=(6, 6, 8, 255))

    # Crowd silhouettes.
    for _ in range(max(22, width // 45)):
        x = rng.randint(-30, width + 30)
        head = rng.randint(max(12, width // 95), max(20, width // 58))
        y = rng.randint(horizon - head, horizon + int(height * 0.08))
        stage.ellipse((x - head, y - head, x + head, y + head), fill=(4, 4, 5, 255))
        stage.polygon(
            ((x - head * 1.6, y + head * 0.7), (x + head * 1.6, y + head * 0.7), (x + head * 2.2, height), (x - head * 2.2, height)),
            fill=(4, 4, 5, 255),
        )

    # Performer silhouette and gesture.
    px = int(width * (0.36 + (seed % 5) * 0.07))
    py = int(height * 0.50)
    scale = max(28, width // 22)
    stage.ellipse((px - scale * 0.44, py - scale * 1.9, px + scale * 0.44, py - scale * 1.0), fill=(5, 5, 6, 255))
    stage.rounded_rectangle((px - scale * 0.62, py - scale, px + scale * 0.62, py + scale * 2.2), radius=scale // 3, fill=(5, 5, 6, 255))
    arm_end_x = px + (-1 if seed % 2 else 1) * int(scale * 2.4)
    arm_end_y = py - int(scale * (1.5 + (seed % 3) * 0.65))
    stage.line((px, py - scale * 0.4, arm_end_x, arm_end_y), fill=(5, 5, 6, 255), width=max(14, scale // 3))
    stage.ellipse((arm_end_x - scale * 0.22, arm_end_y - scale * 0.22, arm_end_x + scale * 0.22, arm_end_y + scale * 0.22), fill=(5, 5, 6, 255))

    # Small stage-light highlights.
    for _ in range(8):
        x = rng.randint(0, width)
        y = rng.randint(int(height * 0.12), int(height * 0.68))
        r = rng.randint(2, max(4, width // 240))
        stage.ellipse((x-r, y-r, x+r, y+r), fill=(*color_a, rng.randint(90, 210)))

    return add_grain(image.convert("RGB"), 0.085, seed)


def make_portrait(size: tuple[int, int], seed: int) -> Image.Image:
    rng = random.Random(seed)
    bg, ink, accent = PORTRAIT_PALETTES[seed % len(PORTRAIT_PALETTES)]
    width, height = size
    image = gradient(size, bg, tuple(max(0, c - 16) for c in bg)).convert("RGBA")
    draw = ImageDraw.Draw(image)

    # Editorial framing blocks.
    if seed % 2:
        draw.rectangle((0, 0, int(width * 0.28), height), fill=(*accent, 210))
    else:
        draw.rectangle((int(width * 0.72), 0, width, height), fill=(*accent, 165))
    draw.line((width * 0.08, height * 0.08, width * 0.92, height * 0.08), fill=(*ink, 110), width=max(2, width // 800))

    cx = int(width * (0.48 + rng.uniform(-0.08, 0.08)))
    head_y = int(height * 0.31)
    head_w = int(width * 0.19)
    head_h = int(height * 0.18)
    skin = tuple(lerp(bg[i], (196, 142, 104)[i], 0.55) for i in range(3))

    # Window-light glow.
    glow = glow_layer(size, (int(width * 0.36), int(height * 0.28)), int(width * 0.28), PAPER, 105)
    image = Image.alpha_composite(image, glow)
    draw = ImageDraw.Draw(image)

    draw.ellipse((cx - head_w, head_y - head_h, cx + head_w, head_y + head_h), fill=(*skin, 255))
    draw.pieslice((cx - head_w * 1.04, head_y - head_h * 1.12, cx + head_w * 1.04, head_y + head_h * 0.56), 180, 360, fill=(*ink, 255))
    shoulder_y = int(height * 0.52)
    draw.rounded_rectangle((int(width * 0.21), shoulder_y, int(width * 0.79), int(height * 1.02)), radius=int(width * 0.14), fill=(*ink, 255))

    # Face shadow and highlight.
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.pieslice((cx - head_w, head_y - head_h, cx + head_w, head_y + head_h), 270, 90, fill=(5, 5, 6, 88))
    shadow = shadow.filter(ImageFilter.GaussianBlur(max(8, width // 90)))
    image = Image.alpha_composite(image, shadow)

    return add_grain(image.convert("RGB"), 0.05, seed)


def make_event(size: tuple[int, int], seed: int) -> Image.Image:
    rng = random.Random(seed)
    bg, warm, accent = EVENT_PALETTES[seed % len(EVENT_PALETTES)]
    width, height = size
    image = gradient(size, bg, tuple(max(0, c - 10) for c in bg)).convert("RGBA")
    image = Image.alpha_composite(image, glow_layer(size, (int(width * 0.72), int(height * 0.18)), int(width * 0.30), warm, 120))
    draw = ImageDraw.Draw(image)

    floor_y = int(height * 0.70)
    draw.rectangle((0, floor_y, width, height), fill=(12, 12, 14, 255))

    # Repeating people/groups to suggest event consistency without pretending to be a real event.
    count = 8 if width > height else 6
    for i in range(count):
        x = int(width * (0.08 + i * (0.84 / max(1, count - 1))))
        y = floor_y - rng.randint(int(height * 0.02), int(height * 0.10))
        r = max(14, int(width * (0.018 + rng.random() * 0.008)))
        tone = warm if i % 3 == 0 else (32, 32, 36)
        draw.ellipse((x-r, y-r*2, x+r, y), fill=(*tone, 255))
        draw.rounded_rectangle((x-r*2, y-r//2, x+r*2, floor_y+int(height*0.16)), radius=r, fill=(*tone, 255))

    # Stage / architecture lines.
    draw.line((width * 0.06, height * 0.14, width * 0.94, height * 0.14), fill=(*accent, 190), width=max(3, width // 320))
    draw.line((width * 0.06, height * 0.17, width * 0.62, height * 0.17), fill=(*warm, 120), width=max(2, width // 600))

    # Confetti / detail marks.
    for _ in range(44):
        x = rng.randint(0, width)
        y = rng.randint(int(height * 0.10), int(height * 0.68))
        r = rng.randint(2, max(3, width // 260))
        color = warm if rng.random() > 0.45 else accent
        draw.rectangle((x-r, y-r, x+r, y+r), fill=(*color, rng.randint(70, 210)))

    return add_grain(image.convert("RGB"), 0.06, seed)


def make_field(size: tuple[int, int], seed: int) -> Image.Image:
    rng = random.Random(seed)
    sky, land, dark = FIELD_PALETTES[seed % len(FIELD_PALETTES)]
    width, height = size
    image = gradient(size, tuple(min(255, c + 14) for c in sky), sky).convert("RGBA")
    draw = ImageDraw.Draw(image)

    sun_x = int(width * (0.22 + (seed % 5) * 0.13))
    sun_y = int(height * (0.18 + (seed % 3) * 0.05))
    sun_r = int(width * 0.055)
    draw.ellipse((sun_x-sun_r, sun_y-sun_r, sun_x+sun_r, sun_y+sun_r), fill=(*PAPER, 210))

    for layer in range(5):
        base_y = int(height * (0.53 + layer * 0.085))
        amplitude = height * (0.045 + layer * 0.012)
        points = [(0, height)]
        for x in range(0, width + 1, max(24, width // 40)):
            wave = math.sin((x / width) * math.pi * (1.3 + layer * 0.45) + seed * 0.7) * amplitude
            jitter = rng.uniform(-amplitude * 0.18, amplitude * 0.18)
            points.append((x, base_y + wave + jitter))
        points.extend([(width, height), (0, height)])
        t = layer / 4
        color = tuple(lerp(land[i], dark[i], t) for i in range(3))
        draw.polygon(points, fill=(*color, 255))

    # Fine vertical marks like grasses / trees.
    for _ in range(40):
        x = rng.randint(0, width)
        y = rng.randint(int(height * 0.70), int(height * 0.96))
        length = rng.randint(int(height * 0.015), int(height * 0.07))
        draw.line((x, y, x+rng.randint(-4, 4), y-length), fill=(*dark, rng.randint(80, 190)), width=max(1, width // 800))

    return add_grain(image.convert("RGB"), 0.045, seed)


def make_headshot(size: tuple[int, int], seed: int) -> Image.Image:
    width, height = size
    image = gradient(size, (226, 220, 207), (192, 184, 171)).convert("RGBA")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, int(width * 0.22), height), fill=(216, 255, 62, 205))
    cx, cy = int(width * 0.55), int(height * 0.33)
    head_w, head_h = int(width * 0.16), int(height * 0.14)
    draw.ellipse((cx-head_w, cy-head_h, cx+head_w, cy+head_h), fill=(86, 72, 64, 255))
    draw.pieslice((cx-head_w*1.03, cy-head_h*1.12, cx+head_w*1.03, cy+head_h*0.55), 180, 360, fill=(20, 20, 22, 255))
    draw.rounded_rectangle((int(width*0.29), int(height*0.48), int(width*0.82), int(height*1.02)), radius=int(width*0.13), fill=(18,18,20,255))
    draw.line((width*0.08, height*0.08, width*0.92, height*0.08), fill=(10,10,10,110), width=max(2,width//700))
    return add_grain(image.convert("RGB"), 0.055, seed)


def iter_images(data: dict) -> Iterable[tuple[str, dict]]:
    for category in ("concerts", "portraits", "events", "fieldNotes", "headshot"):
        for image in data[category]:
            yield category, image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads(MANIFEST.read_text())
    for category, spec in iter_images(data):
        size = (int(spec["width"]), int(spec["height"]))
        seed = sum(ord(c) for c in spec["id"])
        if category == "concerts":
            image = make_concert(size, seed)
        elif category == "portraits":
            image = make_portrait(size, seed)
        elif category == "events":
            image = make_event(size, seed)
        elif category == "fieldNotes":
            image = make_field(size, seed)
        else:
            image = make_headshot(size, seed)
        target = OUT / f'{spec["file"]}.jpg'
        image.save(target, "JPEG", quality=90, optimize=True, progressive=True, subsampling=1)
        print(f"generated {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
