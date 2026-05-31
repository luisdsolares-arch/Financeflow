"""planned notifications read state

Revision ID: 0008_planned_notif_read
Revises: 0007_financial_goals
Create Date: 2026-05-31 16:35:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_planned_notif_read"
down_revision = "0007_financial_goals"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {column["name"] for column in inspector.get_columns("gastos_planificados")}
    if "reminder_read_due_date" not in columns:
        op.add_column("gastos_planificados", sa.Column("reminder_read_due_date", sa.Date(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = {column["name"] for column in inspector.get_columns("gastos_planificados")}
    if "reminder_read_due_date" in columns:
        op.drop_column("gastos_planificados", "reminder_read_due_date")
