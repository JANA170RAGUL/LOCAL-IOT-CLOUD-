import React from 'react';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import { CommandStatus } from '../features/commands/types/command';

interface CommandStatusChipProps extends Omit<ChipProps, 'color'> {
  status: CommandStatus;
}

export const CommandStatusChip: React.FC<CommandStatusChipProps> = ({ status, ...props }) => {
  let color: ChipProps['color'] = 'default';
  const normStatus = (status || '').toString().toUpperCase();

  switch (normStatus) {
    case 'QUEUED':
      color = 'info';
      break;
    case 'SENT':
      color = 'info';
      break;
    case 'ACKNOWLEDGED':
      color = 'primary';
      break;
    case 'EXECUTED':
      color = 'success';
      break;
    case 'FAILED':
      color = 'error';
      break;
    case 'TIMED_OUT':
      color = 'warning';
      break;
    case 'CANCELLED':
      color = 'default';
      break;
    default:
      color = 'default';
  }

  const chipElement = (
    <Chip
      label={normStatus}
      color={color}
      size="small"
      variant="outlined"
      {...props}
    />
  );

  if (normStatus === 'TIMED_OUT') {
    return (
      <Tooltip title="Execution could not be confirmed">
        <span>{chipElement}</span>
      </Tooltip>
    );
  }

  return chipElement;
};
