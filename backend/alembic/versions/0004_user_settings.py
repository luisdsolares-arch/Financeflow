"""user settings table

Revision ID: 0004_user_settings
Revises: 0003_payment_notifications_and_limits
Create Date: 2026-05-30 00:00:03
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_user_settings"
down_revision = "0003_payment_notifications_and_limits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("configuraciones_usuario"):
        op.create_table(
            "configuraciones_usuario",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("profile_name", sa.String(length=120), nullable=False),
            sa.Column("profile_email", sa.String(length=255), nullable=False),
            sa.Column("currency", sa.String(length=10), nullable=False, server_default="USD"),
            sa.Column("monthly_savings_goal", sa.Float(), nullable=False, server_default="20"),
            sa.Column("weekly_budget_alert_threshold", sa.Float(), nullable=False, server_default="80"),
            sa.Column("require_2fa_for_sensitive_actions", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("notify_email", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("notify_push", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("notify_payment_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("auto_sync_bank_daily", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("payment_assistant_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("default_payment_limit", sa.Float(), nullable=False, server_default="1200"),
            sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", name="uq_configuraciones_usuario_user_id"),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("configuraciones_usuario")}
    if "ix_configuraciones_usuario_id" not in existing_indexes:
        op.create_index("ix_configuraciones_usuario_id", "configuraciones_usuario", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("configuraciones_usuario"):
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("configuraciones_usuario")}
        if "ix_configuraciones_usuario_id" in existing_indexes:
            op.drop_index("ix_configuraciones_usuario_id", table_name="configuraciones_usuario")
        op.drop_table("configuraciones_usuario")
