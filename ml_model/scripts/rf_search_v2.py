"""Try multiple search queries against api.roboflow.com/search."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import requests


REPO_ROOT = Path(__file__).resolve().parents[2]
KEY_FILE = REPO_ROOT / ".roboflow_key"


def search(api_key: str, query: str) -> dict | None:
    try:
        r = requests.get(
            "https://api.roboflow.com/search",
            params={"query": query, "type": "dataset", "api_key": api_key},
            timeout=15,
        )
        if r.status_code == 200:
            return r.json()
        print(f"  '{query}' -> status {r.status_code}: {r.text[:120]}")
    except Exception as e:
        print(f"  '{query}' -> error {e}")
    return None


def collect_projects(payload: dict, query: str) -> list[dict]:
    if not payload:
        return []
    projects: list[dict] = []
    workspaces = payload.get("workspace", [])
    if isinstance(workspaces, dict):
        workspaces = [workspaces]
    for ws in workspaces:
        ws_url = ws.get("url", "?")
        for p in ws.get("projects", []):
            projects.append({
                "query": query,
                "ws": ws_url,
                "id": p.get("id"),
                "type": p.get("type"),
                "images": p.get("images", 0),
                "classes": list(p.get("classes", {}).keys()) if isinstance(p.get("classes"), dict) else [],
                "license": p.get("license", "?"),
                "annotation": p.get("annotation"),
                "versions": p.get("versions", 0),
            })
    return projects


def main() -> int:
    api_key = KEY_FILE.read_text(encoding="utf-8").strip()
    queries = [
        "fridge", "refrigerator", "fridge inside", "refrigerator content",
        "fridge food", "groceries fridge", "kitchen fridge",
        "what's in my fridge", "open fridge", "fridge inventory",
        "fridge items", "fridge contents", "in fridge",
    ]
    seen: set[str] = set()
    everything: list[dict] = []

    print(f"Trying {len(queries)} queries...\n")
    for q in queries:
        payload = search(api_key, q)
        if payload is None:
            continue
        projects = collect_projects(payload, q)
        new_proj = [p for p in projects if p["id"] not in seen and p["type"] == "object-detection"]
        for p in new_proj:
            seen.add(p["id"])
        print(f"  '{q}' -> {len(projects)} projects, {len(new_proj)} new object-detection")
        everything.extend(new_proj)

    if not everything:
        print("\nNo new datasets found.")
        return 1

    fridge_kw = {"fridge", "refrigerator", "kitchen", "grocery", "food", "fruit", "vegetable", "produce", "ingredient", "cook"}
    relevant = []
    for d in everything:
        text = f"{d['id']} {d.get('annotation') or ''}".lower()
        if any(kw in text for kw in fridge_kw):
            relevant.append(d)

    print(f"\n=== {len(relevant)} possibly relevant datasets ===")
    relevant.sort(key=lambda d: (-d["versions"], -d["images"]))
    for d in relevant[:40]:
        print(f"  v{d['versions']:<2} {d['images']:>5} imgs  {d['id']:<55} cls: {d['classes'][:6]}")

    out = REPO_ROOT / "ml_model" / "models" / "rf_search_v2_results.json"
    out.write_text(json.dumps(relevant, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
