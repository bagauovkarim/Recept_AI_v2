"""CookingHistory model."""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from db import Base


class CookingHistory(Base):
    __tablename__ = "cooking_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dish_id = Column(Integer, ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False)
    cooked_at = Column(DateTime(timezone=True), server_default=func.now())
