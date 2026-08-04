import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { CommandStatus } from '../features/commands/types/command';

interface CommandStatusChipProps extends Omit<ChipProps, 'color'> {
  status: CommandStatus;
}

export const CommandStatusChip: React.FC<CommandStatusChipProps> = ({ status, ...props }) => {
  let color: ChipProps['color'] = 'default';
  
  switch (status) {
    case 'Queued':
      color = 'info';
      break;
    case 'Sent':
      color = 'warning';
      break;
    case 'Executed':
      color = 'success';
      break;
    case 'Failed':
      color = 'error';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={status}
      color={color}
      size="small"
      variant="outlined"
      {...props}
    />
  );
};
