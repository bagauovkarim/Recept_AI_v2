import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db import get_db
from models.dish import Dish
from schemas import (
    DishFindRequest,
    DishOut,
    DishDetail,
    GenerateRecipeRequest,
    GenerateFreeFormRecipeRequest,
    GeneratedRecipe,
)
from routers.auth import get_current_user
from models.user import User
from services.recipe_generator import (
    generate_recipe_text,
    generate_freeform_recipe,
    stream_recipe_text,
    stream_freeform_recipe,
)
from services.rate_limit import limiter

router = APIRouter(tags=["Dishes"])

DIFFICULTY_ORDER = {"easy": 0, "medium": 1, "hard": 2}


@router.post("/dishes/find", response_model=list[DishOut])
async def find_dishes(
    data: DishFindRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Dish))
    all_dishes = result.scalars().all()

    user_ingredients = set(ing.lower() for ing in data.ingredients)
    matched = []

    for dish in all_dishes:
        dish_ingredients = set(ing.lower() for ing in dish.ingredients)
        missing = dish_ingredients - user_ingredients
        missing_count = len(missing)

        if missing_count <= 2:
            matched.append(DishOut(
                id=dish.id,
                title=dish.title,
                difficulty=dish.difficulty,
                missing_count=missing_count,
                missing_ingredients=sorted(missing),
            ))

    matched.sort(key=lambda d: (d.missing_count, DIFFICULTY_ORDER.get(d.difficulty, 99)))
    return matched


@router.get("/dishes/{dish_id}", response_model=DishDetail)
async def get_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Dish).where(Dish.id == dish_id))
    dish = result.scalar_one_or_none()
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish


@router.post("/generate-recipe", response_model=GeneratedRecipe)
@limiter.limit("10/minute")
async def generate_recipe(
    request: Request,
    data: GenerateRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    return await generate_recipe_text(data.dish_title, data.ingredients, data.lang)


@router.post("/generate-freeform-recipe", response_model=GeneratedRecipe)
@limiter.limit("5/minute")
async def generate_freeform(
    request: Request,
    data: GenerateFreeFormRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    return await generate_freeform_recipe(data.ingredients, data.lang)


def _format_sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/generate-recipe/stream")
@limiter.limit("10/minute")
async def stream_recipe(
    request: Request,
    data: GenerateRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    async def event_stream():
        try:
            async for delta in stream_recipe_text(data.dish_title, data.ingredients, data.lang):
                yield _format_sse({"delta": delta})
            yield _format_sse({"done": True})
        except HTTPException as exc:
            yield _format_sse({"error": exc.detail, "status": exc.status_code})
        except Exception as exc:  
            yield _format_sse({"error": str(exc), "status": 500})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/generate-freeform-recipe/stream")
@limiter.limit("5/minute")
async def stream_freeform(
    request: Request,
    data: GenerateFreeFormRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    async def event_stream():
        try:
            async for delta in stream_freeform_recipe(data.ingredients, data.lang):
                yield _format_sse({"delta": delta})
            yield _format_sse({"done": True})
        except HTTPException as exc:
            yield _format_sse({"error": exc.detail, "status": exc.status_code})
        except Exception as exc:  # noqa: BLE001
            yield _format_sse({"error": str(exc), "status": 500})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
