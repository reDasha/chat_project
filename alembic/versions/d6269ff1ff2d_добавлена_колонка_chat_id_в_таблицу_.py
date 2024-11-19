"""Добавлена колонка chat_id в таблицу users

Revision ID: d6269ff1ff2d
Revises: 8218daeed353
Create Date: 2024-11-15 03:13:53.607781
"""

from alembic import op
import sqlalchemy as sa
from typing import Union, Sequence

# revision identifiers, used by Alembic.
revision: str = 'd6269ff1ff2d'
down_revision: Union[str, None] = '8218daeed353'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонку chat_id в таблицу users
    op.add_column('users', sa.Column('chat_id', sa.BigInteger(), nullable=True))


def downgrade() -> None:
    # Удаляем колонку chat_id из таблицы users
    op.drop_column('users', 'chat_id')
