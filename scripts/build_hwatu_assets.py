#!/usr/bin/env python3
from collections import deque
from pathlib import Path
import sys

from PIL import Image, ImageDraw

# Usage:
#   python3 scripts/build_hwatu_assets.py [source]
# Default source:
#   scripts/hwatu_sheet.png

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("scripts/hwatu_sheet.png")
OUT_DIR = Path("assets/hwatu")
CARD_W, CARD_H = 72, 108


def is_red(r, g, b):
    # Detect red border pixels in a robust way.
    return r > 125 and g < 140 and b < 140 and (r - g) > 20 and (r - b) > 20


def cleanup_old_outputs():
    for p in OUT_DIR.glob("m??_?.png"):
        p.unlink(missing_ok=True)
    for p in OUT_DIR.glob("m??_?.webp"):
        p.unlink(missing_ok=True)
    for p in OUT_DIR.glob("bonus_?.png"):
        p.unlink(missing_ok=True)
    for p in OUT_DIR.glob("bonus_?.webp"):
        p.unlink(missing_ok=True)


def find_card_components(rgb):
    w, h = rgb.size
    px = rgb.load()
    vis = bytearray(w * h)
    components = []

    for y in range(h):
        row = y * w
        for x in range(w):
            i = row + x
            if vis[i]:
                continue
            vis[i] = 1
            r, g, b = px[x, y]
            if not is_red(r, g, b):
                continue

            q = deque([(x, y)])
            minx = maxx = x
            miny = maxy = y
            count = 0

            while q:
                cx, cy = q.popleft()
                count += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)

                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    ni = ny * w + nx
                    if vis[ni]:
                        continue
                    vis[ni] = 1
                    rr, gg, bb = px[nx, ny]
                    if is_red(rr, gg, bb):
                        q.append((nx, ny))

            bw = maxx - minx + 1
            bh = maxy - miny + 1
            if 140 <= bw <= 240 and 220 <= bh <= 360 and count > 5000:
                components.append((count, minx, miny, maxx, maxy, bw, bh))

    return components


def sort_to_rows(cards):
    cards_by_y = sorted(cards, key=lambda c: (c[2] + c[4]) / 2)
    rows = [cards_by_y[i * 12:(i + 1) * 12] for i in range(4)]
    if any(len(r) != 12 for r in rows):
        return None
    return [sorted(row, key=lambda c: (c[1] + c[3]) / 2) for row in rows]


def make_bonus_card(path: Path, title: str, accent: tuple[int, int, int]):
    card = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, CARD_W - 1, CARD_H - 1), radius=8, fill=(216, 35, 35, 255))
    d.rounded_rectangle((4, 4, CARD_W - 5, CARD_H - 5), radius=6, fill=(231, 224, 208, 255))
    d.rectangle((8, 10, CARD_W - 9, CARD_H - 31), fill=(255, 243, 180, 255))
    # Golden pig icon
    d.ellipse((18, 28, 54, 56), fill=(246, 192, 66, 255), outline=(168, 112, 16, 255), width=2)
    d.ellipse((50, 34, 60, 44), fill=(246, 192, 66, 255), outline=(168, 112, 16, 255), width=2)
    d.ellipse((26, 22, 34, 30), fill=(246, 192, 66, 255), outline=(168, 112, 16, 255), width=2)
    d.ellipse((38, 22, 46, 30), fill=(246, 192, 66, 255), outline=(168, 112, 16, 255), width=2)
    d.ellipse((31, 38, 41, 46), fill=(255, 216, 125, 255), outline=(168, 112, 16, 255), width=1)
    d.point((34, 41), fill=(120, 70, 10, 255))
    d.point((38, 41), fill=(120, 70, 10, 255))
    d.ellipse((24, 36, 28, 40), fill=(48, 32, 20, 255))
    d.ellipse((44, 36, 48, 40), fill=(48, 32, 20, 255))
    d.text((10, 12), "GOLD", fill=(126, 84, 20, 255))
    d.text((12, 60), "PIG", fill=(126, 84, 20, 255))
    d.text((10, 86), title, fill=accent)
    card.save(path)


def main():
    if not SRC.exists():
        print(f"[ERROR] source not found: {SRC}")
        sys.exit(2)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cleanup_old_outputs()

    src_img = Image.open(SRC).convert("RGBA")
    rgb = src_img.convert("RGB")
    cards = find_card_components(rgb)

    if len(cards) != 48:
        print(f"[ERROR] expected 48 card components, found {len(cards)}")
        sys.exit(3)

    rows = sort_to_rows(cards)
    if not rows:
        print("[ERROR] failed to cluster cards into 4 rows x 12 columns")
        sys.exit(4)

    for slot in range(4):
        for month_idx in range(12):
            _, minx, miny, maxx, maxy, _, _ = rows[slot][month_idx]
            crop = src_img.crop((minx, miny, maxx + 1, maxy + 1))
            crop.resize((CARD_W, CARD_H), Image.Resampling.LANCZOS).save(
                OUT_DIR / f"m{month_idx + 1:02d}_{slot}.webp",
                "WEBP",
                quality=80
            )

    make_bonus_card(OUT_DIR / "bonus_1.webp", "BONUS 1", (92, 62, 10))
    make_bonus_card(OUT_DIR / "bonus_2.webp", "BONUS 2", (92, 62, 10))
    print("[OK] generated 48 card WebP + 2 bonus WebP in assets/hwatu")


if __name__ == "__main__":
    main()
