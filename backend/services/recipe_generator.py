"""
Recipe generator using OpenAI ChatGPT API.
Generates a structured recipe based on dish name and available ingredients.
"""
import json
from openai import AsyncOpenAI
from db import get_settings
from schemas import GeneratedRecipe

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_recipe_text(dish_title: str, ingredients: list[str]) -> GeneratedRecipe:
    """
    Generate a recipe using ChatGPT.
    Returns structured recipe with steps, time, and servings.
    """
    prompt = f"""Ты — профессиональный повар. Сгенерируй подробный рецепт блюда.

Блюдо: {dish_title}
Доступные ингредиенты: {', '.join(ingredients)}

Ответь СТРОГО в формате JSON (без markdown, без ```):
{{
  "title": "название блюда",
  "ingredients": ["ингредиент 1 (количество)", "ингредиент 2 (количество)"],
  "steps": ["шаг 1", "шаг 2", "шаг 3"],
  "cooking_time": "30 минут",
  "servings": "2 порции"
}}

Используй только указанные ингредиенты. Пиши на русском языке."""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Ты профессиональный повар. Отвечай только валидным JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=1000,
    )

    content = response.choices[0].message.content.strip()

    # Clean markdown wrapping if present
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0]
        content = content.strip()

    data = json.loads(content)
    return GeneratedRecipe(**data)
