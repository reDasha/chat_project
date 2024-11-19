"""Изменен default колонки is_active

Revision ID: 38b366f2b1cf
Revises: d6269ff1ff2d
Create Date: 2024-11-17 00:56:47.173587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '38b366f2b1cf'
down_revision: Union[str, None] = 'd6269ff1ff2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Устанавливаем новое значение по умолчанию для колонки is_active
    op.alter_column(
        'users',
        'is_active',
        server_default=sa.text('FALSE')
    )


def downgrade() -> None:
    # Возвращаем старое значение по умолчанию для колонки is_active
    op.alter_column(
        'users',
        'is_active',
        server_default=sa.text('TRUE')
    )
