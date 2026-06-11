from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEIGHTS = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "weights" / "best.pt"
DEFAULT_DATA = REPO_ROOT / "ml_model" / "eval_data" / "data.yaml"
DEFAULT_OUT = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "ood_eval"


def pick_device() -> str | int:
    if torch.cuda.is_available():
        return 0
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="OOD evaluation on smart-fridge dataset.")
    p.add_argument("--weights", type=Path, default=DEFAULT_WEIGHTS)
    p.add_argument("--data", type=Path, default=DEFAULT_DATA,
                   help="Path to OOD data.yaml")
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--split", default="val")
    return p


def main() -> int:
    args = build_parser().parse_args()
    weights = args.weights.expanduser().resolve()
    data_yaml = args.data.expanduser().resolve()
    out_dir = args.out.expanduser().resolve()

    if not weights.exists():
        print(f"ERROR: weights missing: {weights}", file=sys.stderr)
        return 2
    if not data_yaml.exists():
        print(f"ERROR: data.yaml missing: {data_yaml}", file=sys.stderr)
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Weights: {weights}")
    print(f"Data:    {data_yaml}")
    print(f"Out:     {out_dir}\n")

    model = YOLO(str(weights))
    metrics = model.val(
        data=str(data_yaml),
        split=args.split,
        imgsz=args.imgsz,
        batch=args.batch,
        device=pick_device(),
        workers=0,
        plots=True,
        save_json=False,
        project=str(out_dir.parent),
        name=out_dir.name,
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

    out_json = out_dir / "ood_metrics.json"
    out_json.write_text(json.dumps({"summary": summary, "per_class": per_class}, indent=2), encoding="utf-8")
    print(f"\nSaved: {out_json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
