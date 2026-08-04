import React from 'react';
import { Chip } from '@mui/material';
import type { AlertStatus } from '../types';

export interface AlertStatusChipProps {
  status: AlertStatus;
}

export const AlertStatusChip: React.FC<AlertStatusChipProps> = ({ status }) => {
  let color: 'error' | 'warning' | 'success' | 'default' = 'default';

  switch (status) {
    case 'OPEN':
      color = 'error';
      break;
    case 'ACKNOWLEDGED':
      color = 'warning';
      break;
    case 'RESOLVED':
      color = 'success';
      break;
    case 'CLOSED':
      color = 'default';
      break;
  }

  return <Chip label={status} color={color} size="small" />;
};
