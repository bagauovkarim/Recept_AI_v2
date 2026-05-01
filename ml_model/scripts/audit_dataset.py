"""Audit fridgify_v4 dataset: class distribution, label validity, image stats."""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

import yaml
from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[2]
DATASET = REPO_ROOT / "ml_model" / "datasets" / "fridgify_v4"
SPLITS = ["train", "valid", "test"]


def load_class_names() -> list[str]:
    with (DATASET / "data.yaml").open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["names"]


def parse_label(path: Path) -> tuple[list[int], list[str]]:
    """Return (class_ids, error_messages)."""
    classes: list[int] = []
    errors: list[str] = []
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        return classes, [f"unreadable: {e}"]

    for lineno, line in enumerate(text.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) != 5:
            errors.append(f"L{lineno}: expected 5 fields, got {len(parts)}")
            continue
        try:
            cls = int(parts[0])
            cx, cy, w, h = (float(x) for x in parts[1:])
        except ValueError:
            errors.append(f"L{lineno}: non-numeric fields")
            continue
        if cls < 0:
            errors.append(f"L{lineno}: negative class id {cls}")
        for name, val in (("cx", cx), ("cy", cy), ("w", w), ("h", h)):
            if not (0.0 <= val <= 1.0):
                errors.append(f"L{lineno}: {name}={val} out of [0,1]")
        if w <= 0 or h <= 0:
            errors.append(f"L{lineno}: non-positive box w={w} h={h}")
        classes.append(cls)
    return classes, errors


def audit_split(split: str, class_names: list[str]) -> dict:
    img_dir = DATASET / split / "images"
    lbl_dir = DATASET / split / "labels"
    counts: Counter[int] = Counter()
    empty_files = 0
    error_files: list[tuple[str, list[str]]] = []
    total_boxes = 0
    boxes_per_image: list[int] = []
    img_sizes: list[tuple[int, int]] = []
    sample_n = 0
    missing_pairs: list[str] = []

    label_files = sorted(lbl_dir.glob("*.txt"))
    image_files = {p.stem for p in img_dir.iterdir() if p.is_file()}

    for lbl_path in label_files:
        if lbl_path.stem not in image_files:
            missing_pairs.append(f"label without image: {lbl_path.name}")
            continue

        classes, errors = parse_label(lbl_path)
        if errors:
            error_files.append((lbl_path.name, errors))

        if not classes:
            empty_files += 1
        else:
            counts.update(classes)
            total_boxes += len(classes)
            boxes_per_image.append(len(classes))

        if sample_n < 50:
            for ext in (".jpg", ".jpeg", ".png"):
                img_path = img_dir / f"{lbl_path.stem}{ext}"
                if img_path.exists():
                    try:
                        with Image.open(img_path) as im:
                            img_sizes.append(im.size)
                        sample_n += 1
                    except Exception:
                        pass
                    break

    return {
        "split": split,
        "n_images": len(image_files),
        "n_labels": len(label_files),
        "empty_files": empty_files,
        "error_files": error_files[:10],
        "n_error_files": len(error_files),
        "total_boxes": total_boxes,
        "avg_boxes_per_image": (sum(boxes_per_image) / len(boxes_per_image)) if boxes_per_image else 0,
        "max_boxes_per_image": max(boxes_per_image) if boxes_per_image else 0,
        "class_counts": counts,
        "img_size_samples": img_sizes,
        "missing_pairs": missing_pairs[:10],
    }


def main() -> int:
    class_names = load_class_names()
    print(f"Classes: {len(class_names)}")
    print(f"Dataset root: {DATASET}\n")

    all_counts: Counter[int] = Counter()
    for split in SPLITS:
        if not (DATASET / split).exists():
            continue
        info = audit_split(split, class_names)
        print(f"=== {split.upper()} ===")
        print(f"  images: {info['n_images']}  labels: {info['n_labels']}  empty-labels: {info['empty_files']}")
        print(f"  total boxes: {info['total_boxes']}  avg/img: {info['avg_boxes_per_image']:.2f}  max/img: {info['max_boxes_per_image']}")
        if info["img_size_samples"]:
            sizes = info["img_size_samples"]
            unique_sizes = set(sizes)
            print(f"  image sizes (sample {len(sizes)}): {len(unique_sizes)} unique, e.g. {list(unique_sizes)[:3]}")
        if info["n_error_files"]:
            print(f"  LABEL ERRORS in {info['n_error_files']} files (first 5):")
            for fname, errs in info["error_files"][:5]:
                print(f"    {fname}: {errs[:3]}")
        if info["missing_pairs"]:
            print(f"  MISSING IMAGE FOR LABEL: {info['missing_pairs'][:5]}")
        all_counts.update(info["class_counts"])
        print()

    print("=== CLASS DISTRIBUTION (across all splits) ===")
    print(f"{'idx':>3} {'name':<22} {'count':>7} {'pct':>6}")
    total = sum(all_counts.values())
    sorted_classes = sorted(range(len(class_names)), key=lambda i: -all_counts.get(i, 0))
    for i in sorted_classes:
        c = all_counts.get(i, 0)
        pct = 100 * c / total if total else 0
        flag = ""
        if c == 0:
            flag = "  <-- ZERO"
        elif c < 50:
            flag = "  <-- VERY RARE"
        elif c < 200:
            flag = "  <-- rare"
        print(f"{i:>3} {class_names[i]:<22} {c:>7} {pct:>5.2f}%{flag}")

    if total:
        max_c = max(all_counts.values())
        nonzero = [c for c in all_counts.values() if c > 0]
        min_c = min(nonzero) if nonzero else 0
        print(f"\n  total boxes: {total}")
        print(f"  imbalance: max={max_c}  min={min_c}  ratio={max_c / min_c:.1f}x" if min_c else f"  imbalance: max={max_c}  min={min_c}")
        print(f"  classes with zero boxes: {sum(1 for c in (all_counts.get(i, 0) for i in range(len(class_names))) if c == 0)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
