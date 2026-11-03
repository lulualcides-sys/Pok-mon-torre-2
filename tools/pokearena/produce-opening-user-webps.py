#!/usr/bin/env python3
"""T87 user-uploaded Kanto opening assets, isolated from 60 approved originals.

All four JPEG originals have been SHA-256-verified in GitHub. Only Viridian
Forest has its five baked Bug Catchers removed at this checkpoint.
The other three are lossless-identity compositions re-encoded as WebP, pending
a separately reviewed NPC-cleaning pass. Do not silently activate overlay
NPCs on those originals.
"""
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/ui/kanto-opening-user/original"
TARGET = ROOT / "assets/ui/kanto-opening-user"
SOURCE_SHA = {
    "pallet-town": "182307b602cb8cd2365610bbb183f0da74ac3f260e045f6b94ea8fde533df9de",
    "route-1": "cfbf218967faf1e12da38bba3a307005a3f63ff36d20dd563ef543d7fbd02430",
    "viridian-city": "919109d3a492708c87c38a858f40c094783dc1462ea98382e2139820f8202366",
    "viridian-forest": "3f2dd05bb0e3028795dd0ca51cd5828bb415be6da536e476d7ce74b9cbe0f03d"
}
# Five painted actor areas on the original 1536x864 user picture.
# Donors are SAME SOURCE pixels, not generated art. This method is an
# initial QA-stage plate only; not a claim of final pixel-perfect restoration.
FOREST_MASKS = [
    ((329, 192, 427, 292), (440, 515)),
    ((1261, 160, 1376, 281), (1030, 330)),
    ((647, 350, 771, 478), (1080, 320)),
    ((257, 557, 371, 685), (420, 495)),
    ((1225, 571, 1375, 709), (885, 490)),
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def remove_forest_painted_actors(source_path: Path) -> Image.Image:
    picture = cv2.imread(str(source_path))
    if picture is None or picture.shape[:2] != (864, 1536):
        raise ValueError("Viridian Forest original must be 1536x864")
    for (x0, y0, x1, y1), (donor_x, donor_y) in FOREST_MASKS:
        pad = 15
        left, top = x0 - pad, y0 - pad
        w, h = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
        if not (0 <= donor_x <= 1536 - w and 0 <= donor_y <= 864 - h):
            raise ValueError("Unsafe donor outside source image")
        donor = picture[donor_y:donor_y+h, donor_x:donor_x+w].copy()
        mask = np.zeros((h, w), np.uint8)
        cv2.rectangle(mask, (pad+4, pad+4), (w-pad-4, h-pad-4), 255, -1)
        mask = cv2.GaussianBlur(mask, (9, 9), 3)
        picture = cv2.seamlessClone(
            donor, picture, mask, (left+w//2, top+h//2), cv2.NORMAL_CLONE
        )
    return Image.fromarray(cv2.cvtColor(picture, cv2.COLOR_BGR2RGB))


def main():
    # Initial materialization intentionally occurs only on T87 staging branch.
    TARGET.mkdir(parents=True, exist_ok=True)
    manifest = []
    for map_id, expected in SOURCE_SHA.items():
        original = SOURCE / (map_id + ".jpg")
        raw = original.read_bytes()
        if sha256(raw) != expected:
            raise ValueError(f"User source SHA-256 mismatch: {map_id}")
        image = remove_forest_painted_actors(original) if map_id == "viridian-forest" else Image.open(original).convert("RGB")
        if image.size != (1536, 864):
            raise ValueError(f"Bad original dimensions: {map_id}")
        cleaned = image.resize((1280, 720), Image.Resampling.LANCZOS)
        output = TARGET / (map_id + ".webp")
        cleaned.save(output, format="WEBP", quality=92, method=6)
        pixel = output.read_bytes()
        if Image.open(output).size != (1280, 720):
            raise ValueError(f"Bad image output: {map_id}")
        manifest.append({
            "id": map_id,
            "original": "original/" + map_id + ".jpg",
            "original_sha256": expected,
            "image": "assets/ui/kanto-opening-user/" + map_id + ".webp",
            "optimized_sha256": sha256(pixel),
            "bytes": len(pixel),
            "width": 1280,
            "height": 720,
            "painted_trainers_removed": map_id == "viridian-forest",
            "status": "preview-needs-visual-review" if map_id == "viridian-forest" else "original-art"
        })
        print(map_id, len(pixel), sha256(pixel))
    (TARGET / "opening-user-manifest.json").write_text(
        json.dumps({"version": 1, "original_count": 4, "maps": manifest}, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
