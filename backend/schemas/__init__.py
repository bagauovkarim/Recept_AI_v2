from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


class EmailChange(BaseModel):
    new_email: EmailStr
    password: str


class DetectedProduct(BaseModel):
    name: str
    confidence: float


class DishFindRequest(BaseModel):
    ingredients: list[str]


class DishOut(BaseModel):
    id: int
    title: str
    difficulty: str
    missing_count: int
    missing_ingredients: list[str]


class DishDetail(BaseModel):
    id: int
    title: str
    difficulty: str
    ingredients: list[str]

    class Config:
        from_attributes = True


class GenerateRecipeRequest(BaseModel):
    dish_title: str
    ingredients: list[str]
    lang: str = "ru"


class GenerateFreeFormRecipeRequest(BaseModel):
    ingredients: list[str]
    lang: str = "ru"


class GeneratedRecipe(BaseModel):
    title: str
    ingredients: list[str]
    steps: list[str]
    cooking_time: str
    servings: str
    tips: list[str] = Field(default_factory=list)
    serving_suggestion: Optional[str] = None


class HistoryCreate(BaseModel):
    dish_id: int
    image_uri: Optional[str] = None


class HistoryOut(BaseModel):
    id: int
    dish_id: int
    dish_title: Optional[str] = None
    image_uri: Optional[str] = None
    cooked_at: datetime

    class Config:
        from_attributes = True


class FavoriteCreate(BaseModel):
    dish_id: int


class FavoriteOut(BaseModel):
    id: int
    dish_id: int
    dish_title: Optional[str] = None
    difficulty: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ShoppingItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class ShoppingItemBulkCreate(BaseModel):
    names: list[str]


class ShoppingItemUpdate(BaseModel):
    purchased: bool


class ShoppingItemOut(BaseModel):
    id: int
    name: str
    purchased: bool
    created_at: datetime

    class Config:
        from_attributes = True
