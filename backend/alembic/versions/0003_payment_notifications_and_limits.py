"""payment notifications and safety limits

Revision ID: 0003_payment_notif_limits
Revises: 0002_auto_payments
Create Date: 2026-05-30 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_payment_notif_limits"
down_revision = "0002_auto_payments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("pagos_automaticos", sa.Column("max_amount", sa.Float(), nullable=False, server_default="0"))
    op.add_column("pagos_automaticos", sa.Column("reminder_days_before", sa.Integer(), nullable=False, server_default="3"))
    op.add_column("pagos_automaticos", sa.Column("last_reminder_date", sa.Date(), nullable=True))

    op.create_table(
        "notificaciones_pagos",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=30), nullable=False),
        sa.Column("message", sa.String(length=255), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rule_id"], ["pagos_automaticos.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notificaciones_pagos_id", "notificaciones_pagos", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_notificaciones_pagos_id", table_name="notificaciones_pagos")
    op.drop_table("notificaciones_pagos")
    op.drop_column("pagos_automaticos", "last_reminder_date")
    op.drop_column("pagos_automaticos", "reminder_days_before")
    op.drop_column("pagos_automaticos", "max_amount")
