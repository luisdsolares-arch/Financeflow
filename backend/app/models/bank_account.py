from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BankAccount(Base):
    __tablename__ = "cuentas_bancarias"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)
    last_four: Mapped[str] = mapped_column(String(4), nullable=False)
    access_token: Mapped[str] = mapped_column(String(512), nullable=False)

    user: Mapped["User"] = relationship(back_populates="bank_accounts")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account", cascade="all, delete-orphan")
    auto_payments: Mapped[list["AutoPayment"]] = relationship(back_populates="account", cascade="all, delete-orphan")
