from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AutoPayment(Base):
    __tablename__ = "pagos_automaticos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[int] = mapped_column(ForeignKey("cuentas_bancarias.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    day_of_month: Mapped[int] = mapped_column(nullable=False)
    description_template: Mapped[str] = mapped_column(String(255), nullable=False)
    max_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    reminder_days_before: Mapped[int] = mapped_column(nullable=False, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    next_run_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    last_reminder_date: Mapped[date] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship(back_populates="auto_payments")
    account: Mapped["BankAccount"] = relationship(back_populates="auto_payments")
    notifications: Mapped[list["PaymentNotification"]] = relationship(back_populates="rule", cascade="all, delete-orphan")
