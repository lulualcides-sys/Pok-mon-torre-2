"""T46: no approved map can be installed with altered pixels or dimensions."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "torre2_approved_installer", ROOT / "tools/pokearena/install-approved-maps.py")
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)


def tiny_webp(width=1280, height=720):
    bits = (width - 1) | ((height - 1) << 14)
    payload = b"\x2f" + bits.to_bytes(4, "little")
    chunk = b"VP8L" + len(payload).to_bytes(4, "little") + payload + b"\x00"
    return b"RIFF" + (len(chunk) + 4).to_bytes(4, "little") + b"WEBP" + chunk


def make_archive(change=None, extra=None):
    maps, entries = [], {}
    for i in range(60):
        name = f"assets/ui/kanto-approved-maps/kanto/test-map-{i:02d}.webp"
        data = tiny_webp()
        entries[name] = data
        maps.append({"id": f"test-map-{i:02d}", "image": name,
                     "approved": True, "bytes": len(data),
                     "image_width": 1280, "image_height": 720,
                     "optimized_sha256": hashlib.sha256(data).hexdigest()})
    manifest = {"original_count": 60, "maps": maps,
                "derivative_of_archive_sha256": installer.EXPECTED_APPROVED_SOURCE_SHA256}
    if change:
        change(manifest, entries)
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("approved-maps-atlas.json", json.dumps(manifest))
        for name, data in entries.items():
            z.writestr(name, data)
        if extra:
            z.writestr(extra, b"unexpected")
    stream.seek(0)
    return zipfile.ZipFile(stream)


class ApprovedMapInstallerTest(unittest.TestCase):
    def test_valid_60_maps(self):
        with make_archive() as z:
            self.assertEqual(len(installer.validate(z)), 60)

    def test_webp_dimensions_vp8l_and_corrupt_riff(self):
        self.assertEqual(installer.webp_dimensions(tiny_webp()), (1280, 720))
        with self.assertRaisesRegex(ValueError, "RIFF"):
            installer.webp_dimensions(tiny_webp()[:-1])

    def test_wrong_pixel_dimensions(self):
        with make_archive(lambda m, e: e.update({
            m["maps"][0]["image"]: tiny_webp(1280, 721)})) as z:
            with self.assertRaisesRegex(ValueError, "Byte length|dimensions|SHA-256"):
                installer.validate(z)

    def test_changed_bytes_cannot_pass_approved_sha(self):
        def tamper(manifest, entries):
            name = manifest["maps"][0]["image"]
            entries[name] = entries[name][:-1] + b"\x01"
        with make_archive(tamper) as z:
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
                installer.validate(z)

    def test_missing_provenance_rejected(self):
        with make_archive(lambda m, e: m.pop("derivative_of_archive_sha256")) as z:
            with self.assertRaisesRegex(ValueError, "provenance"):
                installer.validate(z)

    def test_extra_unapproved_image_rejected(self):
        with make_archive(extra="assets/ui/kanto-approved-maps/kanto/unapproved.webp") as z:
            with self.assertRaisesRegex(ValueError, "unexpected images"):
                installer.validate(z)

    def test_real_archive_when_supplied(self):
        approved = os.environ.get("TORRE2_APPROVED_MAP_ARCHIVE")
        if not approved:
            self.skipTest("Real approved ZIP not available in this environment")
        with zipfile.ZipFile(approved) as z:
            self.assertEqual(len(installer.validate(z)), 60)


if __name__ == "__main__":
    unittest.main()
