"""Run inference on multiple crops of an image to test sensitivity to composition."""
from __future__ import annotations

import sys
from pathlib import Path

import torch
from PIL import Image
from ultralytics import YOLO


REPO_ROOT = Path(__file__).resolve().parents[2]
WEIGHTS = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "weights" / "best.pt"
OUT_DIR = REPO_ROOT / "ml_model" / "models" / "fridgify_y11s_full" / "predictions" / "crops"


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python predict_crops.py <image>")
        return 2

    img_path = Path(sys.argv[1]).expanduser().resolve()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    img = Image.open(img_path).convert("RGB")
    W, H = img.size
    print(f"Source: {img_path.name}  size={W}x{H}\n")

    crops = {
        "full":         (0, 0, W, H),
        "top_shelf":    (0, 0, W, H // 2),
        "bottom_shelf": (0, H // 2, W, H),
        "veggies":      (0, int(H * 0.55), int(W * 0.65), H),
        "eggs":         (int(W * 0.35), int(H * 0.15), int(W * 0.75), int(H * 0.55)),
        "cheese":       (int(W * 0.15), int(H * 0.20), int(W * 0.45), int(H * 0.55)),
        "cucumber":     (int(W * 0.50), int(H * 0.55), W, H),
    }

    device = 0 if torch.cuda.is_available() else "cpu"
    model = YOLO(str(WEIGHTS))

    for name, box in crops.items():
        crop_img = img.crop(box)
        crop_path = OUT_DIR / f"crop_{name}.jpg"
        crop_img.save(crop_path)

        results = model.predict(
            source=str(crop_path),
            conf=0.20,
            imgsz=640,
            device=device,
            save=True,
            project=str(OUT_DIR),
            name=name,
            exist_ok=True,
            verbose=False,
        )

        boxes_found = []
        for r in results:
            for b in r.boxes:
                cls_name = r.names[int(b.cls[0])]
                conf = float(b.conf[0])
                boxes_found.append(f"{cls_name} ({conf:.2f})")

        print(f"=== {name:<13} {box} ===")
        if boxes_found:
            for det in boxes_found:
                print(f"   {det}")
        else:
            print("   (nothing detected at conf >= 0.20)")
        print()

    print(f"Annotated crops saved to: {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
