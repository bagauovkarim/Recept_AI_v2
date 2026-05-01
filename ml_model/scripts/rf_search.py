"""Verify Roboflow API key and search Universe for fridge-related public datasets.

Reads key from .roboflow_key (one line, gitignored).
Tries multiple search strategies; prints candidates so the user can pick.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import requests


REPO_ROOT = Path(__file__).resolve().parents[2]
KEY_FILE = REPO_ROOT / ".roboflow_key"


def load_key() -> str:
    if not KEY_FILE.exists():
        print(f"ERROR: {KEY_FILE} not found", file=sys.stderr)
        sys.exit(2)
    return KEY_FILE.read_text(encoding="utf-8").strip()


def verify_key(api_key: str) -> dict | None:
    print("[1/3] Verifying API key...")
    try:
        r = requests.get(
            "https://api.roboflow.com/",
            params={"api_key": api_key},
            timeout=15,
        )
        if r.status_code == 200:
            data = r.json()
            print(f"  OK — workspace: {data.get('workspace', '?')}")
            return data
        print(f"  FAILED status={r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"  ERROR: {e}")
    return None


def search_universe(api_key: str, query: str, limit: int = 30) -> list[dict]:
    """Try the Universe search endpoint Roboflow's website uses."""
    print(f"\n[2/3] Searching Universe for '{query}'...")

    candidates_url = [
        ("https://universe.roboflow.com/api/search",
         {"query": query, "type": "dataset"}),
        ("https://api.roboflow.com/search",
         {"query": query, "type": "dataset", "api_key": api_key}),
        ("https://app.roboflow.com/api/search",
         {"q": query}),
    ]

    for url, params in candidates_url:
        try:
            r = requests.get(url, params=params, timeout=15)
            if r.status_code == 200:
                data = r.json()
                print(f"  Endpoint worked: {url}")
                if isinstance(data, list):
                    return data[:limit]
                if isinstance(data, dict):
                    for k in ("results", "datasets", "hits", "data"):
                        if k in data and isinstance(data[k], list):
                            return data[k][:limit]
                    return [data]
            else:
                print(f"  {url} -> status {r.status_code}")
        except Exception as e:
            print(f"  {url} -> error {e}")
    return []


def try_known_datasets(api_key: str) -> list[dict]:
    """Probe a hand-picked list of likely-existing fridge/food projects.

    Each tuple: (workspace_slug, project_slug). The /dataset/{ws}/{proj} endpoint
    returns 200 with metadata if it exists and is public.
    """
    print("\n[3/3] Probing known dataset slugs...")
    candidates = [
        ("workspace01-ae0oa", "fridgify"),
        ("roboflow-100", "team-fight-tactics"),
        ("smart-fridge", "smart-fridge"),
        ("fridge-detection", "fridge-detection"),
        ("inside-fridge", "inside-fridge"),
        ("refrigerator", "refrigerator"),
        ("fruit-and-vegetable-detection", "fruit-and-vegetable-detection"),
        ("food-detection-2", "food-detection"),
        ("groceries-detection", "groceries-detection"),
        ("supermarket", "products"),
    ]

    found: list[dict] = []
    for ws, proj in candidates:
        try:
            r = requests.get(
                f"https://api.roboflow.com/{ws}/{proj}",
                params={"api_key": api_key},
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                project_info = data.get("project", {})
                versions = data.get("versions", [])
                latest_v = versions[0] if versions else {}
                images = project_info.get("images", "?")
                classes = project_info.get("classes", {})
                print(f"  FOUND  {ws}/{proj}: {images} images, "
                      f"{len(classes) if isinstance(classes, dict) else '?'} classes")
                found.append({
                    "workspace": ws,
                    "project": proj,
                    "images": images,
                    "classes": list(classes.keys()) if isinstance(classes, dict) else [],
                    "version": latest_v.get("id") or latest_v.get("version") or 1,
                    "url": f"https://universe.roboflow.com/{ws}/{proj}",
                })
            elif r.status_code == 404:
                pass
            else:
                print(f"  {ws}/{proj}: status {r.status_code}")
        except Exception as e:
            print(f"  {ws}/{proj}: error {e}")
    return found


def main() -> int:
    api_key = load_key()
    info = verify_key(api_key)
    if info is None:
        print("\nABORT: API key check failed.", file=sys.stderr)
        return 1

    search_results = search_universe(api_key, "fridge")
    print(f"  Search returned {len(search_results)} hits")

    found = try_known_datasets(api_key)

    out = REPO_ROOT / "ml_model" / "models" / "rf_search_result.json"
    out.write_text(json.dumps({
        "user_info": info,
        "search_hits": search_results[:30],
        "probed_known": found,
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved full result: {out}")

    if found:
        print("\n=== ACCESSIBLE FRIDGE-RELATED DATASETS ===")
        for f in found:
            print(f"  {f['url']}  |  {f['images']} imgs  |  classes: {f['classes'][:8]}{'...' if len(f['classes'])>8 else ''}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
