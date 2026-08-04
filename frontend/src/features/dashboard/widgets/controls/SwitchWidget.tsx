import React, { useState } from 'react';
import { Box, Typography, Switch as MuiSwitch, CircularProgress } from '@mui/material';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import { CommandConfirmationDialog } from './CommandConfirmationDialog';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const SwitchWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isOn, setIsOn] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = () => {
    setDialogOpen(true);
  };

  const handleCommandSuccess = () => {
    setIsPending(true);
    setTimeout(() => {
      setIsOn(!isOn);
      setIsPending(false);
    }, 1000);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Control Switch'}
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Typography variant="body1" color={!isOn ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: 'bold' }}>
          OFF
        </Typography>
        
        {isPending ? (
          <CircularProgress size={30} />
        ) : (
          <MuiSwitch 
            checked={isOn} 
            onChange={handleToggle} 
            color="primary"
            sx={{ transform: 'scale(1.5)' }} 
          />
        )}
        
        <Typography variant="body1" color={isOn ? 'primary.main' : 'text.secondary'} sx={{ fontWeight: 'bold' }}>
          ON
        </Typography>
      </Box>

      <CommandConfirmationDialog 
        open={dialogOpen}
        deviceId={config.deviceId}
        commandName={isOn ? 'SWITCH_OFF' : 'SWITCH_ON'}
        commandPayload={{ component: 'switch', action: isOn ? 'off' : 'on' }}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCommandSuccess}
      />
    </Box>
  );
};

export const SwitchWidgetManifest: WidgetManifest = {
  type: 'switch',
  name: 'Switch',
  category: 'Industrial',
  description: 'Standard toggle switch for binary control.',
  icon: ToggleOnIcon,
  component: SwitchWidget,
  supportedCommands: ['SWITCH_ON', 'SWITCH_OFF'],
  requiresConfirmation: true,
  requiresResponse: true,
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'switch',
    timeRange: '15m',
    refresh: 'live'
  }
};
