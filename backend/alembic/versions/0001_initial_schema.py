"""initial schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-05-30 00:00:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
    )
    op.create_index("ix_usuarios_id", "usuarios", ["id"], unique=False)
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=True)

    op.create_table(
        "cuentas_bancarias",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("bank_name", sa.String(length=100), nullable=False),
        sa.Column("account_type", sa.String(length=50), nullable=False),
        sa.Column("last_four", sa.String(length=4), nullable=False),
        sa.Column("access_token", sa.String(length=512), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_cuentas_bancarias_id", "cuentas_bancarias", ["id"], unique=False)

    op.create_table(
        "presupuestos",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("limit_amount", sa.Float(), nullable=False),
        sa.Column("current_spent", sa.Float(), nullable=False, server_default="0"),
        sa.Column("month_year", sa.String(length=7), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_presupuestos_id", "presupuestos", ["id"], unique=False)

    op.create_table(
        "transacciones",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("is_automated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["account_id"], ["cuentas_bancarias.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_transacciones_id", "transacciones", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_transacciones_id", table_name="transacciones")
    op.drop_table("transacciones")

    op.drop_index("ix_presupuestos_id", table_name="presupuestos")
    op.drop_table("presupuestos")

    op.drop_index("ix_cuentas_bancarias_id", table_name="cuentas_bancarias")
    op.drop_table("cuentas_bancarias")

    op.drop_index("ix_usuarios_email", table_name="usuarios")
    op.drop_index("ix_usuarios_id", table_name="usuarios")
    op.drop_table("usuarios")
