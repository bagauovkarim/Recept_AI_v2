"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ─── Auth ───────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Products ──────────────────────────────────────────
class DetectedProduct(BaseModel):
    name: str
    confidence: float


# ─── Dishes ────────────────────────────────────────────
class DishFindRequest(BaseModel):
    ingredients: list[str]


class DishOut(BaseModel):
    id: int
    title: str
    difficulty: str
    missing_count: int
    missing_ingredients: list[str]


# ─── Recipe Generation ─────────────────────────────────
class GenerateRecipeRequest(BaseModel):
    dish_title: str
    ingredients: list[str]


class GeneratedRecipe(BaseModel):
    title: str
    ingredients: list[str]
    steps: list[str]
    cooking_time: str
    servings: str


# ─── History ───────────────────────────────────────────
class HistoryCreate(BaseModel):
    dish_id: int


class HistoryOut(BaseModel):
    id: int
    dish_id: int
    dish_title: Optional[str] = None
    cooked_at: datetime

    class Config:
        from_attributes = True
