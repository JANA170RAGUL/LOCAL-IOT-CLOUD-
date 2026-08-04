import React from 'react';
import { Chip } from '@mui/material';
import type { AlertSeverity } from '../types';

export interface SeverityChipProps {
  severity: AlertSeverity;
}

export const SeverityChip: React.FC<SeverityChipProps> = ({ severity }) => {
  let color: 'info' | 'warning' | 'error' | 'default' = 'default';

  switch (severity) {
    case 'INFO':
      color = 'info';
      break;
    case 'WARNING':
      color = 'warning';
      break;
    case 'CRITICAL':
    case 'EMERGENCY':
      color = 'error';
      break;
  }

  return <Chip label={severity} color={color} size="small" />;
};
