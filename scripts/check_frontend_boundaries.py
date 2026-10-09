"""Check local JavaScript module boundaries and forbidden legacy runtime paths."""

from pathlib import Path
import re
import sys

ROOT = Path("custom_components/jamesui_next/frontend")
IMPORT = re.compile(r"""(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)["'](\.{1,2}/[^"']+)["']""")
OLD_PATH = re.compile(r"(?:/jamesui_static/|custom_components/jamesui/|\bjamesui/config/)")
problems = []
checked = 0

for path in sorted(ROOT.rglob("*.js")):
    source = path.read_text(encoding="utf-8")
    checked += 1
    for match in IMPORT.finditer(source):
        destination = (path.parent / match.group(1).split("?")[0]).resolve()
        if not destination.is_relative_to(ROOT.resolve()) or not destination.is_file():
            problems.append(f"{path}: missing or external local import {match.group(1)}")
    for match in OLD_PATH.finditer(source):
        problems.append(f"{path}: legacy runtime dependency {match.group(0)}")

if problems:
    print("\n".join(problems), file=sys.stderr)
    sys.exit(1)
print(f"Validated {checked} JavaScript module paths; no legacy runtime references.")
