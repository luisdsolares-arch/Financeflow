"""notification read state

Revision ID: 0008_notification_read_state
Revises: 0007_financial_goals
Create Date: 2026-06-01 00:00:08
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_notification_read_state"
down_revision = "0007_financial_goals"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("notificaciones_leidas_estado"):
        op.create_table(
            "notificaciones_leidas_estado",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("notification_id", sa.String(length=120), nullable=False),
            sa.Column("read_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "notification_id", name="uq_notif_read_user_notification"),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("notificaciones_leidas_estado")}
    if "ix_notificaciones_leidas_estado_id" not in existing_indexes:
        op.create_index("ix_notificaciones_leidas_estado_id", "notificaciones_leidas_estado", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("notificaciones_leidas_estado"):
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("notificaciones_leidas_estado")}
        if "ix_notificaciones_leidas_estado_id" in existing_indexes:
            op.drop_index("ix_notificaciones_leidas_estado_id", table_name="notificaciones_leidas_estado")
        op.drop_table("notificaciones_leidas_estado")