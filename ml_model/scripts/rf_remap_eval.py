"""Remap Smart-Fridge classes to our 58-class taxonomy and assemble a 300-image eval set."""

from __future__ import annotations

import random
import shutil
import sys
from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = Path("D:/eval_smart_fridge/raw/Smart-Fridge-2")
OUT_ROOT = Path("D:/eval_smart_fridge/mapped")
OUR_DATA_YAML = REPO_ROOT / "ml_model" / "datasets" / "fridgify_v4" / "data.yaml"

TARGET_COUNT = 300
SEED = 42

THEIRS_TO_OURS: dict[str, str | None] = {
    "apples": "apple",
    "aubergine": "aubergine",
    "avocado": None,
    "bacon": None,
    "banana": "banana",
    "beans": "beans",
    "beef": "beef",
    "blueberries": "blueberries",
    "bread": None,
    "butter": None,
    "carrots": "carrot",
    "cherry_tomato": "tomato",
    "chicken": "chicken",
    "chicken_breast": "chicken",
    "chickpeas": None,
    "chocolate": None,
    "corn": "corn",
    "courgettes": "courgettes",
    "eggs": "egg",
    "flour": "flour",
    "goat_cheese": "cheese",
    "green_beans": "green beans",
    "ground_beef": "beef",
    "ham": None,
    "heavy_cream": None,
    "lime": "lime",
    "mid_seasoned_cheese": "cheese",
    "milk": None,
    "mushrooms": "mushroom",
    "oats": None,
    "oil": None,
    "olives": "olive",
    "onions": "onion",
    "orange": "orange",
    "parmesan_cheese": "cheese",
    "potatoes": "potato",
    "shrimp": None,
    "spinach": "spinach",
    "strawberries": "strawberry",
    "sugar": "sugar",
    "sweet_potatoes": "sweet potato",
    "tomato": "tomato",
    "tomato_sauce": None,
    "tuna_fish": None,
    "yoghurt": "swiss yoghurt",
}


def load_their_classes() -> list[str]:
    with (RAW_ROOT / "data.yaml").open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)["names"]


def load_our_classes() -> list[str]:
    with OUR_DATA_YAML.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)["names"]


def remap_label(text: str, their_idx_to_our_idx: dict[int, int]) -> tuple[str, int, int]:
    new_lines: list[str] = []
    kept = 0
    dropped = 0
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) < 5:
            continue
        try:
            cid = int(parts[0])
        except ValueError:
            continue
        if cid in their_idx_to_our_idx:
            new_cid = their_idx_to_our_idx[cid]
            new_lines.append(f"{new_cid} {' '.join(parts[1:])}")
            kept += 1
        else:
            dropped += 1
    return "\n".join(new_lines), kept, dropped


def main() -> int:
    if not RAW_ROOT.exists():
        print(f"ERROR: raw dataset not at {RAW_ROOT}", file=sys.stderr)
        return 2

    their_classes = load_their_classes()
    our_classes = load_our_classes()
    print(f"Their classes: {len(their_classes)}")
    print(f"Our  classes: {len(our_classes)}")

    our_name_to_idx = {n: i for i, n in enumerate(our_classes)}

    their_idx_to_our_idx: dict[int, int] = {}
    coverage_log = []
    for tidx, tname in enumerate(their_classes):
        oname = THEIRS_TO_OURS.get(tname)
        if oname is None:
            coverage_log.append(f"  DROP {tname}")
            continue
        if oname not in our_name_to_idx:
            print(f"  WARN map target '{oname}' (from '{tname}') not in our classes")
            continue
        their_idx_to_our_idx[tidx] = our_name_to_idx[oname]
        coverage_log.append(f"  KEEP {tname} -> {oname}")
    print("\n--- mapping ---")
    for line in coverage_log:
        print(line)
    print(f"\nMapped: {len(their_idx_to_our_idx)} / {len(their_classes)} classes")

    candidates: list[tuple[Path, str]] = []
    total_kept = 0
    total_dropped = 0
    for split in ("train", "valid", "test"):
        img_dir = RAW_ROOT / split / "images"
        lbl_dir = RAW_ROOT / split / "labels"
        if not img_dir.exists():
            continue
        for img_path in img_dir.iterdir():
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            lbl_path = lbl_dir / f"{img_path.stem}.txt"
            if not lbl_path.exists():
                continue
            text = lbl_path.read_text(encoding="utf-8")
            mapped_text, k, d = remap_label(text, their_idx_to_our_idx)
            total_kept += k
            total_dropped += d
            if k > 0:
                candidates.append((img_path, mapped_text))

    print(f"\nImages with >=1 mapped label: {len(candidates)}")
    print(f"Total annotation lines: kept={total_kept}, dropped={total_dropped}")

    if len(candidates) == 0:
        print("ERROR: no candidates after mapping")
        return 1

    rng = random.Random(SEED)
    rng.shuffle(candidates)
    selected = candidates[:TARGET_COUNT]
    print(f"\nSelected {len(selected)} of {len(candidates)} candidates (seed={SEED})")

    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    out_img = OUT_ROOT / "images"
    out_lbl = OUT_ROOT / "labels"
    out_img.mkdir(parents=True, exist_ok=True)
    out_lbl.mkdir(parents=True, exist_ok=True)

    written = 0
    for img_path, mapped_text in selected:
        target_img = out_img / img_path.name
        target_lbl = out_lbl / f"{img_path.stem}.txt"
        shutil.copy2(img_path, target_img)
        target_lbl.write_text(mapped_text + ("\n" if not mapped_text.endswith("\n") else ""), encoding="utf-8")
        written += 1
    print(f"Wrote {written} images and labels to {OUT_ROOT}")

    out_yaml = OUT_ROOT / "data.yaml"
    yaml_data = {
        "path": str(OUT_ROOT).replace("\\", "/"),
        "train": "images",
        "val": "images",
        "test": "images",
        "nc": len(our_classes),
        "names": our_classes,
    }
    with out_yaml.open("w", encoding="utf-8") as f:
        yaml.safe_dump(yaml_data, f, sort_keys=False, allow_unicode=True)
    print(f"Wrote {out_yaml}")

    from collections import Counter
    cnt: Counter[int] = Counter()
    for _, mt in selected:
        for line in mt.splitlines():
            if line.strip():
                try:
                    cnt[int(line.split()[0])] += 1
                except (ValueError, IndexError):
                    pass
    print("\n--- per-class instance counts in eval set ---")
    for cid in sorted(cnt, key=lambda c: -cnt[c]):
        print(f"  {our_classes[cid]:<22} {cnt[cid]}")
    print(f"  total instances: {sum(cnt.values())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
