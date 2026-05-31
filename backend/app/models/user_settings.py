from sqlalchemy import Boolean, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserSettings(Base):
    __tablename__ = "configuraciones_usuario"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)

    profile_name: Mapped[str] = mapped_column(String(120), nullable=False)
    profile_email: Mapped[str] = mapped_column(String(255), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")

    monthly_savings_goal: Mapped[float] = mapped_column(Float, nullable=False, default=20)
    weekly_budget_alert_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=80)

    require_2fa_for_sensitive_actions: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notify_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_push: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_payment_reminders: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    auto_sync_bank_daily: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    payment_assistant_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    default_payment_limit: Mapped[float] = mapped_column(Float, nullable=False, default=1200)
    dark_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped["User"] = relationship(back_populates="settings")
