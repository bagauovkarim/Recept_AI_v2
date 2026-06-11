import json
from types import SimpleNamespace

import httpx
import pytest
from fastapi import HTTPException
from openai import (
    AuthenticationError,
    RateLimitError,
    APITimeoutError,
    APIConnectionError,
    APIStatusError,
)

from services import recipe_generator as rg
from schemas import GeneratedRecipe


def _fake_resp(status: int) -> httpx.Response:
    return httpx.Response(status_code=status, request=httpx.Request("POST", "http://x"))


VALID_PAYLOAD = {
    "title": "Тестовое блюдо",
    "ingredients": ["яйцо (2 шт.)", "соль (по вкусу)"],
    "steps": [f"Шаг {i}" for i in range(1, 9)],
    "cooking_time": "10 минут",
    "servings": "1 порция",
    "tips": ["Не пересолить"],
    "serving_suggestion": "Подавать тёплым.",
}


def _ds_response(content: str):
    message = SimpleNamespace(content=content)
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


def test_parse_response_clean_json():
    recipe = rg._parse_response(json.dumps(VALID_PAYLOAD, ensure_ascii=False))
    assert isinstance(recipe, GeneratedRecipe)
    assert recipe.title == "Тестовое блюдо"
    assert len(recipe.steps) == 8


def test_parse_response_strips_markdown_fence():
    fenced = "```json\n" + json.dumps(VALID_PAYLOAD, ensure_ascii=False) + "\n```"
    recipe = rg._parse_response(fenced)
    assert recipe.title == "Тестовое блюдо"


def test_parse_response_recovers_unescaped_newlines():
    payload_copy = dict(VALID_PAYLOAD)
    payload_copy["serving_suggestion"] = "first line\nsecond line"
    raw = json.dumps(payload_copy, ensure_ascii=False).replace("\\n", "\n")
    recipe = rg._parse_response(raw)
    assert "first line" in recipe.serving_suggestion


def test_parse_response_non_json_raises_502():
    with pytest.raises(HTTPException) as exc:
        rg._parse_response("definitely not json at all")
    assert exc.value.status_code == 502


def test_parse_response_malformed_schema_raises_502():
    bad = json.dumps({"title": "x"})  # missing required fields
    with pytest.raises(HTTPException) as exc:
        rg._parse_response(bad)
    assert exc.value.status_code == 502


def test_wrap_api_error_classifies_auth():
    err = AuthenticationError(message="bad key", response=_fake_resp(401), body=None)
    http = rg._wrap_api_error(err)
    assert http.status_code == 503
    assert "key" in http.detail.lower()


def test_wrap_api_error_classifies_rate_limit():
    err = RateLimitError(message="slow down", response=_fake_resp(429), body=None)
    assert rg._wrap_api_error(err).status_code == 429


def test_wrap_api_error_classifies_timeout():
    assert rg._wrap_api_error(APITimeoutError(request=None)).status_code == 504


def test_wrap_api_error_classifies_connection():
    assert rg._wrap_api_error(APIConnectionError(request=None)).status_code == 503


def test_wrap_api_error_classifies_balance_empty():
    status_err = APIStatusError(message="Insufficient balance", response=_fake_resp(402), body=None)
    http = rg._wrap_api_error(status_err)
    assert http.status_code == 503
    assert "balance" in http.detail.lower()


def test_wrap_api_error_other_status():
    status_err = APIStatusError(message="server boom", response=_fake_resp(500), body=None)
    assert rg._wrap_api_error(status_err).status_code == 502


def test_wrap_api_error_generic():
    assert rg._wrap_api_error(RuntimeError("oops")).status_code == 502


def test_build_recipe_messages_structure():
    msgs = rg._build_recipe_messages("омлет", ["egg", "tomato"], "ru")
    assert msgs[0]["role"] == "system"
    assert "Анна" in msgs[0]["content"]
    assert msgs[-1]["role"] == "user"
    assert "омлет" in msgs[-1]["content"]


def test_build_recipe_messages_english_branch():
    msgs = rg._build_recipe_messages("omelette", ["egg"], "en")
    assert msgs[0]["role"] == "system"
    assert "Anna" in msgs[0]["content"]
    assert "omelette" in msgs[-1]["content"]


def test_build_freeform_messages_runs_for_both_langs():
    ru = rg._build_freeform_messages(["egg", "tomato"], "ru")
    en = rg._build_freeform_messages(["egg", "tomato"], "en")
    assert ru[0]["content"] != en[0]["content"]


def test_escape_string_newlines_only_inside_strings():
    src = '{"a": "line1\nline2", "b": 1\n}'
    out = rg._escape_string_newlines(src)
    # newline inside the string should be escaped...
    assert "line1\\nline2" in out
    # ...the structural newline between fields stays as a real newline
    assert out.endswith("}")


async def test_generate_recipe_text_happy_path(monkeypatch):
    async def fake_create(**kwargs):
        return _ds_response(json.dumps(VALID_PAYLOAD, ensure_ascii=False))

    monkeypatch.setattr(rg.client.chat.completions, "create", fake_create)
    recipe = await rg.generate_recipe_text("омлет", ["egg"], "ru")
    assert recipe.title == "Тестовое блюдо"


async def test_generate_recipe_text_wraps_api_errors(monkeypatch):
    async def boom(**kwargs):
        raise APIConnectionError(request=None)

    monkeypatch.setattr(rg.client.chat.completions, "create", boom)
    with pytest.raises(HTTPException) as exc:
        await rg.generate_recipe_text("омлет", ["egg"], "ru")
    assert exc.value.status_code == 503


async def test_generate_freeform_recipe_happy_path(monkeypatch):
    async def fake_create(**kwargs):
        return _ds_response(json.dumps(VALID_PAYLOAD, ensure_ascii=False))

    monkeypatch.setattr(rg.client.chat.completions, "create", fake_create)
    recipe = await rg.generate_freeform_recipe(["egg", "tomato"], "ru")
    assert recipe.title == "Тестовое блюдо"


async def test_stream_recipe_text_emits_deltas(monkeypatch):
    class _Stream:
        def __aiter__(self):
            self._chunks = iter([
                SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="hello "))]),
                SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="world"))]),
                SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=None))]),
            ])
            return self

        async def __anext__(self):
            try:
                return next(self._chunks)
            except StopIteration:
                raise StopAsyncIteration

    async def fake_create(**kwargs):
        return _Stream()

    monkeypatch.setattr(rg.client.chat.completions, "create", fake_create)
    collected = []
    async for delta in rg.stream_recipe_text("омлет", ["egg"], "ru"):
        collected.append(delta)
    assert collected == ["hello ", "world"]


async def test_stream_recipe_text_wraps_errors(monkeypatch):
    async def boom(**kwargs):
        raise APITimeoutError(request=None)

    monkeypatch.setattr(rg.client.chat.completions, "create", boom)
    with pytest.raises(HTTPException) as exc:
        async for _ in rg.stream_recipe_text("омлет", ["egg"], "ru"):
            pass
    assert exc.value.status_code == 504
