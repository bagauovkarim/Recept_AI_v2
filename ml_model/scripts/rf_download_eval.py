"""Download fridge-detection/smart-fridge-2uqsi v2 from Roboflow Universe."""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

from roboflow import Roboflow


REPO_ROOT = Path(__file__).resolve().parents[2]
KEY_FILE = REPO_ROOT / ".roboflow_key"
OUT_ROOT = Path("D:/eval_smart_fridge")


def main() -> int:
    api_key = KEY_FILE.read_text(encoding="utf-8").strip()
    print(f"OUT_ROOT: {OUT_ROOT}")
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    raw_dir = OUT_ROOT / "raw"
    if raw_dir.exists():
        print(f"Removing existing raw dir: {raw_dir}")
        shutil.rmtree(raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)

    cwd_before = os.getcwd()
    os.chdir(str(raw_dir))
    try:
        rf = Roboflow(api_key=api_key)
        project = rf.workspace("fridge-detection").project("smart-fridge-2uqsi")
        print(f"\nProject: {project.id}, type: {project.type}")
        versions = project.versions()
        print(f"Available versions: {[v.version for v in versions] if versions else 'none'}")
        if not versions:
            print("ERROR: no downloadable versions")
            return 1
        latest = versions[0]
        print(f"\nDownloading version {latest.version}...")
        ds = latest.download("yolov8")
        print(f"\nDownloaded to: {ds.location}")
    finally:
        os.chdir(cwd_before)

    return 0


if __name__ == "__main__":
    sys.exit(main())
