"""auto payments table

Revision ID: 0002_auto_payments
Revises: 0001_initial_schema
Create Date: 2026-05-30 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_auto_payments"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pagos_automaticos",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("day_of_month", sa.Integer(), nullable=False),
        sa.Column("description_template", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("next_run_date", sa.Date(), nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["account_id"], ["cuentas_bancarias.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_pagos_automaticos_id", "pagos_automaticos", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_pagos_automaticos_id", table_name="pagos_automaticos")
    op.drop_table("pagos_automaticos")
