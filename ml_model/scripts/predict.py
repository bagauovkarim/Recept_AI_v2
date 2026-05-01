"""Run YOLO inference on a single image and print predictions."""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

import torch
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEIGHTS = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "weights" / "best.pt"
DEFAULT_OUT_DIR = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "predictions"


def pick_device() -> str | int:
    if torch.cuda.is_available():
        return 0
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: python {Path(__file__).name} <image_path> [--conf 0.25] [--imgsz 640]")
        return 2

    image_path = Path(sys.argv[1]).expanduser().resolve()
    if not image_path.exists():
        print(f"ERROR: image not found: {image_path}", file=sys.stderr)
        return 2

    weights = DEFAULT_WEIGHTS
    conf = 0.25
    imgsz = 640
    augment = False
    args = sys.argv[2:]
    while args:
        flag = args.pop(0)
        if flag == "--conf" and args:
            conf = float(args.pop(0))
        elif flag == "--imgsz" and args:
            imgsz = int(args.pop(0))
        elif flag == "--weights" and args:
            weights = Path(args.pop(0)).expanduser().resolve()
        elif flag == "--augment":
            augment = True

    if not weights.exists():
        print(f"ERROR: weights not found: {weights}", file=sys.stderr)
        return 2

    DEFAULT_OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Image:    {image_path}")
    print(f"Weights:  {weights}")
    print(f"Conf:     {conf}")
    print(f"Imgsz:    {imgsz}")
    print()

    model = YOLO(str(weights))
    results = model.predict(
        source=str(image_path),
        conf=conf,
        imgsz=imgsz,
        device=pick_device(),
        save=True,
        augment=augment,
        project=str(DEFAULT_OUT_DIR.parent),
        name=DEFAULT_OUT_DIR.name,
        exist_ok=True,
        verbose=False,
    )

    counts: Counter[str] = Counter()
    confidences: dict[str, list[float]] = {}

    for r in results:
        names = r.names
        for box in r.boxes:
            cid = int(box.cls[0])
            cls = names[cid]
            cf = float(box.conf[0])
            counts[cls] += 1
            confidences.setdefault(cls, []).append(cf)

    if not counts:
        print("No detections (try lowering --conf below 0.25).")
        return 0

    print("=" * 64)
    print(f"{'CLASS':<22} {'COUNT':>5} {'AVG_CONF':>10} {'MIN':>8} {'MAX':>8}")
    print("-" * 64)
    for cls in sorted(counts, key=lambda c: -counts[c]):
        cs = confidences[cls]
        avg = sum(cs) / len(cs)
        print(f"{cls:<22} {counts[cls]:>5} {avg:>10.3f} {min(cs):>8.3f} {max(cs):>8.3f}")
    print("=" * 64)
    print(f"Total objects: {sum(counts.values())}  Unique classes: {len(counts)}")
    print()
    print(f"Annotated image saved to: {DEFAULT_OUT_DIR}\\{image_path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
