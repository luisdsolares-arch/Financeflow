from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Budget(Base):
    __tablename__ = "presupuestos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    limit_amount: Mapped[float] = mapped_column(Float, nullable=False)
    current_spent: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    month_year: Mapped[str] = mapped_column(String(7), nullable=False)

    user: Mapped["User"] = relationship(back_populates="budgets")
