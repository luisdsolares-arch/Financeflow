from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NotificationReadState(Base):
    __tablename__ = "notificaciones_leidas_estado"
    __table_args__ = (UniqueConstraint("user_id", "notification_id", name="uq_notif_read_user_notification"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    notification_id: Mapped[str] = mapped_column(String(120), nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)