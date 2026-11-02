#!/usr/bin/env python3
"""Install the exact sixty user-approved WebP scenes into Pokémon Torre 2.

Usage:
 python3 tools/pokearena/install-approved-maps.py /path/atlas-60-mapas-phaser.zip --check-only
 python3 tools/pokearena/install-approved-maps.py /path/atlas-60-mapas-phaser.zip

Never installs partial or unexpected archives. Enables the runtime flag only
after all 60 assets have been successfully written. Requires Python stdlib.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zipfile

EXPECTED_APPROVED_SOURCE_SHA256 = "572e35cc530cf25e1c0551953a0f59034e5ed53d33cac09e1b0fd5b3f288e21c"
PREFIX = "assets/ui/kanto-approved-maps/"
RENDERER = "tools/pokearena/torre2-approved-map-renderer.js"
OFF = "export const APPROVED_MAP_ASSETS_READY = false;"
ON = "export const APPROVED_MAP_ASSETS_READY = true;"


def webp_dimensions(data):
    """Parse the RIFF/WebP canvas without optional imaging dependencies."""
    if len(data) < 25 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("Invalid WebP RIFF header")
    if int.from_bytes(data[4:8], "little") + 8 != len(data):
        raise ValueError("Invalid WebP RIFF length")
    offset = 12
    while offset + 8 <= len(data):
        kind = data[offset:offset + 4]
        length = int.from_bytes(data[offset + 4:offset + 8], "little")
        begin = offset + 8
        end = begin + length
        if end > len(data):
            raise ValueError("Truncated WebP chunk")
        if kind == b"VP8 ":
            if length < 10 or data[begin + 3:begin + 6] != b"\x9d\x01\x2a":
                raise ValueError("Invalid VP8 frame header")
            return (int.from_bytes(data[begin + 6:begin + 8], "little") & 0x3fff,
                    int.from_bytes(data[begin + 8:begin + 10], "little") & 0x3fff)
        if kind == b"VP8L":
            if length < 5 or data[begin] != 0x2f:
                raise ValueError("Invalid VP8L frame header")
            bits = int.from_bytes(data[begin + 1:begin + 5], "little")
            return ((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1)
        if kind == b"VP8X":
            if length < 10:
                raise ValueError("Invalid VP8X frame header")
            return (int.from_bytes(data[begin + 4:begin + 7], "little") + 1,
                    int.from_bytes(data[begin + 7:begin + 10], "little") + 1)
        offset = end + (length % 2)
    raise ValueError("WebP frame header missing")


def validate(archive):
    if archive.testzip() is not None:
        raise ValueError("ZIP CRC mismatch; refusing installation")
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise ValueError("Duplicate ZIP members")
    manifest = json.loads(archive.read("approved-maps-atlas.json"))
    if manifest.get("derivative_of_archive_sha256") != EXPECTED_APPROVED_SOURCE_SHA256:
        raise ValueError("Approved source ZIP provenance mismatch")
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
        if m.get("image_width") != 1280 or m.get("image_height") != 720:
            raise ValueError(f"Manifest is not 1280x720: {name}")
        if webp_dimensions(data) != (1280, 720):
            raise ValueError(f"Actual WebP dimensions are not 1280x720: {name}")
        expected_hash = m.get("optimized_sha256", "")
        if len(expected_hash) != 64 or any(c not in "0123456789abcdef" for c in expected_hash):
            raise ValueError(f"Missing SHA-256 for approved asset: {name}")
        if hashlib.sha256(data).hexdigest() != expected_hash:
            raise ValueError(f"Approved WebP SHA-256 mismatch: {name}")
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
