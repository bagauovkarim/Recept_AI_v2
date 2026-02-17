"""
ReceptAI Backend — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import create_tables
from routers import auth, dishes, products, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (dev only)."""
    await create_tables()
    yield


app = FastAPI(
    title="ReceptAI API",
    description="Backend для мобильного приложения распознавания продуктов и подбора рецептов",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — разрешаем все origins для разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(dishes.router)
app.include_router(history.router)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "ReceptAI API is running", "docs": "/docs"}
