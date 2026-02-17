"""
Dishes router: find dishes by ingredients, generate recipe.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db import get_db
from models.dish import Dish
from schemas import DishFindRequest, DishOut, GenerateRecipeRequest, GeneratedRecipe
from routers.auth import get_current_user
from models.user import User
from services.recipe_generator import generate_recipe_text

router = APIRouter(tags=["Dishes"])

DIFFICULTY_ORDER = {"easy": 0, "medium": 1, "hard": 2}


@router.post("/dishes/find", response_model=list[DishOut])
async def find_dishes(
    data: DishFindRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Подбор блюд по списку ингредиентов пользователя.

    Алгоритм:
    1. Получить все блюда из БД
    2. Для каждого блюда вычислить недостающие ингредиенты
    3. Отфильтровать блюда с missing_count > 2
    4. Отсортировать: missing_count ASC, difficulty ASC
    """
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

    # Sort: missing_count ASC, then difficulty ASC
    matched.sort(key=lambda d: (d.missing_count, DIFFICULTY_ORDER.get(d.difficulty, 99)))
    return matched


@router.post("/generate-recipe", response_model=GeneratedRecipe)
async def generate_recipe(
    data: GenerateRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    """Генерация рецепта через ChatGPT. Не сохраняется в БД."""
    recipe = await generate_recipe_text(data.dish_title, data.ingredients)
    return recipe
