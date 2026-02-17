"""Dish model."""
from sqlalchemy import Column, Integer, String, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from db import Base


class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    ingredients = Column(JSONB, nullable=False)  # ["egg", "milk", "cheese"]
    difficulty = Column(
        String,
        CheckConstraint("difficulty IN ('easy', 'medium', 'hard')"),
        nullable=False,
    )
