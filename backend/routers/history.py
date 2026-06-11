from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    dish_result = await db.execute(select(Dish).where(Dish.id == data.dish_id))
    dish = dish_result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    entry = CookingHistory(
        user_id=current_user.id,
        dish_id=data.dish_id,
        image_uri=data.image_uri,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return HistoryOut(
        id=entry.id,
        dish_id=entry.dish_id,
        dish_title=dish.title,
        image_uri=entry.image_uri,
        cooked_at=entry.cooked_at,
    )


@router.get("", response_model=list[HistoryOut])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
            image_uri=entry.image_uri,
            cooked_at=entry.cooked_at,
        )
        for entry, title in rows
    ]


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CookingHistory).where(
            CookingHistory.id == entry_id,
            CookingHistory.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()
    return None
