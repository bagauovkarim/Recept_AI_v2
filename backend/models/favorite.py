from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, func
from db import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dish_id = Column(Integer, ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "dish_id", name="uq_user_dish_favorite"),
    )
