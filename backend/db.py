"""
Database connection and session management for PostgreSQL.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/receptai"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: str = ""
    YOLO_MODEL_PATH: str = "../ml_model/models/best.pt"
    CONFIDENCE_THRESHOLD: float = 0.5

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


class Base(DeclarativeBase):
    pass


# Engine & session factory
engine = create_async_engine(
    get_settings().DATABASE_URL,
    echo=False,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI dependency: yields an async DB session."""
    async with async_session() as session:
        yield session


async def create_tables():
    """Create all tables (for dev/testing only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
