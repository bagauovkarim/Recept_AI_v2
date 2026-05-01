"""Run model.val() on the OOD smart-fridge eval set and write a comparison report."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import torch
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]
WEIGHTS = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "weights" / "best.pt"
DATA_YAML = Path("D:/eval_smart_fridge/mapped/data.yaml")
OUT_DIR = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "ood_eval"


def pick_device() -> str | int:
    if torch.cuda.is_available():
        return 0
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def main() -> int:
    if not WEIGHTS.exists():
        print(f"ERROR: weights missing: {WEIGHTS}", file=sys.stderr)
        return 2
    if not DATA_YAML.exists():
        print(f"ERROR: data.yaml missing: {DATA_YAML}", file=sys.stderr)
        return 2

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Weights: {WEIGHTS}")
    print(f"Data:    {DATA_YAML}")
    print(f"Out:     {OUT_DIR}\n")

    model = YOLO(str(WEIGHTS))
    metrics = model.val(
        data=str(DATA_YAML),
        split="val",
        imgsz=640,
        batch=8,
        device=pick_device(),
        workers=0,
        plots=True,
        save_json=False,
        project=str(OUT_DIR.parent),
        name=OUT_DIR.name,
        exist_ok=True,
        verbose=True,
    )

    summary = {
        "mAP50": float(metrics.box.map50),
        "mAP50-95": float(metrics.box.map),
        "precision_mean": float(metrics.box.mp),
        "recall_mean": float(metrics.box.mr),
        "fitness": float(metrics.fitness),
    }
    print("\n=== OOD eval summary ===")
    for k, v in summary.items():
        print(f"  {k:<18} {v:.4f}")

    per_class = {}
    if hasattr(metrics.box, "ap_class_index") and metrics.box.ap_class_index is not None:
        names = model.names
        ap50 = metrics.box.ap50
        ap = metrics.box.ap
        p = metrics.box.p
        r = metrics.box.r
        for i, ci in enumerate(metrics.box.ap_class_index):
            cname = names[int(ci)] if isinstance(names, dict) else names[int(ci)]
            per_class[cname] = {
                "P": float(p[i]) if len(p) > i else None,
                "R": float(r[i]) if len(r) > i else None,
                "mAP50": float(ap50[i]) if len(ap50) > i else None,
                "mAP50-95": float(ap[i].mean() if hasattr(ap[i], "mean") else ap[i]) if len(ap) > i else None,
            }

    out_json = OUT_DIR / "ood_metrics.json"
    out_json.write_text(json.dumps({"summary": summary, "per_class": per_class}, indent=2), encoding="utf-8")
    print(f"\nSaved: {out_json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
