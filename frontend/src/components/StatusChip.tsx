import type { FC } from 'react';
import { Chip } from '@mui/material';

type StatusValue = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';

type ChipColor = 'success' | 'error' | 'warning' | 'info' | 'default';

const COLOR_MAP: Record<string, ChipColor> = {
  ACTIVE: 'success',
  TRIAL: 'info',
  SUSPENDED: 'warning',
  INACTIVE: 'error',
  EXPIRED: 'error',
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusChip: FC<StatusChipProps> = ({ status, size = 'small' }) => (
  <Chip
    label={status}
    size={size}
    color={COLOR_MAP[status as StatusValue] ?? 'default'}
    sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: 0.3 }}
  />
);
