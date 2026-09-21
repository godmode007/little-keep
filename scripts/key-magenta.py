#!/usr/bin/env python3
"""Knock out magenta/pink backgrounds and crop to opaque bounds."""
from pathlib import Path
from PIL import Image

SESS = Path("/Users/user/.grok/sessions/%2FUsers%2Fuser%2FProjects%2Flittle-keep/01a0543c-da78-7b52-98de-be181ba97d9d/images")
OUT = Path("/Users/user/Projects/little-keep/assets/game")
MAPPING = {
    "15.jpg": "pine.png",
    "16.jpg": "hut.png",
    "13.jpg": "wall.png",
    "17.jpg": "pine-stump.png",
    "18.jpg": "pip-chop.png",
    "20.jpg": "hut.png",
    "19.jpg": "wall.png",
    "21.jpg": "tower.png",
    "22.jpg": "farm.png",
    "26.jpg": "mine.png",
}


def is_magenta(r: int, g: int, b: int) -> bool:
    return r > 160 and b > 130 and g < 170 and (r + b) > (g * 2 + 30)


def key_magenta(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGBA")
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if is_magenta(r, g, b):
                pix[x, y] = (r, g, b, 0)
    bbox = im.getbbox()
    if bbox:
        pad = 8
        x0, y0, x1, y1 = bbox
        im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst)
    print(f"wrote {dst} {im.size}")


if __name__ == "__main__":
    for src_name, dst_name in MAPPING.items():
        key_magenta(SESS / src_name, OUT / dst_name)
