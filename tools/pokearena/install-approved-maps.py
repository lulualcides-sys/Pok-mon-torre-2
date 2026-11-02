#!/usr/bin/env python3
"""Install the exact sixty user-approved WebP scenes into Pokémon Torre 2.

Usage:
 python3 tools/pokearena/install-approved-maps.py /path/atlas-60-mapas-phaser.zip --check-only
 python3 tools/pokearena/install-approved-maps.py /path/atlas-60-mapas-phaser.zip

Never installs partial or unexpected archives. Enables the runtime flag only
after all 60 assets have been successfully written. Requires Python stdlib.
"""
import argparse
import json
import os
from pathlib import Path
import tempfile
import zipfile

PREFIX = "assets/ui/kanto-approved-maps/"
RENDERER = "tools/pokearena/torre2-approved-map-renderer.js"
OFF = "export const APPROVED_MAP_ASSETS_READY = false;"
ON = "export const APPROVED_MAP_ASSETS_READY = true;"


def validate(archive):
    if archive.testzip() is not None:
        raise ValueError("ZIP CRC mismatch; refusing installation")
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise ValueError("Duplicate ZIP members")
    manifest = json.loads(archive.read("approved-maps-atlas.json"))
    maps = manifest.get("maps", [])
    if len(maps) != 60 or len({m.get("id") for m in maps}) != 60:
        raise ValueError("Expected exactly 60 unique approved maps")
    if manifest.get("original_count") != 60:
        raise ValueError("Manifest count mismatch")
    approved = []
    for m in maps:
        name = m.get("image", "")
        if (not name.startswith(PREFIX) or not name.endswith(".webp") or
                "\\" in name or ".." in Path(name).parts or
                name not in names or m.get("approved") is not True):
            raise ValueError(f"Unapproved or unsafe asset path: {name!r}")
        data = archive.read(name)
        if len(data) != m.get("bytes"):
            raise ValueError(f"Byte length differs from approval: {name}")
        if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
            raise ValueError(f"Not a WebP asset: {name}")
        approved.append((name, data))
    if len({name for name, _ in approved}) != 60:
        raise ValueError("Duplicate destination paths")
    actual_webps = {name for name in names if name.endswith(".webp")}
    if actual_webps != {name for name, _ in approved}:
        raise ValueError("Archive includes unexpected images")
    return approved


def install(files, root):
    target = root / RENDERER
    source = target.read_text(encoding="utf-8")
    if OFF not in source and ON not in source:
        raise ValueError("Renderer flag has changed; cannot enable safely")
    # All byte checks happen before the first filesystem mutation.
    for name, data in files:
        destination = root / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        handle, temporary = tempfile.mkstemp(prefix=".approved-", dir=destination.parent)
        try:
            with os.fdopen(handle, "wb") as stream:
                stream.write(data)
            os.replace(temporary, destination)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
    if OFF in source:
        new_source = source.replace(OFF, ON, 1)
        handle, temporary = tempfile.mkstemp(prefix=".renderer-", dir=target.parent)
        try:
            with os.fdopen(handle, "w", encoding="utf-8") as stream:
                stream.write(new_source)
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--repo-root", type=Path,
                        default=Path(__file__).resolve().parents[2])
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    with zipfile.ZipFile(args.archive, "r") as archive:
        files = validate(archive)
    print(f"Validated {len(files)} approved WebP files, "
          f"{sum(len(data) for _, data in files):,} bytes")
    if not args.check_only:
        install(files, args.repo_root)
        print("Assets installed; approved-map preview flag enabled")


if __name__ == "__main__":
    main()
