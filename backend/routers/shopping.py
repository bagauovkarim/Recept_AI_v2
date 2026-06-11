from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from db import get_db
from models.shopping_list import ShoppingItem
from models.user import User
from schemas import ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemOut, ShoppingItemBulkCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/shopping-list", tags=["ShoppingList"])


@router.get("", response_model=list[ShoppingItemOut])
async def list_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingItem)
        .where(ShoppingItem.user_id == current_user.id)
        .order_by(ShoppingItem.purchased.asc(), ShoppingItem.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=ShoppingItemOut, status_code=status.HTTP_201_CREATED)
async def add_item(
    data: ShoppingItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = data.name.strip()
    existing = await db.execute(
        select(ShoppingItem).where(
            ShoppingItem.user_id == current_user.id,
            func.lower(ShoppingItem.name) == name.lower(),
        )
    )
    dup = existing.scalar_one_or_none()
    if dup:
        return dup

    item = ShoppingItem(user_id=current_user.id, name=name)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/bulk", response_model=list[ShoppingItemOut], status_code=status.HTTP_201_CREATED)
async def add_items_bulk(
    data: ShoppingItemBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(ShoppingItem.name).where(ShoppingItem.user_id == current_user.id)
    )
    existing_names = {n.lower() for (n,) in existing.all()}

    created = []
    for raw in data.names:
        n = raw.strip()
        if not n or n.lower() in existing_names:
            continue
        item = ShoppingItem(user_id=current_user.id, name=n)
        db.add(item)
        created.append(item)
        existing_names.add(n.lower())

    await db.commit()
    for c in created:
        await db.refresh(c)
    return created


@router.patch("/{item_id}", response_model=ShoppingItemOut)
async def update_item(
    item_id: int,
    data: ShoppingItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.purchased = data.purchased
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return None


@router.delete("/purchased/all", status_code=status.HTTP_204_NO_CONTENT)
async def clear_purchased(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(ShoppingItem).where(
            ShoppingItem.user_id == current_user.id,
            ShoppingItem.purchased == True,  # noqa: E712
        )
    )
    await db.commit()
    return None
