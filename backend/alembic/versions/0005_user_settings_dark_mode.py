"""add dark mode to user settings

Revision ID: 0005_user_settings_dark_mode
Revises: 0004_user_settings
Create Date: 2026-05-30 00:00:04
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_user_settings_dark_mode"
down_revision = "0004_user_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("configuraciones_usuario")}
    if "dark_mode" not in columns:
        op.add_column(
            "configuraciones_usuario",
            sa.Column("dark_mode", sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("configuraciones_usuario")}
    if "dark_mode" in columns:
        op.drop_column("configuraciones_usuario", "dark_mode")
