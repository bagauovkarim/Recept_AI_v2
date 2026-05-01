from ultralytics import YOLO
from PIL import Image
from db import get_settings
from schemas import DetectedProduct

settings = get_settings()

_model = None


def _get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(settings.YOLO_MODEL_PATH)
    return _model


def detect_products(image: Image.Image) -> list[DetectedProduct]:
    model = _get_model()
    results = model.predict(source=image, conf=settings.CONFIDENCE_THRESHOLD, verbose=False)

    products = []
    seen = set()

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            name = result.names[class_id]

            if name not in seen:
                seen.add(name)
                products.append(DetectedProduct(
                    name=name,
                    confidence=round(confidence, 2),
                ))

    products.sort(key=lambda p: p.confidence, reverse=True)
    return products
