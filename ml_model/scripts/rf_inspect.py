"""Fetch full details about a specific Roboflow project."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import requests


REPO_ROOT = Path(__file__).resolve().parents[2]
KEY_FILE = REPO_ROOT / ".roboflow_key"


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: python rf_inspect.py <workspace> <project>")
        return 2
    ws, proj = sys.argv[1], sys.argv[2]
    api_key = KEY_FILE.read_text(encoding="utf-8").strip()

    r = requests.get(
        f"https://api.roboflow.com/{ws}/{proj}",
        params={"api_key": api_key},
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()

    project = data.get("project", {})
    versions = data.get("versions", [])
    classes = project.get("classes", {})

    print(f"=== {ws}/{proj} ===")
    print(f"  type:        {project.get('type', '?')}")
    print(f"  images:      {project.get('images', '?')}")
    print(f"  unannotated: {project.get('unannotated', '?')}")
    print(f"  splits:      {project.get('splits', {})}")
    print(f"  license:     {project.get('license', '?')}")
    print(f"  versions:    {len(versions)}")
    if versions:
        print(f"\n  --- Latest 5 versions ---")
        for v in versions[:5]:
            vnum = v.get("id", "?")
            vname = v.get("name", "?")
            vimgs = v.get("images", "?")
            vsplit = v.get("splits", {})
            vcreated = v.get("created", "?")
            print(f"    v{vnum} ({vname}): {vimgs} imgs, splits={vsplit}, ts={vcreated}")
    print(f"\n  --- Classes ({len(classes)}) ---")
    if isinstance(classes, dict):
        sorted_cls = sorted(classes.items(), key=lambda kv: -kv[1] if isinstance(kv[1], int) else 0)
        for c, n in sorted_cls:
            print(f"    {c:<25} {n}")
    out = REPO_ROOT / "ml_model" / "models" / f"rf_inspect_{ws}_{proj}.json"
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nFull metadata saved: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
