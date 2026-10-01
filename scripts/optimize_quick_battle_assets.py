from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "qb-webp"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Source PNGs already live in public/. Resize only to the maximum useful
# rendering resolution for the Quick Battle modal, then encode as WebP.
ASSETS = [
    ("public/aditaka-quick-battle.png", "aditaka-quick-battle.webp", (768, 1152)),
    ("public/skd.png", "skd.webp", (800, 800)),
    ("public/casn.png", "casn.webp", (800, 800)),
    ("public/bumn.png", "bumn.webp", (800, 800)),
    ("public/trophy.png", "trophy.webp", (800, 800)),
    ("public/coin.png", "coin.webp", (512, 512)),
    ("public/paper.png", "paper.webp", (512, 512)),
    ("public/plate.png", "plate.webp", (800, 800)),
]

for source_rel, output_name, max_size in ASSETS:
    source = ROOT / source_rel
    if not source.exists():
        raise FileNotFoundError(f"Missing Quick Battle source asset: {source_rel}")

    with Image.open(source) as image:
        image = image.convert("RGBA")
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        output = OUT_DIR / output_name
        image.save(output, "WEBP", quality=80, method=6)
        before = source.stat().st_size
        after = output.stat().st_size
        print(f"{source.name}: {before / 1024:.1f} KB -> {after / 1024:.1f} KB")

REPLACEMENTS = {
    "/aditaka-quick-battle.png": "/qb-webp/aditaka-quick-battle.webp",
    "/skd.png": "/qb-webp/skd.webp",
    "/casn.png": "/qb-webp/casn.webp",
    "/bumn.png": "/qb-webp/bumn.webp",
    "/trophy.png": "/qb-webp/trophy.webp",
    "/coin.png": "/qb-webp/coin.webp",
    "/paper.png": "/qb-webp/paper.webp",
}

COMPONENTS = [
    ROOT / "components" / "quick-battle" / "desktop-stage.tsx",
    ROOT / "components" / "quick-battle" / "mobile-sheet.tsx",
    ROOT / "components" / "quick-battle" / "scene-art.tsx",
]

for component in COMPONENTS:
    text = component.read_text(encoding="utf-8")
    original = text
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)
    if text != original:
        component.write_text(text, encoding="utf-8")
        print(f"Updated paths in {component.relative_to(ROOT)}")

headers = ROOT / "public" / "_headers"
if headers.exists():
    text = headers.read_text(encoding="utf-8")
    cache_rule = "\n/qb-webp/*\n  Cache-Control: public, max-age=31536000, immutable\n"
    if "/qb-webp/*" not in text:
        headers.write_text(text.rstrip() + "\n" + cache_rule, encoding="utf-8")
        print("Added immutable caching for /qb-webp/*")

print("Quick Battle WebP optimization complete.")
