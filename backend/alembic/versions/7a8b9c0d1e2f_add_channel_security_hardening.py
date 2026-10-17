"""Add channel security hardening (hashed API keys and encrypted webhook secrets)

Revision ID: 7a8b9c0d1e2f
Revises: c7e7b1a2d3e4
Create Date: 2026-09-05 17:19:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, Sequence[str], None] = 'c7e7b1a2d3e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update channel_api_keys table
    op.add_column('channel_api_keys', sa.Column('key_id', sa.String(length=32), nullable=True))
    op.add_column('channel_api_keys', sa.Column('key_hash', sa.String(length=64), nullable=True))
    op.add_column('channel_api_keys', sa.Column('name', sa.String(length=100), nullable=False, server_default='Primary'))
    op.add_column('channel_api_keys', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('channel_api_keys', sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('channel_api_keys', sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True))
    
    # Make api_key nullable
    op.alter_column('channel_api_keys', 'api_key', existing_type=sa.String(length=64), nullable=True)

    # Fill existing rows with default key_id and dummy key_hash if any exist
    op.execute("UPDATE channel_api_keys SET key_id = CONCAT('legacy_', SUBSTRING(id, 1, 8)), key_hash = 'legacy_migrated' WHERE key_id IS NULL")

    op.alter_column('channel_api_keys', 'key_id', existing_type=sa.String(length=32), nullable=False)
    op.alter_column('channel_api_keys', 'key_hash', existing_type=sa.String(length=64), nullable=False)

    op.create_index(op.f('ix_channel_api_keys_key_id'), 'channel_api_keys', ['key_id'], unique=True)
    op.create_index(op.f('ix_channel_api_keys_channel_id'), 'channel_api_keys', ['channel_id'], unique=False)

    # 2. Update channel_webhooks table
    op.add_column('channel_webhooks', sa.Column('secret_encrypted', sa.String(length=512), nullable=True))
    op.execute("UPDATE channel_webhooks SET secret_encrypted = secret_token WHERE secret_token IS NOT NULL")
    op.drop_column('channel_webhooks', 'secret_token')


def downgrade() -> None:
    op.add_column('channel_webhooks', sa.Column('secret_token', sa.String(length=255), nullable=True))
    op.execute("UPDATE channel_webhooks SET secret_token = secret_encrypted WHERE secret_encrypted IS NOT NULL")
    op.drop_column('channel_webhooks', 'secret_encrypted')

    op.drop_index(op.f('ix_channel_api_keys_channel_id'), table_name='channel_api_keys')
    op.drop_index(op.f('ix_channel_api_keys_key_id'), table_name='channel_api_keys')
    op.drop_column('channel_api_keys', 'revoked_at')
    op.drop_column('channel_api_keys', 'last_used_at')
    op.drop_column('channel_api_keys', 'expires_at')
    op.drop_column('channel_api_keys', 'name')
    op.drop_column('channel_api_keys', 'key_hash')
    op.drop_column('channel_api_keys', 'key_id')
