import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import PowerIcon from '@mui/icons-material/Power';
import { CommandConfirmationDialog } from './CommandConfirmationDialog';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const RelayWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Relay Control'}
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Button
          variant={isOn ? 'contained' : 'outlined'}
          color={isOn ? 'success' : 'inherit'}
          onClick={handleToggle}
          disabled={isPending}
          sx={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid', borderColor: isOn ? 'success.main' : 'divider' }}
        >
          {isPending ? (
            <CircularProgress size={40} />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {isOn ? 'ON' : 'OFF'}
            </Typography>
          )}
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Click to toggle state
      </Typography>

      <CommandConfirmationDialog 
        open={dialogOpen}
        deviceId={config.deviceId}
        commandName={isOn ? 'TURN_OFF' : 'TURN_ON'}
        commandPayload={{ component: 'relay', action: isOn ? 'off' : 'on' }}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCommandSuccess}
      />
    </Box>
  );
};

export const RelayWidgetManifest: WidgetManifest = {
  type: 'relay',
  name: 'Relay',
  category: 'Industrial',
  description: 'Heavy duty toggle button for relays.',
  icon: PowerIcon,
  component: RelayWidget,
  supportedCommands: ['TURN_ON', 'TURN_OFF'],
  requiresConfirmation: true,
  requiresResponse: true,
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'relay',
    timeRange: '15m',
    refresh: 'live'
  }
};
