"""Search Roboflow Universe by scraping the search page."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import requests


REPO_ROOT = Path(__file__).resolve().parents[2]
KEY_FILE = REPO_ROOT / ".roboflow_key"


def fetch_universe_html(query: str) -> str:
    url = "https://universe.roboflow.com/search"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/119.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
    }
    r = requests.get(url, params={"q": query}, headers=headers, timeout=20)
    r.raise_for_status()
    return r.text


def extract_next_data(html: str) -> dict | None:
    """Next.js apps embed __NEXT_DATA__ JSON in a <script> tag."""
    m = re.search(
        r'<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)</script>',
        html,
        re.DOTALL,
    )
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def find_build_id(html: str) -> str | None:
    m = re.search(r'"buildId":"([^"]+)"', html)
    return m.group(1) if m else None


def search_via_data_endpoint(build_id: str, query: str) -> dict | None:
    url = f"https://universe.roboflow.com/_next/data/{build_id}/search.json"
    r = requests.get(url, params={"q": query}, timeout=20)
    if r.status_code == 200:
        return r.json()
    return None


def collect_dataset_slugs(payload: dict) -> list[dict]:
    """Walk the JSON looking for dataset references."""
    found: list[dict] = []

    def walk(node, path=""):
        if isinstance(node, dict):
            if "id" in node and isinstance(node["id"], str) and "/" in node["id"]:
                ds = node["id"]
                if ds.count("/") == 1:
                    ws, proj = ds.split("/", 1)
                    info = {
                        "id": ds,
                        "name": node.get("name"),
                        "type": node.get("type"),
                        "images": node.get("images"),
                        "classes": list(node.get("classes", {}).keys()) if isinstance(node.get("classes"), dict) else [],
                        "license": node.get("license"),
                    }
                    if info["type"] == "object-detection":
                        found.append(info)
            for k, v in node.items():
                walk(v, f"{path}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}[{i}]")

    walk(payload)
    seen = set()
    unique = []
    for f in found:
        if f["id"] in seen:
            continue
        seen.add(f["id"])
        unique.append(f)
    return unique


def main() -> int:
    query = sys.argv[1] if len(sys.argv) > 1 else "fridge"
    print(f"Searching Universe for '{query}'...\n")

    print("[1/2] Fetching HTML of search page...")
    try:
        html = fetch_universe_html(query)
    except Exception as e:
        print(f"  HTML fetch FAILED: {e}")
        return 1

    payload = extract_next_data(html)
    if payload:
        print("  Got __NEXT_DATA__ payload from HTML")
    else:
        print("  No __NEXT_DATA__ found")

    build_id = find_build_id(html)
    if build_id:
        print(f"  buildId: {build_id}")
        print("[2/2] Fetching JSON via _next/data endpoint...")
        api_payload = search_via_data_endpoint(build_id, query)
        if api_payload:
            print(f"  Got {len(json.dumps(api_payload))} bytes of JSON")
            payload = api_payload
        else:
            print("  Endpoint returned non-200")

    if not payload:
        print("\nNo data extracted.")
        return 1

    out = REPO_ROOT / "ml_model" / "models" / f"rf_search_{query}.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved raw payload: {out}")

    datasets = collect_dataset_slugs(payload)
    print(f"\n=== Found {len(datasets)} object-detection datasets ===\n")
    api_key = KEY_FILE.read_text(encoding="utf-8").strip()

    for d in datasets[:30]:
        ws, proj = d["id"].split("/", 1)
        try:
            r = requests.get(
                f"https://api.roboflow.com/{ws}/{proj}",
                params={"api_key": api_key},
                timeout=8,
            )
            if r.status_code == 200:
                info = r.json()
                p = info.get("project", {})
                versions = info.get("versions", [])
                imgs = p.get("images", 0)
                classes = p.get("classes", {})
                vlist = versions
                vstr = f"v{vlist[0].get('id', '?')}" if vlist else "no-version"
                cls_pre = list(classes.keys())[:6]
                print(f"  {d['id']:<55} {imgs:>5} imgs  {vstr:<10} classes: {cls_pre}")
        except Exception:
            print(f"  {d['id']:<55} probe failed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
