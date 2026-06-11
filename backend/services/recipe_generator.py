import json
from fastapi import HTTPException
from openai import AsyncOpenAI, APIStatusError, AuthenticationError, RateLimitError, APITimeoutError, APIConnectionError
from pydantic import ValidationError
from db import get_settings
from schemas import GeneratedRecipe

settings = get_settings()
client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url=settings.DEEPSEEK_BASE_URL,
)
MODEL = settings.DEEPSEEK_MODEL


SYSTEM_RU = (
    "Ты — Анна, повар русской и европейской кухни с 15-летним опытом. "
    "Готовишь рецепты для домашних поваров без профессионального оборудования. "
    "Пишешь живо и подробно, как объясняешь другу: что делать И зачем. "
    "Указываешь визуальные ориентиры готовности, аромат, текстуру. "
    "Делишься практическими советами и нюансами техники. "
    "Названия ингредиентов всегда переводишь на нормальный русский язык "
    "(не оставляй технические английские названия вроде \"chicken\" или \"bell pepper\"). "
    "Отвечаешь только валидным JSON по заданной схеме."
)

SYSTEM_EN = (
    "You are Anna, a chef specializing in Russian and European cuisine with 15 years of experience. "
    "You write recipes for home cooks without professional equipment. "
    "You write warmly and in detail, like explaining to a friend: what to do AND why. "
    "You include visual cues for doneness, aroma, texture. "
    "You share practical tips and technique nuances. "
    "You translate any non-English ingredient or dish names into proper English. "
    "You always reply with valid JSON matching the requested schema."
)


FEW_SHOT_EXAMPLE_RU = {
    "input": {
        "dish_title": "Жареная картошка с грибами",
        "ingredients": ["potato", "mushroom", "onion"],
    },
    "output": {
        "title": "Жареная картошка с грибами и луком",
        "ingredients": [
            "картофель (700 г, лучше всего сорт с низким содержанием крахмала)",
            "грибы шампиньоны (300 г, можно белые)",
            "лук репчатый (1 крупная луковица)",
            "чеснок (2 зубчика, по желанию)",
            "соль, чёрный перец (по вкусу)",
            "растительное масло (3–4 ст. ложки, можно смешать со сливочным для аромата)",
            "укроп или петрушка (небольшой пучок, для подачи)",
        ],
        "steps": [
            "Картофель очисти и нарежь брусочками толщиной около 1 см или дольками — главное, чтобы все кусочки были одинакового размера, иначе мелкие подгорят, а крупные останутся сырыми.",
            "Помой нарезанный картофель в холодной воде 1–2 минуты, чтобы смыть лишний крахмал — это ключ к хрустящей корочке. После промывки обязательно промокни кусочки бумажным полотенцем досуха: вода превратит жарку в тушение.",
            "Грибы протри влажной тряпкой (не мой под краном — впитают воду), нарежь крупными пластинами около 5 мм. Если ломтики слишком тонкие, грибы превратятся в кашу.",
            "Лук нарежь полукольцами средней толщины — слишком тонкий сгорит, слишком толстый останется хрустящим.",
            "Разогрей большую сковороду с толстым дном на сильном огне до лёгкого дымка, добавь масло. Сразу выложи картофель в один слой — не вали кучей, иначе он начнёт париться, а не жариться. Если сковорода маленькая, готовь в два захода.",
            "Жарь картофель 4–5 минут без перемешивания — должна образоваться золотистая корочка. Только потом аккуратно переверни лопаткой и жарь ещё 4–5 минут с другой стороны.",
            "Сдвинь картофель к одной стороне сковороды, на освободившееся место выложи грибы. Дай им потерять влагу и зарумяниться — это займёт 5–7 минут. Не перемешивай первые 2–3 минуты, чтобы они подрумянились, а не варились в собственном соку.",
            "Добавь лук, перемешай всё вместе и жарь ещё 3–4 минуты до прозрачности и лёгкой золотистости лука.",
            "За минуту до готовности добавь раздавленный чеснок, посоли и поперчи. Перемешай и сними с огня — чеснок должен только успеть отдать аромат, но не сгореть.",
            "Дай блюду постоять под крышкой 2 минуты — вкусы соединятся.",
        ],
        "cooking_time": "35 минут",
        "servings": "3 порции",
        "tips": [
            "Соли картофель в самом конце — соль вытягивает влагу, и кусочки могут стать мягкими вместо хрустящих.",
            "Если хочешь насыщенный вкус — последние 30 секунд добавь кусочек сливочного масла. Оно карамелизируется на горячих кусочках и даст ореховый аромат.",
            "Старайся не перемешивать слишком часто — каждое движение лопаткой сбивает корочку. Терпение — ключ к идеальной жареной картошке.",
        ],
        "serving_suggestion": "Подавай горячим, посыпав рубленой зеленью. Отлично сочетается с маринованными огурчиками, квашеной капустой или свежим овощным салатом. Можно подать со сметаной или соусом из йогурта с чесноком и зеленью.",
    },
}

FEW_SHOT_EXAMPLE_EN = {
    "input": {
        "dish_title": "Pan-fried potatoes with mushrooms",
        "ingredients": ["potato", "mushroom", "onion"],
    },
    "output": {
        "title": "Pan-fried Potatoes with Mushrooms and Onion",
        "ingredients": [
            "potatoes (700 g, low-starch variety works best)",
            "white mushrooms (300 g, or porcini if you have them)",
            "yellow onion (1 large)",
            "garlic (2 cloves, optional)",
            "salt, black pepper (to taste)",
            "vegetable oil (3–4 tbsp, mix in butter for extra aroma)",
            "fresh dill or parsley (small bunch, for serving)",
        ],
        "steps": [
            "Peel the potatoes and cut into 1 cm sticks or wedges — the key is uniform size, otherwise small pieces burn while large stay raw.",
            "Rinse the cut potatoes in cold water for 1–2 minutes to wash away excess starch — this is the trick to a crisp crust. Pat them completely dry with paper towels: any water turns frying into steaming.",
            "Wipe mushrooms with a damp cloth (don't wash under tap — they soak up water) and slice into thick 5 mm pieces. Slices any thinner and they'll turn to mush.",
            "Cut onion into medium half-rings — too thin burns, too thick stays crunchy.",
            "Heat a heavy-bottomed skillet over high heat until it just starts to smoke, then add oil. Spread potatoes in a single layer — don't crowd or they'll steam instead of fry. Use two batches if your pan is small.",
            "Fry potatoes 4–5 minutes without stirring — a golden crust must form. Then carefully flip with a spatula and fry another 4–5 minutes on the other side.",
            "Push potatoes to one side, add mushrooms to the empty space. Let them release moisture and brown — about 5–7 minutes. Don't stir for the first 2–3 minutes so they actually sear, not boil.",
            "Add the onion, mix everything together, and cook 3–4 more minutes until onion turns translucent and lightly golden.",
            "A minute before finishing, add crushed garlic, salt, and pepper. Stir and remove from heat — garlic should release aroma but not burn.",
            "Cover the pan and let it rest 2 minutes — the flavors come together.",
        ],
        "cooking_time": "35 minutes",
        "servings": "3 servings",
        "tips": [
            "Salt the potatoes only at the end — salt draws out moisture and pieces will turn soft instead of crisp.",
            "For a richer flavor, add a knob of butter in the last 30 seconds. It caramelizes on the hot pieces and gives a nutty aroma.",
            "Try not to stir too often — every spatula move breaks the crust. Patience is key to perfect pan-fried potatoes.",
        ],
        "serving_suggestion": "Serve hot, sprinkled with chopped fresh herbs. Pairs beautifully with pickles, sauerkraut, or a fresh vegetable salad. A side of sour cream or garlic-herb yogurt sauce is excellent.",
    },
}


PROMPT_RU = """Сгенерируй подробный рецепт блюда.

Блюдо: {dish_title}
Ингредиенты у пользователя: {ingredients}

Требования:
- 8–12 шагов. Каждый шаг — не просто "что делать", но и "зачем" (визуальные признаки готовности, аромат, текстура, обоснование техники).
- Используй преимущественно указанные ингредиенты. Можешь добавить базовые специи и дополнения (соль, перец, масло, чеснок, лук, специи) — укажи их в списке ингредиентов.
- Ингредиенты — на русском языке, с количеством и пояснением (например "помидоры спелые (4 шт.)").
- Поле tips: 2–4 практических совета (что нельзя делать, как улучшить вкус, типичные ошибки).
- Поле serving_suggestion: 1–2 предложения о подаче — с чем подавать, как украсить, гарнир.

Верни валидный JSON по схеме:
{{"title": "...", "ingredients": ["...", "..."], "steps": ["...", "..."], "cooking_time": "...", "servings": "...", "tips": ["...", "..."], "serving_suggestion": "..."}}"""


PROMPT_EN = """Generate a detailed recipe for the dish.

Dish: {dish_title}
User's ingredients: {ingredients}

Requirements:
- 8–12 steps. Each step explains not just "what to do" but also "why" (visual cues for doneness, aroma, texture, technique rationale).
- Use mostly the listed ingredients. Basic seasonings and additions (salt, pepper, oil, garlic, onion, spices) are okay — include them in the ingredient list.
- Ingredient names in natural English with amounts and notes (e.g. "ripe tomatoes (4)").
- tips field: 2–4 practical tips (what to avoid, how to improve flavor, common mistakes).
- serving_suggestion field: 1–2 sentences about serving — what to pair it with, garnish, side.

Return valid JSON:
{{"title": "...", "ingredients": ["...", "..."], "steps": ["...", "..."], "cooking_time": "...", "servings": "...", "tips": ["...", "..."], "serving_suggestion": "..."}}"""


FREEFORM_PROMPT_RU = """Придумай интересный домашний рецепт ТОЛЬКО из этих ингредиентов.

Ингредиенты: {ingredients}

Требования:
- Выбери блюдо, которое реально сочетается с этими ингредиентами — не натягивай. Если набор странный, придумай что-то простое (запеканка, фриттата, сложный салат), но не делай вид что это haute cuisine.
- Название блюда реалистичное и аппетитное на русском.
- 8–12 шагов с пояснениями "зачем" и визуальными ориентирами.
- Можешь добавить базовые специи (соль, перец, масло, вода) — указывай их в списке.
- Все названия — на русском.
- tips: 2–4 совета.
- serving_suggestion: 1–2 предложения о подаче.

Верни валидный JSON:
{{"title": "...", "ingredients": ["...", "..."], "steps": ["...", "..."], "cooking_time": "...", "servings": "...", "tips": ["...", "..."], "serving_suggestion": "..."}}"""


FREEFORM_PROMPT_EN = """Invent an interesting home recipe using ONLY these ingredients.

Ingredients: {ingredients}

Requirements:
- Pick a dish that actually works with these ingredients — don't force it. If the combo is unusual, do something simple (a bake, frittata, composed salad) instead of pretending it's haute cuisine.
- Realistic, appetizing English dish name.
- 8–12 steps with "why" explanations and visual cues.
- Basic seasonings okay (salt, pepper, oil, water) — include in ingredient list.
- tips: 2–4 tips.
- serving_suggestion: 1–2 sentences.

Return valid JSON:
{{"title": "...", "ingredients": ["...", "..."], "steps": ["...", "..."], "cooking_time": "...", "servings": "...", "tips": ["...", "..."], "serving_suggestion": "..."}}"""


def _escape_string_newlines(s: str) -> str:
    out: list[str] = []
    in_str = False
    esc = False
    for ch in s:
        if esc:
            out.append(ch)
            esc = False
            continue
        if ch == "\\":
            out.append(ch)
            esc = True
            continue
        if ch == '"':
            in_str = not in_str
            out.append(ch)
            continue
        if in_str:
            if ch == "\n":
                out.append("\\n")
                continue
            if ch == "\r":
                out.append("\\r")
                continue
            if ch == "\t":
                out.append("\\t")
                continue
        out.append(ch)
    return "".join(out)


def _parse_response(content: str) -> GeneratedRecipe:
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0]
        content = content.strip()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        try:
            data = json.loads(_escape_string_newlines(content))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Recipe generator returned non-JSON response: {exc.msg}",
            )
    try:
        return GeneratedRecipe(**data)
    except (ValidationError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Recipe generator returned malformed schema: {exc}",
        )


def _wrap_api_error(exc: Exception) -> HTTPException:
    if isinstance(exc, AuthenticationError):
        return HTTPException(status_code=503, detail="DeepSeek API key is invalid or missing")
    if isinstance(exc, RateLimitError):
        return HTTPException(status_code=429, detail="DeepSeek rate limit reached, try again in a moment")
    if isinstance(exc, APITimeoutError):
        return HTTPException(status_code=504, detail="DeepSeek timed out, try again")
    if isinstance(exc, APIConnectionError):
        return HTTPException(status_code=503, detail="Cannot reach DeepSeek API")
    if isinstance(exc, APIStatusError):
        if exc.status_code == 402:
            return HTTPException(status_code=503, detail="DeepSeek balance is empty, top up at platform.deepseek.com")
        return HTTPException(status_code=502, detail=f"DeepSeek error {exc.status_code}: {exc.message}")
    return HTTPException(status_code=502, detail=f"DeepSeek call failed: {exc}")


async def _call_deepseek(messages: list[dict], temperature: float) -> str:
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=2500,
            timeout=60.0,
            response_format={"type": "json_object"},
        )
    except (AuthenticationError, RateLimitError, APITimeoutError, APIConnectionError, APIStatusError) as exc:
        raise _wrap_api_error(exc)
    return response.choices[0].message.content


async def _stream_deepseek(messages: list[dict], temperature: float):
    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=2500,
            timeout=60.0,
            response_format={"type": "json_object"},
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta
    except (AuthenticationError, RateLimitError, APITimeoutError, APIConnectionError, APIStatusError) as exc:
        raise _wrap_api_error(exc)


def _build_messages(system: str, user_prompt: str, example: dict, lang: str) -> list[dict]:
    if lang == "en":
        example_user = (
            f"Dish: {example['input']['dish_title']}\n"
            f"User's ingredients: {', '.join(example['input']['ingredients'])}"
        )
    else:
        example_user = (
            f"Блюдо: {example['input']['dish_title']}\n"
            f"Ингредиенты у пользователя: {', '.join(example['input']['ingredients'])}"
        )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": example_user},
        {"role": "assistant", "content": json.dumps(example["output"], ensure_ascii=False)},
        {"role": "user", "content": user_prompt},
    ]


def _build_recipe_messages(dish_title: str, ingredients: list[str], lang: str) -> list[dict]:
    template = PROMPT_EN if lang == "en" else PROMPT_RU
    system = SYSTEM_EN if lang == "en" else SYSTEM_RU
    example = FEW_SHOT_EXAMPLE_EN if lang == "en" else FEW_SHOT_EXAMPLE_RU
    user_prompt = template.format(dish_title=dish_title, ingredients=", ".join(ingredients))
    return _build_messages(system, user_prompt, example, lang)


def _build_freeform_messages(ingredients: list[str], lang: str) -> list[dict]:
    template = FREEFORM_PROMPT_EN if lang == "en" else FREEFORM_PROMPT_RU
    system = SYSTEM_EN if lang == "en" else SYSTEM_RU
    example = FEW_SHOT_EXAMPLE_EN if lang == "en" else FEW_SHOT_EXAMPLE_RU
    user_prompt = template.format(ingredients=", ".join(ingredients))
    return _build_messages(system, user_prompt, example, lang)


async def generate_recipe_text(dish_title: str, ingredients: list[str], lang: str = "ru") -> GeneratedRecipe:
    messages = _build_recipe_messages(dish_title, ingredients, lang)
    content = await _call_deepseek(messages, temperature=0.85)
    return _parse_response(content)


async def generate_freeform_recipe(ingredients: list[str], lang: str = "ru") -> GeneratedRecipe:
    messages = _build_freeform_messages(ingredients, lang)
    content = await _call_deepseek(messages, temperature=0.9)
    return _parse_response(content)


async def stream_recipe_text(dish_title: str, ingredients: list[str], lang: str = "ru"):
    messages = _build_recipe_messages(dish_title, ingredients, lang)
    async for delta in _stream_deepseek(messages, temperature=0.85):
        yield delta


async def stream_freeform_recipe(ingredients: list[str], lang: str = "ru"):
    messages = _build_freeform_messages(ingredients, lang)
    async for delta in _stream_deepseek(messages, temperature=0.9):
        yield delta
