import asyncio
import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio


BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-please-ignore")
os.environ.setdefault("DEEPSEEK_API_KEY", "test-key")
os.environ.setdefault("YOLO_MODEL_PATH", "/tmp/nonexistent.pt")

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB



import models.dish as _dish_mod
_dish_mod.Dish.__table__.c.ingredients.type = JSON()

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import db as db_module
from db import Base, get_db
from main import app
from models.dish import Dish
from services.rate_limit import limiter as _limiter
from httpx import AsyncClient, ASGITransport



_limiter.enabled = False


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session_maker(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def client(session_maker):
    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seeded_dishes(session_maker):
    items = [
        Dish(title="Омлет с овощами", ingredients=["egg", "tomato", "onion"], difficulty="easy"),
        Dish(title="Жареная картошка", ingredients=["potato", "onion"], difficulty="easy"),
        Dish(title="Куриный суп", ingredients=["chicken", "carrot", "onion", "potato"], difficulty="medium"),
        Dish(title="Салат сложный", ingredients=["lettuce", "tomato", "cucumber", "cheese", "olive"], difficulty="hard"),
    ]
    async with session_maker() as session:
        session.add_all(items)
        await session.commit()
    return items


@pytest_asyncio.fixture
async def auth_token(client) -> str:
    resp = await client.post(
        "/auth/register",
        json={"email": "tester@example.com", "password": "secret123"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def auth_headers(auth_token) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}
