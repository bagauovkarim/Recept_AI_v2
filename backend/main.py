from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from db import create_tables
from routers import auth, dishes, products, history, favorites, shopping
from services.rate_limit import limiter
from models import user as _u, dish as _d, history as _h, favorite as _f, shopping_list as _s  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="ReceptAI API",
    description="Backend для мобильного приложения распознавания продуктов и подбора рецептов",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(dishes.router)
app.include_router(history.router)
app.include_router(favorites.router)
app.include_router(shopping.router)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "ReceptAI API is running", "docs": "/docs"}
