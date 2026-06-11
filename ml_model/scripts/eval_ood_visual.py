from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import torch
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEIGHTS = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "weights" / "best.pt"
DEFAULT_OUT = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "ood_eval" / "visual"


def pick_device() -> str | int:
    if torch.cuda.is_available():
        return 0
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Run YOLO predict on a sample of OOD images.")
    p.add_argument("--weights", type=Path, default=DEFAULT_WEIGHTS)
    p.add_argument("--images", type=Path, required=True,
                   help="Directory containing OOD images.")
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--n", type=int, default=30)
    p.add_argument("--conf", type=float, default=0.25)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--seed", type=int, default=42)
    return p


def main() -> int:
    args = build_parser().parse_args()
    weights = args.weights.expanduser().resolve()
    images_dir = args.images.expanduser().resolve()
    out_dir = args.out.expanduser().resolve()

    if not weights.exists():
        print(f"ERROR: weights missing: {weights}", file=sys.stderr)
        return 2
    if not images_dir.exists() or not images_dir.is_dir():
        print(f"ERROR: images directory missing: {images_dir}", file=sys.stderr)
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)
    images = sorted(images_dir.iterdir())
    random.Random(args.seed).shuffle(images)
    sample = [p for p in images if p.suffix.lower() in {".jpg", ".jpeg", ".png"}][:args.n]
    print(f"Predicting on {len(sample)} sample OOD images")

    device = pick_device()
    model = YOLO(str(weights))

    for img in sample:
        model.predict(
            source=str(img),
            conf=args.conf,
            imgsz=args.imgsz,
            device=device,
            save=True,
            project=str(out_dir.parent),
            name=out_dir.name,
            exist_ok=True,
            verbose=False,
        )
    print(f"Annotated images saved to: {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
