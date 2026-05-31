"""planned expenses

Revision ID: 0006_planned_expenses
Revises: 0005_user_settings_dark_mode
Create Date: 2026-05-31 00:00:06
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_planned_expenses"
down_revision = "0005_user_settings_dark_mode"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("gastos_planificados"):
        op.create_table(
            "gastos_planificados",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=False),
            sa.Column("category", sa.String(length=80), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("due_date", sa.Date(), nullable=False),
            sa.Column("recurrence_type", sa.String(length=20), nullable=False, server_default="one_time"),
            sa.Column("planning_mode", sa.String(length=20), nullable=False, server_default="monthly"),
            sa.Column("reminder_days_before", sa.Integer(), nullable=False, server_default="7"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("gastos_planificados")}
    if "ix_gastos_planificados_id" not in existing_indexes:
        op.create_index("ix_gastos_planificados_id", "gastos_planificados", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("gastos_planificados"):
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("gastos_planificados")}
        if "ix_gastos_planificados_id" in existing_indexes:
            op.drop_index("ix_gastos_planificados_id", table_name="gastos_planificados")
        op.drop_table("gastos_planificados")