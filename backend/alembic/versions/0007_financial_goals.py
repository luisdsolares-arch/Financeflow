"""financial goals

Revision ID: 0007_financial_goals
Revises: 0006_planned_expenses
Create Date: 2026-05-31 00:00:07
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_financial_goals"
down_revision = "0006_planned_expenses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("metas_financieras"):
        op.create_table(
            "metas_financieras",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=120), nullable=False),
            sa.Column("target_amount", sa.Float(), nullable=False),
            sa.Column("current_amount", sa.Float(), nullable=False, server_default="0"),
            sa.Column("target_date", sa.Date(), nullable=False),
            sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("metas_financieras")}
    if "ix_metas_financieras_id" not in existing_indexes:
        op.create_index("ix_metas_financieras_id", "metas_financieras", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("metas_financieras"):
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("metas_financieras")}
        if "ix_metas_financieras_id" in existing_indexes:
            op.drop_index("ix_metas_financieras_id", table_name="metas_financieras")
        op.drop_table("metas_financieras")