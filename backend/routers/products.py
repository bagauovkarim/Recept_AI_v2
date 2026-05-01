from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from PIL import Image
import io

from schemas import DetectedProduct
from routers.auth import get_current_user
from models.user import User
from ml.detector import detect_products

router = APIRouter(tags=["Products"])

MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/detect-products", response_model=list[DetectedProduct])
async def detect(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Поддерживаются только JPEG, PNG, WebP")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 10MB)")

    try:
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Не удалось открыть изображение")

    products = detect_products(image)
    return products
