#!/usr/bin/env python3
"""Train YOLOv11 on the Fridgify dataset."""

from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_cache(value: str):
    value = value.strip().lower()
    if value in {"false", "off", "0", "none"}:
        return False
    if value in {"ram", "disk"}:
        return value
    raise argparse.ArgumentTypeError("cache must be one of: false, ram, disk")


def build_parser() -> argparse.ArgumentParser:
    repo_root = Path(__file__).resolve().parents[2]
    default_data = repo_root / "ml_model" / "datasets" / "fridgify_v4" / "data.yaml"
    default_project = repo_root / "ml_model" / "models"

    parser = argparse.ArgumentParser(
        description="Train YOLOv11 model for Fridgify object detection."
    )
    parser.add_argument("--model", default="yolo11s.pt", help="Base model weights.")
    parser.add_argument("--data", type=Path, default=default_data, help="Path to data.yaml.")
    parser.add_argument(
        "--project",
        type=Path,
        default=default_project,
        help="Directory where training runs are saved.",
    )
    parser.add_argument("--name", default="fridgify_y11s_v4", help="Run name.")
    parser.add_argument("--epochs", type=int, default=100, help="Total training epochs.")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size.")
    parser.add_argument("--batch", type=int, default=4, help="Batch size.")
    parser.add_argument("--device", default="mps", help="Device: mps, cpu, or cuda:0.")
    parser.add_argument("--workers", type=int, default=0, help="Dataloader workers.")
    parser.add_argument("--patience", type=int, default=20, help="Early stopping patience.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument(
        "--cache",
        type=parse_cache,
        default=False,
        help="Dataset cache mode: false, ram, or disk.",
    )
    parser.add_argument(
        "--exist-ok",
        action="store_true",
        help="Allow reuse of existing run directory.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    data_path = args.data.expanduser().resolve()
    project_path = args.project.expanduser().resolve()

    if not data_path.exists():
        parser.error(f"data.yaml not found: {data_path}")

    project_path.mkdir(parents=True, exist_ok=True)

    print("Training config:")
    print(f"  model:   {args.model}")
    print(f"  data:    {data_path}")
    print(f"  project: {project_path}")
    print(f"  name:    {args.name}")
    print(f"  epochs:  {args.epochs}")
    print(f"  imgsz:   {args.imgsz}")
    print(f"  batch:   {args.batch}")
    print(f"  device:  {args.device}")
    print(f"  workers: {args.workers}")
    print(f"  cache:   {args.cache}")

    model = YOLO(args.model)
    model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        workers=args.workers,
        patience=args.patience,
        seed=args.seed,
        cache=args.cache,
        project=str(project_path),
        name=args.name,
        exist_ok=args.exist_ok,
        verbose=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
