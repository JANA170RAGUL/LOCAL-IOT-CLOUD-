"""Add command reliability fields to device_commands

Revision ID: c7e7b1a2d3e4
Revises: 3f85319ebdaa
Create Date: 2026-09-05 16:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7e7b1a2d3e4'
down_revision: Union[str, Sequence[str], None] = 'd9cd2bfe4416'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('device_commands', sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('device_commands', sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('device_commands', sa.Column('published_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('device_commands', sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('device_commands', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('device_commands', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('device_commands', sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('device_commands', sa.Column('last_error', sa.Text(), nullable=True))
    op.add_column('device_commands', sa.Column('response_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('device_commands', 'response_message')
    op.drop_column('device_commands', 'last_error')
    op.drop_column('device_commands', 'next_retry_at')
    op.drop_column('device_commands', 'expires_at')
    op.drop_column('device_commands', 'completed_at')
    op.drop_column('device_commands', 'acknowledged_at')
    op.drop_column('device_commands', 'published_at')
    op.drop_column('device_commands', 'max_attempts')
    op.drop_column('device_commands', 'attempt_count')
