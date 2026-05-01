"""Full training pipeline for YOLOv11s on Fridgify dataset.

Cross-platform: auto-selects CUDA / MPS / CPU.
Optimized for RTX 2070 SUPER 8GB VRAM.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import torch
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]


def pick_device() -> str | int:
    if torch.cuda.is_available():
        return 0
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def build_parser() -> argparse.ArgumentParser:
    default_data = REPO_ROOT / "ml_model" / "datasets" / "fridgify_v4" / "data.yaml"
    default_project = REPO_ROOT / "ml_model" / "models"

    p = argparse.ArgumentParser(description="Full YOLOv11s training on Fridgify.")
    p.add_argument("--model", default=str(REPO_ROOT / "yolo11s.pt"))
    p.add_argument("--data", type=Path, default=default_data)
    p.add_argument("--project", type=Path, default=default_project)
    p.add_argument("--name", default="fridgify_y11s_full")
    p.add_argument("--epochs", type=int, default=300)
    p.add_argument("--patience", type=int, default=50)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--batch", type=int, default=16,
                   help="Batch size; -1 for auto.")
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--cache", default="disk", choices=["ram", "disk", "false"])
    p.add_argument("--device", default=None)
    p.add_argument("--resume", action="store_true")
    p.add_argument("--smoke", action="store_true",
                   help="Quick 3-epoch sanity run.")
    p.add_argument("--multi-scale", action="store_true",
                   help="Enable multi-scale training (more VRAM).")
    p.add_argument("--mosaic", type=float, default=1.0)
    p.add_argument("--mixup", type=float, default=0.1)
    p.add_argument("--copy-paste", type=float, default=0.3)
    p.add_argument("--exist-ok", action="store_true")
    return p


def main() -> int:
    args = build_parser().parse_args()

    data_path = args.data.expanduser().resolve()
    if not data_path.exists():
        print(f"ERROR: data.yaml not found at {data_path}", file=sys.stderr)
        return 2

    project_path = args.project.expanduser().resolve()
    project_path.mkdir(parents=True, exist_ok=True)

    device = args.device if args.device is not None else pick_device()
    cache = False if args.cache == "false" else args.cache

    if args.smoke:
        epochs = 3
        name = args.name + "_smoke"
        patience = 3
    else:
        epochs = args.epochs
        name = args.name
        patience = args.patience

    print("=" * 60)
    print("YOLOv11s Fridgify Training")
    print("=" * 60)
    print(f"  device:    {device}")
    print(f"  model:     {args.model}")
    print(f"  data:      {data_path}")
    print(f"  project:   {project_path}")
    print(f"  name:      {name}")
    print(f"  epochs:    {epochs}")
    print(f"  patience:  {patience}")
    print(f"  imgsz:     {args.imgsz}")
    print(f"  batch:     {args.batch}")
    print(f"  workers:   {args.workers}")
    print(f"  cache:     {cache}")
    if torch.cuda.is_available():
        print(f"  cuda:      {torch.cuda.get_device_name(0)} "
              f"({torch.cuda.get_device_properties(0).total_memory // (1024 ** 3)} GB)")
    print("=" * 60, flush=True)

    model = YOLO(args.model)

    train_kwargs = dict(
        data=str(data_path),
        epochs=epochs,
        patience=patience,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        workers=args.workers,
        cache=cache,
        amp=True,

        optimizer="SGD",
        lr0=0.01,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        cos_lr=True,
        warmup_epochs=3,

        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        shear=0.0,
        perspective=0.0,
        flipud=0.0,
        fliplr=0.5,
        mosaic=args.mosaic,
        mixup=args.mixup,
        copy_paste=args.copy_paste,
        close_mosaic=15,
        multi_scale=args.multi_scale,

        seed=42,
        deterministic=True,
        save=True,
        save_period=10,
        plots=True,
        verbose=True,

        project=str(project_path),
        name=name,
        exist_ok=args.exist_ok,
        resume=args.resume,
    )

    model.train(**train_kwargs)

    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()

    print("\nValidating best weights on test split...", flush=True)
    best_pt = project_path / name / "weights" / "best.pt"
    if best_pt.exists():
        best = YOLO(str(best_pt))
        best.val(data=str(data_path), split="test", imgsz=args.imgsz,
                 batch=max(args.batch // 2, 1), device=device,
                 workers=0, plots=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
