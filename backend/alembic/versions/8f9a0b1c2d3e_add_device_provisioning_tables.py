"""add device provisioning tables

Revision ID: 8f9a0b1c2d3e
Revises: 7eec4f08fcd2
Create Date: 2026-10-03 17:08:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '8f9a0b1c2d3e'
down_revision: Union[str, Sequence[str], None] = '7eec4f08fcd2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'device_connections',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('device_id', sa.String(length=36), nullable=False),
        sa.Column('connection_type', sa.String(length=30), server_default='SSH', nullable=False),
        sa.Column('host', sa.String(length=255), nullable=False),
        sa.Column('port', sa.Integer(), server_default='22', nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('authentication_type', sa.String(length=30), server_default='PASSWORD', nullable=False),
        sa.Column('credential_ref', sa.String(length=255), nullable=True),
        sa.Column('host_key_verified', sa.Boolean(), server_default=sa.text('0'), nullable=False),
        sa.Column('last_tested_at', sa.DateTime(), nullable=True),
        sa.Column('last_test_status', sa.String(length=30), nullable=True),
        sa.Column('last_test_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_id', name='uq_device_connections_device_id')
    )
    op.create_index('ix_device_connections_device_id', 'device_connections', ['device_id'])

    op.create_table(
        'provisioning_jobs',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('device_id', sa.String(length=36), nullable=False),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='PENDING', nullable=False),
        sa.Column('current_step', sa.String(length=100), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_provisioning_jobs_device_id', 'provisioning_jobs', ['device_id'])
    op.create_index('ix_provisioning_jobs_status', 'provisioning_jobs', ['status'])

    op.create_table(
        'hardware_components',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('device_id', sa.String(length=36), nullable=False),
        sa.Column('component_type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('interface', sa.String(length=50), nullable=True),
        sa.Column('address', sa.String(length=100), nullable=True),
        sa.Column('manufacturer', sa.String(length=100), nullable=True),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('discovery_status', sa.String(length=30), server_default='DISCOVERED', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_hardware_components_device_id', 'hardware_components', ['device_id'])

    op.create_table(
        'device_agents',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('device_id', sa.String(length=36), nullable=False),
        sa.Column('installed', sa.Boolean(), server_default=sa.text('0'), nullable=False),
        sa.Column('agent_name', sa.String(length=100), server_default='localiot-agent', nullable=False),
        sa.Column('agent_version', sa.String(length=50), nullable=True),
        sa.Column('platform', sa.String(length=100), nullable=True),
        sa.Column('architecture', sa.String(length=50), nullable=True),
        sa.Column('service_status', sa.String(length=30), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_id', name='uq_device_agents_device_id')
    )
    op.create_index('ix_device_agents_device_id', 'device_agents', ['device_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('device_agents')
    op.drop_table('hardware_components')
    op.drop_table('provisioning_jobs')
    op.drop_table('device_connections')
