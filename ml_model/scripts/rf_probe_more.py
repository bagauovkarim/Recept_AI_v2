"""Probe additional fridge/grocery datasets and try to find ones with versions."""

from __future__ import annotations

import sys
from pathlib import Path

import requests


REPO_ROOT = Path(__file__).resolve().parents[2]
KEY_FILE = REPO_ROOT / ".roboflow_key"


def probe(api_key: str, ws: str, proj: str) -> dict | None:
    try:
        r = requests.get(
            f"https://api.roboflow.com/{ws}/{proj}",
            params={"api_key": api_key},
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def main() -> int:
    api_key = KEY_FILE.read_text(encoding="utf-8").strip()

    candidates = [
        ("fridge-detection", "fridge-detection"),
        ("grocery-store-classification", "grocery-store-classification"),
        ("food-detection-tarrm", "food-detection"),
        ("hummus-3y0g8", "fridge-uxw3a"),
        ("project-aau4q", "fridge-89bxv"),
        ("fridge-tu7sh", "fridge-tu7sh"),
        ("inside-fridge-9c6y9", "inside-fridge-9c6y9"),
        ("smart-fridge-cu7lp", "smart-fridge-cu7lp"),
        ("food-detection-final", "food-detection-final"),
        ("foodimage", "food-detection-yldl4"),
        ("fridge-bxq11", "fridge-recognition"),
        ("food-tcvh4", "food-tcvh4"),
        ("fruits-vegetables-detection", "fruits-vegetables-detection"),
        ("fridge-management", "fridge-management"),
        ("supermarket-x7iy3", "supermarket-x7iy3"),
        ("fridge-icqsv", "fridge-icqsv"),
        ("fridge-products-detection-ytpqe", "fridge-products-detection-ytpqe"),
        ("brads-cool-workspace", "fridge-detector"),
        ("fridge-yiibc", "products-in-fridge"),
        ("fridge-content", "fridge-content"),
        ("food-recognition-i6c9o", "food-recognition-i6c9o"),
        ("fruit-and-vegetable", "fruits-and-veg"),
    ]

    results: list[dict] = []
    for ws, proj in candidates:
        data = probe(api_key, ws, proj)
        if data is None:
            continue
        p = data.get("project", {})
        versions = data.get("versions", [])
        n_imgs = p.get("images", 0)
        n_classes = len(p.get("classes", {}) or {})
        if n_imgs == 0:
            continue
        info = {
            "url": f"https://universe.roboflow.com/{ws}/{proj}",
            "ws": ws,
            "proj": proj,
            "images": n_imgs,
            "n_classes": n_classes,
            "versions_count": len(versions),
            "classes_top": list((p.get("classes") or {}).keys())[:10],
            "license": p.get("license", "?"),
            "splits": p.get("splits", {}),
        }
        if versions:
            info["latest_v_id"] = versions[0].get("id")
            info["latest_v_imgs"] = versions[0].get("images")
        results.append(info)

    if not results:
        print("No datasets found via probing.")
        return 1

    print("=" * 90)
    print(f"{'WS/PROJ':<55}{'IMGS':>6}{'CLS':>5}{'VERS':>6}  LICENSE")
    print("-" * 90)
    for r in sorted(results, key=lambda r: -r["versions_count"]):
        print(f"  {r['ws']}/{r['proj']:<35}"[:55],
              f"{r['images']:>6}{r['n_classes']:>5}{r['versions_count']:>6}  {r['license']}")
    print("=" * 90)
    print(f"\nDatasets WITH versions (downloadable):")
    for r in results:
        if r["versions_count"] > 0:
            print(f"  {r['url']}  v{r.get('latest_v_id')}  {r['images']} imgs  {r['n_classes']} classes")
            print(f"    classes: {r['classes_top']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
