"""Seed the dishes table with 15 sample recipes.

Idempotent: skips dishes with titles that already exist.
Run from the backend/ directory:
    python seed_dishes.py

Ingredient names must match YOLO class names exactly (lower-case, plural form
following the dataset convention). See ml_model/datasets/fridgify_v4/data.yaml
for the canonical list.
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from db import async_session, create_tables
from models.dish import Dish


SAMPLE_DISHES: list[dict] = [
    {
        "title": "Омлет с овощами",
        "ingredients": ["egg", "tomato", "onion", "cheese"],
        "difficulty": "easy",
    },
    {
        "title": "Греческий салат",
        "ingredients": ["tomato", "cucumber", "olive", "cheese", "onion"],
        "difficulty": "easy",
    },
    {
        "title": "Салат Капрезе",
        "ingredients": ["tomato", "cheese", "basil"],
        "difficulty": "easy",
    },
    {
        "title": "Жареный рис с яйцом",
        "ingredients": ["egg", "carrot", "onion", "garlic"],
        "difficulty": "easy",
    },
    {
        "title": "Куриный суп с овощами",
        "ingredients": ["chicken", "carrot", "onion", "potato", "garlic"],
        "difficulty": "medium",
    },
    {
        "title": "Овощное рагу",
        "ingredients": ["potato", "carrot", "onion", "tomato", "aubergine", "courgettes"],
        "difficulty": "medium",
    },
    {
        "title": "Фруктовый салат",
        "ingredients": ["apple", "banana", "orange", "strawberry"],
        "difficulty": "easy",
    },
    {
        "title": "Смузи ягодный",
        "ingredients": ["banana", "strawberry", "blueberries"],
        "difficulty": "easy",
    },
    {
        "title": "Запеченная курица с картошкой",
        "ingredients": ["chicken", "potato", "garlic", "onion"],
        "difficulty": "medium",
    },
    {
        "title": "Шакшука",
        "ingredients": ["egg", "tomato", "bell pepper", "onion", "garlic"],
        "difficulty": "medium",
    },
    {
        "title": "Брокколи с чесноком",
        "ingredients": ["broccoli", "garlic", "lemon"],
        "difficulty": "easy",
    },
    {
        "title": "Говяжий стейк с овощами",
        "ingredients": ["beef", "potato", "carrot", "onion", "garlic"],
        "difficulty": "hard",
    },
    {
        "title": "Тыквенный крем-суп",
        "ingredients": ["pumpkin", "onion", "garlic", "carrot"],
        "difficulty": "medium",
    },
    {
        "title": "Грибы с луком на сковороде",
        "ingredients": ["mushroom", "onion", "garlic"],
        "difficulty": "easy",
    },
    {
        "title": "Салат с курицей и яблоком",
        "ingredients": ["chicken", "apple", "lettuce", "lemon"],
        "difficulty": "medium",
    },
]


async def seed() -> None:
    await create_tables()
    async with async_session() as session:
        existing_titles = {
            t for (t,) in (await session.execute(select(Dish.title))).all()
        }
        added = 0
        skipped = 0
        for d in SAMPLE_DISHES:
            if d["title"] in existing_titles:
                skipped += 1
                continue
            session.add(Dish(
                title=d["title"],
                ingredients=d["ingredients"],
                difficulty=d["difficulty"],
            ))
            added += 1
        await session.commit()
        print(f"Seeded dishes: added={added}, skipped (already exist)={skipped}")


if __name__ == "__main__":
    asyncio.run(seed())
