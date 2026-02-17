"""
History router: save and retrieve cooking history.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from db import get_db
from models.history import CookingHistory
from models.dish import Dish
from models.user import User
from schemas import HistoryCreate, HistoryOut
from routers.auth import get_current_user

router = APIRouter(prefix="/history", tags=["History"])


@router.post("", response_model=HistoryOut, status_code=201)
async def create_history(
    data: HistoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Сохранить приготовление в историю."""
    # Проверить, что блюдо существует
    dish_result = await db.execute(select(Dish).where(Dish.id == data.dish_id))
    dish = dish_result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")

    entry = CookingHistory(user_id=current_user.id, dish_id=data.dish_id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return HistoryOut(
        id=entry.id,
        dish_id=entry.dish_id,
        dish_title=dish.title,
        cooked_at=entry.cooked_at,
    )


@router.get("", response_model=list[HistoryOut])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить историю приготовлений текущего пользователя."""
    result = await db.execute(
        select(CookingHistory, Dish.title)
        .join(Dish, CookingHistory.dish_id == Dish.id)
        .where(CookingHistory.user_id == current_user.id)
        .order_by(CookingHistory.cooked_at.desc())
    )
    rows = result.all()

    return [
        HistoryOut(
            id=entry.id,
            dish_id=entry.dish_id,
            dish_title=title,
            cooked_at=entry.cooked_at,
        )
        for entry, title in rows
    ]
