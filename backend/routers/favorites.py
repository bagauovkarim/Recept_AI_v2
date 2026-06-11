from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from db import get_db
from models.favorite import Favorite
from models.dish import Dish
from models.user import User
from schemas import FavoriteCreate, FavoriteOut
from routers.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=list[FavoriteOut])
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Favorite, Dish.title, Dish.difficulty)
        .join(Dish, Favorite.dish_id == Dish.id)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    rows = result.all()
    return [
        FavoriteOut(
            id=fav.id,
            dish_id=fav.dish_id,
            dish_title=title,
            difficulty=difficulty,
            created_at=fav.created_at,
        )
        for fav, title, difficulty in rows
    ]


@router.post("", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    data: FavoriteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dish_result = await db.execute(select(Dish).where(Dish.id == data.dish_id))
    dish = dish_result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.dish_id == data.dish_id,
        )
    )
    fav = existing.scalar_one_or_none()
    if fav:
        return FavoriteOut(
            id=fav.id,
            dish_id=fav.dish_id,
            dish_title=dish.title,
            difficulty=dish.difficulty,
            created_at=fav.created_at,
        )

    fav = Favorite(user_id=current_user.id, dish_id=data.dish_id)
    db.add(fav)
    await db.commit()
    await db.refresh(fav)
    return FavoriteOut(
        id=fav.id,
        dish_id=fav.dish_id,
        dish_title=dish.title,
        difficulty=dish.difficulty,
        created_at=fav.created_at,
    )


@router.delete("/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    dish_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.dish_id == dish_id,
        )
    )
    await db.commit()
    return None
