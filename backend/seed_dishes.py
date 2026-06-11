from __future__ import annotations

import asyncio

from sqlalchemy import select

from db import async_session, create_tables
from models.dish import Dish


EASY = [
    {
        "title": "Омлет с овощами",
        "ingredients": ["egg", "tomato", "onion", "cheese"],
        "difficulty": "easy",
    },
    {
        "title": "Яичница с помидорами",
        "ingredients": ["egg", "tomato", "onion"],
        "difficulty": "easy",
    },
    {
        "title": "Окрошка на минералке",
        "ingredients": ["cucumber", "egg", "potato", "spring onion", "mineral water"],
        "difficulty": "easy",
    },
    {
        "title": "Салат «Витаминный»",
        "ingredients": ["cabbage", "carrot", "lemon"],
        "difficulty": "easy",
    },
    {
        "title": "Свекольный салат с чесноком",
        "ingredients": ["beetroot", "garlic", "olive"],
        "difficulty": "easy",
    },
    {
        "title": "Тёртая морковь с яблоком",
        "ingredients": ["carrot", "apple", "lemon"],
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
        "title": "Салат с лососем и шпинатом",
        "ingredients": ["spinach", "lemon", "olive", "egg"],
        "difficulty": "easy",
    },
    {
        "title": "Брускетта с томатами",
        "ingredients": ["tomato", "basil", "garlic", "olive"],
        "difficulty": "easy",
    },
    {
        "title": "Смузи ягодный",
        "ingredients": ["banana", "strawberry", "blueberries"],
        "difficulty": "easy",
    },
    {
        "title": "Смузи зелёный",
        "ingredients": ["spinach", "banana", "apple", "lime"],
        "difficulty": "easy",
    },
    {
        "title": "Фруктовый салат",
        "ingredients": ["apple", "banana", "orange", "strawberry"],
        "difficulty": "easy",
    },
    {
        "title": "Арбузный салат с фетой",
        "ingredients": ["watermelon", "cheese", "lime", "basil"],
        "difficulty": "easy",
    },
    {
        "title": "Брокколи с чесноком на пару",
        "ingredients": ["broccoli", "garlic", "lemon"],
        "difficulty": "easy",
    },
    {
        "title": "Спаржа на гриле",
        "ingredients": ["asparagus", "lemon", "olive"],
        "difficulty": "easy",
    },
    {
        "title": "Грибы с луком на сковороде",
        "ingredients": ["mushroom", "onion", "garlic"],
        "difficulty": "easy",
    },
    {
        "title": "Жареные кабачки",
        "ingredients": ["courgettes", "garlic", "olive"],
        "difficulty": "easy",
    },
    {
        "title": "Бутерброды с сыром и помидором",
        "ingredients": ["cheese", "tomato", "flour", "basil"],
        "difficulty": "easy",
    },
    {
        "title": "Йогурт с ягодами и мёдом",
        "ingredients": ["swiss yoghurt", "strawberry", "blueberries", "swiss jam"],
        "difficulty": "easy",
    },
]


MEDIUM = [
    {
        "title": "Борщ",
        "ingredients": ["beetroot", "cabbage", "potato", "carrot", "onion", "garlic"],
        "difficulty": "medium",
    },
    {
        "title": "Щи из свежей капусты",
        "ingredients": ["cabbage", "potato", "carrot", "onion", "tomato"],
        "difficulty": "medium",
    },
    {
        "title": "Куриный суп с лапшой",
        "ingredients": ["chicken", "carrot", "onion", "potato", "flour"],
        "difficulty": "medium",
    },
    {
        "title": "Рассольник",
        "ingredients": ["cucumber", "potato", "carrot", "onion", "beef"],
        "difficulty": "medium",
    },
    {
        "title": "Винегрет",
        "ingredients": ["beetroot", "potato", "carrot", "onion", "olive", "beans"],
        "difficulty": "medium",
    },
    {
        "title": "Оливье с курицей",
        "ingredients": ["potato", "carrot", "egg", "chicken", "cucumber", "peas"],
        "difficulty": "medium",
    },
    {
        "title": "Сельдь под шубой",
        "ingredients": ["beetroot", "potato", "carrot", "onion", "egg"],
        "difficulty": "medium",
    },
    {
        "title": "Голубцы",
        "ingredients": ["cabbage", "beef", "onion", "carrot", "tomato"],
        "difficulty": "medium",
    },
    {
        "title": "Драники с сметаной",
        "ingredients": ["potato", "onion", "egg", "flour"],
        "difficulty": "medium",
    },
    {
        "title": "Запеченная курица с картошкой",
        "ingredients": ["chicken", "potato", "garlic", "onion"],
        "difficulty": "medium",
    },
    {
        "title": "Овощное рагу",
        "ingredients": ["potato", "carrot", "onion", "tomato", "aubergine", "courgettes"],
        "difficulty": "medium",
    },
    {
        "title": "Тыквенный крем-суп",
        "ingredients": ["pumpkin", "onion", "garlic", "carrot"],
        "difficulty": "medium",
    },
    {
        "title": "Картофельное пюре с грибами",
        "ingredients": ["potato", "mushroom", "onion", "swiss butter"],
        "difficulty": "medium",
    },
    {
        "title": "Шакшука",
        "ingredients": ["egg", "tomato", "bell pepper", "onion", "garlic"],
        "difficulty": "medium",
    },
    {
        "title": "Рататуй",
        "ingredients": ["aubergine", "courgettes", "tomato", "bell pepper", "onion", "garlic"],
        "difficulty": "medium",
    },
    {
        "title": "Паста с грибами",
        "ingredients": ["mushroom", "garlic", "onion", "cheese", "flour"],
        "difficulty": "medium",
    },
    {
        "title": "Паста Помодоро",
        "ingredients": ["tomato", "garlic", "basil", "olive", "flour"],
        "difficulty": "medium",
    },
    {
        "title": "Ризотто с грибами",
        "ingredients": ["mushroom", "onion", "garlic", "cheese", "swiss butter"],
        "difficulty": "medium",
    },
    {
        "title": "Куриный карри",
        "ingredients": ["chicken", "onion", "garlic", "ginger", "tomato", "coriander"],
        "difficulty": "medium",
    },
    {
        "title": "Жареный рис с яйцом",
        "ingredients": ["egg", "carrot", "onion", "garlic", "spring onion"],
        "difficulty": "medium",
    },
    {
        "title": "Минестроне",
        "ingredients": ["tomato", "carrot", "onion", "beans", "courgettes", "cabbage"],
        "difficulty": "medium",
    },
    {
        "title": "Греческая мусака",
        "ingredients": ["aubergine", "potato", "tomato", "onion", "cheese", "beef"],
        "difficulty": "medium",
    },
    {
        "title": "Куриный салат с яблоком",
        "ingredients": ["chicken", "apple", "lettuce", "lemon"],
        "difficulty": "medium",
    },
    {
        "title": "Запеканка из цветной капусты",
        "ingredients": ["cauliflower", "egg", "cheese", "swiss butter", "flour"],
        "difficulty": "medium",
    },
    {
        "title": "Шарлотка с яблоками",
        "ingredients": ["apple", "egg", "flour", "sugar"],
        "difficulty": "medium",
    },
]


HARD = [
    {
        "title": "Бефстроганов",
        "ingredients": ["beef", "onion", "mushroom", "flour", "swiss butter"],
        "difficulty": "hard",
    },
    {
        "title": "Говяжий стейк с овощами",
        "ingredients": ["beef", "potato", "carrot", "onion", "garlic"],
        "difficulty": "hard",
    },
    {
        "title": "Узбекский плов с курицей",
        "ingredients": ["chicken", "carrot", "onion", "garlic", "ginger"],
        "difficulty": "hard",
    },
    {
        "title": "Лазанья болоньезе",
        "ingredients": ["beef", "tomato", "onion", "garlic", "cheese", "flour", "swiss butter"],
        "difficulty": "hard",
    },
    {
        "title": "Фаршированные перцы",
        "ingredients": ["bell pepper", "beef", "onion", "carrot", "tomato", "garlic"],
        "difficulty": "hard",
    },
    {
        "title": "Утка с яблоками и апельсином",
        "ingredients": ["chicken", "apple", "orange", "onion", "garlic"],
        "difficulty": "hard",
    },
    {
        "title": "Паэлья с курицей",
        "ingredients": ["chicken", "tomato", "bell pepper", "onion", "garlic", "peas"],
        "difficulty": "hard",
    },
    {
        "title": "Запеченные баклажаны пармиджано",
        "ingredients": ["aubergine", "tomato", "cheese", "basil", "garlic", "flour"],
        "difficulty": "hard",
    },
    {
        "title": "Баклажанные роллы с сыром",
        "ingredients": ["aubergine", "cheese", "tomato", "garlic", "basil", "olive"],
        "difficulty": "hard",
    },
    {
        "title": "Киш-лорен с беконом и луком",
        "ingredients": ["egg", "cheese", "onion", "swiss butter", "flour", "sausage"],
        "difficulty": "hard",
    },
]


SAMPLE_DISHES = EASY + MEDIUM + HARD


YOLO_CLASSES = {
    "apple", "asparagus", "aubergine", "banana", "basil", "beans", "beef",
    "beetroot", "bell pepper", "blueberries", "broccoli", "cabbage", "carrot",
    "cauliflower", "cheese", "chicken", "chillies", "coriander", "corn",
    "courgettes", "cucumber", "dates", "egg", "flour", "garlic", "ginger",
    "green beans", "green chilies", "lemon", "lettuce", "lime", "mango",
    "mineral water", "mushroom", "olive", "onion", "orange", "parsley",
    "peach", "peas", "peppers", "potato", "pumpkin", "red grapes", "red onion",
    "sauce", "sausage", "shallot", "spinach", "spring onion", "strawberry",
    "sugar", "sweet potato", "swiss butter", "swiss jam", "swiss yoghurt",
    "tomato", "watermelon",
}


def validate() -> None:
    titles = [d["title"] for d in SAMPLE_DISHES]
    duplicates = {t for t in titles if titles.count(t) > 1}
    assert not duplicates, f"Duplicate titles: {duplicates}"

    for d in SAMPLE_DISHES:
        unknown = [ing for ing in d["ingredients"] if ing not in YOLO_CLASSES]
        assert not unknown, f"Unknown ingredients in '{d['title']}': {unknown}"
        assert d["difficulty"] in ("easy", "medium", "hard"), f"Bad difficulty in '{d['title']}'"

    print(f"Validation OK: {len(SAMPLE_DISHES)} dishes, all ingredients ∈ YOLO classes")
    counts = {"easy": 0, "medium": 0, "hard": 0}
    for d in SAMPLE_DISHES:
        counts[d["difficulty"]] += 1
    print(f"  Distribution: easy={counts['easy']}, medium={counts['medium']}, hard={counts['hard']}")


async def seed() -> None:
    validate()
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
