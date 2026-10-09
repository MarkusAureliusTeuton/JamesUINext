#!/usr/bin/env python3
"""Verify the eight Alpine image files against their source SHA-256 manifest."""
from pathlib import Path
import hashlib
import re
import sys

root = Path("custom_components/jamesui_next/frontend/assets/alpine")
manifest = root / "SHA256.txt"
required = {
    "clear-day.webp", "cloudy-day.webp", "rain-day.webp", "snow-day.webp",
    "fog.webp", "dusk.webp", "clear-night.webp", "cloudy-night.webp",
}
if not manifest.is_file():
    raise SystemExit("Missing Alpine SHA256.txt")
seen = set()
for line in manifest.read_text(encoding="utf-8").splitlines():
    hit = re.fullmatch(r"([0-9a-f]{64})\s+([\w-]+\.webp)\s+\((\d+) bytes\)", line.strip())
    if not hit:
        continue
    digest, name, length = hit.groups()
    if name not in required or name in seen:
        raise SystemExit(f"Unexpected or duplicate Alpine asset: {name}")
    file = root / name
    if not file.is_file():
        raise SystemExit(f"Missing Alpine image: {name}")
    data = file.read_bytes()
    if len(data) != int(length) or hashlib.sha256(data).hexdigest() != digest:
        raise SystemExit(f"Alpine image differs from source: {name}")
    seen.add(name)
if seen != required:
    raise SystemExit("Unverified Alpine images: " + ", ".join(sorted(required - seen)))
print("Verified all eight Alpine WebP images, byte lengths and SHA-256 digests.")
