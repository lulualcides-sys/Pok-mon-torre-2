#!/usr/bin/env python3
"""T80: import only the user-supplied 2026-11-03 Lt. Surge map into an override.

Never change or regenerate the 60 original WebPs. Fail closed if input PNG
differs from the uploaded image's SHA-256. Source 1536x864; output 1280x720.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image

SOURCE_SHA256 = "6ad10368ae69d1be43a07ad31aecafce21e4a8a076c37eac2e73f6271653d469"
MAP = Path("assets/ui/kanto-overrides/gym-surge-user.webp")
META = Path("assets/ui/kanto-overrides/gym-surge-user.json")


def sha256(content):
    return hashlib.sha256(content).hexdigest()


def import_image(png, root=Path(".")):
    if sha256(png) != SOURCE_SHA256:
        raise ValueError("T80 source image does not match user-uploaded PNG")
    with Image.open(io.BytesIO(png)) as original:
        if original.format != "PNG" or original.size != (1536, 864):
            raise ValueError("T80 requires the exact user's 1536x864 PNG")
        frame = original.convert("RGB").resize((1280, 720), Image.Resampling.NEAREST)
        out = io.BytesIO()
        frame.save(out, "WEBP", quality=94, method=6)
    webp = out.getvalue()
    if len(webp) < 10000:
        raise ValueError("T80 generated WebP is abnormally small")
    path = root / MAP
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(webp)
    data = {
        "id": "gym-surge",
        "image": MAP.as_posix(),
        "source": "user-uploaded 1001008531.png, 2026-11-03",
        "source_sha256": SOURCE_SHA256,
        "width": 1280,
        "height": 720,
        "bytes": len(webp),
        "optimized_sha256": sha256(webp),
        "original_approved_art_preserved": True,
    }
    (root / META).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return data


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--url", help="temporary HTTPS source of uploaded user PNG")
    p.add_argument("--file", type=Path, help="local copy of the exact uploaded PNG")
    p.add_argument("--root", type=Path, default=Path("."))
    args = p.parse_args()
    if bool(args.file) == bool(args.url):
        p.error("specify exactly one of --file or --url")
    if args.file:
        png = args.file.read_bytes()
    else:
        if not args.url.startswith("https://"):
            p.error("source must use HTTPS")
        req = Request(args.url, headers={"User-Agent": "Pokemon-Torre2-T80-user-art-import"})
        with urlopen(req, timeout=45) as resp:
            png = resp.read(2 * 1024 * 1024 + 1)
        if len(png) > 2 * 1024 * 1024:
            raise ValueError("source image exceeds 2 MB limit")
    data = import_image(png, args.root)
    print("T80 user Surge override:", data["image"], data["bytes"], data["optimized_sha256"])


if __name__ == "__main__":
    main()
