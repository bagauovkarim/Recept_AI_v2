"""Run predict on a sample of OOD eval images for visual inspection."""

from __future__ import annotations

import random
import sys
from pathlib import Path

import torch
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]
WEIGHTS = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "weights" / "best.pt"
EVAL_IMAGES = Path("D:/eval_smart_fridge/mapped/images")
OUT_DIR = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "ood_eval" / "visual"


def main() -> int:
    n = 30
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    images = sorted(EVAL_IMAGES.iterdir())
    random.Random(42).shuffle(images)
    sample = [p for p in images if p.suffix.lower() in {".jpg", ".jpeg", ".png"}][:n]
    print(f"Predicting on {len(sample)} sample OOD images")

    device = 0 if torch.cuda.is_available() else "cpu"
    model = YOLO(str(WEIGHTS))

    for img in sample:
        model.predict(
            source=str(img),
            conf=0.25,
            imgsz=640,
            device=device,
            save=True,
            project=str(OUT_DIR.parent),
            name=OUT_DIR.name,
            exist_ok=True,
            verbose=False,
        )
    print(f"Annotated images saved to: {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
